import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Branch, VerificationSession, Customer } from '../../api/types';
import { api } from '../../api/client';
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  Eye,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Video,
  ScanFace,
  Info,
  Lock,
  Building2,
  ShieldCheck,
  Power,
  AlertCircle,
  Wallet,
  Home,
  UserX,
  SwitchCamera,
  Maximize2,
} from 'lucide-react';

interface Step2Props {
  branch: Branch;
  amount: number;
  claimReference?: string;
  onVerificationPassed: (session: VerificationSession, verifiedCustomer: Customer) => void;
  onBack: () => void;
}

export type CameraPermissionStatus =
  | 'NOT_REQUESTED' // Camera Permission Required
  | 'REQUESTING' // Requesting Camera
  | 'GRANTED' // Camera Ready
  | 'DENIED' // Permission Denied / Camera Unavailable
  | 'NO_HARDWARE' // Camera Unavailable / No Camera Found
  | 'INSECURE_CONTEXT'; // Insecure Context (HTTP without localhost)

export const Step2CombinedVerification: React.FC<Step2Props> = ({
  branch,
  amount,
  claimReference,
  onVerificationPassed,
  onBack,
}) => {
  const [session, setSession] = useState<VerificationSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Camera Access and Stream States
  const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>('NOT_REQUESTED');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [useSyntheticFeed, setUseSyntheticFeed] = useState<boolean>(false);

  // Verification execution states
  const [verificationStarted, setVerificationStarted] = useState<boolean>(false);
  const [verificationAttempted, setVerificationAttempted] = useState<boolean>(false);

  // Security Test Simulation Toggles
  const [simulateMismatch, setSimulateMismatch] = useState<boolean>(false);
  const [simulateSpoof, setSimulateSpoof] = useState<boolean>(false);
  const [simulateBioFail, setSimulateBioFail] = useState<boolean>(false);
  const [simulateBioUnavailable, setSimulateBioUnavailable] = useState<boolean>(false);
  const [simulateUnknown, setSimulateUnknown] = useState<boolean>(false);
  const [simulateNoFace, setSimulateNoFace] = useState<boolean>(false);
  const [simulateMultiFace, setSimulateMultiFace] = useState<boolean>(false);
  const [simulateModelsUnconfigured, setSimulateModelsUnconfigured] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate cameras when mediaDevices is available
  const refreshDevices = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Unable to enumerate video devices', err);
      }
    }
  }, [selectedDeviceId]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch (e) {
        console.warn('Video cleanup error', e);
      }
    }
    setCameraActive(false);
    setCameraReady(false);
    setVideoDimensions(null);
    if (cameraPermission === 'GRANTED') {
      setCameraPermission('NOT_REQUESTED');
    }
  }, [cameraPermission]);

  // Initialize verification session with authoritative backend
  useEffect(() => {
    initSession();

    // Check secure context
    if (typeof window !== 'undefined') {
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        setCameraPermission('INSECURE_CONTEXT');
        setCameraError(
          'Insecure Context Detected: Camera API requires HTTPS or localhost. Live video stream blocked by browser security boundary.'
        );
      }
    }

    // Refresh devices on mount
    refreshDevices();

    // Security cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [refreshDevices, stopCamera]);

  const initSession = async () => {
    try {
      setLoading(true);
      setInitError(null);
      const sess = await api.createVerificationSession(branch.id, amount, claimReference);
      setSession(sess);
    } catch (e: any) {
      console.error('Failed to create verification session', e);
      setInitError(e.message || 'Failed to initialize verification session with backend engine');
    } finally {
      setLoading(false);
    }
  };

  // Explicit user-triggered camera start
  const handleStartCamera = async (overrideDeviceId?: string, overrideFacingMode?: 'user' | 'environment') => {
    setCameraError(null);

    // 1. Enforce secure context check
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setCameraPermission('INSECURE_CONTEXT');
      setCameraError('Insecure context: Camera API requires HTTPS or localhost execution.');
      return;
    }

    // 2. Check navigator.mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraPermission('NO_HARDWARE');
      setCameraError('Camera API (navigator.mediaDevices.getUserMedia) is not supported in this browser.');
      setUseSyntheticFeed(true);
      return;
    }

    try {
      setCameraPermission('REQUESTING');
      setCameraReady(false);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const activeFacing = overrideFacingMode || facingMode;
      const activeDevId = overrideDeviceId || selectedDeviceId;

      // Primary constraint: ideal resolution and selected facing mode
      let stream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          video: activeDevId
            ? { deviceId: { exact: activeDevId }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { facingMode: activeFacing, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        console.warn('Constrained camera request failed, attempting fallback to generic video: true', firstErr);
        // Fallback: request generic video stream without strict facing/deviceId
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video viewport DOM element not found');
      }

      // Attach stream to video element
      video.srcObject = stream;

      // Wait for stream metadata to load
      await new Promise<void>((resolve) => {
        let resolved = false;
        const handleLoaded = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        if (video.readyState >= 2) {
          handleLoaded();
        } else {
          video.onloadedmetadata = handleLoaded;
          // Safety timeout after 2.5 seconds
          setTimeout(handleLoaded, 2500);
        }
      });

      // Call video.play() and handle promise
      try {
        await video.play();
      } catch (playErr) {
        console.warn('Video play() call encountered warning (might already be playing):', playErr);
      }

      // Confirm actual dimensional video feed is active
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      setVideoDimensions({ width: w, height: h });

      // ONLY now transition state to Camera Ready
      setCameraPermission('GRANTED');
      setCameraActive(true);
      setCameraReady(true);
      setUseSyntheticFeed(false);

      // Refresh available device list now that permission was granted
      await refreshDevices();
    } catch (err: any) {
      console.warn('Camera access denied or hardware error', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermission('DENIED');
        setCameraError(
          'Camera permission was denied by browser or user. Allow camera permission in site settings and click Start Camera.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPermission('NO_HARDWARE');
        setCameraError('No video camera hardware detected on this workstation terminal.');
        setUseSyntheticFeed(true);
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraPermission('DENIED');
        setCameraError('Camera is already in use by another application or tab. Free hardware and retry.');
      } else {
        setCameraPermission('DENIED');
        setCameraError(`Camera initialization error: ${err.message || 'MediaStream acquisition failed'}`);
      }
      setCameraActive(false);
      setCameraReady(false);
    }
  };

  // Flip camera (user <-> environment)
  const handleToggleFacingMode = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (cameraActive) {
      await handleStartCamera(undefined, nextFacing);
    }
  };

  // Select specific camera device
  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (cameraActive) {
      await handleStartCamera(deviceId);
    }
  };

  // Capture frame from video and execute authoritative verification
  const handleStartFaceVerification = async () => {
    if (!session) return;
    setCapturing(true);
    setVerificationStarted(true);
    setVerificationAttempted(true);

    try {
      let frameBase64: string | undefined;
      let frameWidth = 640;
      let frameHeight = 480;

      // Real video frame capture onto canvas
      if (cameraActive && !useSyntheticFeed && videoRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        frameWidth = video.videoWidth || 640;
        frameHeight = video.videoHeight || 480;
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, frameWidth, frameHeight);
          // Export JPEG frame with 0.85 quality
          frameBase64 = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      // 1. Submit live face capture to authoritative backend (POST /api/v1/verification/sessions/:id/face)
      const afterFaceSess = await api.submitFaceVerification(session.id, {
        frame: frameBase64,
        image_format: 'image/jpeg',
        image_width: frameWidth,
        image_height: frameHeight,
        simulate_face_mismatch: simulateMismatch,
        simulate_liveness_fail: simulateSpoof,
        simulate_unknown_customer: simulateUnknown,
        simulate_no_face: simulateNoFace,
        simulate_multiple_faces: simulateMultiFace,
        simulate_models_unconfigured: simulateModelsUnconfigured,
        client_face_present: !simulateNoFace,
      });

      // 2. Submit secondary biometric modality adapter (POST /api/v1/verification/sessions/:id/biometric)
      const updatedOverall = await api.submitBiometricVerification(session.id, {
        modality: 'FINGERPRINT',
        simulate_biometric_fail: simulateBioFail,
        simulate_biometric_unavailable: simulateBioUnavailable,
      });

      setSession(updatedOverall);

      // Stop camera tracks once verification completes successfully to release hardware sensor
      if (updatedOverall.overall_result === 'VERIFIED') {
        stopCamera();
      }
    } catch (err: any) {
      console.error('Face verification request failed', err);
    } finally {
      setCapturing(false);
    }
  };

  const handleResetAndRetry = async () => {
    setVerificationStarted(false);
    setVerificationAttempted(false);
    setSimulateMismatch(false);
    setSimulateSpoof(false);
    setSimulateBioFail(false);
    setSimulateBioUnavailable(false);
    setSimulateNoFace(false);
    setSimulateMultiFace(false);
    setSimulateModelsUnconfigured(false);
    await initSession();
  };

  // Derived statuses
  const faceStatus = session?.face_result.status || 'PENDING';
  const detectionStatus = session?.face_result.detection_status || 'PENDING';
  const livenessStatus = session?.face_result.liveness_status || 'PENDING';
  const bioStatus = session?.additional_biometric_result.status || 'PENDING';
  const overallResult = session?.overall_result || 'PENDING';
  const verifiedCustomer = session?.verified_customer;
  const isModelsConfigured = session?.face_result.face_matching_configured !== false && faceStatus !== 'NOT_CONFIGURED';
  const isLivenessConfigured = session?.face_result.liveness_configured !== false && livenessStatus !== 'NOT_CONFIGURED';

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <span>STEP 2 OF 5</span>
          <span>·</span>
          <span>IDENTITY-FIRST MULTI-MODAL BIOMETRIC VERIFICATION</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">
          Face Verification & Anti-Spoofing Liveness Gateway
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Evaluating physical person standing at the terminal. Customer identity, home branch records, and balances remain concealed until verified.
        </p>
      </div>

      {/* Prominent Simulation Mode / Mock Hardware Adapter V2 Banner */}
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-amber-300 px-2 py-0.5 rounded bg-amber-900/50 border border-amber-700/60">
              Simulation Mode / Mock Hardware Adapter V2
            </span>
            <span className="text-[10px] font-mono text-slate-400">Academic Prototype</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Biometric models (OpenCV landmark locator, InsightFace / ArcFace 512-dim cosine similarity, and anti-spoofing PAD evaluation) are evaluated in academic simulation mode. Raw biometric images are never persisted.
          </p>
        </div>
      </div>

      {/* Persistent Sections: Visiting Branch, Amount, Customer Identity & Home Branch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        {/* Section 1: Visiting Branch */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Building2 className="w-3 h-3 text-indigo-400" />
            <span>1. Visiting Branch</span>
          </span>
          <span className="font-bold text-white block truncate">{branch.name}</span>
          <span className="text-[11px] text-indigo-300 block truncate">
            {branch.bank_name || 'Participating Bank'} ({branch.branch_code})
          </span>
        </div>

        {/* Section 2: Requested Amount */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Wallet className="w-3 h-3 text-emerald-400" />
            <span>2. Requested Amount</span>
          </span>
          <span className="font-bold text-emerald-400 text-base block tabular-nums">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block">Policy Cap ₹50,000/day</span>
        </div>

        {/* Section 3: Customer Identity (Privacy Guard Active) */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>3. Customer Privacy Guard</span>
          </span>
          {overallResult === 'VERIFIED' && verifiedCustomer ? (
            <div>
              <span className="font-bold text-emerald-400 block truncate">
                {verifiedCustomer.full_name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                Ref: {verifiedCustomer.customer_reference}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-bold text-amber-400 block">Concealed / Hidden</span>
              <span className="text-[10px] text-slate-500 block">Pending Verification</span>
            </div>
          )}
        </div>

        {/* Section 4: Home Branch Status */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Home className="w-3 h-3 text-indigo-400" />
            <span>4. Home Branch Status</span>
          </span>
          {overallResult === 'VERIFIED' && verifiedCustomer ? (
            <div>
              <span className="font-bold text-emerald-400 block truncate">
                {verifiedCustomer.home_bank_name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {verifiedCustomer.home_branch_name}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-bold text-slate-400 block">Unverified</span>
              <span className="text-[10px] text-slate-500 block">Inter-Switch Link Armed</span>
            </div>
          )}
        </div>
      </div>

      {initError && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{initError}</span>
        </div>
      )}

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Camera Viewport, Permission Status, Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            {/* Camera Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Camera Viewport</span>
                {videoDimensions && cameraReady && (
                  <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                    ({videoDimensions.width}×{videoDimensions.height})
                  </span>
                )}
              </span>

              {/* Camera Controls & Status Badge */}
              <div className="flex items-center gap-2">
                {/* Camera switcher if multiple video devices available */}
                {availableDevices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => handleSelectDevice(e.target.value)}
                    className="text-[11px] font-mono bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                    title="Select Camera Input"
                  >
                    {availableDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                {/* Flip camera facing mode button */}
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title={`Switch to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>

                {/* Section 9 Status 1, 2, 3, 4: Camera Permission Status Badge */}
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${
                    cameraReady
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : cameraPermission === 'REQUESTING'
                      ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
                      : cameraPermission === 'DENIED' || cameraPermission === 'INSECURE_CONTEXT'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : cameraPermission === 'NO_HARDWARE'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cameraReady
                        ? 'bg-emerald-400 animate-pulse'
                        : cameraPermission === 'REQUESTING'
                        ? 'bg-indigo-400 animate-ping'
                        : cameraPermission === 'DENIED'
                        ? 'bg-rose-400'
                        : cameraPermission === 'NO_HARDWARE'
                        ? 'bg-amber-400'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {cameraReady
                      ? 'Camera Ready'
                      : cameraPermission === 'REQUESTING'
                      ? 'Requesting Camera...'
                      : cameraPermission === 'DENIED'
                      ? 'Camera Unavailable / Denied'
                      : cameraPermission === 'NO_HARDWARE'
                      ? 'Camera Unavailable'
                      : cameraPermission === 'INSECURE_CONTEXT'
                      ? 'Insecure Context'
                      : 'Camera Permission Required'}
                  </span>
                </span>
              </div>
            </div>

            {/* Video Box Viewport (Video element is PERMANENTLY mounted in DOM to prevent null ref) */}
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              {/* Permanent Video Element: Visible when active, hidden when stopped */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  cameraActive && !useSyntheticFeed ? 'opacity-100 block' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              />

              {/* Fallback View 1: Synthetic Sensor Feed */}
              {useSyntheticFeed && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-5">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-500/60 flex items-center justify-center bg-indigo-950/30">
                    <ScanFace className="w-12 h-12 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Synthetic Simulation Camera Feed Active
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                      Counter Terminal: {branch.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                      Subject Claim: {claimReference || 'Direct Biometric Search'}
                    </span>
                  </div>
                </div>
              )}

              {/* Fallback View 2: Standby Prompt when Camera Inactive */}
              {!cameraActive && !useSyntheticFeed && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-sm z-5">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Video className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block">
                      Camera Stream Inactive
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Click <strong className="text-indigo-400">“Start Camera”</strong> below to request camera permission and initialize live preview.
                    </p>
                  </div>
                </div>
              )}

              {/* Facial Alignment Guide Reticle Overlay (Rendered ON TOP of live video feed) */}
              {(cameraActive || useSyntheticFeed) && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
                  {/* Outer Frame with Crosshairs */}
                  <div className="relative w-full h-full max-w-[280px] max-h-[320px] border-2 border-dashed border-indigo-400/50 rounded-3xl flex flex-col justify-between p-3 bg-indigo-500/5">
                    {/* Corner Guides */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

                    {/* Header Overlay Label */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-indigo-300/80 bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      <span>FACIAL_ALIGNMENT_GUIDE</span>
                      <span>ISO_19794_5</span>
                    </div>

                    {/* Eye Level Guide Line */}
                    <div className="w-full flex items-center justify-center my-auto">
                      <div className="w-3/4 border-b border-indigo-400/30 flex justify-between text-[8px] font-mono text-indigo-400/60 pb-0.5">
                        <span>EYE_LEVEL</span>
                        <span>HORIZON</span>
                      </div>
                    </div>

                    {/* Footer Overlay Label */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-indigo-300/80 bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      <span>PAD_SENSORS_ARMED</span>
                      <span>LIVE_PREVIEW</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Overlay while Capturing & Evaluating */}
              {capturing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center space-y-2.5 z-20">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs font-mono text-slate-200 font-semibold tracking-wide">
                    EXTRACTING EMBEDDINGS & EVALUATING PAD LIVENESS...
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Transmitting encrypted feature vector to authoritative session
                  </span>
                </div>
              )}
            </div>

            {/* Hidden canvas element for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Error banner for permission denial or hardware errors */}
            {cameraError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-1">
                  <p className="font-semibold">{cameraError}</p>
                  {(cameraPermission === 'DENIED' || cameraPermission === 'NO_HARDWARE') && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartCamera()}
                        className="text-[11px] underline text-indigo-400 hover:text-indigo-300 font-mono"
                      >
                        Retry Camera Access
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setUseSyntheticFeed(true);
                          setCameraPermission('GRANTED');
                        }}
                        className="text-[11px] underline text-amber-400 hover:text-amber-300 font-mono"
                      >
                        Use Simulation Sensor Feed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Primary Action Controls: Start Camera, Start Face Verification, Stop, Retry */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* 1. "Start Camera" Button */}
                {!cameraActive && !useSyntheticFeed ? (
                  <button
                    type="button"
                    onClick={() => handleStartCamera()}
                    disabled={loading || capturing}
                    className="min-h-[44px] sm:flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs font-mono flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span>Start Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    disabled={capturing}
                    className="min-h-[44px] py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border border-slate-800 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop Camera</span>
                  </button>
                )}

                {/* 2. "Start Face Verification" Button */}
                <button
                  type="button"
                  onClick={handleStartFaceVerification}
                  disabled={
                    capturing ||
                    loading ||
                    (!cameraActive && !useSyntheticFeed) ||
                    overallResult === 'VERIFIED'
                  }
                  className="min-h-[44px] sm:flex-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs font-mono flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {capturing
                      ? 'Executing Face Verification...'
                      : overallResult === 'VERIFIED'
                      ? 'Identity Verified'
                      : 'Start Face Verification'}
                  </span>
                </button>

                {/* 3. Retry Controls */}
                {verificationAttempted && (
                  <button
                    type="button"
                    onClick={handleResetAndRetry}
                    disabled={capturing}
                    className="min-h-[44px] py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs font-mono flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                    title="Reset verification state and create new session"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Retry</span>
                  </button>
                )}
              </div>

              {/* Simulation Feed Toggle fallback */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                <span>
                  Sensor Stream:{' '}
                  {cameraActive
                    ? 'Live Hardware Webcam'
                    : useSyntheticFeed
                    ? 'Simulation Feed'
                    : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (useSyntheticFeed) {
                      setUseSyntheticFeed(false);
                    } else {
                      stopCamera();
                      setUseSyntheticFeed(true);
                      setCameraPermission('GRANTED');
                    }
                  }}
                  className="text-slate-400 hover:text-indigo-300 underline"
                >
                  {useSyntheticFeed ? 'Switch to Physical Camera' : 'Use Simulation Sensor Feed'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Fault Injection & Attack Simulation Controls */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Security Test Fault Injections</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Inject Policy Violations</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateMismatch}
                    onChange={(e) => setSimulateMismatch(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate Face Mismatch (Test 3)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Similarity 0.38 &lt; 0.80 threshold triggers FACE_EMBEDDING_MISMATCH
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateSpoof}
                    onChange={(e) => setSimulateSpoof(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate Presentation Attack / Spoof (Test 4)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      PAD score 0.18 &lt; 0.60 detects synthetic photo or screen replay
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateNoFace}
                    onChange={(e) => setSimulateNoFace(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate No Face in Frame (Test 5)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Landmark detector finds 0 faces; rejects with NO_FACE_DETECTED
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateMultiFace}
                    onChange={(e) => setSimulateMultiFace(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate Multiple Faces in Viewport (Test 6)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      More than one subject detected in frame; rejects with MULTIPLE_FACES_DETECTED
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateBioFail}
                    onChange={(e) => setSimulateBioFail(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate Secondary Biometric Failure (Test 4)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Hardware fingerprint scanner adapter returns mismatch signal
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateBioUnavailable}
                    onChange={(e) => setSimulateBioUnavailable(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate Additional Biometric Unavailable (State 13)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Adapter reports scanner offline or unavailable; fails closed safely
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={simulateModelsUnconfigured}
                    onChange={(e) => setSimulateModelsUnconfigured(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">
                      Simulate Models Not Configured (Section 9 & 10)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      InsightFace / PAD models absent; displays unconfigured notices accurately
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Authoritative Verification Statuses & Decisions */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block">
                  Authoritative Decisions
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Session: {session?.id || 'Initializing...'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                TTL: 180s
              </span>
            </div>

            {/* Model Configuration Notice Banners if Unconfigured */}
            {(!isModelsConfigured || !isLivenessConfigured) && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs space-y-1 font-mono">
                {!isModelsConfigured && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="font-bold">Face Matching Not Configured</span>
                  </div>
                )}
                {!isLivenessConfigured && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="font-bold">Liveness Detection Not Configured</span>
                  </div>
                )}
              </div>
            )}

            {/* Section 9 Status 5, 6: Face Detection Status */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <ScanFace className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Face Detection Status</span>
                </span>
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                    detectionStatus === 'FACE_DETECTED'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : detectionStatus === 'NO_FACE_DETECTED' || detectionStatus === 'MULTIPLE_FACES_DETECTED'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {detectionStatus === 'FACE_DETECTED'
                    ? 'Face Detected'
                    : detectionStatus === 'NO_FACE_DETECTED'
                    ? 'Face Not Detected'
                    : detectionStatus === 'MULTIPLE_FACES_DETECTED'
                    ? 'Multiple Faces Detected'
                    : 'Pending Capture'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Model Detector:</span>
                <span className="text-slate-300">OpenCV Facial Landmark Locator</span>
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                Face detection is NOT face recognition. Matching evaluates identity separately.
              </span>
            </div>

            {/* Section 9 Status 7, 8, 9: Face Feature Matching Status */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <ScanFace className="w-3.5 h-3.5 text-indigo-400" />
                  <span>2. Face Matching Status</span>
                </span>
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                    capturing
                      ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
                      : !isModelsConfigured
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : faceStatus === 'MATCH'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : faceStatus === 'MISMATCH' || faceStatus === 'FAILED'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {capturing
                    ? 'Face Matching'
                    : !isModelsConfigured
                    ? 'Face Matching Not Configured'
                    : faceStatus === 'MATCH'
                    ? 'Face Match Successful'
                    : faceStatus === 'MISMATCH'
                    ? 'Face Mismatch'
                    : faceStatus === 'FAILED'
                    ? 'Face Match Failed'
                    : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Cosine Similarity:</span>
                <span className="text-white font-bold tabular-nums">
                  {session?.face_result.confidence_score
                    ? (session.face_result.confidence_score * 100).toFixed(1) + '%'
                    : '---'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    faceStatus === 'MATCH' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${(session?.face_result.confidence_score || 0) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                InsightFace / ArcFace 512-dim embedding similarity (Threshold &ge; 80.0%)
              </span>
            </div>

            {/* Section 9 Status 10, 11: Liveness & PAD Detection Status */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Liveness Status</span>
                </span>
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                    !isLivenessConfigured
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : livenessStatus === 'LIVE'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : livenessStatus === 'SPOOF_DETECTED'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {!isLivenessConfigured
                    ? 'Liveness Detection Not Configured'
                    : livenessStatus === 'LIVE'
                    ? 'Liveness Check Passed'
                    : livenessStatus === 'SPOOF_DETECTED'
                    ? 'Liveness Failed'
                    : 'Liveness Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>PAD Anti-Spoof Score:</span>
                <span className="text-white font-bold tabular-nums">
                  {session?.face_result.liveness_score
                    ? (session.face_result.liveness_score * 100).toFixed(1) + '%'
                    : '---'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                Evaluates micro-motion, planar reflectance & texture (Threshold &ge; 60.0%)
              </span>
            </div>

            {/* Section 9 Status 12, 13: Additional Biometric Adapter Status */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                  <span>4. Additional Biometric Status</span>
                </span>
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                    bioStatus === 'MATCH'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : bioStatus === 'UNAVAILABLE'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : bioStatus === 'MISMATCH'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {bioStatus === 'MATCH'
                    ? 'Biometric Verification Passed'
                    : bioStatus === 'UNAVAILABLE'
                    ? 'Additional Biometric Verification Unavailable'
                    : bioStatus === 'MISMATCH'
                    ? 'Biometric Mismatch'
                    : 'Additional Biometric Verification Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Modality:</span>
                <span className="text-white font-semibold">Fingerprint Scanner (Minutiae)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Adapter Interface:</span>
                <span className="text-amber-300 font-mono text-[10px]">MOCK_HARDWARE_ADAPTER_V2</span>
              </div>
            </div>

            {/* Section 9 Status 14: Overall Identity Verification Result */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                overallResult === 'VERIFIED'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : overallResult === 'REJECTED'
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {overallResult === 'VERIFIED' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : overallResult === 'REJECTED' ? (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-slate-500 shrink-0" />
              )}

              <div>
                <span className="text-xs font-bold uppercase font-mono block">
                  {overallResult === 'VERIFIED'
                    ? 'Identity Verification Successful'
                    : overallResult === 'REJECTED'
                    ? 'Identity Verification Failed'
                    : 'Verification Not Started / Pending'}
                </span>
                <span className="text-[11px] block mt-0.5 opacity-90">
                  {overallResult === 'VERIFIED'
                    ? 'All mandatory identity checks satisfied. Customer profile authoritatively unlocked.'
                    : overallResult === 'REJECTED'
                    ? `Verification Rejected (${session?.failure_reason_code || 'SECURITY_POLICY_VIOLATION'})`
                    : 'Awaiting facial capture and biometric scan execution'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Guard Notice while Pending */}
          {overallResult === 'PENDING' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold font-mono">
                <UserX className="w-4 h-4 shrink-0" />
                <span>Customer identity has not been verified.</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Customer details will appear only after the required identity verification and home-branch checks succeed. Zero pre-verification customer data disclosed.
              </p>
            </div>
          )}

          {/* Rejection / Violation Message */}
          {overallResult === 'REJECTED' && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-mono font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Customer identity could not be verified. Withdrawal denied.</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                In accordance with zero-knowledge privacy protection, zero customer account details or non-matching records have been disclosed.
              </p>
              {session?.failure_reason_code === 'VISITING_BRANCH_IS_HOME_BRANCH' && (
                <p className="text-[11px] text-amber-300 font-mono">
                  Violation: Visiting branch matches the customer's registered home branch. Cardless cross-branch withdrawals are restricted to non-home branches.
                </p>
              )}
              {session?.failure_reason_code === 'NO_FACE_DETECTED' && (
                <p className="text-[11px] text-amber-300 font-mono">
                  Sensor Anomaly: No face detected in camera viewport. Ensure subject is directly facing terminal lens.
                </p>
              )}
              {session?.failure_reason_code === 'MULTIPLE_FACES_DETECTED' && (
                <p className="text-[11px] text-amber-300 font-mono">
                  Security Violation: Multiple subjects in viewport. Only single customer requesting withdrawal may be in frame.
                </p>
              )}
              {session?.failure_reason_code === 'MODELS_NOT_CONFIGURED' && (
                <p className="text-[11px] text-amber-300 font-mono">
                  Configuration Note: Face matching or anti-spoofing liveness model not loaded. Fail-closed defense halted verification.
                </p>
              )}
              {session?.failure_reason_code === 'BIOMETRIC_ADAPTER_UNAVAILABLE' && (
                <p className="text-[11px] text-amber-300 font-mono">
                  Hardware Note: Secondary biometric adapter scanner is unavailable or offline.
                </p>
              )}
            </div>
          )}

          {/* Customer Unlocked View (Only upon authoritative VERIFIED state) */}
          {overallResult === 'VERIFIED' && verifiedCustomer && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/80 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-800/50 pb-2">
                <span className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>CUSTOMER IDENTITY AUTHENTICATED</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-900/40">
                  {verifiedCustomer.account_status}
                </span>
              </div>

              <div>
                <span className="text-base font-bold text-white block">
                  {verifiedCustomer.full_name}
                </span>
                <span className="text-[11px] font-mono text-slate-300 block mt-0.5">
                  Ref: {verifiedCustomer.customer_reference} · PAN: {verifiedCustomer.synthetic_pan}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-800/40 text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Home Financial Institution:</span>
                  <span className="text-white font-semibold">{verifiedCustomer.home_bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Home Registered Branch:</span>
                  <span className="text-white font-semibold">{verifiedCustomer.home_branch_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Balance:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    ₹{verifiedCustomer.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cross-Branch Validated:</span>
                  <span className="text-emerald-400 font-bold">YES (Visiting != Home Branch)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg border border-slate-800 sm:border-transparent flex items-center justify-center cursor-pointer"
        >
          ← Back to Branch & Amount
        </button>

        <button
          type="button"
          onClick={() => {
            if (session && overallResult === 'VERIFIED' && verifiedCustomer) {
              const fullCustomerObj: Customer = {
                id: verifiedCustomer.id,
                customer_reference: verifiedCustomer.customer_reference,
                full_name: verifiedCustomer.full_name,
                synthetic_pan: verifiedCustomer.synthetic_pan,
                home_branch_id: verifiedCustomer.home_branch_id,
                home_branch_name: verifiedCustomer.home_branch_name,
                home_bank_id: '',
                home_bank_name: verifiedCustomer.home_bank_name,
                account_status: verifiedCustomer.account_status as any,
                available_balance: verifiedCustomer.available_balance,
                daily_withdrawal_limit: 50000,
                enrolled_biometrics: {
                  face_enrolled: true,
                  iris_enrolled: false,
                  fingerprint_enrolled: true,
                  reference_face_hash: '',
                },
                created_at: '',
                updated_at: '',
              };
              onVerificationPassed(session, fullCustomerObj);
            }
          }}
          disabled={overallResult !== 'VERIFIED' || !verifiedCustomer}
          className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs transition-colors shadow-sm w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Proceed to Home-Branch Check</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
