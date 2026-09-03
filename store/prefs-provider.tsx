"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import type { Prefs } from "@/lib/domain/types";
import { createPrefsStore, type PrefsStore, type PrefsStoreApi } from "./prefs";

const PrefsContext = createContext<PrefsStoreApi | null>(null);

export function PrefsProvider({ initial, children }: { initial: Prefs; children: ReactNode }) {
  const [store] = useState(() => createPrefsStore(initial));
  return <PrefsContext.Provider value={store}>{children}</PrefsContext.Provider>;
}

export function usePrefs<T>(selector: (state: PrefsStore) => T): T {
  const api = useContext(PrefsContext);
  if (!api) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return useStore(api, useShallow(selector));
}
