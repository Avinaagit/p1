import { AccountManagement } from '../_components/AccountManagement';
import { Navigation } from '../_components/Navigation';
import { RoleGuard } from '../_components/RoleGuard';

export const metadata = {
  title: 'Account Management - Employee Pulse',
};

export default function AccountManagementPage() {
  return (
    <>
      <RoleGuard blockedRoles={["EMPLOYEE", "HR", "CONSULTANT", "ADMIN"]} />
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Account Management</h1>
            <p className="text-white mt-2">System Admin хэрэглэгчийн нууц үгийг солих хэсэг.</p>
          </div>
          <AccountManagement />
        </div>
      </div>
    </>
  );
}
