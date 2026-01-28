'use client';

import { useState } from 'react';

export default function EmployeeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Файл сонгоно уу');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/employees/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Импорт хийхэд алдаа гарлаа');
      }

      setResult(data.results);
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create sample Excel template
    const template = `Company,Газрын нэр,Хэлтэс,И-мэйл,Нэр,Овог
  Employee Pulse LLC,Улаанбаатар,IT,john.doe@example.com,John,Doe
  Employee Pulse LLC,Дархан,HR,jane.smith@example.com,Jane,Smith`;

    const blob = new Blob([`\ufeff${template}`], { type: 'text/csv; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          📥 Ажилтны мэдээлэл импортлох
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            ← Буцах
          </button>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            📄 Загвар татах
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Зааварчилгаа:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Excel (.xlsx) эсвэл CSV (.csv) файл ашиглана</li>
          <li>Баганы нэр: <code className="bg-blue-100 px-1 rounded">Company, Газрын нэр, Хэлтэс, И-мэйл, Нэр, Овог</code></li>
          <li>Email, FirstName, LastName багана заавал шаардлагатай</li>
          <li>Нууц үг автоматаар <code className="bg-blue-100 px-1 rounded">Welcome2024!</code> болно</li>
          <li>Бүх ажилтан EMPLOYEE эрхтэйгээр үүснэ</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excel файл сонгох
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Сонгосон файл: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition ${
            !file || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? '⏳ Импортлож байна...' : '📤 Импортлох'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">❌ Алдаа:</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm">Нийт</p>
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-600 text-sm">Амжилттай</p>
              <p className="text-2xl font-bold text-green-700">{result.success}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm">Амжилтгүй</p>
              <p className="text-2xl font-bold text-red-700">{result.failed}</p>
            </div>
          </div>

          {result.created && result.created.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-semibold text-green-900 mb-2">
                ✅ Үүссэн ажилтнууд ({result.created.length}):
              </p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                  {result.created.map((email: string, idx: number) => (
                    <li key={idx}>{email}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-semibold text-red-900 mb-2">
                ❌ Алдаанууд ({result.errors.length}):
              </p>
              <div className="max-h-60 overflow-y-auto">
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {result.errors.map((error: string, idx: number) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
