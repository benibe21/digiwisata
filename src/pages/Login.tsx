import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { MapPinned } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-full">
              <MapPinned className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-extrabold">
                <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent dark:from-sky-400 dark:to-cyan-300">DIGI</span><span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent dark:from-teal-300 dark:to-emerald-400">WISATA</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Sistem Pencatatan Wisata Digital Disporapar Kabupaten Serang
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
