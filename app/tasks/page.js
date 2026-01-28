import { Navigation } from '../_components/Navigation';
import { TaskList } from '../_components/TaskList';

export const metadata = {
  title: 'Tasks - Employee Pulse',
};

export default function TasksPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Tasks</h1>
              <p className="text-white mt-2">Manage your assigned survey and engagement tasks</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
              New Task
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <TaskList />
          </div>

          <div className="mt-6 bg-white rounded-lg shadow p-6 text-gray-900">
            <h2 className="text-lg font-semibold mb-3">Жишээ судалгаанд суурилсан ажил (Task)</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Стресс өндөртэй бүлэгт 1:1 check‑in хийх хуваарь гаргах.</li>
              <li>Менежерүүдэд psychological safety сургалт зохион байгуулах.</li>
              <li>Wellbeing pulse судалгааг 2–4 долоо хоног тутам давтах.</li>
              <li>Ачаалал тэнцвэржүүлэлтийн төлөвлөгөө боловсруулах.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
