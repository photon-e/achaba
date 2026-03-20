from dataclasses import dataclass
from typing import Any


@dataclass
class FirebaseNotificationResult:
    delivered: bool
    payload: dict[str, Any]


def publish_ride_update(channel: str, payload: dict[str, Any]) -> FirebaseNotificationResult:
    """
    Stub for Firebase publish operations.

    Replace this implementation with a real Firebase Admin SDK integration when
    credentials are available. Keeping a dedicated service makes the rest of the
    codebase production-ready while preserving local MVP ergonomics.
    """
    return FirebaseNotificationResult(delivered=False, payload={"channel": channel, **payload})
