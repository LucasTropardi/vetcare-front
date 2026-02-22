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
  professionalLicense?: string | null;
  signatureImageBase64?: string | null;
  signatureImageContentType?: string | null;
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
  confirmPassword: string;
  role: Role;
  professionalLicense?: string;
  signatureImageBase64?: string;
  signatureImageContentType?: string;
};

export type UpdateMeRequest = {
  name?: string;
  email?: string;
  password?: string;
  professionalLicense?: string;
  signatureImageBase64?: string;
  signatureImageContentType?: string;
};

export type UpdateUserRequest = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: Role;
  active?: boolean;
  professionalLicense?: string;
  signatureImageBase64?: string;
  signatureImageContentType?: string;
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

export type ItemType = "PRODUCT" | "SERVICE";
export type ProductCategory = "MEDICINE" | "SUPPLY" | "FEED" | "OTHER";
export type FiscalOriginCode = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7";

export const ITEM_TYPE_OPTIONS: readonly ItemType[] = ["PRODUCT", "SERVICE"];
export const PRODUCT_CATEGORY_OPTIONS: readonly ProductCategory[] = ["MEDICINE", "SUPPLY", "FEED", "OTHER"];
export const FISCAL_ORIGIN_OPTIONS: ReadonlyArray<{ code: FiscalOriginCode; label: string }> = [
  { code: "0", label: "Nacional" },
  { code: "1", label: "Estrangeira - importação direta" },
  { code: "2", label: "Estrangeira - adquirida no mercado interno" },
  { code: "3", label: "Nacional - conteúdo importação > 40%" },
  { code: "4", label: "Nacional - processo produtivo básico" },
  { code: "5", label: "Nacional - outros casos" },
  { code: "6", label: "Estrangeira - importação direta (sem similar)" },
  { code: "7", label: "Estrangeira - adquirida no mercado interno (sem similar)" },
];

export type ProductFiscalRequest = {
  ncm?: string;
  cest?: string;
  origin?: FiscalOriginCode;
  gtinEan?: string;
  gtinEanTrib?: string;
  unitTrib?: string;
  tribFactor?: number;
  cbenef?: string;
  serviceListCode?: string;
};

export type ProductFiscalResponse = {
  ncm?: string;
  cest?: string;
  origin?: FiscalOriginCode;
  gtinEan?: string;
  gtinEanTrib?: string;
  unitTrib?: string;
  tribFactor?: number;
  cbenef?: string;
  serviceListCode?: string;
};

export type ProductListItemResponse = {
  id: number;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;
  active: boolean;
  salePrice: number;
  costPrice: number;
  minStock: number;
};

export type ProductResponse = {
  id: number;
  sku: string;
  name: string;
  itemType: ItemType;
  category: ProductCategory;
  unit: string;
  active: boolean;
  salePrice: number;
  costPrice: number;
  minStock: number;
  fiscal?: ProductFiscalResponse | null;
};

export type CreateProductRequest = {
  sku: string;
  name: string;
  itemType: ItemType;
  category: ProductCategory;
  unit: string;
  salePrice: number;
  costPrice: number;
  minStock: number;
  fiscal: ProductFiscalRequest;
};

export type UpdateProductRequest = {
  sku?: string;
  name?: string;
  itemType?: ItemType;
  category?: ProductCategory;
  unit?: string;
  salePrice?: number;
  costPrice?: number;
  minStock?: number;
  fiscal?: ProductFiscalRequest;
};

export type StockMovementType =
  | "ENTRY_PURCHASE"
  | "EXIT_SALE"
  | "EXIT_VISIT_CONSUMPTION"
  | "ADJUSTMENT";

export type StockReferenceType = "PURCHASE" | "SALE" | "VISIT" | "MANUAL" | "IMPORT" | "REVERSAL";

export type StockBalanceListItemResponse = {
  productId: number;
  sku: string;
  name: string;
  onHand: number;
  avgCost: number;
  minStock: number;
  belowMinStock: boolean;
};

export type StockBalanceResponse = {
  productId: number;
  onHand: number;
  avgCost: number;
};

export type StockMovementListItemResponse = {
  id: number;
  productId: number;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number | null;
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: number | null;
  createdBy: number;
  createdAt: string;
};

export type CreateStockMovementRequest = {
  productId: number;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  notes?: string;
  referenceType?: StockReferenceType;
  referenceId?: number;
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

export type ReportFormat = "PDF" | "CSV" | "XLSX";
export type PdfOrientation = "PORTRAIT" | "LANDSCAPE";
export type ReportFilterType = "TEXT" | "BOOLEAN" | "SELECT" | "NUMBER";

export type ReportOptionResponse = {
  value: string;
  label: string;
};

export type ReportFilterResponse = {
  key: string;
  label: string;
  type: ReportFilterType;
  options?: ReportOptionResponse[] | null;
  placeholder?: string | null;
};

export type ReportColumnResponse = {
  key: string;
  label: string;
};

export type ReportDefinitionResponse = {
  key: string;
  title: string;
  description: string;
  filters: ReportFilterResponse[];
  columns: ReportColumnResponse[];
  formats: ReportFormat[];
};

export type ReportRunRequest = {
  filters?: Record<string, unknown>;
  columns?: string[];
  page?: number;
  size?: number;
  sort?: string[];
};

export type ReportPreviewResponse = {
  reportKey: string;
  title: string;
  columns: ReportColumnResponse[];
  rows: Array<Record<string, unknown>>;
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type AppointmentType = "VET" | "PETSHOP";
export type AppointmentStatus = "OPEN" | "FINISHED" | "CANCELED";

export const APPOINTMENT_TYPE_OPTIONS: readonly AppointmentType[] = ["VET", "PETSHOP"];
export const APPOINTMENT_STATUS_OPTIONS: readonly AppointmentStatus[] = ["OPEN", "FINISHED", "CANCELED"];

export type OpenAppointmentRequest = {
  petId: number;
  appointmentType?: AppointmentType;
  veterinarianUserId?: number;
  serviceProductId?: number;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  notes?: string;
  chiefComplaint?: string;
};

export type UpdateAppointmentRequest = {
  appointmentType?: AppointmentType;
  veterinarianUserId?: number;
  serviceProductId?: number;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
  notes?: string;
  chiefComplaint?: string;
};

export type AppointmentResponse = {
  id: number;
  petId: number;
  appointmentType: AppointmentType;
  veterinarianUserId?: number | null;
  serviceProductId?: number | null;
  status: AppointmentStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  notes?: string | null;
  openedAt: string;
  finishedAt?: string | null;
  canceledAt?: string | null;
  cancelReason?: string | null;
  createdBy?: number | null;
  finishedBy?: number | null;
  canceledBy?: number | null;
  createdAt: string;
  updatedAt: string;
};
