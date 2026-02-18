import { http } from "./http";
import type {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentType,
  OpenAppointmentRequest,
  PageResponse,
  UpdateAppointmentRequest,
} from "./types";

export type ListAppointmentsParams = {
  page?: number;
  size?: number;
  sort?: string | string[];
  petId?: number;
  vetUserId?: number;
  serviceProductId?: number;
  appointmentType?: AppointmentType;
  status?: AppointmentStatus;
  scheduledFrom?: string;
  scheduledTo?: string;
};

export async function listAppointments(params?: ListAppointmentsParams): Promise<PageResponse<AppointmentResponse>> {
  const { data } = await http.get<PageResponse<AppointmentResponse>>("/api/appointments", { params });
  return data;
}

export async function createAppointment(payload: OpenAppointmentRequest): Promise<AppointmentResponse> {
  const { data } = await http.post<AppointmentResponse>("/api/appointments", payload);
  return data;
}

export async function getAppointmentById(id: number): Promise<AppointmentResponse> {
  const { data } = await http.get<AppointmentResponse>(`/api/appointments/${id}`);
  return data;
}

export async function updateAppointment(id: number, payload: UpdateAppointmentRequest): Promise<AppointmentResponse> {
  const { data } = await http.patch<AppointmentResponse>(`/api/appointments/${id}`, payload);
  return data;
}

export async function assignAppointmentVet(appointmentId: number, veterinarianUserId: number): Promise<AppointmentResponse> {
  const { data } = await http.patch<AppointmentResponse>(`/api/appointments/${appointmentId}/assign-vet`, null, {
    params: { veterinarianUserId },
  });
  return data;
}

export async function finishAppointment(appointmentId: number): Promise<AppointmentResponse> {
  const { data } = await http.patch<AppointmentResponse>(`/api/appointments/${appointmentId}/finish`);
  return data;
}

export async function cancelAppointment(appointmentId: number, reason: string): Promise<AppointmentResponse> {
  const { data } = await http.patch<AppointmentResponse>(`/api/appointments/${appointmentId}/cancel`, { reason });
  return data;
}
