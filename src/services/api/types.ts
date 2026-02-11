export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
};

export type UserResponse = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

export type Role = "ADMIN" | "VET" | "RECEPTION" ; 

export type UserResponseWithRole = {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export type UserStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  admin: number;
  vet: number;
  reception: number;
};

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type UpdateMeRequest = {
  name?: string;
  email?: string;
  password?: string;
};

export type UpdateUserRequest = {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  active?: boolean;
};

export type TutorAddressRequest = {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityName?: string;
  cityIbge?: string;
  stateUf?: string;
  country?: string;
};

export type TutorAddressResponse = {
  tutorId: number;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityName?: string;
  cityIbge?: string;
  stateUf?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
};

export type TutorListItemResponse = {
  id: number;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  active: boolean;
};

export type TutorResponse = {
  id: number;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  active: boolean;
  address?: TutorAddressResponse | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTutorRequest = {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: TutorAddressRequest;
};

export type UpdateTutorRequest = {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: TutorAddressRequest;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
  sort?: unknown;
  pageable?: unknown;
};
