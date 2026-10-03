import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  FileText,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

export function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);
  const accountTitle = user?.role === 'PETUGAS'
    ? 'Petugas Pendataan Wisata'
    : 'Admin DigiWisata Disporapar Kabupaten Serang';
  const accountDescription = user?.role === 'PETUGAS'
    ? 'Petugas lapangan pelaporan wisata'
    : 'Penerima dan verifikator laporan petugas';

  const handleSignOut = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut();
      navigate('/login');
    }
  };

  const menuItems = [
    {
      icon: FileText,
      label: 'Laporan wisata',
      description: 'Buka input atau tinjau laporan kunjungan',
      onClick: () => navigate(user?.role === 'PETUGAS' ? '/wisata/input' : '/wisata/laporan'),
      role: ['ADMIN', 'PETUGAS'],
    },
    {
      icon: Shield,
      label: 'Audit Log',
      description: 'Lihat aktivitas sistem',
      onClick: () => navigate('/audit'),
      role: ['ADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.role.includes(user?.role || 'PETUGAS')
  );

  return (
    <div className="pb-20 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Pengaturan
      </h1>

      {/* User Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {accountTitle}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {accountDescription}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tampilan
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button
              onClick={() => setTheme('light')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                theme === 'light'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="flex-1 text-left text-gray-900 dark:text-gray-100">Light Mode</span>
              {theme === 'light' && (
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Moon className="w-5 h-5 text-blue-500" />
              <span className="flex-1 text-left text-gray-900 dark:text-gray-100">Dark Mode</span>
              {theme === 'dark' && (
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                theme === 'system'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Monitor className="w-5 h-5 text-gray-500" />
              <span className="flex-1 text-left text-gray-900 dark:text-gray-100">System Mode</span>
              {theme === 'system' && (
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      {filteredMenuItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Menu
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Button
        onClick={handleSignOut}
        variant="danger"
        className="w-full"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>

      <Card className="mt-6">
        <button
          onClick={() => setAboutOpen((open) => !open)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Tentang Aplikasi</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Informasi aplikasi pelaporan wisata</p>
          </div>
          <span className="text-primary-600 dark:text-primary-400">{aboutOpen ? '−' : '+'}</span>
        </button>
        {aboutOpen && (
          <CardContent className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong className="text-gray-900 dark:text-gray-100">Nama aplikasi:</strong> DigiWisata</p>
              <p><strong className="text-gray-900 dark:text-gray-100">Dikembangkan oleh:</strong> Tim DigiWisata</p>
              <p><strong className="text-gray-900 dark:text-gray-100">Fungsi:</strong> Pelaporan dan pemantauan data wisata</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>DigiWisata · Pelaporan Data Wisata</p>
        <p className="mt-1">Versi 1.0.0</p>
      </div>
    </div>
  );
}
