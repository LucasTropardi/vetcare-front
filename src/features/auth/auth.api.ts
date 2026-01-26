import { http } from "../../api/http";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string; // "Bearer"
};

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", req);
  return res.data;
}
