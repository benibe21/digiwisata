import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, FilePlus2, Home, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const navItems: NavItem[] = [
    { path: '/', icon: Home, label: 'Beranda' },
    user?.role === 'PETUGAS'
      ? { path: '/wisata/input', icon: FilePlus2, label: 'Input laporan' }
      : { path: '/wisata/laporan', icon: ClipboardList, label: 'Laporan masuk' },
    { path: '/settings', icon: Settings, label: 'Pengaturan' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'scale-110')} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
