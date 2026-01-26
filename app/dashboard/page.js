import { Navigation } from '../_components/Navigation';
import { EngagementDashboard } from '../_components/EngagementDashboard';
import { TaskList } from '../_components/TaskList';
import { SurveyList } from '../_components/SurveyList';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jose';

export const metadata = {
  title: 'Dashboard - Employee Pulse',
};

async function getUserRole() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return 'employee';
    }

    // Decode JWT to get user role
    const parts = token.split('.');
    if (parts.length !== 3) return 'employee';
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.role || 'employee';
  } catch {
    return 'employee';
  }
}

export default async function DashboardPage() {
  const userRole = await getUserRole();
  const isHRAdmin = userRole === 'CONSULTANT' || userRole === 'ADMIN';

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isHRAdmin ? 'HR Admin Dashboard' : 'Employee Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isHRAdmin 
                ? 'Manage surveys, track engagement, and analyze employee feedback'
                : 'Welcome to your Employee Engagement Hub'}
            </p>
          </div>

          {/* HR Admin Section */}
          {isHRAdmin && (
            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900">HR Admin Console</h2>
              <p className="text-blue-800 mt-2">You have administrative access to survey management and analytics tools</p>
            </div>
          )}

          {/* Engagement Metrics */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isHRAdmin ? 'Engagement Analytics' : 'Engagement Overview'}
            </h2>
            <EngagementDashboard />
          </section>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tasks or Admin Tools */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isHRAdmin ? 'Survey Tasks' : 'My Tasks'}
              </h2>
              <div className="bg-white rounded-lg shadow p-4">
                <TaskList />
              </div>
            </div>

            {/* Surveys */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {isHRAdmin ? 'Survey Management' : 'Active Surveys'}
              </h2>
              <div className="bg-white rounded-lg shadow p-4">
                <SurveyList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
