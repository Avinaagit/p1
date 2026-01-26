import { Navigation } from '../_components/Navigation';
import { TaskList } from '../_components/TaskList';

export const metadata = {
  title: 'Tasks - Employee Pulse',
};

export default function TasksPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-2">Manage your assigned survey and engagement tasks</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
              New Task
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <TaskList />
          </div>
        </div>
      </div>
    </>
  );
}
