import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { SuperAdmin, Students as StudentsApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth';
import type { SchoolListItem, StudentIdCardPayload, StudentListItem } from '@/lib/api/types';

type StudentForm = {
  firstName: string;
  lastName: string;
  email: string;
};

type ParentForm = {
  fatherName: string;
  motherName: string;
  primaryPhone: string;
  email: string;
  homeAddress: string;
};

const emptyStudentForm: StudentForm = {
  firstName: '',
  lastName: '',
  email: '',
};

const emptyParentForm: ParentForm = {
  fatherName: '',
  motherName: '',
  primaryPhone: '',
  email: '',
  homeAddress: '',
};

export function StudentsPage() {
  const qc = useQueryClient();
  const { activeSchoolId, setActiveSchool } = useAuthStore();
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<StudentListItem | null>(null);

  const schoolsQuery = useQuery({
    queryKey: ['schools', 'selector'],
    queryFn: () => SuperAdmin.listSchools({ limit: 1000 }),
  });

  const schools = schoolsQuery.data?.schools ?? [];

  useEffect(() => {
    if (!activeSchoolId && schools.length === 1) {
      setActiveSchool(schools[0].id);
    }
  }, [activeSchoolId, schools, setActiveSchool]);

  const currentSchool = useMemo(
    () => schools.find((s) => s.id === activeSchoolId) ?? null,
    [schools, activeSchoolId],
  );

  const studentsQuery = useQuery({
    queryKey: ['students', activeSchoolId],
    queryFn: () => StudentsApi.list({ limit: 50 }),
    enabled: Boolean(activeSchoolId),
  });

  const students = studentsQuery.data?.students ?? [];
  const total = studentsQuery.data?.meta.total ?? students.length;

  function handleSchoolChange(value: string) {
    setActiveSchool(value || null);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label">Student management</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Students</h1>
          <p className="text-ink-500 mt-1 text-sm">Choose a school first, then manage that school&apos;s students.</p>
        </div>
      </header>

      <section className="card p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="label">Choose School</p>
            <p className="text-sm text-ink-500 mt-1">The selected school id is saved and used for all student API calls.</p>
          </div>
          {currentSchool && (
            <span className="chip-brand">Selected: {currentSchool.name}</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label">School</label>
            <select
              className="input mt-2"
              value={activeSchoolId ?? ''}
              onChange={(e) => handleSchoolChange(e.target.value)}
            >
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.registrationNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-outline h-11 w-full sm:w-auto"
              onClick={() => qc.invalidateQueries({ queryKey: ['students', activeSchoolId] })}
              disabled={!activeSchoolId}
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {!activeSchoolId ? (
        <div className="card p-8 text-center">
          <Icon name="school" size={28} className="mx-auto text-ink-400" />
          <h2 className="font-display text-lg font-semibold mt-3">Select a school</h2>
          <p className="text-ink-500 text-sm mt-1">Once you choose a school, its students will appear below.</p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="label">Students</p>
              <h2 className="font-display text-xl font-bold tracking-tight mt-1">
                {total} student{total === 1 ? '' : 's'}
              </h2>
            </div>
          </div>

          <div className="card overflow-hidden">
            {studentsQuery.isLoading ? (
              <StudentsSkeleton />
            ) : students.length === 0 ? (
              <EmptyStudents />
            ) : (
              <>
                <div className="md:hidden space-y-3 p-4">
                  {students.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onEdit={() => setEditingStudent(student)}
                      onDelete={(s) => deleteStudent(s.id, qc)}
                    />
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="table-header">Student</th>
                        <th className="table-header">Parent</th>
                        <th className="table-header">Class / Section</th>
                        <th className="table-header">Status</th>
                        <th className="table-header">RFID</th>
                        <th className="table-header text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/40 transition-colors">
                          <td className="table-cell">
                            <div className="font-semibold text-ink-900">{student.firstName} {student.lastName}</div>
                            <div className="text-xs text-ink-400">{student.email}</div>
                          </td>
                          <td className="table-cell text-sm">
                            <div>{student.parentContact?.fatherName ?? '—'}</div>
                            <div className="text-xs text-ink-400">{student.parentContact?.primaryPhone ?? '—'}</div>
                          </td>
                          <td className="table-cell text-sm">
                            <div>{student.classId || '—'}</div>
                            <div className="text-xs text-ink-400">{student.sectionId || '—'}</div>
                          </td>
                          <td className="table-cell">{renderStatus(student.status)}</td>
                          <td className="table-cell text-sm font-mono">{student.rfidCardCode ?? '—'}</td>
                          <td className="table-cell text-right pr-6 space-x-2">
                            <button
                              type="button"
                              className="btn-outline py-1.5 px-3 text-xs"
                              onClick={() => setEditingStudent(student)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-ghost py-1.5 px-3 text-xs text-danger"
                              onClick={() => deleteStudent(student.id, qc)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <AnimatePresence>
        {editingStudent && (
          <StudentModal
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
            onViewIdCard={(student) => setIdCardStudent(student)}
            onSaved={() => qc.invalidateQueries({ queryKey: ['students', activeSchoolId] })}
          />
        )}
        {idCardStudent && (
          <IdCardModal
            student={idCardStudent}
            onClose={() => setIdCardStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StudentCard({
  student,
  onEdit,
  onDelete,
}: {
  student: StudentListItem;
  onEdit: () => void;
  onDelete: (student: StudentListItem) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink-900">{student.firstName} {student.lastName}</div>
          <div className="text-xs text-ink-400">{student.email}</div>
        </div>
        {renderStatus(student.status)}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Parent" value={student.parentContact?.fatherName ?? '—'} />
        <Info label="Phone" value={student.parentContact?.primaryPhone ?? '—'} />
        <Info label="Class" value={student.classId || '—'} />
        <Info label="RFID" value={student.rfidCardCode ?? '—'} />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-outline flex-1 py-2 text-xs" onClick={onEdit}>Edit</button>
        <button type="button" className="btn-ghost flex-1 py-2 text-xs text-danger" onClick={() => onDelete(student)}>Delete</button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="text-sm font-medium text-ink-900 mt-1 break-all">{value}</div>
    </div>
  );
}

function renderStatus(status: StudentListItem['status']) {
  if (status === 'ENROLLED') return <span className="chip-success">● Enrolled</span>;
  if (status === 'DE-ENROLLED' || status === 'DEENROLLED') return <span className="chip-danger">● De-enrolled</span>;
  if (status === 'GRADUATED') return <span className="chip-warning">● Graduated</span>;
  if (status === 'TRANSFERRED') return <span className="chip-warning">● Transferred</span>;
  return <span className="chip-warning">● {status}</span>;
}

function EmptyStudents() {
  return (
    <div className="py-16 text-center">
      <Icon name="students" size={28} className="mx-auto text-ink-400" />
      <h3 className="font-display text-lg font-semibold mt-3">No students yet</h3>
      <p className="text-ink-500 text-sm mt-1">This school currently has no students returned by the API.</p>
    </div>
  );
}

function StudentsSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/60 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function StudentModal({
  student,
  onClose,
  onViewIdCard,
  onSaved,
}: {
  student: StudentListItem;
  onClose: () => void;
  onViewIdCard: (student: StudentListItem) => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyStudentForm);
  const [parentForm, setParentForm] = useState<ParentForm>(emptyParentForm);

  useEffect(() => {
    setStudentForm({
      firstName: student.firstName ?? '',
      lastName: student.lastName ?? '',
      email: student.email ?? '',
    });
    setParentForm({
      fatherName: student.parentContact?.fatherName ?? '',
      motherName: student.parentContact?.motherName ?? '',
      primaryPhone: student.parentContact?.primaryPhone ?? '',
      email: student.parentContact?.email ?? '',
      homeAddress: student.parentContact?.homeAddress ?? '',
    });
  }, [student]);

  const saveStudent = useMutation({
    mutationFn: () => StudentsApi.update(student.id, studentForm),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['students'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success('Student updated');
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update student'),
  });

  const saveParent = useMutation({
    mutationFn: () => StudentsApi.updateParent(student.id, parentForm),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Parent details updated');
      onSaved();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update parent details'),
  });

  const remove = useMutation({
    mutationFn: () => StudentsApi.remove(student.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['students'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success('Student removed');
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to remove student'),
  });

  return (
    <Modal title="Edit student" onClose={onClose} size="lg" footer={(
      <>
        <button type="button" className="btn-ghost text-danger text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={() => remove.mutate()}>
          Delete
        </button>
        <button type="button" className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-primary text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={() => saveStudent.mutate()} disabled={saveStudent.isPending}>
          {saveStudent.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </>
    )}>
      <div className="space-y-6">
        <section className="space-y-4">
          <div>
            <p className="label">Student details</p>
            <p className="text-xs text-ink-400 mt-1">Only name and email are editable here.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name" value={studentForm.firstName} onChange={(v) => setStudentForm((f) => ({ ...f, firstName: v }))} />
            <Field label="Last name" value={studentForm.lastName} onChange={(v) => setStudentForm((f) => ({ ...f, lastName: v }))} />
            <Field label="Email" type="email" value={studentForm.email} onChange={(v) => setStudentForm((f) => ({ ...f, email: v }))} className="sm:col-span-2" />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="label">Parent details</p>
            <p className="text-xs text-ink-400 mt-1">Saved separately using the parent update route.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Father name" value={parentForm.fatherName} onChange={(v) => setParentForm((f) => ({ ...f, fatherName: v }))} />
            <Field label="Mother name" value={parentForm.motherName} onChange={(v) => setParentForm((f) => ({ ...f, motherName: v }))} />
            <Field label="Primary phone" value={parentForm.primaryPhone} onChange={(v) => setParentForm((f) => ({ ...f, primaryPhone: v }))} />
            <Field label="Email" type="email" value={parentForm.email} onChange={(v) => setParentForm((f) => ({ ...f, email: v }))} />
            <Field label="Home address" value={parentForm.homeAddress} onChange={(v) => setParentForm((f) => ({ ...f, homeAddress: v }))} className="sm:col-span-2" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-outline text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={() => saveParent.mutate()} disabled={saveParent.isPending}>
              {saveParent.isPending ? 'Saving…' : 'Save parent'}
            </button>
            <button type="button" className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={() => onViewIdCard(student)}>
              View ID card
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function IdCardModal({
  student,
  onClose,
}: {
  student: StudentListItem;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<StudentIdCardPayload>({
    queryKey: ['student-id-card', student.id],
    queryFn: () => StudentsApi.idCard(student.id),
  });

  const imageUrl = toMediaUrl(data?.photoUrl);

  return (
    <Modal title="Student ID card" onClose={onClose} size="lg" footer={(
      <button type="button" className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={onClose}>
        Close
      </button>
    )}>
      {isLoading ? (
        <div className="py-10 text-center text-ink-500">Loading ID card…</div>
      ) : error ? (
        <div className="py-10 text-center text-danger">Failed to load ID card</div>
      ) : (
        <div className="mx-auto max-w-md rounded-[28px] border border-line bg-gradient-to-br from-brand-50 to-white p-4 sm:p-5 shadow-card">
          <div className="rounded-[24px] overflow-hidden bg-white border border-line">
            <div className="px-5 py-4 bg-brand-gradient text-white">
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/80">Student ID Card</div>
              <div className="mt-1 text-xl font-bold">{data?.name ?? student.firstName + ' ' + student.lastName}</div>
              <div className="text-sm text-white/90">{data?.enrollmentNumber ?? '—'}</div>
            </div>
            <div className="p-5 grid grid-cols-[96px_1fr] gap-4 items-start">
              <div className="w-24 h-28 rounded-2xl bg-muted overflow-hidden border border-line">
                {imageUrl ? (
                  <img src={imageUrl} alt={data?.name ?? 'Student photo'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-ink-400 text-xs">No photo</div>
                )}
              </div>
              <div className="space-y-2">
                <Info label="Class" value={data?.className ?? '—'} />
                <Info label="QR" value={data?.qrCodeData ?? '—'} />
                <Info label="Name" value={data?.name ?? student.firstName + ' ' + student.lastName} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input className="input mt-2" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

async function deleteStudent(id: string, qc: ReturnType<typeof useQueryClient>) {
  if (!window.confirm('Delete this student?')) return;
  try {
    await StudentsApi.remove(id);
    await qc.invalidateQueries({ queryKey: ['students'] });
    await qc.invalidateQueries({ queryKey: ['overview'] });
    toast.success('Student removed');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Failed to delete student');
  }
}

function toMediaUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://schoolmate.digitalleadpro.com/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
