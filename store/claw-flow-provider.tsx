"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import {
  createClawFlowStore,
  type ClawFlowStoreApi,
  type FlowEvent,
  type FlowStore,
} from "./claw-flow";

const ClawFlowContext = createContext<ClawFlowStoreApi | null>(null);

export function ClawFlowProvider({
  machineSlug,
  maxQuantity,
  children,
}: {
  machineSlug: string;
  maxQuantity: number;
  children: ReactNode;
}) {
  const [store] = useState(() => createClawFlowStore({ machineSlug, maxQuantity }));
  return <ClawFlowContext.Provider value={store}>{children}</ClawFlowContext.Provider>;
}

export function useClawFlowApi(): ClawFlowStoreApi {
  const api = useContext(ClawFlowContext);
  if (!api) throw new Error("useClawFlow must be used inside <ClawFlowProvider>");
  return api;
}

export function useClawFlow<T>(selector: (state: FlowStore) => T): T {
  return useStore(useClawFlowApi(), useShallow(selector));
}

export function useFlowDispatch(): (event: FlowEvent) => void {
  return useClawFlowApi().getState().dispatch;
}
