import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY} from "../constants/settings";
import {sanitize} from "./sanitize";

const SettingsContext = createContext(null);

export function SettingsProvider({children}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (cancelled) return;
        const parsed = stored ? JSON.parse(stored) : null;
        setSettings(sanitize(parsed));
      } catch (err) {
        console.warn("[settings] failed to read persisted settings, using defaults", err);
        if (!cancelled) setSettings(DEFAULT_SETTINGS);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => {
      const next = sanitize({...prev, ...partial});
      AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)).catch((err) => {
        console.warn("[settings] failed to persist settings", err);
      });
      return next;
    });
  }, []);

  if (!hydrated) {
    return null;
  }

  return <SettingsContext.Provider value={{settings, updateSettings}}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside a SettingsProvider");
  }
  return ctx;
}
