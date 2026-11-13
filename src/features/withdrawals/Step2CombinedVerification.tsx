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
  const [verificationError, setVerificationError] = useState<string | null>(null);

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
  const selectedDeviceIdRef = useRef<string>('');
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  // Enumerate cameras when mediaDevices is available
  const refreshDevices = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (!isMountedRef.current) return;
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceIdRef.current) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Unable to enumerate video devices', err);
      }
    }
  }, []);

  // Stop camera tracks cleanly (stable callback without permission state dependency)
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
    setCameraPermission((prev) => (prev === 'GRANTED' ? 'NOT_REQUESTED' : prev));
  }, []);

  const initSession = useCallback(async () => {
    try {
      setLoading(true);
      setInitError(null);
      setVerificationError(null);
      const sess = await api.createVerificationSession(branch.id, amount, claimReference);
      if (isMountedRef.current) {
        setSession(sess);
      }
    } catch (e: any) {
      console.error('Failed to create verification session', e);
      if (isMountedRef.current) {
        setInitError(e.message || 'Failed to initialize verification session with backend engine');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [branch.id, amount, claimReference]);

  // Initialize verification session once on mount and release hardware tracks strictly on unmount
  useEffect(() => {
    isMountedRef.current = true;
    initSession();

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

    refreshDevices();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [initSession, refreshDevices, stopCamera]);

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

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
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
    setVerificationError(null);

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

      // Short-circuit secondary biometric if facial verification or PAD liveness already rejected
      if (
        afterFaceSess.overall_result === 'REJECTED' ||
        afterFaceSess.face_result.status !== 'MATCH' ||
        afterFaceSess.face_result.liveness_status !== 'LIVE'
      ) {
        setSession(afterFaceSess);
        return;
      }

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
      setVerificationError(err?.message || 'Face verification request failed. Please retry.');
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
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
          <span>STEP 2 OF 5</span>
          <span className="text-slate-300">·</span>
          <span>IDENTITY-FIRST MULTI-MODAL BIOMETRIC VERIFICATION</span>
        </div>
        <h2 className="text-xl font-bold text-[#172554] mt-1">
          Face Verification & Anti-Spoofing Liveness Gateway
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Evaluating physical person standing at the terminal. Customer identity, home branch records, and balances remain concealed until verified.
        </p>
      </div>

      {/* Prominent Simulation Mode / Mock Hardware Adapter V2 Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[#172554] text-xs flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#D97706] px-2 py-0.5 rounded bg-white border border-amber-200">
              Simulation Mode / Mock Hardware Adapter V2
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">Academic Prototype</span>
          </div>
          <p className="text-[#64748B] text-[11px] leading-relaxed">
            Biometric models (OpenCV landmark locator, InsightFace / ArcFace 512-dim cosine similarity, and anti-spoofing PAD evaluation) are evaluated in academic simulation mode. Raw biometric images are never persisted.
          </p>
        </div>
      </div>

      {/* Persistent Sections: Visiting Branch, Amount, Customer Identity & Home Branch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Section 1: Visiting Branch */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#2563EB]" />
            <span>1. Visiting Branch</span>
          </span>
          <span className="font-bold text-[#172554] block truncate">{branch.name}</span>
          <span className="text-[11px] font-mono text-[#2563EB] block truncate">
            {branch.bank_name || 'Participating Bank'} ({branch.branch_code})
          </span>
        </div>

        {/* Section 2: Requested Amount */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase flex items-center gap-1">
            <Wallet className="w-3 h-3 text-[#16A34A]" />
            <span>2. Requested Amount</span>
          </span>
          <span className="font-bold font-mono text-[#16A34A] text-base block tabular-nums">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-[#64748B] block">Policy Cap ₹50,000/day</span>
        </div>

        {/* Section 3: Customer Identity (Privacy Guard Active) */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#D97706]" />
            <span>3. Customer Privacy Guard</span>
          </span>
          {overallResult === 'VERIFIED' && verifiedCustomer ? (
            <div>
              <span className="font-bold text-[#16A34A] block truncate">
                {verifiedCustomer.full_name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] block truncate">
                Ref: {verifiedCustomer.customer_reference}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-bold text-[#D97706] block">Concealed / Hidden</span>
              <span className="text-[11px] text-[#64748B] block">Pending Verification</span>
            </div>
          )}
        </div>

        {/* Section 4: Home Branch Status */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#64748B] uppercase flex items-center gap-1">
            <Home className="w-3 h-3 text-[#2563EB]" />
            <span>4. Home Branch Status</span>
          </span>
          {overallResult === 'VERIFIED' && verifiedCustomer ? (
            <div>
              <span className="font-bold text-[#16A34A] block truncate">
                {verifiedCustomer.home_bank_name}
              </span>
              <span className="text-[10px] text-[#64748B] block truncate">
                {verifiedCustomer.home_branch_name}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-bold text-[#64748B] block">Unverified</span>
              <span className="text-[11px] text-[#64748B] block">Inter-Switch Link Armed</span>
            </div>
          )}
        </div>
      </div>

      {initError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{initError}</span>
        </div>
      )}

      {/* Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Camera Viewport, Permission Status, Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
            {/* Camera Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Camera Viewport</span>
                {videoDimensions && cameraReady && (
                  <span className="text-[10px] font-mono text-[#64748B] font-normal hidden sm:inline">
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
                    className="max-w-[140px] sm:max-w-[200px] truncate text-[11px] font-mono bg-white border border-[#E2E8F0] rounded-md px-2 py-1 text-[#172554] focus:outline-none focus:border-[#2563EB]"
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
                  className="p-1.5 rounded-md bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#2563EB] border border-[#E2E8F0] transition-colors cursor-pointer"
                  title={`Switch to ${facingMode === 'user' ? 'rear' : 'front'} camera`}
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>

                {/* Section 9 Status 1, 2, 3, 4: Camera Permission Status Badge */}
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1.5 ${
                    cameraReady
                      ? 'bg-green-50 border-green-200 text-[#16A34A]'
                      : cameraPermission === 'REQUESTING'
                      ? 'bg-[#EFF6FF] border-blue-200 text-[#2563EB]'
                      : cameraPermission === 'DENIED' || cameraPermission === 'INSECURE_CONTEXT'
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : cameraPermission === 'NO_HARDWARE'
                      ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cameraReady
                        ? 'bg-[#16A34A] animate-pulse'
                        : cameraPermission === 'REQUESTING'
                        ? 'bg-[#2563EB] animate-ping'
                        : cameraPermission === 'DENIED'
                        ? 'bg-[#DC2626]'
                        : cameraPermission === 'NO_HARDWARE'
                        ? 'bg-[#D97706]'
                        : 'bg-slate-400'
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
            <div className="relative aspect-4/3 w-full bg-[#F8FAFC] rounded-xl overflow-hidden border border-[#E2E8F0] flex items-center justify-center">
              {/* Permanent Video Element: Visible when active, hidden when stopped */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} transition-opacity duration-300 ${
                  cameraActive && !useSyntheticFeed ? 'opacity-100 block' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              />

              {/* Fallback View 1: Synthetic Sensor Feed */}
              {useSyntheticFeed && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-5">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#2563EB]/60 flex items-center justify-center bg-[#EFF6FF]">
                    <ScanFace className="w-12 h-12 text-[#2563EB] animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#172554] block">
                      Synthetic Simulation Camera Feed Active
                    </span>
                    <span className="text-[11px] text-[#64748B] block font-mono mt-0.5">
                      Counter Terminal: {branch.name}
                    </span>
                    <span className="text-[10px] text-[#64748B] block font-mono mt-0.5">
                      Subject Claim: {claimReference || 'Direct Biometric Search'}
                    </span>
                  </div>
                </div>
              )}

              {/* Fallback View 2: Standby Prompt when Camera Inactive */}
              {!cameraActive && !useSyntheticFeed && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-sm z-5">
                  <div className="w-16 h-16 rounded-full bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                    <Video className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#172554] block">
                      Camera Stream Inactive
                    </span>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                      Click <strong className="text-[#2563EB]">“Start Camera”</strong> below to request camera permission and initialize live preview.
                    </p>
                  </div>
                </div>
              )}

              {/* Facial Alignment Guide Reticle Overlay (Rendered ON TOP of live video feed) */}
              {(cameraActive || useSyntheticFeed) && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
                  {/* Outer Frame with Crosshairs */}
                  <div className="relative w-full h-full max-w-[280px] max-h-[320px] border-2 border-dashed border-[#2563EB]/75 rounded-3xl flex flex-col justify-between p-3 bg-blue-500/5">
                    {/* Corner Guides */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#2563EB]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#2563EB]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#2563EB]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#2563EB]" />

                    {/* Header Overlay Label */}
                    <div className="flex justify-between items-center text-[9px] font-mono font-semibold text-[#2563EB] bg-white/90 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                      <span>FACIAL_ALIGNMENT_GUIDE</span>
                      <span>ISO_19794_5</span>
                    </div>

                    {/* Eye Level Guide Line */}
                    <div className="w-full flex items-center justify-center my-auto">
                      <div className="w-3/4 border-b border-[#2563EB]/40 flex justify-between text-[8px] font-mono font-semibold text-[#2563EB]/80 pb-0.5">
                        <span>EYE_LEVEL</span>
                        <span>HORIZON</span>
                      </div>
                    </div>

                    {/* Footer Overlay Label */}
                    <div className="flex justify-between items-center text-[9px] font-mono font-semibold text-[#2563EB] bg-white/90 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                      <span>PAD_SENSORS_ARMED</span>
                      <span>LIVE_PREVIEW</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Overlay while Capturing & Evaluating */}
              {capturing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center space-y-2.5 z-20 p-4 text-center">
                  <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
                  <span className="text-xs font-mono text-[#172554] font-bold tracking-wide">
                    EXTRACTING EMBEDDINGS & EVALUATING PAD LIVENESS...
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Transmitting encrypted feature vector to authoritative session
                  </span>
                </div>
              )}
            </div>

            {/* Hidden canvas element for frame extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Error banner for verification API errors */}
            {verificationError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <p className="font-semibold">{verificationError}</p>
              </div>
            )}

            {/* Error banner for permission denial or hardware errors */}
            {cameraError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <div className="space-y-1">
                  <p className="font-semibold">{cameraError}</p>
                  {(cameraPermission === 'DENIED' || cameraPermission === 'NO_HARDWARE') && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartCamera()}
                        className="text-[11px] underline text-[#2563EB] hover:text-blue-700 font-medium cursor-pointer"
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
                        className="text-[11px] underline text-[#D97706] hover:text-amber-700 font-medium cursor-pointer"
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
                    className="min-h-[44px] sm:flex-1 py-2.5 px-4 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-blue-200 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-[#2563EB]" />
                    <span>Start Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    disabled={capturing}
                    className="min-h-[44px] py-2.5 px-3.5 rounded-lg bg-white hover:bg-red-50 text-[#DC2626] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
                  >
                    <Power className="w-3.5 h-3.5 text-[#DC2626]" />
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
                  className="min-h-[44px] sm:flex-2 py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed"
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
                    className="min-h-[44px] py-2.5 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-[#172554] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#E2E8F0] cursor-pointer"
                    title="Reset verification state and create new session"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Retry</span>
                  </button>
                )}
              </div>

              {/* Simulation Feed Toggle fallback */}
              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                <span>
                  Sensor Stream:{' '}
                  <strong className="text-[#172554]">
                    {cameraActive
                      ? 'Live Hardware Webcam'
                      : useSyntheticFeed
                      ? 'Simulation Feed'
                      : 'Inactive'}
                  </strong>
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
                  className="text-[#2563EB] hover:text-blue-700 underline font-medium cursor-pointer"
                >
                  {useSyntheticFeed ? 'Switch to Physical Camera' : 'Use Simulation Sensor Feed'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Fault Injection & Attack Simulation Controls */}
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-xs font-bold text-[#172554] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Security Test Fault Injections</span>
              </span>
              <span className="text-[11px] text-[#64748B]">Inject Policy Violations</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateMismatch}
                    onChange={(e) => setSimulateMismatch(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate Face Mismatch (Test 3)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Similarity 0.38 &lt; 0.80 threshold triggers FACE_EMBEDDING_MISMATCH
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateSpoof}
                    onChange={(e) => setSimulateSpoof(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate Presentation Attack / Spoof (Test 4)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      PAD score 0.18 &lt; 0.60 detects synthetic photo or screen replay
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateNoFace}
                    onChange={(e) => setSimulateNoFace(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate No Face in Frame (Test 5)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Landmark detector finds 0 faces; rejects with NO_FACE_DETECTED
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateMultiFace}
                    onChange={(e) => setSimulateMultiFace(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate Multiple Faces in Viewport (Test 6)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      More than one subject detected in frame; rejects with MULTIPLE_FACES_DETECTED
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateBioFail}
                    onChange={(e) => setSimulateBioFail(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate Secondary Biometric Failure (Test 4)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Hardware fingerprint scanner adapter returns mismatch signal
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateBioUnavailable}
                    onChange={(e) => setSimulateBioUnavailable(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate Additional Biometric Unavailable (State 13)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Adapter reports scanner offline or unavailable; fails closed safely
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={simulateModelsUnconfigured}
                    onChange={(e) => setSimulateModelsUnconfigured(e.target.checked)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <div>
                    <span className="font-semibold text-[#172554] block">
                      Simulate Models Not Configured (Section 9 & 10)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
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
          <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#172554] uppercase tracking-wider block">
                  Authoritative Decisions
                </span>
                <span className="text-[11px] text-[#64748B] font-mono">
                  Session: {session?.id || 'Initializing...'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                TTL: 180s
              </span>
            </div>

            {/* Model Configuration Notice Banners if Unconfigured */}
            {(!isModelsConfigured || !isLivenessConfigured) && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[#D97706] text-xs space-y-1">
                {!isModelsConfigured && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />
                    <span className="font-bold">Face Matching Not Configured</span>
                  </div>
                )}
                {!isLivenessConfigured && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />
                    <span className="font-bold">Liveness Detection Not Configured</span>
                  </div>
                )}
              </div>
            )}

            {/* Section 9 Status 5, 6: Face Detection Status */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[#172554] flex items-center gap-1.5">
                  <ScanFace className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>1. Face Detection Status</span>
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    detectionStatus === 'FACE_DETECTED'
                      ? 'bg-green-50 border-green-200 text-[#16A34A]'
                      : detectionStatus === 'NO_FACE_DETECTED' || detectionStatus === 'MULTIPLE_FACES_DETECTED'
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B]'
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
              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Model Detector:</span>
                <span className="text-[#172554] font-medium">OpenCV Facial Landmark Locator</span>
              </div>
              <span className="text-[10px] text-[#64748B] block">
                Face detection is NOT face recognition. Matching evaluates identity separately.
              </span>
            </div>

            {/* Section 9 Status 7, 8, 9: Face Feature Matching Status */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[#172554] flex items-center gap-1.5">
                  <ScanFace className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>2. Face Matching Status</span>
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    capturing
                      ? 'bg-[#EFF6FF] border-blue-200 text-[#2563EB]'
                      : !isModelsConfigured
                      ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                      : faceStatus === 'MATCH'
                      ? 'bg-green-50 border-green-200 text-[#16A34A]'
                      : faceStatus === 'MISMATCH' || faceStatus === 'FAILED'
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B]'
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

              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Cosine Similarity:</span>
                <span className="text-[#172554] font-mono font-bold tabular-nums">
                  {session?.face_result.confidence_score
                    ? (session.face_result.confidence_score * 100).toFixed(1) + '%'
                    : '---'}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    faceStatus === 'MATCH' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                  }`}
                  style={{
                    width: `${(session?.face_result.confidence_score || 0) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-[#64748B] block">
                InsightFace / ArcFace 512-dim embedding similarity (Threshold &ge; 80.0%)
              </span>
            </div>

            {/* Section 9 Status 10, 11: Liveness & PAD Detection Status */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[#172554] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>3. Liveness Status</span>
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    !isLivenessConfigured
                      ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                      : livenessStatus === 'LIVE'
                      ? 'bg-green-50 border-green-200 text-[#16A34A]'
                      : livenessStatus === 'SPOOF_DETECTED'
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B]'
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

              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>PAD Anti-Spoof Score:</span>
                <span className="text-[#172554] font-mono font-bold tabular-nums">
                  {session?.face_result.liveness_score
                    ? (session.face_result.liveness_score * 100).toFixed(1) + '%'
                    : '---'}
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] block">
                Evaluates micro-motion, planar reflectance & texture (Threshold &ge; 60.0%)
              </span>
            </div>

            {/* Section 9 Status 12, 13: Additional Biometric Adapter Status */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[#172554] flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>4. Additional Biometric Status</span>
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    bioStatus === 'MATCH'
                      ? 'bg-green-50 border-green-200 text-[#16A34A]'
                      : bioStatus === 'UNAVAILABLE'
                      ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                      : bioStatus === 'MISMATCH'
                      ? 'bg-red-50 border-red-200 text-[#DC2626]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B]'
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

              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Modality:</span>
                <span className="text-[#172554] font-semibold">Fingerprint Scanner (Minutiae)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Adapter Interface:</span>
                <span className="text-[#D97706] font-mono font-medium text-[10px]">MOCK_HARDWARE_ADAPTER_V2</span>
              </div>
            </div>

            {/* Section 9 Status 14: Overall Identity Verification Result */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                overallResult === 'VERIFIED'
                  ? 'bg-green-50 border-green-200 text-[#16A34A]'
                  : overallResult === 'REJECTED'
                  ? 'bg-red-50 border-red-200 text-[#DC2626]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              {overallResult === 'VERIFIED' ? (
                <CheckCircle2 className="w-6 h-6 text-[#16A34A] shrink-0" />
              ) : overallResult === 'REJECTED' ? (
                <XCircle className="w-6 h-6 text-[#DC2626] shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-[#64748B] shrink-0" />
              )}

              <div>
                <span className="text-xs font-bold uppercase block">
                  {overallResult === 'VERIFIED'
                    ? 'Identity Verification Successful'
                    : overallResult === 'REJECTED'
                    ? 'Identity Verification Failed'
                    : 'Verification Not Started / Pending'}
                </span>
                <span className="text-[11px] block mt-0.5 text-[#172554]/80">
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
            <div className="p-4 rounded-xl bg-white border border-dashed border-[#E2E8F0] text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#D97706] font-semibold">
                <UserX className="w-4 h-4 shrink-0" />
                <span>Customer identity has not been verified.</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Customer details will appear only after the required identity verification and home-branch checks succeed. Zero pre-verification customer data disclosed.
              </p>
            </div>
          )}

          {/* Rejection / Violation Message */}
          {overallResult === 'REJECTED' && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#172554] text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-[#DC2626]">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#DC2626]" />
                <span>Customer identity could not be verified. Withdrawal denied.</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#64748B]">
                In accordance with zero-knowledge privacy protection, zero customer account details or non-matching records have been disclosed.
              </p>
              {session?.failure_reason_code === 'VISITING_BRANCH_IS_HOME_BRANCH' && (
                <p className="text-[11px] text-[#D97706] font-mono">
                  Violation: Visiting branch matches the customer's registered home branch. Cardless cross-branch withdrawals are restricted to non-home branches.
                </p>
              )}
              {session?.failure_reason_code === 'NO_FACE_DETECTED' && (
                <p className="text-[11px] text-[#D97706] font-mono">
                  Sensor Anomaly: No face detected in camera viewport. Ensure subject is directly facing terminal lens.
                </p>
              )}
              {session?.failure_reason_code === 'MULTIPLE_FACES_DETECTED' && (
                <p className="text-[11px] text-[#D97706] font-mono">
                  Security Violation: Multiple subjects in viewport. Only single customer requesting withdrawal may be in frame.
                </p>
              )}
              {session?.failure_reason_code === 'MODELS_NOT_CONFIGURED' && (
                <p className="text-[11px] text-[#D97706] font-mono">
                  Configuration Note: Face matching or anti-spoofing liveness model not loaded. Fail-closed defense halted verification.
                </p>
              )}
              {session?.failure_reason_code === 'BIOMETRIC_ADAPTER_UNAVAILABLE' && (
                <p className="text-[11px] text-[#D97706] font-mono">
                  Hardware Note: Secondary biometric adapter scanner is unavailable or offline.
                </p>
              )}
            </div>
          )}

          {/* Customer Unlocked View (Only upon authoritative VERIFIED state) */}
          {overallResult === 'VERIFIED' && verifiedCustomer && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-green-200 pb-2">
                <span className="font-bold text-[#16A34A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  <span>CUSTOMER IDENTITY AUTHENTICATED</span>
                </span>
                <span className="text-[10px] font-mono font-semibold text-[#16A34A] px-1.5 py-0.5 rounded bg-white border border-green-200">
                  {verifiedCustomer.account_status}
                </span>
              </div>

              <div>
                <span className="text-base font-bold text-[#172554] block">
                  {verifiedCustomer.full_name}
                </span>
                <span className="text-[11px] font-mono text-[#64748B] block mt-0.5">
                  Ref: {verifiedCustomer.customer_reference} · PAN: {verifiedCustomer.synthetic_pan}
                </span>
              </div>

              <div className="pt-2 border-t border-green-200 text-[11px] text-[#64748B] space-y-1">
                <div className="flex justify-between">
                  <span>Home Financial Institution:</span>
                  <span className="text-[#172554] font-semibold">{verifiedCustomer.home_bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Home Registered Branch:</span>
                  <span className="text-[#172554] font-semibold">{verifiedCustomer.home_branch_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Balance:</span>
                  <span className="text-[#16A34A] font-mono font-bold tabular-nums">
                    ₹{verifiedCustomer.available_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cross-Branch Validated:</span>
                  <span className="text-[#16A34A] font-bold">YES (Visiting != Home Branch)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-[#64748B] hover:text-[#172554] transition-colors rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer"
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
          className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shadow-xs w-full sm:w-auto cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Proceed to Home-Branch Check</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
