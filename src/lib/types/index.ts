export interface Course {
  id: string;
  "Product Area": string;
  "Program Name": string;
  "Certification Type": string;
  Offering: string;
  "Offering Type": string;
  Required: string;
  "Training Cost": string;
  "Training Units": string;
}

export interface Allocation {
  id: string;
  totalCredits: number;
  usedCredits: number;
  managerId: string;
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'enrolled';

export interface Enrollment {
  id: string;
  employeeEmail: string;
  managerEmail: string;
  courseId: string;
  courseName: string;
  credits: number;
  status: EnrollmentStatus;
  requestDate: string;
  rejectionReason?: string;
  approvedDate?: string;
}
