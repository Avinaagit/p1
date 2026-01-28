import { Navigation } from '../_components/Navigation';
import { EngagementDashboard } from '../_components/EngagementDashboard';
import { TaskList } from '../_components/TaskList';
import { SurveyList } from '../_components/SurveyList';
import { HRQuickInsights } from '../_components/HRQuickInsights';
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
  const isHRRole = userRole === 'HR' || userRole === 'CONSULTANT';
  const isHRAdmin = isHRRole || userRole === 'ADMIN';

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        {/* Hero Header */}
        <div className="bg-transparent text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {isHRAdmin ? '👔 HR Admin Dashboard' : '👋 Welcome Back!'}
                </h1>
                <p className="text-white text-lg">
                  {isHRAdmin 
                    ? 'Manage surveys, track engagement, and analyze employee feedback'
                    : 'Your Employee Engagement Hub'}
                </p>
              </div>
              {isHRRole && (
                <a
                  href="/employees/import"
                  className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-full hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-bold"
                >
                  📥 Import Employees
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8 -mt-8">
          {/* HR Admin Section */}
          {isHRAdmin && (
            <div className="mb-8">
              <HRQuickInsights />
            </div>
          )}

          {isHRAdmin && (
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-gray-900">
                <h3 className="text-lg font-semibold mb-3">Recommended actions</h3>
                <ul className="list-disc list-inside text-sm space-y-2">
                  <li>Run 1:1 check‑ins for high‑risk respondents.</li>
                  <li>Schedule stress management workshop this month.</li>
                  <li>Review workload balance across teams.</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-gray-900">
                <h3 className="text-lg font-semibold mb-3">Risk alert</h3>
                <ul className="text-sm space-y-2">
                  <li>Burnout: 3 high‑risk responses flagged.</li>
                  <li>Disengagement: 5 responses below threshold.</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-gray-900">
                <h3 className="text-lg font-semibold mb-3">Team engagement heatmap</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-6 rounded ${
                        idx % 4 === 0
                          ? 'bg-green-300'
                          : idx % 4 === 1
                          ? 'bg-yellow-300'
                          : idx % 4 === 2
                          ? 'bg-orange-300'
                          : 'bg-red-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-600">Sample heatmap by team/department.</p>
              </div>
            </div>
          )}

          {isHRAdmin && (
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-gray-900">
                <h3 className="text-lg font-semibold mb-3">Action plan tracking</h3>
                <ul className="text-sm space-y-2">
                  <li>Stress workshop — In progress</li>
                  <li>Workload review — Scheduled</li>
                  <li>EAP rollout — Pending</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-gray-900">
                <h3 className="text-lg font-semibold mb-3">Manager follow-up log</h3>
                <ul className="text-sm space-y-2">
                  <li>Sales: 1:1 follow‑ups completed (3)</li>
                  <li>Engineering: pending check‑ins (2)</li>
                  <li>Support: next review 02/15</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-gray-900">
                <h3 className="text-lg font-semibold mb-3">Employee feedback acknowledgement</h3>
                <ul className="text-sm space-y-2">
                  <li>Reply sent to 12 respondents</li>
                  <li>5 acknowledgements pending</li>
                  <li>Next update cycle: weekly</li>
                </ul>
              </div>
            </div>
          )}

          {/* Engagement Metrics */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isHRAdmin ? '📊 Engagement Analytics' : '📈 Your Engagement Overview'}
              </h2>
            </div>
            <EngagementDashboard />
          </section>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tasks or Admin Tools */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                ✅ {isHRAdmin ? 'Survey Tasks' : 'My Tasks'}
              </h2>
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <TaskList />
              </div>
            </div>

            {/* Surveys */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                📊 {isHRAdmin ? 'Survey Management' : 'Active Surveys'}
              </h2>
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <SurveyList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
