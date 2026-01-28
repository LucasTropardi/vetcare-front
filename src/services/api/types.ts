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