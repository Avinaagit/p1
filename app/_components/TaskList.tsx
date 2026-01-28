'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  assignee: { firstName: string; lastName: string };
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/v1/tasks');
      const data = await res.json();

      if (data.success) {
        const excludedKeywords = [
          'Q1 2026 Employee Engagement Survey',
          'Q1 engagement survey',
          'engagement survey results',
        ];
        let tasks = (data.data || []).filter((task: Task) => {
          const title = task.title?.toLowerCase() || '';
          return !excludedKeywords.some((keyword) => title.includes(keyword.toLowerCase()));
        });
        if (filter !== 'all') {
          tasks = tasks.filter((t: Task) =>
            filter === 'pending' ? t.status !== 'COMPLETED' : t.status === 'COMPLETED'
          );
        }
        setTasks(tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.MEDIUM;
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="p-4 text-gray-500">No tasks</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-gray-200 rounded-lg flex justify-between items-start hover:shadow transition"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 items-center ml-4">
                <span className={`px-2 py-1 text-xs rounded font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
