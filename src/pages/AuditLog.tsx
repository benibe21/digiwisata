import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  reason: string | null;
  created_at: string;
  users?: { name: string }[] | null;
}

export function AuditLog() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuditLog = async () => {
      const { data, error: queryError } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, reason, created_at, users(name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryError) setError(queryError.message);
      else setEntries((data || []) as AuditEntry[]);
      setLoading(false);
    };

    fetchAuditLog();
  }, []);

  return (
    <div className="min-h-screen pb-32 p-4">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1><p className="text-sm text-gray-500">Jejak perubahan dan aktivitas penting sistem</p></div>
      </div>

      <Card>
        <CardHeader><div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary-600" /><h2 className="font-semibold">Aktivitas Terbaru</h2></div></CardHeader>
        <CardContent>
          {loading && <p className="py-6 text-center text-sm text-gray-500">Memuat aktivitas...</p>}
          {!loading && error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">Gagal memuat audit log: {error}</p>}
          {!loading && !error && entries.length === 0 && <div className="py-8 text-center text-sm text-gray-500">Belum ada aktivitas yang tercatat.</div>}
          {!loading && !error && entries.length > 0 && <div className="divide-y divide-gray-100 dark:divide-gray-700">{entries.map(entry => <div key={entry.id} className="py-4 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-gray-900 dark:text-gray-100">{entry.action}</p><p className="mt-1 text-sm text-gray-500">{entry.entity_type}{entry.users?.[0]?.name ? ` · ${entry.users[0].name}` : ''}</p>{entry.reason && <p className="mt-1 text-xs text-gray-500">Alasan: {entry.reason}</p>}</div><span className="flex shrink-0 items-center gap-1 text-xs text-gray-400"><Clock3 className="h-3.5 w-3.5" />{new Date(entry.created_at).toLocaleString('id-ID')}</span></div></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}