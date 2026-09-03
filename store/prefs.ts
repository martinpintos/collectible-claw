import { createStore } from "zustand/vanilla";
import { prefsCookieString } from "@/lib/domain/prefs";
import type { Prefs } from "@/lib/domain/types";

export type PrefsStore = Prefs & {
  setSound: (sound: boolean) => void;
  setAnimation: (animation: boolean) => void;
};

function persist(prefs: Prefs) {
  if (typeof document !== "undefined") {
    document.cookie = prefsCookieString(prefs);
  }
}

/** Sound / animation preferences. Cookie-backed so the server renders the right initial state. */
export function createPrefsStore(initial: Prefs) {
  return createStore<PrefsStore>((set, get) => ({
    ...initial,
    setSound: (sound) => {
      set({ sound });
      persist({ sound, animation: get().animation });
    },
    setAnimation: (animation) => {
      set({ animation });
      persist({ sound: get().sound, animation });
    },
  }));
}

export type PrefsStoreApi = ReturnType<typeof createPrefsStore>;
