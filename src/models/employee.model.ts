export type JobTitle = 'commis_kitchen' | 'barista' | 'steward' | 'commis_pastry' | 'fnb_service' | 'manager';
export type EmploymentType = 'full_time' | 'part_time';
export type EmployeeStatus = 'active' | 'inactive';
export type BankName = 'bca' | 'mandiri' | 'bni' | 'bri' | 'cimb' | 'permata' | 'danamon' | 'other';

export interface Employee {
  id: string;
  userId?: string; // Linked when employee signs up
  email: string;
  name: string;
  jobTitle?: JobTitle;
  employmentType?: EmploymentType;
  status?: EmployeeStatus;
  salary?: number;
  hourlyRate?: number;
  startDate?: string; // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  bankName?: BankName;
  bankAccountNumber?: string;
  address?: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  probationEndDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'employee';
  photoURL?: string;
  createdAt: Date;
}
