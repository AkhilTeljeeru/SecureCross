"""
Biometric Adapter Layer (Section 3 & Section 10)
Preserves adapter decoupling: face matching, PAD liveness, and hardware biometrics.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class IBiometricAdapter(ABC):
    @abstractmethod
    def verify_secondary_biometric(
        self,
        customer_id: str,
        modality: str,
        simulate_fail: bool = False
    ) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Verifies secondary biometric modality (Fingerprint / Iris).
        Returns: (is_match, confidence_score, metadata)
        """
        pass


class MockHardwareAdapterV2(IBiometricAdapter):
    """
    Evaluated academic mock adapter for hardware-based biometrics.
    Clearly labeled to prevent false claims of webcam hardware scanning.
    """
    def __init__(self):
        self.adapter_version = "MOCK_HARDWARE_ADAPTER_V2"

    def verify_secondary_biometric(
        self,
        customer_id: str,
        modality: str,
        simulate_fail: bool = False
    ) -> Tuple[bool, float, Dict[str, Any]]:
        if simulate_fail:
            return False, 0.22, {
                "adapter": self.adapter_version,
                "status": "MISMATCH",
                "reason": "SIMULATED_MINUTIAE_MISALIGNMENT"
            }
        
        return True, 0.982, {
            "adapter": self.adapter_version,
            "status": "MATCH",
            "modality": modality,
            "simulated": True
        }
