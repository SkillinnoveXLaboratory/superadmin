export type ID = string;

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TEACHER'
  | 'FINANCE'
  | 'SPORTS'
  | 'LIBRARY'
  | 'HR'
  | 'PARENT'
  | 'STUDENT';

export interface School {
  id: ID;
  name: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  plan?: string;
  studentCount?: number;
  staffCount?: number;
}

export interface SchoolListItem {
  id: ID;
  name: string;
  registrationNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface StudentParentContact {
  fatherName?: string;
  motherName?: string;
  primaryPhone?: string;
  email?: string;
  homeAddress?: string;
}

export interface StudentListItem {
  id: ID;
  schoolId: ID;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  status: 'ENROLLED' | 'GRADUATED' | 'TRANSFERRED' | 'DE-ENROLLED' | 'DEENROLLED' | 'INACTIVE';
  classId: ID;
  sectionId: ID;
  rfidCardCode?: string;
  parentContact?: StudentParentContact;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedStudentsResponse {
  students: StudentListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface StudentIdCardPayload {
  name: string;
  enrollmentNumber: string;
  className: string;
  photoUrl?: string;
  qrCodeData: string;
}

export interface PaginatedSchoolsResponse {
  schools: SchoolListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface User {
  id: ID;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  schoolId: ID | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Student {
  id: ID;
  enrollmentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  photoUrl?: string;
  schoolId: ID;
  classId: ID;
  sectionId: ID;
  parentContact?: {
    fatherName?: string;
    motherName?: string;
    primaryPhone: string;
    homeAddress: string;
  };
  emergencyContact: string;
  status: 'ENROLLED' | 'GRADUATED' | 'TRANSFERRED' | 'DEENROLLED' | 'INACTIVE';
}

export interface PlatformKPIs {
  totalSchools: number;
  activeSchools: number;
  suspendedSchools: number;
  totalUsers?: number;
  totalStudents?: number;
  totalStaff?: number;
  monthlyRevenue?: number;
  trend?: { month: string; revenue: number; students: number }[];
  topSchools?: { id: ID; name: string; students: number; revenue: number }[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
