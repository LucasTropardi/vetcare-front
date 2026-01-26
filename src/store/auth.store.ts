import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  tokenType: string | null;

  setAuth: (accessToken: string, tokenType: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
};

const STORAGE_KEY = "vetcare:auth";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accessToken: null, tokenType: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : null,
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : null,
    };
  } catch {
    return { accessToken: null, tokenType: null };
  }
}

const initial = loadInitial();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initial.accessToken,
  tokenType: initial.tokenType,

  setAuth: (accessToken, tokenType) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, tokenType }));
    set({ accessToken, tokenType });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ accessToken: null, tokenType: null });
  },

  isAuthenticated: () => !!get().accessToken,
}));

export const authStore = {
  getState: () => useAuthStore.getState(),
};
