import { http } from "./http";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/api/auth/login", req);
  return data;
}
