'use client';

import { useEffect, useState } from 'react';

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

interface ResponseInterpretation {
  overallScore: number;
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
}

interface QuestionResponse {
  id: string;
  answer: string;
  question: {
    id: string;
    questionText: string;
    questionType: string;
    displayOrder: number;
  };
}

interface SurveyQuestion {
  id: string;
  questionText: string;
  questionType: string;
  displayOrder: number;
}

interface SurveyResponse {
  id: string;
  submittedAt: string;
  respondent?: {
    id: string;
    email: string;
    firstName: string;
    department: string;
  } | null;
  anonymousId?: string;
  sentimentScore?: number;
  questionResponses: QuestionResponse[];
  interpretation?: ResponseInterpretation;
  survey?: {
    questions: SurveyQuestion[];
  };
}

export function SurveyResponsesAnalytics({ surveyId }: { surveyId: string }) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchResponses();
    }
  }, [surveyId]);

  const fetchResponses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/surveys/${surveyId}/responses`);
      const data = await res.json();

      if (data.success) {
        setResponses(data.data || []);
      } else {
        setError(data.error || 'Failed to load responses');
      }
    } catch (err) {
      setError('Network error while loading responses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Хариултуудыг ачааллаж байна...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Одоогоор хариулт байхгүй байна.</p>
      </div>
    );
  }

  const surveyQuestions = responses[0]?.survey?.questions || [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📊 Судалгааны хариултын тойм
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Нийт хариулт</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{responses.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Дундаж оноо</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {calculateAverageScore(responses).toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Эрсдэлтэй хариулт</p>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              {countRiskResponses(responses)}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Өндөр эрсдэлтэй</p>
            <p className="text-2xl font-bold text-red-900 mt-1">
              {countHighRiskResponses(responses)}
            </p>
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Хувь хүний хариултууд ({responses.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {responses.map((response, idx) => {
            const interpretation = computeInterpretation(response);
            const isSelected = selectedResponse === response.id;

            return (
              <div key={response.id} className="p-6 hover:bg-gray-50 transition">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedResponse(isSelected ? null : response.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                      {response.respondent ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {response.respondent.firstName} ({response.respondent.email})
                          </p>
                          <p className="text-xs text-gray-500">{response.respondent.department}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 italic">Anonymous response</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(response.submittedAt).toLocaleString('mn-MN')}
                      </span>
                      {interpretation && (
                        <>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              interpretation.overallScore >= 4.2
                                ? 'bg-green-100 text-green-800'
                                : interpretation.overallScore >= 3.4
                                ? 'bg-yellow-100 text-yellow-800'
                                : interpretation.overallScore >= 2.6
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Оноо: {interpretation.overallScore.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {interpretation.overallLevel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    {isSelected ? 'Хаах' : 'Дэлгэрэнгүй харах'}
                  </button>
                </div>

                {/* Detailed view */}
                {isSelected && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    {interpretation ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Дэлгэрэнгүй дүн шинжилгээ
                        </h3>

                        {/* Overall */}
                        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">Ерөнхий оноо:</span>
                            <span className="text-xl font-bold text-blue-600">
                              {interpretation.overallScore.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {interpretation.overallInterpretation}
                          </p>
                        </div>

                        {/* Combined Diagnosis */}
                        {interpretation.combinedDiagnosis && (
                          <div className={`mb-6 p-4 rounded-lg border-2 ${
                            interpretation.combinedDiagnosis.severity === 'critical' ? 'bg-red-50 border-red-300' :
                            interpretation.combinedDiagnosis.severity === 'high' ? 'bg-orange-50 border-orange-300' :
                            interpretation.combinedDiagnosis.severity === 'moderate' ? 'bg-yellow-50 border-yellow-300' :
                            'bg-green-50 border-green-300'
                          }`}>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xl">{interpretation.combinedDiagnosis.icon}</span>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900">
                                  🧠 Combined оношлол: {interpretation.combinedDiagnosis.diagnosisMn}
                                </h4>
                                <p className="text-xs text-gray-600 italic mt-1">
                                  {interpretation.combinedDiagnosis.diagnosis}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs font-medium text-gray-900 leading-relaxed">
                              💡 {interpretation.combinedDiagnosis.recommendation}
                            </p>
                          </div>
                        )}

                        {/* Categories */}
                        <div className="space-y-3">
                          {interpretation.categories.map((cat, catIdx) => (
                            <div
                              key={catIdx}
                              className="p-4 bg-white rounded-lg border-l-4"
                              style={{ borderLeftColor: getCategoryColor(cat.color) }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-base">{cat.icon}</span>
                                <h4 className="font-semibold text-sm text-gray-900">{cat.categoryMn}</h4>
                                <span className="text-sm font-bold text-gray-900 ml-auto">
                                  {cat.averageScore.toFixed(2)}
                                </span>
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    cat.color === 'green'
                                      ? 'bg-green-100 text-green-800'
                                      : cat.color === 'yellow'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : cat.color === 'orange'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {cat.levelMn}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {cat.interpretation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Дүн шинжилгээ гаргахад хангалттай оноо олдсонгүй.
                      </p>
                    )}

                    {/* Individual Answers */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Бүх асуултын хариултууд:
                      </h4>
                      <div className="space-y-2">
                        {(surveyQuestions.length > 0
                          ? surveyQuestions
                          : response.questionResponses.map((qr) => qr.question)
                        )
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((question) => {
                            const matched = response.questionResponses.find(
                              (qr) => qr.question.id === question.id
                            );
                            return (
                              <div
                                key={question.id}
                                className="p-3 bg-white rounded border border-gray-200 text-xs"
                              >
                                <p className="font-medium text-gray-900 mb-1">
                                  {question.displayOrder}. {question.questionText}
                                </p>
                                <p className="text-gray-700">
                                  Хариулт:{' '}
                                  <span className="font-semibold text-blue-600">
                                    {matched ? parseAnswer(matched.answer) : 'Хариулаагүй'}
                                  </span>
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parseAnswer(answer: string): string {
  try {
    const parsed = JSON.parse(answer);
    if (typeof parsed === 'number' || typeof parsed === 'string') {
      return String(parsed);
    }
    return answer;
  } catch {
    return answer;
  }
}

function computeInterpretation(response: SurveyResponse): ResponseInterpretation | null {
  const answers = response.questionResponses.map((qr) => {
    const numAnswer = parseInt(parseAnswer(qr.answer), 10);
    return isNaN(numAnswer) ? null : numAnswer;
  }).filter((a): a is number => a !== null);

  if (answers.length === 0) return null;

  const overallScore = answers.reduce((sum, a) => sum + a, 0) / answers.length;

  // Simplified category breakdown (5 categories, 12 questions each)
  const categories: CategoryScore[] = [
    { categoryMn: 'Сэтгэл зүйн эрүүл мэнд & стресс', start: 0, end: 11 },
    { categoryMn: 'Байгууллагын сэтгэл зүйн орчин', start: 12, end: 23 },
    { categoryMn: 'Хувь хүний сэтгэл зүйн төлөв', start: 24, end: 35 },
    { categoryMn: 'Зан төлөв & харилцааны хэв маяг', start: 36, end: 47 },
    { categoryMn: 'Ерөнхий wellbeing', start: 48, end: 59 },
  ].map((cat) => {
    const catAnswers = response.questionResponses
      .filter((qr) => qr.question.displayOrder > cat.start && qr.question.displayOrder <= cat.end + 1)
      .map((qr) => parseInt(parseAnswer(qr.answer), 10))
      .filter((a) => !isNaN(a));

    const avgScore =
      catAnswers.length > 0 ? catAnswers.reduce((sum, a) => sum + a, 0) / catAnswers.length : 0;

    const levelInfo = getScoreLevel(avgScore);

    return {
      category: cat.categoryMn,
      categoryMn: cat.categoryMn,
      averageScore: parseFloat(avgScore.toFixed(2)),
      level: levelInfo.level,
      levelMn: levelInfo.levelMn,
      icon: levelInfo.icon,
      interpretation: levelInfo.interpretation,
      color: levelInfo.color,
    };
  });

  const overallLevelInfo = getScoreLevel(overallScore);

  return {
    overallScore: parseFloat(overallScore.toFixed(2)),
    overallLevel: overallLevelInfo.levelMn,
    overallInterpretation: overallLevelInfo.interpretation,
    categories,
    combinedDiagnosis: generateCombinedDiagnosis(categories),
  };
}

function getScoreLevel(score: number): {
  level: string;
  levelMn: string;
  color: string;
  icon: string;
  interpretation: string;
} {
  if (score >= 4.2) {
    return {
      level: 'healthy',
      levelMn: 'Эрүүл, тогтвортой',
      color: 'green',
      icon: '🟢',
      interpretation: 'Сайн байна.',
    };
  } else if (score >= 3.4) {
    return {
      level: 'attention',
      levelMn: 'Анхаарал шаардах',
      color: 'yellow',
      icon: '🟡',
      interpretation: 'Анхаарал шаардлагатай.',
    };
  } else if (score >= 2.6) {
    return {
      level: 'risk',
      levelMn: 'Эрсдэл нэмэгдсэн',
      color: 'orange',
      icon: '🟠',
      interpretation: 'Эрсдэл нэмэгдсэн байна.',
    };
  } else {
    return {
      level: 'high-risk',
      levelMn: 'Өндөр эрсдэл',
      color: 'red',
      icon: '🔴',
      interpretation: 'Өндөр эрсдэл. Дэмжлэг шаардлагатай.',
    };
  }
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

function calculateAverageScore(responses: SurveyResponse[]): number {
  let totalScore = 0;
  let count = 0;

  responses.forEach((resp) => {
    resp.questionResponses.forEach((qr) => {
      const num = parseInt(parseAnswer(qr.answer), 10);
      if (!isNaN(num)) {
        totalScore += num;
        count++;
      }
    });
  });

  return count > 0 ? totalScore / count : 0;
}

function countRiskResponses(responses: SurveyResponse[]): number {
  return responses.filter((resp) => {
    const interpretation = computeInterpretation(resp);
    return interpretation && interpretation.overallScore >= 2.6 && interpretation.overallScore < 3.4;
  }).length;
}

function countHighRiskResponses(responses: SurveyResponse[]): number {
  return responses.filter((resp) => {
    const interpretation = computeInterpretation(resp);
    return interpretation && interpretation.overallScore < 2.6;
  }).length;
}

function generateCombinedDiagnosis(categories: CategoryScore[]) {
  if (categories.length < 2) return undefined;

  const stressCategory = categories[0];
  const cultureCategory = categories[1];

  const stressLevel = stressCategory.level;
  const cultureLevel = cultureCategory.level;

  const diagnosisMatrix: Record<
    string,
    {
      diagnosis: string;
      diagnosisMn: string;
      severity: 'critical' | 'high' | 'moderate' | 'healthy';
      icon: string;
      recommendation: string;
    }
  > = {
    'high-risk_high-risk': {
      diagnosis: 'Systemic burnout risk',
      diagnosisMn: 'Системийн burnout эрсдэл',
      severity: 'critical',
      icon: '🔴🔴',
      recommendation:
        'Маш эмзэг нөхцөл байдал. Ажилтны сэтгэл зүйн болон байгууллагын соёлын хоёуланд нь ноцтой асуудал илэрч байна.',
    },
    'high-risk_healthy': {
      diagnosis: 'Individual overload',
      diagnosisMn: 'Хувь хүний хэт ачаалал',
      severity: 'high',
      icon: '🔴🟢',
      recommendation:
        'Ажлын орчин аюулгүй ч хувь хүн хэт ачаалалтай байна. Хувийн сэргээлт, амралт шаардлагатай.',
    },
    'healthy_high-risk': {
      diagnosis: 'Cultural toxicity risk',
      diagnosisMn: 'Соёлын хоруу орчин',
      severity: 'high',
      icon: '🟢🔴',
      recommendation:
        'Хувь хүн тогтвортой боловч ажлын орчин сэтгэл зүйн хувьд аюулгүй бус байна.',
    },
    'risk_risk': {
      diagnosis: 'Latent psychosocial risk',
      diagnosisMn: 'Далд сэтгэл зүйн эрсдэл',
      severity: 'moderate',
      icon: '🟠🟠',
      recommendation: 'Стресс болон соёлын хоёуланд эрсдэл нэмэгдэж байна.',
    },
    'healthy_healthy': {
      diagnosis: 'Healthy workplace',
      diagnosisMn: 'Эрүүл ажлын орчин',
      severity: 'healthy',
      icon: '🟢🟢',
      recommendation: 'Сайн байна! Стресс болон ажлын орчин хоёулаа тогтвортой.',
    },
  };

  const key = `${stressLevel}_${cultureLevel}`;
  const result = diagnosisMatrix[key];

  if (!result) {
    return {
      stressLevel,
      cultureLevel,
      diagnosis: 'Mixed indicators',
      diagnosisMn: 'Холимог үзүүлэлт',
      severity: 'moderate' as const,
      icon: '🟡',
      recommendation: 'Стресс болон соёлын түвшинд анхаарах шаардлагатай.',
    };
  }

  return {
    stressLevel,
    cultureLevel,
    ...result,
  };
}
