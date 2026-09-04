"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { WebHaptics, type HapticInput } from "web-haptics";
import {
  HAPTIC_INTENSITY,
  HAPTIC_PATTERNS,
  type HapticEvent,
} from "@/lib/haptics/events";

type FireOptions = { intensity?: number };

type HapticsApi = {
  fire: (event: HapticEvent, options?: FireOptions) => void;
  /** Escape hatch for one-off patterns that do not have a semantic event yet. */
  trigger: (input: HapticInput, options?: FireOptions) => void;
};

const noop = () => {};
const HapticsContext = createContext<HapticsApi>({ fire: noop, trigger: noop });

const subscribeNever = () => noop;
const readDebugFlag = () =>
  new URLSearchParams(window.location.search).get("haptics") === "debug" ||
  process.env.NEXT_PUBLIC_HAPTICS_DEBUG === "1";
const readDebugFlagOnServer = () => process.env.NEXT_PUBLIC_HAPTICS_DEBUG === "1";

export function HapticsProvider({ children }: { children: ReactNode }) {
  const debug = useSyncExternalStore(subscribeNever, readDebugFlag, readDebugFlagOnServer);
  const engine = useRef<WebHaptics | null>(null);

  useEffect(() => {
    const instance = new WebHaptics({ debug });
    engine.current = instance;
    return () => {
      instance.destroy();
      engine.current = null;
    };
  }, [debug]);

  const trigger = useCallback((input: HapticInput, options?: FireOptions) => {
    void engine.current?.trigger(input, options).catch(() => {});
  }, []);

  const fire = useCallback(
    (event: HapticEvent, options?: FireOptions) => {
      const intensity = options?.intensity ?? HAPTIC_INTENSITY[event] ?? 0.7;
      trigger(HAPTIC_PATTERNS[event], { intensity });
    },
    [trigger],
  );

  const value = useMemo<HapticsApi>(() => ({ fire, trigger }), [fire, trigger]);

  return <HapticsContext.Provider value={value}>{children}</HapticsContext.Provider>;
}

export function useHaptics() {
  return useContext(HapticsContext);
}
