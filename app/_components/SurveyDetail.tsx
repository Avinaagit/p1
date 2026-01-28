'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

interface CategoryScore {
  category: string;
  categoryMn: string;
  averageScore: number;
  level: string;
  levelMn: string;
  icon: string;
  interpretation: string;
  color: string;
}

interface SurveyInterpretation {
  overallScore: number;
  overallIndex: number;
  overallLevel: string;
  overallInterpretation: string;
  categories: CategoryScore[];
  combinedDiagnosis?: {
    stressLevel: string;
    cultureLevel: string;
    diagnosis: string;
    diagnosisMn: string;
    severity: 'critical' | 'high' | 'moderate' | 'healthy';
    icon: string;
    recommendation: string;
  };
  recommendationLevel?: string;
}

interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options?: string | null;
  isRequired: boolean;
  displayOrder: number;
}

interface Survey {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  questions: SurveyQuestion[];
}

export function SurveyDetail({ surveyId }: { surveyId: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [interpretation, setInterpretation] = useState<SurveyInterpretation | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSurvey = async () => {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const res = await fetch(`/api/v1/surveys/${surveyId}`);
        const data = await res.json();

        if (!mounted) return;

        if (data.success) {
          setSurvey(data.data as Survey);
        } else {
          setError(data.error || 'Survey could not be loaded');
        }
      } catch (err) {
        setError('Network error while loading survey');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSurvey();

    return () => {
      mounted = false;
    };
  }, [surveyId]);

  const questions = useMemo(() => {
    if (!survey) return [] as SurveyQuestion[];
    return [...survey.questions].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [survey]);

  const likertLabels = [
    '1 – Огт тохирохгүй',
    '2 – Бага зэрэг тохирохгүй',
    '3 – Дунд зэрэг',
    '4 – Тохирно',
    '5 – Маш сайн тохирно',
  ];

  const parseOptions = (optionString?: string | null) => {
    if (!optionString) return [1, 2, 3, 4, 5];

    try {
      const parsed = JSON.parse(optionString);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [1, 2, 3, 4, 5];
    } catch (err) {
      return [1, 2, 3, 4, 5];
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!survey) return;

    const missingRequired = questions.filter(
      (q) => q.isRequired && (answers[q.id] === undefined || answers[q.id] === '')
    );

    if (missingRequired.length > 0) {
      setError('Бүх шаардлагатай асуултад хариулна уу.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        responses: questions.map((q) => ({
          questionId: q.id,
          answer: answers[q.id] ?? '',
        })),
      };

      const res = await fetch(`/api/v1/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Саналаа амжилттай илгээлээ. Баярлалаа!');
        if (data.data?.interpretation) {
          setInterpretation(data.data.interpretation);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error || 'Саналыг хадгалах боломжгүй байна.');
      }
    } catch (err) {
      setError('Сүлжээний алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-700">Судалгаа ачааллаж байна...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!survey) {
    return <div className="p-6 text-gray-600">Судалгаа олдсонгүй.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{survey.title}</h1>
        {survey.description && (
          <p className="text-gray-700 mt-2">{survey.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Нээлттэй, идэвхтэй
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-800 rounded-full">
            1–3 минут зарцуулна
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-700 rounded-full">
            Хариултын шкал: 1–5 (Огт тохирохгүй → Маш сайн тохирно)
          </span>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          {success}
        </div>
      )}

      {interpretation && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            📊 Таны судалгааны дүн шинжилгээ
          </h2>

          {/* Overall Score */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-900">Ерөнхий оноо:</span>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Raw Score</p>
                  <p className="text-lg font-semibold text-gray-700">{interpretation.overallScore.toFixed(2)}</p>
                </div>
                <div className="text-right bg-blue-50 px-3 py-1 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Weighted Index</p>
                  <p className="text-2xl font-bold text-blue-700">{interpretation.overallIndex.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                interpretation.overallIndex >= 4.2 ? 'bg-green-100 text-green-800' :
                interpretation.overallIndex >= 3.4 ? 'bg-yellow-100 text-yellow-800' :
                interpretation.overallIndex >= 2.6 ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {interpretation.overallLevel}
              </span>
              {interpretation.recommendationLevel && interpretation.recommendationLevel !== 'none' && (
                <span className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  interpretation.recommendationLevel === 'immediate-action' ? 'bg-red-100 text-red-800 border border-red-300' :
                  interpretation.recommendationLevel === 'action-needed' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                  'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}>
                  {interpretation.recommendationLevel === 'immediate-action' && '⚠️ Яаралтай арга хэмжээ авах'}
                  {interpretation.recommendationLevel === 'action-needed' && '⚡ Арга хэмжээ авах'}
                  {interpretation.recommendationLevel === 'monitor' && '👁️ Хянаж байх'}
                </span>
              )}
            </div>
            <p className="text-gray-700 mt-2">{interpretation.overallInterpretation}</p>
          </div>

          {/* Combined Diagnosis */}
          {interpretation.combinedDiagnosis && (
            <div className={`mb-6 rounded-lg p-5 shadow-sm border-2 ${
              interpretation.combinedDiagnosis.severity === 'critical' ? 'bg-red-50 border-red-300' :
              interpretation.combinedDiagnosis.severity === 'high' ? 'bg-orange-50 border-orange-300' :
              interpretation.combinedDiagnosis.severity === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
              'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{interpretation.combinedDiagnosis.icon}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    🧠 Combined оношлол: {interpretation.combinedDiagnosis.diagnosisMn}
                  </h3>
                  <p className="text-sm text-gray-600 italic mb-2">
                    {interpretation.combinedDiagnosis.diagnosis}
                  </p>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                interpretation.combinedDiagnosis.severity === 'critical' ? 'bg-red-100' :
                interpretation.combinedDiagnosis.severity === 'high' ? 'bg-orange-100' :
                interpretation.combinedDiagnosis.severity === 'moderate' ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  💡 {interpretation.combinedDiagnosis.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Категори тус бүрийн дүн:</h3>
            {interpretation.categories.map((cat, idx) => (
              <div key={idx} className="rounded-lg bg-white p-4 shadow-sm border-l-4" style={{ borderLeftColor: getCategoryColor(cat.color) }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{cat.icon}</span>
                      <h4 className="font-semibold text-gray-900">{cat.categoryMn}</h4>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-600">Дундаж оноо:</span>
                      <span className="text-lg font-bold text-gray-900">{cat.averageScore.toFixed(2)}</span>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        cat.color === 'green' ? 'bg-green-100 text-green-800' :
                        cat.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        cat.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {cat.levelMn}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{cat.interpretation}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              💡 <strong>Анхаар:</strong> Энэхүү дүн шинжилгээ нь танд зориулсан ерөнхий мэдээлэл бөгөөд эмнэлгийн оношийг орлохгүй. 
              Хэрэв та сэтгэл санааны асуудалтай тулгарч байвал мэргэжлийн сэтгэл зүйчтэй зөвлөлдөхийг зөвлөж байна.
            </p>
          </div>
        </div>
      )}

      {error && !success && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question, index) => {
          const options = parseOptions(question.options);

          return (
            <div key={question.id} className="border-b border-gray-100 pb-5 last:border-none">
              <p className="font-medium text-gray-900 mb-3">
                {index + 1}. {question.questionText}
                {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {options.map((opt: number | string) => (
                  <label
                    key={`${question.id}-${opt}`}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition ${
                      answers[question.id] === String(opt)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-semibold">{opt}</span>
                    <input
                      type="radio"
                      name={question.id}
                      value={opt}
                      checked={answers[question.id] === String(opt)}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">{likertLabels[optIndexFromAnswer(answers[question.id])] ?? '1: Огт тохирохгүй · 5: Маш сайн тохирно'}</p>
            </div>
          );
        })}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Илгээж байна…' : 'Судалгааг илгээх'}
          </button>
          <span className="text-sm text-gray-600">Таны санал байгууллагын wellbeing-д чухал хувь нэмэр болно.</span>
        </div>
      </form>
    </div>
  );
}

function optIndexFromAnswer(answer?: string) {
  if (!answer) return undefined;
  const num = Number(answer);
  if (Number.isNaN(num)) return undefined;
  if (num < 1 || num > 5) return undefined;
  return num - 1;
}

function getCategoryColor(color: string): string {
  const colorMap: Record<string, string> = {
    green: '#10b981',
    yellow: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
  };
  return colorMap[color] || '#6b7280';
}
