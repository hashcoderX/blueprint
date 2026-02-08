'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
const Header = dynamic(() => import('./Header'), { ssr: false });

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer sidebar */}
      <Sidebar mobile className={`transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <Header onOpenSidebar={() => setSidebarOpen(true)} />
      <main className="pt-16 p-4 sm:p-6 lg:ml-64">
        {children}
      </main>
    </div>
  );
}