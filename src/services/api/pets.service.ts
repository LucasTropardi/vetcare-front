import { http } from "./http";
import type {
  CreatePetRequest,
  PageResponse,
  PetListItemResponse,
  PetResponse,
  PetSpecies,
  PetStatsResponse,
  UpdatePetRequest,
} from "./types";

export async function createPet(payload: CreatePetRequest): Promise<PetResponse> {
  const { data } = await http.post<PetResponse>("/api/pets", payload);
  return data;
}

export type ListPetsParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  query?: string;
  tutorId?: number;
  active?: boolean;
  species?: PetSpecies;
  othersSpecies?: boolean;
};

export async function listPets(params?: ListPetsParams): Promise<PageResponse<PetListItemResponse>> {
  const { data } = await http.get<PageResponse<PetListItemResponse>>("/api/pets", { params });
  return data;
}

export async function getPetById(id: number): Promise<PetResponse> {
  const { data } = await http.get<PetResponse>(`/api/pets/${id}`);
  return data;
}

export async function getPetStats(): Promise<PetStatsResponse> {
  const { data } = await http.get<PetStatsResponse>("/api/pets/stats");
  return data;
}

export async function updatePet(id: number, payload: UpdatePetRequest): Promise<PetResponse> {
  const { data } = await http.put<PetResponse>(`/api/pets/${id}`, payload);
  return data;
}

export async function deletePet(id: number): Promise<void> {
  await http.delete(`/api/pets/${id}`);
}
