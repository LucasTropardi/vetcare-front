import { create } from "zustand";
import type { UserResponseWithRole } from "../services/api/types";

type AuthState = {
  accessToken: string | null;
  tokenType: string | null;
  me: UserResponseWithRole | null;

  setAuth: (accessToken: string, tokenType: string) => void;
  setMe: (me: UserResponseWithRole | null) => void;

  clearAuth: () => void;
  isAuthenticated: () => boolean;
};

const STORAGE_KEY = "vetcare:auth";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, tokenType: null, me: null };

    const parsed = JSON.parse(raw);
    return {
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : null,
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : null,
      me: parsed.me ?? null,
    };
  } catch {
    return { accessToken: null, tokenType: null, me: null };
  }
}

const initial = loadInitial();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initial.accessToken,
  tokenType: initial.tokenType,
  me: initial.me,

  setAuth: (accessToken, tokenType) => {
    const current = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, accessToken, tokenType })
    );
    set({ accessToken, tokenType });
  },

  setMe: (me) => {
    const current = get();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, me })
    );
    set({ me });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ accessToken: null, tokenType: null, me: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));

export const authStore = {
  getState: () => useAuthStore.getState(),
};
