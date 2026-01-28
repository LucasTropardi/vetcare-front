import { useEffect } from "react";
import { getMe } from "./services/api/users.service"; 
import { useAuthStore } from "./store/auth.store"; 

export function AuthBootstrap() {
  const token = useAuthStore((s) => s.accessToken);
  const setMe = useAuthStore((s) => s.setMe);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (!token) return;

    getMe()
      .then(setMe)
      .catch(() => {
        clearAuth();
      });
  }, [token]);

  return null;
}
