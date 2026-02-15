import { http } from "./http";
import type {
  CreateStockMovementRequest,
  PageResponse,
  StockBalanceResponse,
  StockBalanceListItemResponse,
  StockMovementListItemResponse,
} from "./types";

export type ListStockBalancesParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  query?: string;
  belowMinStock?: boolean;
};

export async function listStockBalances(
  params?: ListStockBalancesParams
): Promise<PageResponse<StockBalanceListItemResponse>> {
  const { data } = await http.get<PageResponse<StockBalanceListItemResponse>>("/api/stock/balances", { params });
  return data;
}

export async function getStockBalance(productId: number): Promise<StockBalanceResponse> {
  const { data } = await http.get<StockBalanceResponse>("/api/stock/balance", { params: { productId } });
  return data;
}

export type ListStockMovementsParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  productId?: number;
};

export async function listStockMovements(
  params?: ListStockMovementsParams
): Promise<PageResponse<StockMovementListItemResponse>> {
  const { data } = await http.get<PageResponse<StockMovementListItemResponse>>("/api/stock/movements", { params });
  return data;
}

export async function createStockMovement(payload: CreateStockMovementRequest): Promise<StockMovementListItemResponse> {
  const { data } = await http.post<StockMovementListItemResponse>("/api/stock/movements", payload);
  return data;
}
