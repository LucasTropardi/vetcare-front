import { http } from "./http";
import type {
  CreateTutorRequest,
  PageResponse,
  TutorListItemResponse,
  TutorStatsResponse,
  TutorResponse,
  UpdateTutorRequest,
} from "./types";

export async function createTutor(payload: CreateTutorRequest): Promise<TutorResponse> {
  const { data } = await http.post<TutorResponse>("/api/tutors", payload);
  return data;
}

export type ListTutorsParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  query?: string;
  active?: boolean;
  hasCompany?: boolean;
  hasPet?: boolean;
  hasContact?: boolean;
};

export async function listTutors(params?: ListTutorsParams): Promise<PageResponse<TutorListItemResponse>> {
  const { data } = await http.get<PageResponse<TutorListItemResponse>>("/api/tutors", { params });
  return data;
}

export async function getTutorStats(): Promise<TutorStatsResponse> {
  const { data } = await http.get<TutorStatsResponse>("/api/tutors/stats");
  return data;
}

export async function getTutorById(id: number): Promise<TutorResponse> {
  const { data } = await http.get<TutorResponse>(`/api/tutors/${id}`);
  return data;
}

export async function updateTutor(id: number, payload: UpdateTutorRequest): Promise<TutorResponse> {
  const { data } = await http.put<TutorResponse>(`/api/tutors/${id}`, payload);
  return data;
}

export async function deleteTutor(id: number): Promise<void> {
  await http.delete(`/api/tutors/${id}`);
}
