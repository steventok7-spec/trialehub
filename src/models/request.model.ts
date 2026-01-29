export type RequestType = 'leave' | 'sick' | 'permission';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Request {
  id?: string;
  employeeId: string;
  type: RequestType;
  status: RequestStatus;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  reason?: string;
  amount?: number; // For expense claims
  approvedBy?: string; // Owner userId
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AUTO_APPROVE_TYPES: RequestType[] = ['sick'];
