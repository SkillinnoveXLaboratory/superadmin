import { FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Icon } from '@/components/Icon';
import { Lottie } from '@/components/Lottie';
import { Modal } from '@/components/Modal';
import { SuperAdmin } from '@/lib/api/services';
import type { GeoLocation, SchoolListItem, SchoolRegistrationResult } from '@/lib/api/types';

type FilterStatus = 'ALL' | 'ACTIVE' | 'SUSPENDED';

type SchoolForm = {
  name: string;
  registrationNumber: string;
  schoolCode: string;
  address: string;
  city: string;
  district: string;
  pincode: string;
  state: string;
  country: string;
  contactEmail: string;
  primaryPhone: string;
  secondaryPhone: string;
  profileImageUrl: string;
  logoUrl: string;
  websiteUrl: string;
  location: SchoolLocationForm;
};

type SchoolLocationForm = {
  latitude: string;
  longitude: string;
  address: string;
};

type GeoSearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const emptyForm: SchoolForm = {
  name: '',
  registrationNumber: '',
  schoolCode: '',
  address: '',
  city: '',
  district: '',
  pincode: '',
  state: '',
  country: '',
  contactEmail: '',
  primaryPhone: '',
  secondaryPhone: '',
  profileImageUrl: '',
  logoUrl: '',
  websiteUrl: '',
  location: {
    latitude: '',
    longitude: '',
    address: '',
  },
};

export function SchoolsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<FilterStatus>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingLocation, setViewingLocation] = useState<SchoolListItem | null>(null);
  const [registrationResult, setRegistrationResult] = useState<SchoolRegistrationResult | null>(null);

  const qc = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: ['schools', q, status],
    queryFn: () =>
      SuperAdmin.listSchools({
        search: q || undefined,
        status: status === 'ALL' ? undefined : status,
        limit: 1000,
      }),
  });

  const schools = schoolsQuery.data?.schools ?? [];
  const filteredSchools = filterSchools(schools, q);
  const total = filteredSchools.length;

  const suspend = useMutation({
    mutationFn: (args: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      SuperAdmin.suspendSchool(args.id),
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(variables.status === 'SUSPENDED' ? 'School unsuspended' : 'School suspended');
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to suspend school'),
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="label">Tenants</p>
          <h1 className="font-display text-[28px] font-bold tracking-tight mt-1">Schools</h1>
          <p className="text-ink-500 mt-1 text-sm">
            {total} tenant{total === 1 ? '' : 's'} on the platform.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setRegistrationResult(null);
            setCreateOpen(true);
          }}
          className="btn-primary"
          type="button"
        >
          <Icon name="plus" size={16} /> Register school
        </button>
      </header>

      <div className="card p-4 flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, registration #, contact email…"
            className="input pl-9"
          />
        </div>
        <div className="flex bg-muted p-1 rounded-xl overflow-x-auto max-w-full">
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap',
                status === s
                  ? 'bg-surface shadow-soft text-ink-900'
                  : 'text-ink-500 hover:text-ink-900',
              )}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {schoolsQuery.isLoading ? (
          <SchoolsSkeleton />
        ) : filteredSchools.length === 0 ? (
          <Empty onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-muted/60">
                <tr>
                  <th className="table-header">School</th>
                  <th className="table-header">Registration</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Location</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Created</th>
                  <th className="table-header text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="table-cell">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl overflow-hidden bg-brand-gradient text-white grid place-items-center font-semibold text-sm shrink-0">
                          {s.profileImageUrl ? (
                            <img src={s.profileImageUrl} alt={s.name} className="h-full w-full object-cover" />
                          ) : s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                          ) : (
                            initials(s.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-900 group-hover:text-brand-700 transition-colors truncate">
                            {s.name}
                          </div>
                          <div className="text-xs text-ink-400 truncate">{s.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{s.registrationNumber}</td>
                    <td className="table-cell">
                      <div className="text-ink-900 text-[13px] truncate max-w-[220px]">{s.contactEmail}</div>
                      <div className="text-ink-400 text-xs">{s.contactPhone}</div>
                    </td>
                    <td className="table-cell">
                      <div className="text-ink-900 text-[13px] truncate max-w-[220px]">
                        {formatLocationSummary(s.location) || s.address || '—'}
                      </div>
                      <div className="text-ink-400 text-xs">
                        {formatCoordinates(s.location)}
                      </div>
                    </td>
                    <td className="table-cell">
                      {s.status === 'ACTIVE' ? (
                        <span className="chip-success">● Active</span>
                      ) : (
                        <span className="chip-warning">● Suspended</span>
                      )}
                    </td>
                    <td className="table-cell text-ink-500 text-sm">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="table-cell text-right pr-6 space-x-2">
                      <button
                        onClick={() => {
                          setCreateOpen(false);
                          setEditingId(s.id);
                        }}
                        className="btn-outline py-1.5 px-3 text-xs"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewingLocation(s)}
                        className="btn-ghost py-1.5 px-3 text-xs"
                        type="button"
                      >
                        View map
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => suspend.mutate({ id: s.id, status: s.status })}
                          className="btn-ghost py-1.5 px-3 text-xs"
                          type="button"
                          disabled={suspend.isPending}
                        >
                          Suspend
                        </button>
                      )}
                      {s.status === 'SUSPENDED' && (
                        <button
                          onClick={() => suspend.mutate({ id: s.id, status: s.status })}
                          className="btn-ghost py-1.5 px-3 text-xs"
                          type="button"
                          disabled={suspend.isPending}
                        >
                          Unsuspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {createOpen && (
          <SchoolModal
            title="Register a new school"
            schoolId={null}
            onClose={() => setCreateOpen(false)}
            onSuccess={(result) => {
              setCreateOpen(false);
              setRegistrationResult(result);
            }}
          />
        )}
        {editingId && (
          <SchoolModal
            title="Edit school"
            schoolId={editingId}
            onClose={() => setEditingId(null)}
            onSuccess={() => {}}
          />
        )}
        {viewingLocation && (
          <LocationModal
            school={viewingLocation}
            onClose={() => setViewingLocation(null)}
          />
        )}
        {registrationResult && (
          <RegistrationResultModal
            result={registrationResult}
            onClose={() => setRegistrationResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="py-16 grid place-items-center text-center">
      <Lottie src="/lottie/empty-quiet.json" className="w-44" />
      <h3 className="font-display text-lg font-semibold mt-2">No schools yet</h3>
      <p className="text-ink-500 text-sm max-w-sm mt-1">
        Onboard your first tenant to start collecting cash payments, attendance, and exam results.
      </p>
      <button onClick={onCreate} className="btn-primary mt-5" type="button">
        <Icon name="plus" size={16} /> Register school
      </button>
    </div>
  );
}

function SchoolsSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 bg-muted/60 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function SchoolModal({
  title,
  schoolId,
  onClose,
  onSuccess,
}: {
  title: string;
  schoolId: string | null;
  onClose: () => void;
  onSuccess: (result: SchoolRegistrationResult) => void;
}) {
  const qc = useQueryClient();
  const isEdit = Boolean(schoolId);

  const schoolQuery = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => SuperAdmin.getSchool(schoolId as string),
    enabled: isEdit,
  });
  const currentStatus = schoolQuery.data?.status ?? 'ACTIVE';

  const [form, setForm] = useState<SchoolForm>(emptyForm);
  const [geoResults, setGeoResults] = useState<GeoSearchResult[]>([]);
  const [geoSearching, setGeoSearching] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoQuery, setGeoQuery] = useState('');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (schoolQuery.data) {
      setForm({
        name: schoolQuery.data.name ?? '',
        registrationNumber: schoolQuery.data.registrationNumber ?? '',
        schoolCode: (schoolQuery.data as any).schoolCode ?? '',
        address: schoolQuery.data.address ?? '',
        city: (schoolQuery.data as any).city ?? '',
        district: (schoolQuery.data as any).district ?? '',
        pincode: (schoolQuery.data as any).pincode ?? '',
        state: (schoolQuery.data as any).state ?? '',
        country: (schoolQuery.data as any).country ?? '',
        contactEmail: schoolQuery.data.contactEmail ?? '',
        primaryPhone: (schoolQuery.data as any).primaryPhone ?? schoolQuery.data.contactPhone ?? '',
        secondaryPhone: (schoolQuery.data as any).secondaryPhone ?? '',
        profileImageUrl: (schoolQuery.data as any).profileImageUrl ?? '',
        logoUrl: (schoolQuery.data as any).logoUrl ?? '',
        websiteUrl: (schoolQuery.data as any).websiteUrl ?? '',
        location: {
          latitude: schoolQuery.data.location?.latitude?.toString() ?? '',
          longitude: schoolQuery.data.location?.longitude?.toString() ?? '',
          address: schoolQuery.data.location?.address ?? schoolQuery.data.address ?? '',
        },
      });
    } else if (!isEdit) {
      setForm(emptyForm);
    }
  }, [schoolQuery.data, isEdit]);

  const save = useMutation<SchoolRegistrationResult, unknown, Record<string, unknown>>({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (schoolId) {
        const school = await SuperAdmin.updateSchool(schoolId, payload);
        return { school } satisfies SchoolRegistrationResult;
      }
      return SuperAdmin.createSchool(payload as { name: string } & Record<string, unknown>);
    },
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(schoolId ? 'School updated' : 'School registered');
      if (schoolId) onClose();
      else onSuccess(result as SchoolRegistrationResult);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to save school'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => SuperAdmin.deleteSchool(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success('School tenant suspended and queued for cleanup.');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete school'),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => SuperAdmin.suspendSchool(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(currentStatus === 'SUSPENDED' ? 'School unsuspended' : 'School suspended');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to suspend school'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate(buildSchoolPayload(form));
  }

  async function uploadLogo(file: File) {
    if (!schoolId) return;
    try {
      setLogoUploading(true);
      const result = await SuperAdmin.uploadSchoolLogo(schoolId, file);
      if (result.logoUrl) {
        setForm((current) => ({ ...current, logoUrl: result.logoUrl ?? current.logoUrl }));
      }
      toast.success(result.message || 'School logo uploaded');
      await qc.invalidateQueries({ queryKey: ['schools'] });
      await qc.invalidateQueries({ queryKey: ['school', schoolId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to upload school logo');
    } finally {
      setLogoUploading(false);
    }
  }

  async function searchLocation() {
    const query = geoQuery.trim();
    if (!query) {
      setGeoError('Enter a place to search.');
      setGeoResults([]);
      return;
    }
    setGeoError('');
    setGeoSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await res.json()) as GeoSearchResult[];
      setGeoResults(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) {
        setGeoError('No matching location found.');
      }
    } catch {
      setGeoError('Unable to search location right now.');
      setGeoResults([]);
    } finally {
      setGeoSearching(false);
    }
  }

  async function useCurrentLocation() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Current location is not supported in this browser.');
      return;
    }
    setGeoSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setForm((f) => ({
          ...f,
          location: {
            ...f.location,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          },
        }));
        try {
          const reverseRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: 'application/json' } },
          );
          const reverseData = (await reverseRes.json()) as Record<string, unknown>;
          const displayName =
            typeof reverseData.display_name === 'string' ? reverseData.display_name : '';
          const reverseAddress = (reverseData.address ?? {}) as Record<string, unknown>;
          const postcode =
            typeof reverseAddress.postcode === 'string'
              ? reverseAddress.postcode
              : extractPincode(displayName);
          if (displayName) {
            setForm((f) => ({
              ...f,
              location: {
                ...f.location,
                address: displayName,
              },
              address: f.address || displayName,
              pincode: f.pincode || postcode,
              city: f.city || extractCity(displayName),
              district: f.district || extractDistrict(displayName),
              state: f.state || extractState(displayName),
              country: f.country || extractCountry(displayName),
            }));
          }
        } catch {
          // Keep coordinates even if reverse lookup fails.
        } finally {
          setGeoSearching(false);
        }
      },
      () => {
        setGeoSearching(false);
        setGeoError('Unable to read your current location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function applyLocation(result: GeoSearchResult) {
    setForm((f) => ({
      ...f,
      location: {
        latitude: result.lat,
        longitude: result.lon,
        address: result.display_name,
      },
      address: f.address || result.display_name,
      city: f.city || extractCity(result.display_name),
      district: f.district || extractDistrict(result.display_name),
      state: f.state || extractState(result.display_name),
      country: f.country || extractCountry(result.display_name),
      pincode: f.pincode || extractPincode(result.display_name),
    }));
    setGeoResults([]);
    setGeoQuery(result.display_name);
  }

  const footer = (
    <>
      {isEdit && (
        <>
          <button
            type="button"
            onClick={() => {
              if (!schoolId) return;
              if (window.confirm('Delete this school tenant?')) remove.mutate(schoolId);
            }}
            className="btn-ghost text-danger text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0"
            disabled={remove.isPending}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              if (!schoolId) return;
              const action = currentStatus === 'SUSPENDED' ? 'Unsuspend' : 'Suspend';
              if (window.confirm(`${action} this school tenant?`)) suspend.mutate(schoolId);
            }}
            className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0"
            disabled={suspend.isPending}
          >
            {currentStatus === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
          </button>
        </>
      )}
      <button type="button" onClick={onClose} className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0">
        Cancel
      </button>
      <button type="submit" form="school-form" disabled={save.isPending} className="btn-primary text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-w-0">
        {save.isPending ? 'Saving…' : schoolId ? 'Save changes' : 'Register'}
      </button>
    </>
  );

  return (
    <Modal title={title} onClose={onClose} footer={footer} size="xl">
      {isEdit && schoolQuery.isLoading ? (
        <div className="py-8 space-y-3">
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
          <div className="h-10 bg-muted rounded-xl animate-pulse" />
        </div>
      ) : (
        <form id="school-form" onSubmit={submit} className="space-y-4">
          {isEdit && schoolQuery.data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailField label="School ID" value={schoolQuery.data.id} />
              <DetailField label="Status" value={schoolQuery.data.status} />
              <DetailField label="Created" value={formatDateTime(schoolQuery.data.createdAt)} />
              <DetailField label="Updated" value={formatDateTime(schoolQuery.data.updatedAt)} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Field label="School name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            <Field
              label="Registration number"
              value={form.registrationNumber}
              onChange={(v) => setForm((f) => ({ ...f, registrationNumber: v }))}
              disabled={isEdit}
              required
            />
            <section className="rounded-2xl border border-line bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-ink-900">Location</h3>
                  <p className="text-xs text-ink-500 mt-1">
                    Search on the map or use the current device location, then save latitude and longitude.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="btn-ghost text-xs px-3 py-2"
                  disabled={geoSearching}
                >
                  {geoSearching ? 'Detecting…' : 'Use current location'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="label">Search location</label>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <input
                      value={geoQuery}
                      onChange={(e) => setGeoQuery(e.target.value)}
                      placeholder="Search city, landmark, school area..."
                      className="input flex-1"
                    />
                    <button type="button" onClick={searchLocation} className="btn-primary px-4 py-2.5" disabled={geoSearching}>
                      Search
                    </button>
                  </div>
                  {geoError && <p className="text-xs text-danger mt-1">{geoError}</p>}
                  {geoResults.length > 0 && (
                    <div className="rounded-xl border border-line overflow-hidden bg-surface">
                      {geoResults.map((result) => (
                        <button
                          key={`${result.lat}-${result.lon}-${result.display_name}`}
                          type="button"
                          onClick={() => applyLocation(result)}
                          className="w-full text-left px-3 py-3 hover:bg-muted border-b border-line last:border-b-0"
                        >
                          <div className="text-sm font-medium text-ink-900">{result.display_name}</div>
                          <div className="text-[11px] text-ink-500 mt-1">
                            {Number(result.lat).toFixed(6)}, {Number(result.lon).toFixed(6)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost text-xs px-3 py-2"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        address: f.location.address || f.address,
                        city: f.city || extractCity(f.location.address),
                        district: f.district || extractDistrict(f.location.address),
                        state: f.state || extractState(f.location.address),
                        country: f.country || extractCountry(f.location.address),
                        pincode: f.pincode || extractPincode(f.location.address),
                      }))
                    }
                  >
                    Main location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Latitude"
                    value={form.location.latitude}
                    onChange={(v) => setForm((f) => ({ ...f, location: { ...f.location, latitude: v } }))}
                  />
                  <Field
                    label="Longitude"
                    value={form.location.longitude}
                    onChange={(v) => setForm((f) => ({ ...f, location: { ...f.location, longitude: v } }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Location address</label>
                <textarea
                  value={form.location.address}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      location: { ...f.location, address: e.target.value },
                    }))
                  }
                  rows={3}
                  className="input mt-2 min-h-[92px]"
                  placeholder="Selected address or detailed location note"
                />
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="School code" value={form.schoolCode} onChange={(v) => setForm((f) => ({ ...f, schoolCode: v }))} />
              <Field label="Website URL" value={form.websiteUrl} onChange={(v) => setForm((f) => ({ ...f, websiteUrl: v }))} />
              <Field label="Profile image URL" value={form.profileImageUrl} onChange={(v) => setForm((f) => ({ ...f, profileImageUrl: v }))} />
              <Field label="Logo URL" value={form.logoUrl} onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))} />
              <Field label="Country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
              <Field label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
              <Field label="District" value={form.district} onChange={(v) => setForm((f) => ({ ...f, district: v }))} />
              <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
              <Field label="Pincode" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v }))} />
            </div>

            <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Contact email"
                type="email"
                value={form.contactEmail}
                onChange={(v) => setForm((f) => ({ ...f, contactEmail: v }))}
                required
              />
              <Field
                label="Primary phone"
                value={form.primaryPhone}
                onChange={(v) => setForm((f) => ({ ...f, primaryPhone: v }))}
                required
              />
              <Field
                label="Secondary phone"
                value={form.secondaryPhone}
                onChange={(v) => setForm((f) => ({ ...f, secondaryPhone: v }))}
              />
            </div>

            {isEdit && (
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-brand-gradient text-white grid place-items-center shrink-0">
                      {form.logoUrl ? <img src={form.logoUrl} alt={form.name} className="h-full w-full object-cover" /> : <Icon name="school" size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">School logo</p>
                      <p className="text-xs text-ink-500">Upload an image to update `logoUrl` through the dedicated API.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-outline text-xs px-3 py-2"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                  >
                    {logoUploading ? 'Uploading...' : 'Upload logo'}
                  </button>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadLogo(file);
                    event.target.value = '';
                  }}
                />
              </div>
            )}

            {form.location.latitude && form.location.longitude && (
              <div className="rounded-2xl border border-line overflow-hidden bg-surface">
                <div className="px-4 py-3 border-b border-line flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-ink-900">Map preview</div>
                    <div className="text-xs text-ink-500">{formatLocationSummary(toGeoLocation(form.location))}</div>
                  </div>
                  <div className="text-xs text-ink-500 font-mono">
                    {form.location.latitude}, {form.location.longitude}
                  </div>
                </div>
                <iframe
                  title="Selected school location map"
                  src={buildMapEmbedUrl(toGeoLocation(form.location))}
                  className="w-full h-[260px] sm:h-[320px]"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={disabled ? 'input mt-2 bg-muted text-ink-500 cursor-not-allowed' : 'input mt-2'}
      />
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-muted/30 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
      <div className="text-sm font-medium text-ink-900 mt-1 break-all">{value || '—'}</div>
    </div>
  );
}

function LocationModal({ school, onClose }: { school: SchoolListItem; onClose: () => void }) {
  const location = school.location;
  const hasCoords = Boolean(location?.latitude && location?.longitude);
  return (
    <Modal title={`${school.name} location`} onClose={onClose} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label="School" value={school.name} />
          <DetailField label="Address" value={location?.address || school.address || '—'} />
          <DetailField label="Latitude" value={location?.latitude?.toString() || '—'} />
          <DetailField label="Longitude" value={location?.longitude?.toString() || '—'} />
        </div>
        {hasCoords ? (
          <div className="rounded-2xl border border-line overflow-hidden bg-surface">
            <iframe
              title={`${school.name} live location`}
              src={buildMapEmbedUrl(location)}
              className="w-full h-[320px] sm:h-[420px]"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-muted/30 px-4 py-8 text-center text-sm text-ink-500">
            No map coordinates saved for this school yet.
          </div>
        )}
      </div>
    </Modal>
  );
}

function RegistrationResultModal({
  result,
  onClose,
}: {
  result: SchoolRegistrationResult;
  onClose: () => void;
}) {
  const school = result.school;
  const admin = result.schoolAdmin;
  const summaryText = buildRegistrationSummary(result);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success('Registration summary copied');
    } catch {
      toast.error('Unable to copy summary');
    }
  }

  function downloadSummary() {
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${school.name.replace(/\s+/g, '-').toLowerCase()}-credentials.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal title="School registered successfully" onClose={onClose} size="xl" footer={(
      <>
        <button type="button" className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={copySummary}>
          Copy
        </button>
        <button type="button" className="btn-ghost text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={downloadSummary}>
          Download
        </button>
        <button type="button" className="btn-primary text-[11px] sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5" onClick={onClose}>
          Close
        </button>
      </>
    )}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-success/30 bg-success-bg/40 px-4 py-3">
          <div className="text-sm font-semibold text-success">Default data seeded</div>
          <div className="text-xs text-ink-600 mt-1">
            The new school tenant is active and the school admin credentials are ready to share.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailField label="School" value={school.name} />
          <DetailField label="School ID" value={school.id} />
          <DetailField label="Registration #" value={school.registrationNumber} />
          <DetailField label="School code" value={school.schoolCode ?? school.registrationNumber} />
        </div>

        <div className="rounded-2xl border border-line bg-muted/20 p-4 space-y-3">
          <h3 className="font-semibold text-ink-900">School admin credentials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailField label="User ID" value={admin?.userId || '—'} />
            <DetailField label="Username" value={admin?.username || '—'} />
            <DetailField label="Email" value={admin?.email || '—'} />
            <DetailField label="Role" value={admin?.role || '—'} />
            <DetailField label="Temporary password" value={admin?.temporaryPassword || '—'} />
            <DetailField label="Note" value={admin?.note || '—'} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-400">Summary</div>
          <pre className="mt-2 text-xs sm:text-sm whitespace-pre-wrap break-words text-ink-700 bg-muted/40 rounded-xl p-4 overflow-x-auto">
            {summaryText}
          </pre>
        </div>
      </div>
    </Modal>
  );
}

function buildSchoolPayload(form: SchoolForm): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    registrationNumber: form.registrationNumber.trim(),
    schoolCode: form.schoolCode.trim(),
    address: form.address.trim(),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.primaryPhone.trim(),
    primaryPhone: form.primaryPhone.trim(),
    secondaryPhone: form.secondaryPhone.trim(),
    city: form.city.trim(),
    district: form.district.trim(),
    pincode: form.pincode.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    profileImageUrl: form.profileImageUrl.trim(),
    logoUrl: form.logoUrl.trim(),
    websiteUrl: form.websiteUrl.trim(),
  };

  const latitude = Number(form.location.latitude);
  const longitude = Number(form.location.longitude);
  const hasLatitude = form.location.latitude.trim() !== '' && Number.isFinite(latitude);
  const hasLongitude = form.location.longitude.trim() !== '' && Number.isFinite(longitude);
  const location: GeoLocation = {};

  if (hasLatitude) location.latitude = latitude;
  if (hasLongitude) location.longitude = longitude;
  if (form.location.address.trim()) location.address = form.location.address.trim();

  if (Object.keys(location).length > 0) {
    payload.location = location;
  }

  return payload;
}

function buildRegistrationSummary(result: SchoolRegistrationResult) {
  const school = result.school;
  const admin = result.schoolAdmin;
  return [
    `School: ${school.name}`,
    `School ID: ${school.id}`,
    `Registration Number: ${school.registrationNumber}`,
    `School Code: ${school.schoolCode ?? school.registrationNumber}`,
    `Status: ${school.status}`,
    '',
    'School Admin',
    `User ID: ${admin?.userId ?? '—'}`,
    `Username: ${admin?.username ?? '—'}`,
    `Email: ${admin?.email ?? '—'}`,
    `Role: ${admin?.role ?? '—'}`,
    `Temporary Password: ${admin?.temporaryPassword ?? '—'}`,
    `Note: ${admin?.note ?? '—'}`,
  ].join('\n');
}

function filterSchools(schools: SchoolListItem[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return schools;
  return schools.filter((school) => {
    const haystack = [
      school.name,
      school.registrationNumber,
      school.schoolCode,
      school.address,
      school.contactEmail,
      school.contactPhone,
      school.primaryPhone,
      school.secondaryPhone,
      school.city,
      school.district,
      school.state,
      school.country,
      school.pincode,
      school.location?.address,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

function formatLocationSummary(location?: GeoLocation) {
  if (!location) return '';
  if (location.address) return location.address;
  return location.latitude !== undefined && location.longitude !== undefined
    ? `${location.latitude}, ${location.longitude}`
    : '';
}

function formatCoordinates(location?: GeoLocation) {
  if (!location || location.latitude === undefined || location.longitude === undefined) return '—';
  return `${location.latitude}, ${location.longitude}`;
}

function buildMapEmbedUrl(location?: GeoLocation) {
  const latitude = location?.latitude ?? 0;
  const longitude = location?.longitude ?? 0;
  const delta = 0.01;
  const left = longitude - delta;
  const right = longitude + delta;
  const top = latitude + delta;
  const bottom = latitude - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function toGeoLocation(location: SchoolLocationForm): GeoLocation {
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const result: GeoLocation = {};
  if (location.latitude.trim() && Number.isFinite(latitude)) result.latitude = latitude;
  if (location.longitude.trim() && Number.isFinite(longitude)) result.longitude = longitude;
  if (location.address.trim()) result.address = location.address.trim();
  return result;
}

function extractCity(value: string) {
  const parts = splitLocation(value);
  return parts[0] ?? '';
}

function extractDistrict(value: string) {
  const parts = splitLocation(value);
  return parts[1] ?? '';
}

function extractState(value: string) {
  const parts = splitLocation(value);
  return parts[2] ?? '';
}

function extractCountry(value: string) {
  const parts = splitLocation(value);
  return parts[3] ?? '';
}

function extractPincode(value: string) {
  const match = value.match(/\b\d{5,6}\b/);
  return match?.[0] ?? '';
}

function splitLocation(value: string) {
  return value
    .split(',')
    .map((part) => sanitizeLocationPart(part))
    .filter(Boolean)
    .slice(-4);
}

function sanitizeLocationPart(part: string) {
  return part
    .replace(/\b\d{4,6}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function initials(s: string) {
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(value: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
