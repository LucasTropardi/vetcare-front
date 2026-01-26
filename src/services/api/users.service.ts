import { http } from "./http";
import type { UserResponse } from "./types";

export async function getMe(): Promise<UserResponse> {
  const { data } = await http.get<UserResponse>("/api/users/me");
  return data;
}

export async function listUsers() {
  const { data } = await http.get("/api/users");
  return data;
}
