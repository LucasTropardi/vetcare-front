import { http } from "./http";
import type {
  CreateProductRequest,
  PageResponse,
  ProductCategory,
  ProductListItemResponse,
  ProductResponse,
  UpdateProductRequest,
} from "./types";

export type ListProductsParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  name?: string;
  category?: ProductCategory;
  active?: boolean;
};

export async function listProducts(params?: ListProductsParams): Promise<PageResponse<ProductListItemResponse>> {
  const { data } = await http.get<PageResponse<ProductListItemResponse>>("/api/products", { params });
  return data;
}

export async function getProductById(id: number): Promise<ProductResponse> {
  const { data } = await http.get<ProductResponse>(`/api/products/${id}`);
  return data;
}

export async function createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
  const { data } = await http.post<ProductResponse>("/api/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: UpdateProductRequest): Promise<ProductResponse> {
  const { data } = await http.patch<ProductResponse>(`/api/products/${id}`, payload);
  return data;
}

export async function setProductActive(id: number, value: boolean): Promise<void> {
  await http.patch(`/api/products/${id}/active`, null, { params: { value } });
}
