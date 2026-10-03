import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import { ArrowRight, Camera, Check, ClipboardList, Download, Eye, FileCheck2, FilePlus2, MapPin, MapPinned, RefreshCw, Send, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TourismReport, TourismReportStatus } from '../types';

interface TourismLocation {
  latitude: number;
  longitude: number;
  district: string | null;
  capturedAt: string;
}

let cachedTourismLocation: { location: TourismLocation; capturedAt: number } | null = null;
let locationRequest: Promise<TourismLocation> | null = null;

function requestTourismLocation(forceRefresh = false): Promise<TourismLocation> {
  if (!forceRefresh && cachedTourismLocation && Date.now() - cachedTourismLocation.capturedAt < 5 * 60 * 1000) {
    return Promise.resolve(cachedTourismLocation.location);
  }
  if (locationRequest) return locationRequest;
  if (!navigator.geolocation) return Promise.reject(new Error('Perangkat atau browser tidak mendukung akses lokasi.'));

  locationRequest = new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 });
  }).then(async ({ coords }) => {
    const capturedAt = new Date().toISOString();
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(coords.latitude), lon: String(coords.longitude), zoom: '14', addressdetails: '1' });
    let district: string | null = null;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
      if (response.ok) {
        const result = await response.json();
        const address = result.address || {};
        const value = address.subdistrict || address.city_district || address.district || address.municipality;
        district = typeof value === 'string' && value.trim() ? value.trim() : null;
      }
    } catch {
      district = null;
    }
    const location = { latitude: coords.latitude, longitude: coords.longitude, district, capturedAt };
    cachedTourismLocation = { location, capturedAt: Date.now() };
    return location;
  }).finally(() => { locationRequest = null; });

  return locationRequest;
}

function locationError(error: unknown) {
  const code = (error as GeolocationPositionError | undefined)?.code;
  if (code === 1) return 'Izin lokasi ditolak. Izinkan akses lokasi untuk domain ini melalui pengaturan browser.';
  if (code === 2) return 'Lokasi perangkat tidak tersedia. Periksa GPS atau layanan lokasi perangkat.';
  if (code === 3) return 'Pembacaan lokasi terlalu lama. Coba perbarui lokasi kembali.';
  return error instanceof Error ? error.message : 'Lokasi perangkat tidak dapat dibaca.';
}

interface TourismSummary {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  visitors: number;
}

export function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<TourismSummary>({ total: 0, pending: 0, verified: 0, rejected: 0, visitors: 0 });
  const [rejectedReports, setRejectedReports] = useState<Array<{ id: string; tourism_site: string; visit_date: string; rejection_reason: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [locationState, setLocationState] = useState<{ location: TourismLocation | null; loading: boolean; error: string }>({ location: null, loading: false, error: '' });
  const isOfficer = user?.role === 'PETUGAS';
  const actionPath = isOfficer ? '/wisata/input' : '/wisata/laporan';

  useEffect(() => {
    if (!isOfficer) return;
    setLocationState({ location: null, loading: true, error: '' });
    requestTourismLocation()
      .then(location => setLocationState({ location, loading: false, error: '' }))
      .catch(error => setLocationState({ location: null, loading: false, error: locationError(error) }));
  }, [isOfficer]);

  const refreshLocation = () => {
    setLocationState({ location: null, loading: true, error: '' });
    requestTourismLocation(true)
      .then(location => setLocationState({ location, loading: false, error: '' }))
      .catch(error => setLocationState({ location: null, loading: false, error: locationError(error) }));
  };

  useEffect(() => {
    const loadSummary = async () => {
      if (!user) return;
      let query = supabase.from('tourism_reports').select('id, status, total_visitors, tourism_site, visit_date, rejection_reason').order('created_at', { ascending: false });
      if (isOfficer) query = query.eq('officer_id', user.id);
      const { data, error } = await query;
      if (error) {
        setSummaryError(error.message);
        setLoading(false);
        return;
      }
      const reports = data || [];
      setRejectedReports(isOfficer ? reports.filter(report => report.status === 'REJECTED').slice(0, 8) : []);
      setSummary({
        total: reports.length,
        pending: reports.filter(report => report.status === 'SUBMITTED').length,
        verified: reports.filter(report => report.status === 'VERIFIED').length,
        rejected: reports.filter(report => report.status === 'REJECTED').length,
        visitors: reports.reduce((total, report) => total + Number(report.total_visitors || 0), 0),
      });
      setLoading(false);
    };
    loadSummary();
  }, [isOfficer, user]);

  const cards = [
    { label: isOfficer ? 'Laporan saya' : 'Total laporan', value: summary.total, icon: ClipboardList, color: 'bg-cyan-600' },
    { label: 'Menunggu verifikasi', value: summary.pending, icon: FileCheck2, color: 'bg-amber-500' },
    { label: 'Terverifikasi', value: summary.verified, icon: FileCheck2, color: 'bg-emerald-600' },
    { label: 'Total wisatawan', value: summary.visitors.toLocaleString('id-ID'), icon: Users, color: 'bg-sky-600' },
  ];

  if (isOfficer) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24 dark:bg-gray-950">
        <header className="bg-gradient-to-br from-cyan-800 via-cyan-700 to-teal-500 px-5 pb-8 pt-8 text-white shadow-lg">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">DIGIWISATA</p>
            <h1 className="mt-2 text-3xl font-bold">Laporan lapangan</h1>
            <p className="mt-2 max-w-xl text-sm text-cyan-50">Catat jumlah kunjungan dan kirimkan laporan dengan lokasi perangkat.</p>
            <button onClick={() => navigate('/wisata/input')} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-cyan-800 shadow-sm hover:bg-cyan-50"><FilePlus2 className="h-4 w-4" /> Buat laporan</button>
          </div>
        </header>
        <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
          <section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/50">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-cyan-950 dark:text-cyan-100">Lokasi pelaporan</p>
                {locationState.loading && <p className="mt-1 text-sm text-cyan-900 dark:text-cyan-200">Meminta izin dan membaca lokasi perangkat...</p>}
                {locationState.location && <><p className="mt-1 text-sm text-cyan-900 dark:text-cyan-200">{locationState.location.district ? `Kecamatan ${locationState.location.district}` : 'Kecamatan belum teridentifikasi'}</p><p className="mt-1 break-all text-xs text-cyan-800 dark:text-cyan-300">{locationState.location.latitude.toFixed(6)}, {locationState.location.longitude.toFixed(6)}</p></>}
                {locationState.error && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{locationState.error}</p>}
                <p className="mt-2 text-xs text-cyan-800 dark:text-cyan-300">Koordinat dikirim ke OpenStreetMap Nominatim untuk mencari kecamatan. © OpenStreetMap contributors.</p>
              </div>
              <button type="button" onClick={refreshLocation} className="rounded-lg p-2 text-cyan-800 hover:bg-cyan-100 dark:text-cyan-200 dark:hover:bg-cyan-900" aria-label="Perbarui lokasi" title="Perbarui lokasi"><RefreshCw className="h-4 w-4" /></button>
            </div>
          </section>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Memuat laporan...</p> : <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label} className="border-0 shadow-sm"><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div><span className={`rounded-xl p-3 text-white ${color}`}><Icon className="h-5 w-5" /></span></CardContent></Card>)}</section>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Laporan yang perlu diperbaiki</h2>
              {rejectedReports.length === 0 ? <p className="text-sm text-slate-500">Tidak ada laporan yang menunggu perbaikan.</p> : <div className="space-y-3">{rejectedReports.map(report => <Card key={report.id} className="border-0 shadow-sm"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-slate-900 dark:text-white">{report.tourism_site}</p><p className="mt-1 text-sm text-slate-500">{report.visit_date} · {report.id}</p><p className="mt-1 text-sm text-red-700 dark:text-red-300">Alasan: {report.rejection_reason || 'Perlu diperbaiki'}</p></div><button onClick={() => navigate(`/wisata/input?edit=${encodeURIComponent(report.id)}`)} className="rounded-lg border border-cyan-700 px-3 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50 dark:text-cyan-200 dark:hover:bg-cyan-950">Perbaiki laporan</button></CardContent></Card>)}</div>}
            </section>
          </>}
        </div>
      </main>
    );
  }

  return <main className="min-h-screen bg-slate-50 pb-24 dark:bg-gray-950">
    <header className="relative overflow-hidden bg-gradient-to-br from-cyan-800 via-cyan-700 to-teal-500 px-5 pb-10 pt-8 text-white shadow-lg">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="relative mx-auto max-w-6xl"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">DIGIWISATA</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{isOfficer ? 'Laporan lapangan' : 'Pusat laporan wisata'}</h1><p className="mt-2 max-w-xl text-sm text-cyan-50">{isOfficer ? 'Catat jumlah wisatawan di lapangan dan kirimkan laporan langsung ke Dinas Pariwisata.' : 'Pantau laporan kunjungan wisata yang dikirim petugas lapangan dalam satu tempat.'}</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={() => navigate(actionPath)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cyan-800 shadow-sm transition hover:bg-cyan-50">{isOfficer ? <FilePlus2 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{isOfficer ? 'Buat laporan' : 'Buka laporan masuk'}</button>{!isOfficer && <span className="inline-flex items-center gap-2 rounded-xl bg-cyan-950/30 px-4 py-2.5 text-sm font-semibold text-white"><MapPinned className="h-4 w-4" /> Internal pengelola</span>}</div></div>
    </header>
    {summaryError && <p role="alert" className="mx-auto mt-4 max-w-6xl rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">Gagal memuat laporan dari Supabase: {summaryError}</p>}
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">{isOfficer && <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm dark:border-cyan-900 dark:bg-cyan-950/50"><div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" /><div className="min-w-0 flex-1"><p className="font-semibold text-cyan-950 dark:text-cyan-100">Lokasi pelaporan</p>{locationState.loading && <p className="mt-1 text-cyan-900 dark:text-cyan-200">Meminta izin dan membaca lokasi perangkat...</p>}{locationState.location && <><p className="mt-1 text-cyan-900 dark:text-cyan-200">{locationState.location.district ? `Kecamatan ${locationState.location.district}` : 'Kecamatan belum teridentifikasi'}</p><p className="mt-1 break-all text-xs text-cyan-800 dark:text-cyan-300">{locationState.location.latitude.toFixed(6)}, {locationState.location.longitude.toFixed(6)}</p></>}{locationState.error && <p className="mt-1 text-red-700 dark:text-red-300">{locationState.error}</p>}<p className="mt-2 text-xs text-cyan-800 dark:text-cyan-300">Koordinat dikirim ke OpenStreetMap Nominatim untuk mencari kecamatan. © OpenStreetMap contributors.</p></div><button type="button" onClick={refreshLocation} className="rounded-lg p-2 text-cyan-800 hover:bg-cyan-100 dark:text-cyan-200 dark:hover:bg-cyan-900" aria-label="Perbarui lokasi" title="Perbarui lokasi"><RefreshCw className="h-4 w-4" /></button></div></div>}{loading ? <div className="py-12 text-center text-sm text-slate-500">Memuat ringkasan laporan...</div> : <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, color }) => <Card key={label} className="border-0 shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div><span className={`rounded-2xl p-3 text-white ${color}`}><Icon className="h-5 w-5" /></span></CardContent></Card>)}</section><Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-start gap-4"><span className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"><Send className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900 dark:text-white">Alur kerja DigiWisata</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{isOfficer ? 'Isi data kunjungan, tambahkan bukti bila diperlukan, lalu kirim untuk ditinjau admin.' : 'Laporan petugas masuk otomatis dan dapat diverifikasi atau dikembalikan untuk diperbaiki.'}</p><button onClick={() => navigate(actionPath)} className="mt-4 text-sm font-semibold text-cyan-700 dark:text-cyan-300">{isOfficer ? 'Mulai input laporan' : 'Tinjau laporan masuk'}</button></div></div></CardContent></Card>{summary.rejected > 0 && isOfficer && <p className="text-sm text-amber-700 dark:text-amber-300">Ada {summary.rejected} laporan yang perlu diperbaiki.</p>}</>}</div>
  </main>;
}

const tourismTypes = ['Alam', 'Buatan', 'Budaya', 'Religi', 'Kuliner', 'Akomodasi', 'Desa Wisata'];
const tourismStatusLabels: Record<TourismReportStatus, string> = { SUBMITTED: 'Menunggu', VERIFIED: 'Terverifikasi', REJECTED: 'Ditolak' };

export function TourismReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();
  const [form, setForm] = useState({ site: '', type: tourismTypes[0], date: new Date().toISOString().slice(0, 10), local: '', foreign: '', notes: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [existingEvidence, setExistingEvidence] = useState<string | null>(null);
  const [location, setLocation] = useState<TourismLocation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportNumber, setReportNumber] = useState<string | null>(null);

  useEffect(() => {
    requestTourismLocation()
      .then(value => { setLocation(value); setMessage(''); })
      .catch(error => setMessage(locationError(error)));
  }, []);

  useEffect(() => {
    if (!editId || !user) return;
    supabase.from('tourism_reports').select('*').eq('id', editId).eq('officer_id', user.id).eq('status', 'REJECTED').maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setMessage('Laporan tidak ditemukan atau sudah tidak menunggu perbaikan.');
          return;
        }
        setForm({ site: data.tourism_site, type: data.tourism_type, date: data.visit_date, local: String(data.local_visitors), foreign: String(data.foreign_visitors), notes: data.notes || '' });
        setExistingEvidence(data.evidence_path);
        setReportNumber(data.report_number);
      });
  }, [editId, user]);

  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!location) {
      setMessage('Lokasi perangkat belum tersedia. Izinkan akses lokasi lalu coba kembali.');
      return;
    }
    setLoading(true);
    setMessage('');
    const currentReportNumber = reportNumber || `DW${Date.now()}`;
    try {
      let evidencePath: string | null = existingEvidence;
      if (photo) {
        if (!photo.type.startsWith('image/') || photo.size > 10 * 1024 * 1024) throw new Error('Bukti foto harus berupa gambar maksimal 10 MB.');
        evidencePath = `${user.id}/${currentReportNumber}-${Date.now()}-${photo.name.replace(/[^a-z0-9._-]/gi, '_')}`;
        const upload = await supabase.storage.from('tourism-evidence').upload(evidencePath, photo);
        if (upload.error) throw upload.error;
      }
      const payload = { tourism_site: form.site.trim(), tourism_type: form.type, visit_date: form.date, local_visitors: Number(form.local) || 0, foreign_visitors: Number(form.foreign) || 0, evidence_path: evidencePath, latitude: location.latitude, longitude: location.longitude, district: location.district, location_captured_at: location.capturedAt, notes: form.notes.trim() || null };
      const result = editId
        ? await supabase.from('tourism_reports').update({ ...payload, status: 'SUBMITTED', rejection_reason: null, reviewed_by: null, reviewed_at: null }).eq('id', editId).eq('officer_id', user.id).select('id')
        : await supabase.from('tourism_reports').insert({ ...payload, report_number: currentReportNumber, officer_id: user.id });
      if (result.error) throw result.error;
      if (editId && (!result.data || result.data.length === 0)) throw new Error('Laporan tidak lagi tersedia untuk diperbaiki.');
      cachedTourismLocation = null;
      setReportNumber(currentReportNumber);
      setMessage(`Laporan ${currentReportNumber} berhasil dikirim${editId ? ' ulang' : ''} ke admin.`);
      if (!editId) setForm(current => ({ ...current, site: '', local: '', foreign: '', notes: '' }));
      setPhoto(null);
    } catch (error: any) {
      setMessage(error.message || 'Laporan gagal dikirim.');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => requestTourismLocation(true).then(value => { setLocation(value); setMessage('Lokasi berhasil diperbarui.'); }).catch(error => setMessage(locationError(error)));

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate('/')} className="mb-5 inline-flex items-center gap-2 text-sm text-cyan-800 dark:text-cyan-200"><ArrowRight className="h-4 w-4 rotate-180" /> Kembali</button>
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">DigiWisata</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{editId ? 'Perbaiki laporan' : 'Input laporan lapangan'}</h1>
              <p className="mt-2 text-sm text-slate-500">Isi data kunjungan dan kirim untuk ditinjau admin.</p>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cyan-950 dark:text-cyan-100">Lokasi pelaporan</p>
                  <p className="mt-1 text-sm text-cyan-900 dark:text-cyan-200">{location ? location.district ? `Kecamatan ${location.district}` : 'Kecamatan belum teridentifikasi' : 'Meminta izin dan membaca lokasi perangkat...'}</p>
                  {location && <p className="mt-1 break-all text-xs text-cyan-800 dark:text-cyan-300">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>}
                  <p className="mt-2 text-xs text-cyan-800 dark:text-cyan-300">Koordinat dikirim ke OpenStreetMap Nominatim untuk mencari kecamatan. © OpenStreetMap contributors.</p>
                </div>
                <button type="button" onClick={detectLocation} className="rounded-lg p-2 text-cyan-800 hover:bg-cyan-100 dark:text-cyan-200 dark:hover:bg-cyan-900" aria-label="Perbarui lokasi" title="Perbarui lokasi"><RefreshCw className="h-4 w-4" /></button>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Nama objek wisata<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900" value={form.site} onChange={event => update('site', event.target.value)} required /></label>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Jenis wisata<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900" value={form.type} onChange={event => update('type', event.target.value)}>{tourismTypes.map(type => <option key={type}>{type}</option>)}</select></label>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Tanggal kunjungan<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900" type="date" value={form.date} onChange={event => update('date', event.target.value)} required /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Wisatawan lokal<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900" type="number" min="0" step="1" value={form.local} onChange={event => update('local', event.target.value)} required /></label>
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Wisatawan mancanegara<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900" type="number" min="0" step="1" value={form.foreign} onChange={event => update('foreign', event.target.value)} required /></label>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm dark:border-gray-700"><Camera className="h-5 w-5 text-cyan-700 dark:text-cyan-300" /><span>{photo?.name || (existingEvidence ? 'Bukti tersimpan; pilih foto untuk mengganti' : 'Tambah bukti kunjungan (opsional)')}</span><input className="sr-only" type="file" accept="image/*" capture="environment" onChange={event => setPhoto(event.target.files?.[0] || null)} /></label>
              <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Catatan (opsional)<textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900" value={form.notes} onChange={event => update('notes', event.target.value)} /></label>
              {message && <p role="status" className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900 dark:bg-cyan-950 dark:text-cyan-100">{message}</p>}
              <button disabled={loading || !location} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-700 p-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" /> {loading ? 'Mengirim...' : editId ? 'Kirim ulang laporan' : 'Kirim laporan'}</button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TourismDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<TourismReport[]>([]);
  const now = new Date();
  const [periodType, setPeriodType] = useState<'month' | 'year'>('month');
  const [period, setPeriod] = useState(now.toISOString().slice(0, 7));
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [tourismType, setTourismType] = useState('');
  const [siteSearch, setSiteSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const loadReports = async () => {
    setLoading(true);
    setLoadError('');
    if (!period) {
      setReports([]);
      setLoading(false);
      return;
    }
    const [year, monthNumber] = periodType === 'month' ? period.split('-').map(Number) : [Number(period), 1];
    const startDate = periodType === 'month' ? `${period}-01` : `${period}-01-01`;
    const endDate = periodType === 'month'
      ? new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10)
      : `${year + 1}-01-01`;
    let from = 0;
    const allReports: TourismReport[] = [];
    while (true) {
      let query = supabase.from('tourism_reports').select('*, officer:users(name, email)').gte('visit_date', startDate).lt('visit_date', endDate).order('visit_date', { ascending: false }).range(from, from + 999);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) {
        console.error('Gagal memuat laporan wisata:', error);
        setLoadError(error.message);
        break;
      }
      allReports.push(...((data || []) as TourismReport[]));
      if ((data || []).length < 1000) break;
      from += 1000;
    }
    setReports(allReports);
    setLoading(false);
  };
  useEffect(() => { loadReports(); }, [periodType, period, status]);
  const review = async (id: string, nextStatus: TourismReportStatus) => {
    const rejectionReason = nextStatus === 'REJECTED' ? window.prompt('Alasan laporan perlu diperbaiki:') : null;
    if (nextStatus === 'REJECTED' && !rejectionReason?.trim()) return;
    const result = await supabase.from('tourism_reports').update({ status: nextStatus, rejection_reason: rejectionReason, reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (!result.error) await loadReports();
  };
  const downloadSpreadsheet = () => {
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['Nomor laporan', 'Tanggal kunjungan', 'Waktu GPS', 'Kecamatan GPS', 'Objek wisata', 'Jenis wisata', 'Wisatawan lokal', 'Wisatawan mancanegara', 'Total wisatawan', 'Status', 'Petugas', 'Catatan', 'Latitude', 'Longitude'];
    const rows = visibleReports.map(report => [
      report.report_number,
      report.visit_date,
      report.location_captured_at || '',
      report.district || '',
      report.tourism_site,
      report.tourism_type,
      report.local_visitors,
      report.foreign_visitors,
      report.total_visitors,
      tourismStatusLabels[report.status],
      report.officer?.name || report.officer?.email || '',
      report.notes || '',
      report.latitude ?? '',
      report.longitude ?? '',
    ]);
    const csv = `\uFEFF${[headers, ...rows].map(row => row.map(escapeCsv).join(';')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digiwisata-${periodType}-${period}${district ? `-${district.toLowerCase().replace(/\s+/g, '-')}` : ''}${status ? `-${status.toLowerCase()}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const openEvidence = async (path: string) => {
    const { data } = await supabase.storage.from('tourism-evidence').createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };
  const visibleReports = reports.filter(report =>
    (!district || report.district === district) &&
    (!tourismType || report.tourism_type === tourismType) &&
    (!siteSearch || report.tourism_site.toLowerCase().includes(siteSearch.toLowerCase()))
  );
  const totalVisitors = visibleReports.reduce((sum, report) => sum + Number(report.total_visitors || 0), 0);
  const localVisitors = visibleReports.reduce((sum, report) => sum + Number(report.local_visitors || 0), 0);
  const foreignVisitors = visibleReports.reduce((sum, report) => sum + Number(report.foreign_visitors || 0), 0);
  const pending = visibleReports.filter(report => report.status === 'SUBMITTED').length;
  const districts = [...new Set(reports.map(report => report.district).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, 'id'));
  const districtSummary = Object.entries(visibleReports.reduce<Record<string, { count: number; local: number; foreign: number }>>((groups, report) => {
    const name = report.district || 'Zona belum terbaca';
    groups[name] ||= { count: 0, local: 0, foreign: 0 };
    groups[name].count += 1;
    groups[name].local += Number(report.local_visitors || 0);
    groups[name].foreign += Number(report.foreign_visitors || 0);
    return groups;
  }, {})).sort(([left], [right]) => left.localeCompare(right, 'id'));
  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-24 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate('/')} className="mb-5 inline-flex items-center gap-2 text-sm text-cyan-800 dark:text-cyan-200"><ArrowRight className="h-4 w-4 rotate-180" /> Kembali</button>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">DigiWisata</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Rekap laporan kunjungan</h1></div>
          <button type="button" onClick={downloadSpreadsheet} disabled={loading || visibleReports.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-50"><Download className="h-4 w-4" /> Unduh CSV</button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-300 p-1 dark:border-gray-700" role="group" aria-label="Periode laporan">
            <button onClick={() => { setPeriodType('month'); setPeriod(now.toISOString().slice(0, 7)); }} className={`rounded-md px-3 py-2 text-sm ${periodType === 'month' ? 'bg-cyan-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Bulanan</button>
            <button onClick={() => { setPeriodType('year'); setPeriod(String(now.getFullYear())); }} className={`rounded-md px-3 py-2 text-sm ${periodType === 'year' ? 'bg-cyan-700 text-white' : 'text-slate-600 dark:text-slate-300'}`}>Tahunan</button>
          </div>
          <label className="sr-only" htmlFor="tourism-period">Periode laporan</label>
          <input id="tourism-period" className="rounded-lg border border-slate-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-900" type={periodType === 'month' ? 'month' : 'number'} min={periodType === 'year' ? '2000' : undefined} max={periodType === 'year' ? String(now.getFullYear() + 1) : undefined} value={period} onChange={event => setPeriod(event.target.value)} />
          <select aria-label="Filter status" className="rounded-lg border border-slate-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-900" value={status} onChange={event => setStatus(event.target.value)}><option value="">Semua status</option><option value="SUBMITTED">Menunggu</option><option value="VERIFIED">Terverifikasi</option><option value="REJECTED">Perlu diperbaiki</option></select>
          <select aria-label="Filter kecamatan GPS" className="rounded-lg border border-slate-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-900" value={district} onChange={event => setDistrict(event.target.value)}><option value="">Semua kecamatan</option>{districts.map(name => <option key={name} value={name}>{name}</option>)}</select>
          <select aria-label="Filter jenis wisata" className="rounded-lg border border-slate-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-900" value={tourismType} onChange={event => setTourismType(event.target.value)}><option value="">Semua jenis wisata</option>{tourismTypes.map(type => <option key={type}>{type}</option>)}</select>
          <input aria-label="Cari objek wisata" className="min-w-48 flex-1 rounded-lg border border-slate-300 bg-white p-2 dark:border-gray-700 dark:bg-gray-900" placeholder="Cari objek wisata" value={siteSearch} onChange={event => setSiteSearch(event.target.value)} />
        </div>
        {loadError && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">Gagal memuat laporan: {loadError}</p>}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Jumlah laporan', visibleReports.length.toLocaleString('id-ID')],
            ['Total wisatawan', totalVisitors.toLocaleString('id-ID')],
            ['Wisatawan lokal', localVisitors.toLocaleString('id-ID')],
            ['Mancanegara', foreignVisitors.toLocaleString('id-ID')],
            ['Menunggu verifikasi', pending.toLocaleString('id-ID')],
          ].map(([label, value]) => <Card key={label} className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></CardContent></Card>)}
        </section>

        <Card className="mb-5 border-0 shadow-sm"><CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Ringkasan per kecamatan GPS</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Kecamatan</th><th className="p-3">Laporan</th><th className="p-3">Lokal</th><th className="p-3">Mancanegara</th><th className="p-3">Total</th></tr></thead><tbody>
            {districtSummary.map(([name, totals]) => <tr key={name} className="border-b last:border-0"><td className="p-3">{name}</td><td className="p-3">{totals.count}</td><td className="p-3">{totals.local.toLocaleString('id-ID')}</td><td className="p-3">{totals.foreign.toLocaleString('id-ID')}</td><td className="p-3 font-semibold">{(totals.local + totals.foreign).toLocaleString('id-ID')}</td></tr>)}
            {visibleReports.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-slate-500">Tidak ada data pada filter ini.</td></tr>}
          </tbody></table></div>
        </CardContent></Card>

        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Rincian laporan</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="p-3">Tanggal</th><th className="p-3">Zona / objek</th><th className="p-3">Jenis</th><th className="p-3">Lokal</th><th className="p-3">Mancanegara</th><th className="p-3">Petugas</th><th className="p-3">Status</th><th className="p-3">Tindakan</th></tr></thead><tbody>
            {loading ? <tr><td className="p-8 text-center text-slate-500" colSpan={8}>Memuat laporan...</td></tr> : visibleReports.length === 0 ? <tr><td className="p-8 text-center text-slate-500" colSpan={8}>Tidak ada laporan pada periode dan filter tersebut.</td></tr> : visibleReports.map(report => <tr key={report.id} className="border-b align-top last:border-0"><td className="whitespace-nowrap p-3">{report.visit_date}</td><td className="p-3"><p className="font-semibold">{report.tourism_site}</p><p className="mt-1 text-xs text-slate-500">{report.district ? `Kec. ${report.district}` : 'Zona belum terbaca'}</p>{report.notes && <p className="mt-1 max-w-56 text-xs text-slate-500">{report.notes}</p>}</td><td className="p-3">{report.tourism_type}</td><td className="p-3">{report.local_visitors.toLocaleString('id-ID')}</td><td className="p-3">{report.foreign_visitors.toLocaleString('id-ID')}</td><td className="p-3">{report.officer?.name || report.officer?.email || '-'}</td><td className="p-3">{tourismStatusLabels[report.status]}{report.rejection_reason && <p className="mt-1 max-w-48 text-xs text-red-700">{report.rejection_reason}</p>}</td><td className="p-3"><div className="flex gap-2">{report.evidence_path && <button title="Buka bukti foto" onClick={() => openEvidence(report.evidence_path!)} className="rounded-md p-2 hover:bg-cyan-50"><Eye className="h-4 w-4" /></button>}{report.status === 'SUBMITTED' && <><button title="Verifikasi" onClick={() => review(report.id, 'VERIFIED')} className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /></button><button title="Minta perbaikan" onClick={() => review(report.id, 'REJECTED')} className="rounded-md p-2 text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></button></>}</div></td></tr>)}
          </tbody></table></div>
        </CardContent></Card>
        <p className="mt-4 text-xs text-slate-500">Zona laporan berasal dari GPS perangkat dan pencarian alamat OpenStreetMap Nominatim. © OpenStreetMap contributors.</p>
      </div>
    </main>
  );
}
