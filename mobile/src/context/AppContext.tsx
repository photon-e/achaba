import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Dispatch, SetStateAction } from "react";

import { setApiToken } from "@/services/api";
import { getProfile } from "@/services/authService";
import { AuthSession, Ride } from "@/types";

interface AppContextValue {
  session: AuthSession | null;
  activeRide: Ride | null;
  loading: boolean;
  setSession: (session: AuthSession | null) => Promise<void>;
  setActiveRide: Dispatch<SetStateAction<Ride | null>>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);
const STORAGE_KEY = "achaba.session";

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [session, updateSession] = useState<AuthSession | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as AuthSession;
        setApiToken(parsed.token);
        const user = await getProfile();
        updateSession({ token: parsed.token, user });
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setApiToken();
      } finally {
        setLoading(false);
      }
    };

    bootstrap().catch(async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setApiToken();
      setLoading(false);
    });
  }, []);

  const setSession = async (nextSession: AuthSession | null) => {
    updateSession(nextSession);
    setApiToken(nextSession?.token);
    if (nextSession) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setActiveRide(null);
    }
  };

  const value = useMemo(
    () => ({
      session,
      activeRide,
      loading,
      setSession,
      setActiveRide
    }),
    [session, activeRide, loading]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
