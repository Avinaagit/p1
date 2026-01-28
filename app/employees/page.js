import { Navigation } from '../_components/Navigation';
import { EmployeeList } from '../_components/EmployeeList';
import { RoleGuard } from '../_components/RoleGuard';
import { EmployeesHeaderActions } from '../_components/EmployeesHeaderActions';

export const metadata = {
  title: 'Employees - Employee Pulse',
};

export default function EmployeesPage() {
  return (
    <>
      <RoleGuard blockedRoles={["EMPLOYEE"]} />
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Ажилтны жагсаалт</h1>
              <p className="text-white mt-2">Ажилтны жагсаалт</p>
            </div>
            <EmployeesHeaderActions />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <EmployeeList />
          </div>
        </div>
      </div>
    </>
  );
}
