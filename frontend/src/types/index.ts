export type UserRole = 'admin' | 'professional' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const SERVICE_CATEGORIES = ['Consulta', 'Estética', 'Ortodoncia', 'Cirugía', 'Prevención'] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  category: ServiceCategory;
  active: boolean;
}

export interface ProfessionalServiceLink {
  id: string;
  professionalId: string;
  serviceId: string;
  priceOverride: string | null;
  durationOverride: number | null;
}

export interface Professional {
  id: string;
  userId: string;
  specialty: string | null;
  bio: string | null;
  color: string;
  active: boolean;
  user: { id: string; name: string; email: string; phone: string | null };
  services: (Service & { ProfessionalService: ProfessionalServiceLink })[];
}

export interface Availability {
  id: string;
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityException {
  id: string;
  professionalId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isBlocked: boolean;
}

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'pending' | 'paid';

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startDatetime: string;
  endDatetime: string;
  status: AppointmentStatus;
  notes: string | null;
  cancellationReason: string | null;
  amount: string | null;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  confirmedByClient: boolean;
  professional?: {
    id: string;
    specialty: string | null;
    color: string;
    user: { id: string; name: string; email: string; phone: string | null };
  };
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
    price: string;
    category: ServiceCategory;
  };
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  appointmentsCount: number;
  lastVisit: string | null;
}

export interface PatientDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  appointments: Appointment[];
}

export interface ClinicalRecord {
  id: string;
  patientId: string;
  professionalId: string;
  content: string;
  createdAt: string;
  professional?: { id: string; specialty: string | null; color: string; user: { id: string; name: string } };
  patient?: { id: string; name: string };
}

export type SupportRequestStatus = 'open' | 'closed';

export interface SupportRequest {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: UserRole };
}
