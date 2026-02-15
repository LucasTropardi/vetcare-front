import { http } from "./http";
import type { CompanyProfileResponse, UpdateCompanyProfileRequest } from "./types";

export async function getCurrentCompanyProfile(): Promise<CompanyProfileResponse> {
  const { data } = await http.get<CompanyProfileResponse>("/api/company/current");
  return data;
}

export async function updateCurrentCompanyProfile(payload: UpdateCompanyProfileRequest): Promise<CompanyProfileResponse> {
  const { data } = await http.put<CompanyProfileResponse>("/api/company/current", payload);
  return data;
}
