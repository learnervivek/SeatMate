import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-full bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
