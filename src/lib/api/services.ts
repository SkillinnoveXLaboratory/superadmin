/**
 * Service layer — mirrors the full Schoolmate API spec.
 * Each module corresponds to a tag in the OpenAPI doc.
 */
import { api, unwrap } from './client';
import { parseAuthTokens } from './tokenRefresh';
import type {
  ID,
  GeoLocation,
  LoginCredentials,
  LoginResponse,
  PaginatedSchoolsResponse,
  PaginatedStudentsResponse,
  PlatformKPIs,
  StudentIdCardPayload,
  StudentListItem,
  SchoolListItem,
  School,
} from './types';

function normalizeStudentStatus(value: unknown): StudentListItem['status'] {
  if (value === 'GRADUATED' || value === 'TRANSFERRED' || value === 'INACTIVE') return value;
  if (value === 'DE-ENROLLED' || value === 'DEENROLLED') return 'DE-ENROLLED';
  return 'ENROLLED';
}

function normalizeSchoolLocation(value: unknown): GeoLocation | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const location = value as Record<string, unknown>;
  const latitude =
    typeof location.latitude === 'number'
      ? location.latitude
      : typeof location.lat === 'number'
        ? location.lat
        : typeof location.latitude === 'string'
          ? Number(location.latitude)
          : typeof location.lat === 'string'
            ? Number(location.lat)
            : undefined;
  const longitude =
    typeof location.longitude === 'number'
      ? location.longitude
      : typeof location.lng === 'number'
        ? location.lng
        : typeof location.longitude === 'string'
          ? Number(location.longitude)
          : typeof location.lng === 'string'
            ? Number(location.lng)
            : undefined;
  const address = typeof location.address === 'string' ? location.address : typeof location.label === 'string' ? location.label : undefined;

  if (latitude === undefined && longitude === undefined && !address) return undefined;
  return {
    ...(latitude === undefined ? {} : { latitude }),
    ...(longitude === undefined ? {} : { longitude }),
    ...(address ? { address } : {}),
  };
}

function normalizeSchoolRecord(record: Record<string, unknown>): SchoolListItem {
  const location = normalizeSchoolLocation(record.location ?? {
    latitude: record.latitude,
    longitude: record.longitude,
    address: record.locationAddress ?? record.locationLabel,
  });

  return {
    id: typeof record._id === 'string' ? record._id : typeof record.id === 'string' ? record.id : '',
    name: typeof record.name === 'string' ? record.name : '',
    registrationNumber: typeof record.registrationNumber === 'string' ? record.registrationNumber : '',
    schoolCode: typeof record.schoolCode === 'string' ? record.schoolCode : undefined,
    address: typeof record.address === 'string' ? record.address : '',
    contactEmail: typeof record.contactEmail === 'string' ? record.contactEmail : '',
    contactPhone: typeof record.contactPhone === 'string' ? record.contactPhone : typeof record.primaryPhone === 'string' ? record.primaryPhone : '',
    primaryPhone: typeof record.primaryPhone === 'string' ? record.primaryPhone : typeof record.contactPhone === 'string' ? record.contactPhone : undefined,
    secondaryPhone: typeof record.secondaryPhone === 'string' ? record.secondaryPhone : undefined,
    city: typeof record.city === 'string' ? record.city : undefined,
    district: typeof record.district === 'string' ? record.district : undefined,
    pincode: typeof record.pincode === 'string' ? record.pincode : undefined,
    state: typeof record.state === 'string' ? record.state : undefined,
    country: typeof record.country === 'string' ? record.country : undefined,
    logoUrl: typeof record.logoUrl === 'string' ? record.logoUrl : undefined,
    websiteUrl: typeof record.websiteUrl === 'string' ? record.websiteUrl : undefined,
    status: record.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    ...(location ? { location } : {}),
  };
}

/* ───────── Module 1: Super Admin & Tenants ───────── */
export const SuperAdmin = {
  login: async (creds: LoginCredentials) => {
    const res = await api.post('/super-admin/auth/login', {
      email: creds.email,
      password: creds.password,
    });
    const body = res.data as Record<string, unknown>;
    const tokens = parseAuthTokens(body);
    const adminRaw = body.admin as Record<string, unknown> | undefined;
    const adminName = typeof adminRaw?.name === 'string' ? adminRaw.name : '';
    const parts = adminName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ');

    const admin = adminRaw
      ? ({
          id: typeof adminRaw.id === 'string' ? adminRaw.id : '',
          username:
            typeof adminRaw.email === 'string' && adminRaw.email
              ? adminRaw.email
              : typeof adminRaw.name === 'string' && adminRaw.name
                ? adminRaw.name
                : creds.email,
          firstName,
          lastName,
          email: typeof adminRaw.email === 'string' ? adminRaw.email : '',
          phone: '',
          role: 'SUPER_ADMIN',
          schoolId: null,
          status: 'ACTIVE',
        } as LoginResponse['user'])
      : undefined;

    return {
      token:
        tokens?.accessToken ??
        (typeof body.accessToken === 'string' ? body.accessToken : undefined) ??
        (typeof body.token === 'string' ? body.token : undefined) ??
        '',
      user: admin ?? ({
        id: '',
        username: creds.email,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'SUPER_ADMIN',
        schoolId: null,
        status: 'ACTIVE',
      } as LoginResponse['user']),
      refreshToken:
        tokens?.refreshToken ??
        (typeof body.refreshToken === 'string' ? body.refreshToken : null),
    };
  },

  listSchools: async (q?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const res = await api.get('/super-admin/schools', { params: q });
    const body = res.data as Record<string, unknown>;
    const schoolsRaw = Array.isArray(body.schools) ? body.schools : [];
    const schools = schoolsRaw.map((item) => normalizeSchoolRecord(item as Record<string, unknown>));

    const meta = {
      total: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).total === 'number'
        ? (body.meta as Record<string, unknown>).total as number
        : schools.length,
      page: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).page === 'number'
        ? (body.meta as Record<string, unknown>).page as number
        : 1,
      limit: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).limit === 'number'
        ? (body.meta as Record<string, unknown>).limit as number
        : schools.length || 50,
      pages: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).pages === 'number'
        ? (body.meta as Record<string, unknown>).pages as number
        : 1,
    };

    return { schools, meta } satisfies PaginatedSchoolsResponse;
  },

  getSchool: async (id: ID) => {
    const res = await api.get(`/super-admin/schools/${id}`);
    const body = res.data as Record<string, unknown>;
    const data = (body.data ?? body.school ?? body) as Record<string, unknown>;
    const location = normalizeSchoolLocation(data.location ?? {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.locationAddress ?? data.locationLabel,
    });
    return {
      id: typeof data.id === 'string' ? data.id : typeof data._id === 'string' ? data._id : id,
      name: typeof data.name === 'string' ? data.name : '',
      registrationNumber: typeof data.registrationNumber === 'string' ? data.registrationNumber : '',
      schoolCode: typeof data.schoolCode === 'string' ? data.schoolCode : undefined,
      address: typeof data.address === 'string' ? data.address : '',
      contactEmail: typeof data.contactEmail === 'string' ? data.contactEmail : '',
      contactPhone: typeof data.contactPhone === 'string' ? data.contactPhone : typeof data.primaryPhone === 'string' ? data.primaryPhone : '',
      primaryPhone: typeof data.primaryPhone === 'string' ? data.primaryPhone : typeof data.contactPhone === 'string' ? data.contactPhone : undefined,
      secondaryPhone: typeof data.secondaryPhone === 'string' ? data.secondaryPhone : undefined,
      city: typeof data.city === 'string' ? data.city : undefined,
      district: typeof data.district === 'string' ? data.district : undefined,
      pincode: typeof data.pincode === 'string' ? data.pincode : undefined,
      state: typeof data.state === 'string' ? data.state : undefined,
      country: typeof data.country === 'string' ? data.country : undefined,
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : undefined,
      websiteUrl: typeof data.websiteUrl === 'string' ? data.websiteUrl : undefined,
      status: data.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
      ...(location ? { location } : {}),
    } satisfies School;
  },

  createSchool: (data: Partial<School> & { name: string }) =>
    unwrap<School>(api.post('/super-admin/schools', data)),

  updateSchool: (id: ID, data: Partial<School>) =>
    unwrap<School>(api.put(`/super-admin/schools/${id}`, data)),

  deleteSchool: (id: ID) => unwrap<void>(api.delete(`/super-admin/schools/${id}`)),

  suspendSchool: (id: ID) =>
    unwrap<School>(api.patch(`/super-admin/schools/${id}/suspend`)),

  toggleSuspension: (id: ID) =>
    unwrap<School>(api.patch(`/super-admin/schools/${id}/suspend`)),

  overview: async () => {
    const res = await api.get('/super-admin/analytics/overview');
    const body = res.data as Record<string, unknown>;
    const analytics = (body.analytics ?? body.data ?? body) as Record<string, unknown>;

    return {
      totalSchools: typeof analytics.totalSchools === 'number' ? analytics.totalSchools : 0,
      activeSchools: typeof analytics.activeSchools === 'number' ? analytics.activeSchools : 0,
      suspendedSchools: typeof analytics.suspendedSchools === 'number' ? analytics.suspendedSchools : 0,
      totalUsers:
        typeof analytics.totalPlatformUsers === 'number'
          ? analytics.totalPlatformUsers
          : typeof analytics.totalUsers === 'number'
            ? analytics.totalUsers
            : 0,
      totalStudents: typeof analytics.totalStudents === 'number' ? analytics.totalStudents : 0,
      totalStaff: typeof analytics.totalStaff === 'number' ? analytics.totalStaff : 0,
      monthlyRevenue: typeof analytics.monthlyRevenue === 'number' ? analytics.monthlyRevenue : 0,
      trend: [],
      topSchools: [],
    } satisfies PlatformKPIs;
  },
};

/* ───────── Module 2: Admissions ───────── */
export const Admissions = {
  apply: (data: Record<string, unknown>) => unwrap(api.post('/admissions/apply', data)),
  list: (q?: Record<string, unknown>) => unwrap(api.get('/admissions/applications', { params: q })),
  get: (id: ID) => unwrap(api.get(`/admissions/applications/${id}`)),
  uploadDoc: (id: ID, form: FormData) =>
    unwrap(api.post(`/admissions/applications/${id}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })),
  verify: (id: ID) => unwrap(api.patch(`/admissions/applications/${id}/verify`)),
  approve: (id: ID) => unwrap(api.patch(`/admissions/applications/${id}/approve`)),
  enroll: (id: ID, body: Record<string, unknown>) =>
    unwrap(api.post(`/admissions/applications/${id}/enroll`, body)),
};

/* ───────── Module 3: Students ───────── */
export const Students = {
  list: async (q?: { page?: number; limit?: number; q?: string }) => {
    const res = await api.get('/students', { params: q });
    const body = res.data as Record<string, unknown>;
    const studentsRaw = Array.isArray(body.students)
      ? body.students
      : Array.isArray(body.data)
        ? body.data
        : [];

    const students = studentsRaw.map((item) => {
      const student = item as Record<string, unknown>;
      const parent = (student.parentContact ?? {}) as Record<string, unknown>;
      return {
        id: typeof student._id === 'string' ? student._id : typeof student.id === 'string' ? student.id : '',
        schoolId: typeof student.schoolId === 'string' ? student.schoolId : '',
        firstName: typeof student.firstName === 'string' ? student.firstName : '',
        lastName: typeof student.lastName === 'string' ? student.lastName : '',
        email: typeof student.email === 'string' ? student.email : '',
        gender:
          student.gender === 'FEMALE' || student.gender === 'OTHER'
            ? student.gender
            : 'MALE',
        dateOfBirth: typeof student.dateOfBirth === 'string' ? student.dateOfBirth : '',
        status: normalizeStudentStatus(student.status),
        classId: typeof student.classId === 'string' ? student.classId : '',
        sectionId: typeof student.sectionId === 'string' ? student.sectionId : '',
        rfidCardCode: typeof student.rfidCardCode === 'string' ? student.rfidCardCode : undefined,
        parentContact: {
          fatherName: typeof parent.fatherName === 'string' ? parent.fatherName : undefined,
          motherName: typeof parent.motherName === 'string' ? parent.motherName : undefined,
          primaryPhone: typeof parent.primaryPhone === 'string' ? parent.primaryPhone : undefined,
          email: typeof parent.email === 'string' ? parent.email : undefined,
          homeAddress: typeof parent.homeAddress === 'string' ? parent.homeAddress : undefined,
        },
        createdAt: typeof student.createdAt === 'string' ? student.createdAt : '',
        updatedAt: typeof student.updatedAt === 'string' ? student.updatedAt : '',
      } satisfies StudentListItem;
    });

    const meta = {
      total: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).total === 'number'
        ? (body.meta as Record<string, unknown>).total as number
        : students.length,
      page: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).page === 'number'
        ? (body.meta as Record<string, unknown>).page as number
        : 1,
      limit: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).limit === 'number'
        ? (body.meta as Record<string, unknown>).limit as number
        : students.length || 50,
      pages: typeof body.meta === 'object' && body.meta !== null && typeof (body.meta as Record<string, unknown>).pages === 'number'
        ? (body.meta as Record<string, unknown>).pages as number
        : 1,
    };

    return { students, meta } satisfies PaginatedStudentsResponse;
  },
  get: async (id: ID) => {
    const res = await api.get(`/students/${id}`);
    const body = res.data as Record<string, unknown>;
    const data = (body.data ?? body.student ?? body) as Record<string, unknown>;
    const parent = (data.parentContact ?? {}) as Record<string, unknown>;
    return {
      id: typeof data.id === 'string' ? data.id : typeof data._id === 'string' ? data._id : id,
      schoolId: typeof data.schoolId === 'string' ? data.schoolId : '',
      firstName: typeof data.firstName === 'string' ? data.firstName : '',
      lastName: typeof data.lastName === 'string' ? data.lastName : '',
      email: typeof data.email === 'string' ? data.email : '',
      gender:
        data.gender === 'FEMALE' || data.gender === 'OTHER'
          ? data.gender
          : 'MALE',
      dateOfBirth: typeof data.dateOfBirth === 'string' ? data.dateOfBirth : '',
      status: normalizeStudentStatus(data.status),
      classId: typeof data.classId === 'string' ? data.classId : '',
      sectionId: typeof data.sectionId === 'string' ? data.sectionId : '',
      rfidCardCode: typeof data.rfidCardCode === 'string' ? data.rfidCardCode : undefined,
      parentContact: {
        fatherName: typeof parent.fatherName === 'string' ? parent.fatherName : undefined,
        motherName: typeof parent.motherName === 'string' ? parent.motherName : undefined,
        primaryPhone: typeof parent.primaryPhone === 'string' ? parent.primaryPhone : undefined,
        email: typeof parent.email === 'string' ? parent.email : undefined,
        homeAddress: typeof parent.homeAddress === 'string' ? parent.homeAddress : undefined,
      },
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
    } satisfies StudentListItem;
  },
  update: (id: ID, body: Record<string, unknown>) => unwrap(api.put(`/students/${id}`, body)),
  remove: (id: ID) => unwrap(api.delete(`/students/${id}`)),
  idCard: async (id: ID) => {
    const res = await api.get(`/students/${id}/id-card`);
    const body = res.data as Record<string, unknown>;
    const data = (body.data ?? body) as Record<string, unknown>;
    return {
      name: typeof data.name === 'string' ? data.name : '',
      enrollmentNumber: typeof data.enrollmentNumber === 'string' ? data.enrollmentNumber : '',
      className: typeof data.className === 'string' ? data.className : '',
      photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : undefined,
      qrCodeData: typeof data.qrCodeData === 'string' ? data.qrCodeData : '',
    } satisfies StudentIdCardPayload;
  },
  updateParent: (id: ID, body: Record<string, unknown>) =>
    unwrap(api.put(`/students/${id}/parent`, body)),
};

/* ───────── Module 4: Attendance ───────── */
export const Attendance = {
  record: (body: Record<string, unknown>) => unwrap(api.post('/attendance/record', body)),
  rfidScan: (body: Record<string, unknown>) =>
    unwrap(api.post('/attendance/biometric-RFID', body)),
  forStudent: (studentId: ID) => unwrap(api.get(`/attendance/student/${studentId}`)),
  forClass: (classId: ID) => unwrap(api.get(`/attendance/class/${classId}`)),
  reports: (q?: Record<string, unknown>) => unwrap(api.get('/attendance/reports', { params: q })),
  submitLeave: (body: Record<string, unknown>) => unwrap(api.post('/attendance/leaves', body)),
  listLeaves: (q?: Record<string, unknown>) => unwrap(api.get('/attendance/leaves', { params: q })),
  setLeaveStatus: (id: ID, body: { status: 'APPROVED' | 'REJECTED' }) =>
    unwrap(api.patch(`/attendance/leaves/${id}/status`, body)),
};

/* ───────── Module 5: Academics ───────── */
export const Academic = {
  classes: {
    list: () => unwrap(api.get('/classes')),
    create: (body: Record<string, unknown>) => unwrap(api.post('/classes', body)),
    addSection: (classId: ID, body: Record<string, unknown>) =>
      unwrap(api.post(`/classes/${classId}/sections`, body)),
  },
  subjects: {
    create: (body: Record<string, unknown>) => unwrap(api.post('/subjects', body)),
    linkToSection: (classId: ID, sectionId: ID, body: Record<string, unknown>) =>
      unwrap(api.post(`/classes/${classId}/sections/${sectionId}/subjects`, body)),
  },
  timetable: {
    addSlot: (body: Record<string, unknown>) => unwrap(api.post('/timetable/slots', body)),
    forSection: (classId: ID, sectionId: ID) =>
      unwrap(api.get(`/timetable/class/${classId}/section/${sectionId}`)),
  },
  homework: {
    publish: (body: Record<string, unknown>) => unwrap(api.post('/homework', body)),
    list: (q?: Record<string, unknown>) => unwrap(api.get('/homework', { params: q })),
    submit: (id: ID, form: FormData) =>
      unwrap(api.post(`/homework/${id}/submissions`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })),
    evaluate: (homeworkId: ID, submissionId: ID, body: Record<string, unknown>) =>
      unwrap(api.put(`/homework/${homeworkId}/submissions/${submissionId}/evaluate`, body)),
  },
  exams: {
    create: (body: Record<string, unknown>) => unwrap(api.post('/exams', body)),
    addSchedule: (examId: ID, body: Record<string, unknown>) =>
      unwrap(api.post(`/exams/${examId}/schedules`, body)),
    submitMarks: (scheduleId: ID, body: Record<string, unknown>) =>
      unwrap(api.post(`/exams/schedules/${scheduleId}/marks`, body)),
    reportCard: (studentId: ID) =>
      unwrap(api.get(`/exams/report-card/student/${studentId}`)),
  },
};

/* ───────── Module 6: Sports ───────── */
export const Sports = {
  list: () => unwrap(api.get('/sports')),
  get: (id: ID) => unwrap(api.get(`/sports/${id}`)),
  create: (body: Record<string, unknown>) => unwrap(api.post('/sports', body)),
  update: (id: ID, body: Record<string, unknown>) => unwrap(api.put(`/sports/${id}`, body)),
  remove: (id: ID) => unwrap(api.delete(`/sports/${id}`)),
  assign: (id: ID, body: { studentId: ID }) =>
    unwrap(api.post(`/sports/${id}/assign`, body)),
  unassign: (id: ID, body: { studentId: ID }) =>
    unwrap(api.post(`/sports/${id}/unassign`, body)),
};

/* ───────── Module 7: Communication ───────── */
export const Communication = {
  announcements: {
    create: (body: Record<string, unknown>) => unwrap(api.post('/announcements', body)),
    list: (q?: Record<string, unknown>) => unwrap(api.get('/announcements', { params: q })),
  },
  channels: {
    create: (body: Record<string, unknown>) =>
      unwrap(api.post('/communication/channels', body)),
    sendMessage: (channelId: ID, body: Record<string, unknown>) =>
      unwrap(api.post(`/communication/channels/${channelId}/messages`, body)),
    history: (channelId: ID, q?: Record<string, unknown>) =>
      unwrap(api.get(`/communication/channels/${channelId}/messages`, { params: q })),
  },
  schedulePTM: (body: Record<string, unknown>) =>
    unwrap(api.post('/communication/ptm', body)),
};

/* ───────── Module 8: Finance / Fees ───────── */
export const Fees = {
  structures: {
    list: () => unwrap(api.get('/fees/structures')),
    create: (body: Record<string, unknown>) => unwrap(api.post('/fees/structures', body)),
  },
  generateYearly: (body: Record<string, unknown>) =>
    unwrap(api.post('/fees/generate-yearly', body)),
  forStudent: (studentId: ID) => unwrap(api.get(`/fees/student/${studentId}`)),
  applyDiscount: (studentId: ID, body: Record<string, unknown>) =>
    unwrap(api.post(`/fees/student/${studentId}/discount`, body)),
  payCash: (studentId: ID, body: Record<string, unknown>) =>
    unwrap(api.post(`/fees/student/${studentId}/pay-cash`, body)),
  invoices: {
    list: (q?: Record<string, unknown>) => unwrap(api.get('/fees/invoices', { params: q })),
    get: (id: ID) => unwrap(api.get(`/fees/invoices/${id}`)),
  },
  dailyCashLedger: (q?: { date?: string }) =>
    unwrap(api.get('/fees/reports/daily-cash-ledger', { params: q })),
};

/* ───────── Module 9: HR ───────── */
export const HR = {
  employees: {
    list: () => unwrap(api.get('/hr/employees')),
    get: (id: ID) => unwrap(api.get(`/hr/employees/${id}`)),
    create: (body: Record<string, unknown>) => unwrap(api.post('/hr/employees', body)),
    update: (id: ID, body: Record<string, unknown>) =>
      unwrap(api.put(`/hr/employees/${id}`, body)),
  },
  payroll: {
    calculate: (body: Record<string, unknown>) =>
      unwrap(api.post('/hr/payroll/calculate', body)),
    pay: (id: ID) => unwrap(api.patch(`/hr/payroll/${id}/pay`)),
    history: (q?: Record<string, unknown>) =>
      unwrap(api.get('/hr/payroll/history', { params: q })),
  },
};

/* ───────── Module 10: Transport ───────── */
export const Transport = {
  routes: {
    list: () => unwrap(api.get('/transport/routes')),
    create: (body: Record<string, unknown>) => unwrap(api.post('/transport/routes', body)),
  },
  vehicles: { create: (body: Record<string, unknown>) => unwrap(api.post('/transport/vehicles', body)) },
  drivers:  { assign: (body: Record<string, unknown>) => unwrap(api.post('/transport/drivers', body)) },
  allocate: (body: Record<string, unknown>) => unwrap(api.post('/transport/allocations', body)),
  forStudent: (studentId: ID) =>
    unwrap(api.get(`/transport/allocations/student/${studentId}`)),
};

/* ───────── Module 11: Library ───────── */
export const Library = {
  books: {
    list: (q?: Record<string, unknown>) => unwrap(api.get('/library/books', { params: q })),
    create: (body: Record<string, unknown>) => unwrap(api.post('/library/books', body)),
    update: (id: ID, body: Record<string, unknown>) =>
      unwrap(api.put(`/library/books/${id}`, body)),
    remove: (id: ID) => unwrap(api.delete(`/library/books/${id}`)),
  },
  issue: (body: Record<string, unknown>) => unwrap(api.post('/library/issues', body)),
  return: (body: Record<string, unknown>) => unwrap(api.post('/library/returns', body)),
  fines: {
    list: (q?: Record<string, unknown>) => unwrap(api.get('/library/fines', { params: q })),
    pay: (id: ID) => unwrap(api.post(`/library/fines/${id}/pay`)),
  },
};

/* ───────── Module 12: Analytics ───────── */
export const Analytics = {
  schoolDashboard: () => unwrap(api.get('/analytics/school-dashboard')),
  studentPerformance: (id: ID) => unwrap(api.get(`/analytics/student-performance/${id}`)),
  teacherPerformance: (id: ID) => unwrap(api.get(`/analytics/teacher-performance/${id}`)),
};

/* ───────── Module 13: Data ───────── */
export const Data = {
  importStudents: (form: FormData) =>
    unwrap(api.post('/data/import/students', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })),
  exportStudents: () => unwrap(api.get('/data/export/students')),
  exportFinance:  () => unwrap(api.get('/data/export/finance')),
  backup:         () => unwrap(api.post('/data/system/backup')),
};

/* ───────── Module 14: Notifications ───────── */
export const Notifications = {
  registerFcm:   (body: { token: string; platform: 'web'|'ios'|'android' }) =>
    unwrap(api.post('/notifications/fcm-token', body)),
  deregisterFcm: (token: string) => unwrap(api.delete(`/notifications/fcm-token/${token}`)),
};
