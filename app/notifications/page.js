import NotificationCenter from '@/app/_components/NotificationCenter';
import { Navigation } from '@/app/_components/Navigation';

export const metadata = {
  title: 'Мэдэгдэл - Employee Pulse',
};

export default function NotificationsPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <NotificationCenter />
        </div>
      </div>
    </>
  );
}
