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

export type TutorStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  withCompany: number;
  withPet: number;
  withoutContact: number;
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

export type PetSpecies =
  | "DOG"
  | "CAT"
  | "BIRD"
  | "RABBIT"
  | "HAMSTER"
  | "GUINEA_PIG"
  | "FERRET"
  | "REPTILE"
  | "SNAKE"
  | "LIZARD"
  | "TURTLE"
  | "FISH"
  | "HORSE"
  | "COW"
  | "PIG"
  | "OTHER";

export type PetSex = "MALE" | "FEMALE" | "UNKNOWN";

export const PET_SPECIES_OPTIONS: readonly PetSpecies[] = [
  "DOG",
  "CAT",
  "BIRD",
  "RABBIT",
  "HAMSTER",
  "GUINEA_PIG",
  "FERRET",
  "REPTILE",
  "SNAKE",
  "LIZARD",
  "TURTLE",
  "FISH",
  "HORSE",
  "COW",
  "PIG",
  "OTHER",
];

export const PET_SEX_OPTIONS: readonly PetSex[] = ["MALE", "FEMALE", "UNKNOWN"];

export type PetListItemResponse = {
  id: number;
  tutorId: number;
  tutorName?: string;
  name: string;
  species: PetSpecies;
  active: boolean;
};

export type PetResponse = {
  id: number;
  tutorId: number;
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  birthDate?: string;
  weightKg?: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePetRequest = {
  tutorId: number;
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  birthDate?: string;
  weightKg?: number;
  notes?: string;
};

export type UpdatePetRequest = {
  tutorId: number;
  name: string;
  species: PetSpecies;
  breed?: string;
  sex?: PetSex;
  birthDate?: string;
  weightKg?: number;
  notes?: string;
};

export type PetStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  dogs: number;
  cats: number;
  others: number;
};

export type IeIndicator = "CONTRIBUTOR" | "EXEMPT" | "NON_CONTRIBUTOR";
export type Crt = "SIMPLES_NACIONAL" | "REGIME_NORMAL";

export const IE_INDICATOR_OPTIONS: readonly IeIndicator[] = [
  "CONTRIBUTOR",
  "EXEMPT",
  "NON_CONTRIBUTOR",
];

export const CRT_OPTIONS: readonly Crt[] = ["SIMPLES_NACIONAL", "REGIME_NORMAL"];

export type CustomerCompanyAddressRequest = {
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

export type CustomerCompanyAddressResponse = {
  customerCompanyId: number;
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

export type CustomerCompanyFiscalRequest = {
  ie?: string;
  ieIndicator: IeIndicator;
};

export type CustomerCompanyFiscalResponse = {
  customerCompanyId: number;
  ie?: string;
  ieIndicator: IeIndicator;
  createdAt: string;
  updatedAt: string;
};

export type CustomerCompanyListItemResponse = {
  id: number;
  tutorId: number;
  legalName: string;
  tradeName?: string;
  cnpj: string;
  active: boolean;
};

export type CustomerCompanyResponse = {
  id: number;
  tutorId: number;
  legalName: string;
  tradeName?: string;
  cnpj: string;
  phone?: string;
  email?: string;
  active: boolean;
  address?: CustomerCompanyAddressResponse | null;
  fiscal?: CustomerCompanyFiscalResponse | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerCompanyRequest = {
  tutorId: number;
  legalName: string;
  tradeName?: string;
  cnpj: string;
  phone?: string;
  email?: string;
  address?: CustomerCompanyAddressRequest;
  fiscal?: CustomerCompanyFiscalRequest;
};

export type UpdateCustomerCompanyRequest = {
  legalName: string;
  tradeName?: string;
  cnpj: string;
  phone?: string;
  email?: string;
  address?: CustomerCompanyAddressRequest;
  fiscal?: CustomerCompanyFiscalRequest;
};

export type CustomerCompanyStatsResponse = {
  total: number;
  active: number;
  inactive: number;
  withAddress: number;
  withFiscal: number;
  withoutContact: number;
};

export type CompanyProfileAddressRequest = {
  zipCode: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityName: string;
  cityIbge?: string;
  stateUf: string;
  country?: string;
};

export type CompanyProfileAddressResponse = {
  companyId: number;
  zipCode: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityName: string;
  cityIbge?: string;
  stateUf: string;
  country?: string;
};

export type CompanyProfileFiscalRequest = {
  ie?: string;
  ieIndicator: IeIndicator;
  crt: Crt;
};

export type CompanyProfileFiscalResponse = {
  companyId: number;
  ie?: string;
  ieIndicator: IeIndicator;
  crt: Crt;
};

export type CompanyProfileResponse = {
  id: number;
  legalName: string;
  tradeName?: string;
  cnpj: string;
  phone?: string;
  email?: string;
  headquarter: boolean;
  parentCompanyId?: number | null;
  address?: CompanyProfileAddressResponse | null;
  fiscalConfig?: CompanyProfileFiscalResponse | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCompanyProfileRequest = {
  legalName: string;
  tradeName?: string;
  cnpj: string;
  phone?: string;
  email?: string;
  headquarter: boolean;
  address?: CompanyProfileAddressRequest;
  fiscalConfig?: CompanyProfileFiscalRequest;
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
