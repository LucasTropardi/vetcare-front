import { http } from "./http";
import type {
  CreateUserRequest,
  PageResponse,
  UpdateMeRequest,
  UpdateUserRequest,
  UserResponseWithRole,
} from "./types";

export async function getMe(): Promise<UserResponseWithRole> {
  const { data } = await http.get<UserResponseWithRole>("/api/users/me");
  return data;
}

export async function updateMe(payload: UpdateMeRequest): Promise<UserResponseWithRole> {
  const { data } = await http.put<UserResponseWithRole>("/api/users/me", payload);
  return data;
}

export async function createUser(payload: CreateUserRequest): Promise<UserResponseWithRole> {
  const { data } = await http.post<UserResponseWithRole>("/api/users", payload);
  return data;
}

export type ListUsersParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
};

export async function listUsers(params?: ListUsersParams): Promise<PageResponse<UserResponseWithRole>> {
  const { data } = await http.get<PageResponse<UserResponseWithRole>>("/api/users", { params });
  return data;
}

export async function getUserById(id: number): Promise<UserResponseWithRole> {
  const { data } = await http.get<UserResponseWithRole>(`/api/users/${id}`);
  return data;
}

export async function updateUser(id: number, payload: UpdateUserRequest): Promise<UserResponseWithRole> {
  const { data } = await http.put<UserResponseWithRole>(`/api/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await http.delete(`/api/users/delete/${id}`);
}
