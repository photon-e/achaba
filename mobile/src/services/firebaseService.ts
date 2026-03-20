import { initializeApp, getApps } from "firebase/app";

import { ENV } from "@/config/env";

const isConfigured = Boolean(
  ENV.firebase.apiKey &&
    ENV.firebase.appId &&
    ENV.firebase.projectId &&
    ENV.firebase.messagingSenderId
);

export const firebaseApp = isConfigured
  ? getApps()[0] ?? initializeApp(ENV.firebase)
  : null;

export const subscribeToRideChannel = (
  channelId: string,
  callback: (payload: Record<string, unknown>) => void
) => {
  if (!firebaseApp) {
    callback({
      mode: "mock",
      message: `Firebase not configured for ${channelId}. Falling back to polling-ready stub.`
    });
    return () => undefined;
  }

  // This is a placeholder for Firestore or Realtime Database listeners.
  callback({ mode: "firebase", message: `Subscribed to ${channelId}` });
  return () => undefined;
};
