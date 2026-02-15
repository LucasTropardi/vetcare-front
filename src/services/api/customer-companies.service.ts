import { http } from "./http";
import type {
  CreateCustomerCompanyRequest,
  CustomerCompanyListItemResponse,
  CustomerCompanyResponse,
  CustomerCompanyStatsResponse,
  PageResponse,
  UpdateCustomerCompanyRequest,
} from "./types";

export async function createCustomerCompany(payload: CreateCustomerCompanyRequest): Promise<CustomerCompanyResponse> {
  const { data } = await http.post<CustomerCompanyResponse>("/api/customer-companies", payload);
  return data;
}

export type ListCustomerCompaniesParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  query?: string;
  tutorId?: number;
  active?: boolean;
  hasAddress?: boolean;
  hasFiscal?: boolean;
  hasContact?: boolean;
};

export async function listCustomerCompanies(
  params?: ListCustomerCompaniesParams
): Promise<PageResponse<CustomerCompanyListItemResponse>> {
  const { data } = await http.get<PageResponse<CustomerCompanyListItemResponse>>("/api/customer-companies", { params });
  return data;
}

export async function getCustomerCompanyStats(): Promise<CustomerCompanyStatsResponse> {
  const { data } = await http.get<CustomerCompanyStatsResponse>("/api/customer-companies/stats");
  return data;
}

export async function getCustomerCompanyById(id: number): Promise<CustomerCompanyResponse> {
  const { data } = await http.get<CustomerCompanyResponse>(`/api/customer-companies/${id}`);
  return data;
}

export async function updateCustomerCompany(
  id: number,
  payload: UpdateCustomerCompanyRequest
): Promise<CustomerCompanyResponse> {
  const { data } = await http.put<CustomerCompanyResponse>(`/api/customer-companies/${id}`, payload);
  return data;
}

export async function deleteCustomerCompany(id: number): Promise<void> {
  await http.delete(`/api/customer-companies/${id}`);
}
