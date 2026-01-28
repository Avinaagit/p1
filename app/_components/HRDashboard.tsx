'use client';

import { useEffect, useState } from 'react';

interface CategoryScore {
  categoryMn: string;
  averageScore: number;
  level: string;
  color: string;
  icon: string;
}

interface DashboardMetrics {
  totalResponses: number;
  averageScore: number;
  criticalCount: number;
  riskCount: number;
  healthyCount: number;
  categories: CategoryScore[];
  iso45003: {
    riskLevel: string;
    requiresAction: boolean;
  };
  esgRating: string;
}

export function HRDashboard({ surveyId }: { surveyId: string }) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (surveyId) {
      fetchMetrics();
    }
  }, [surveyId]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/surveys/${surveyId}/responses`);
      const data = await res.json();

      if (data.success && data.data) {
        const computed = computeAggregateMetrics(data.data);
        setMetrics(computed);
      }
    } catch (err) {
      console.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">HR Dashboard ачааллаж байна...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Мэдээлэл олдсонгүй.</p>
      </div>
    );
  }

  const recommendations = buildHrRecommendations(metrics);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">📊 HR Dashboard - Wellbeing Analytics</h1>
        <p className="text-blue-100">Нийт хариулт: {metrics.totalResponses} | Дундаж оноо: {metrics.averageScore.toFixed(2)}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 font-medium mb-1">🟢 Эрүүл</p>
          <p className="text-3xl font-bold text-green-600">{metrics.healthyCount}</p>
          <p className="text-xs text-gray-500 mt-1">Wellbeing өндөр</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600 font-medium mb-1">🟡 Анхаарах</p>
          <p className="text-3xl font-bold text-yellow-600">{metrics.totalResponses - metrics.criticalCount - metrics.riskCount - metrics.healthyCount}</p>
          <p className="text-xs text-gray-500 mt-1">Мониторинг</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600 font-medium mb-1">🟠 Эрсдэлтэй</p>
          <p className="text-3xl font-bold text-orange-600">{metrics.riskCount}</p>
          <p className="text-xs text-gray-500 mt-1">Урьдчилан сэргийлэх</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-600 font-medium mb-1">🔴 Өндөр эрсдэл</p>
          <p className="text-3xl font-bold text-red-600">{metrics.criticalCount}</p>
          <p className="text-xs text-gray-500 mt-1">Яаралтай дэмжлэг</p>
        </div>
      </div>

      {/* ISO & ESG */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ISO 45003 Compliance */}
        <div className={`rounded-lg shadow p-6 border-2 ${
          metrics.iso45003.riskLevel === 'critical' ? 'bg-red-50 border-red-300' :
          metrics.iso45003.riskLevel === 'high' ? 'bg-orange-50 border-orange-300' :
          metrics.iso45003.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-300' :
          'bg-green-50 border-green-300'
        }`}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">📋 ISO 45003 Compliance</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Эрсдэлийн түвшин:</span>
              <span className={`px-3 py-1 rounded font-semibold text-sm ${
                metrics.iso45003.riskLevel === 'critical' ? 'bg-red-200 text-red-900' :
                metrics.iso45003.riskLevel === 'high' ? 'bg-orange-200 text-orange-900' :
                metrics.iso45003.riskLevel === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                'bg-green-200 text-green-900'
              }`}>
                {metrics.iso45003.riskLevel.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Арга хэмжээ шаардлагатай:</span>
              <span className="font-semibold text-sm">
                {metrics.iso45003.requiresAction ? '✅ Тийм' : '❌ Үгүй'}
              </span>
            </div>
          </div>
        </div>

        {/* ESG Rating */}
        <div className={`rounded-lg shadow p-6 border-2 ${
          metrics.esgRating === 'A' ? 'bg-green-50 border-green-300' :
          metrics.esgRating === 'B' ? 'bg-blue-50 border-blue-300' :
          metrics.esgRating === 'C' ? 'bg-yellow-50 border-yellow-300' :
          'bg-red-50 border-red-300'
        }`}>
          <h2 className="text-lg font-bold text-gray-900 mb-3">🌍 ESG Social Score</h2>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl font-bold ${
              metrics.esgRating === 'A' ? 'bg-green-200 text-green-900' :
              metrics.esgRating === 'B' ? 'bg-blue-200 text-blue-900' :
              metrics.esgRating === 'C' ? 'bg-yellow-200 text-yellow-900' :
              'bg-red-200 text-red-900'
            }`}>
              {metrics.esgRating}
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {metrics.esgRating === 'A' ? 'Маш сайн' :
               metrics.esgRating === 'B' ? 'Сайн' :
               metrics.esgRating === 'C' ? 'Дунд' : 'Сайжруулалт шаардлагатай'}
            </p>
          </div>
        </div>
      </div>

      {/* HR Action Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🛠️ HR Action Recommendations</h2>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          {recommendations.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Жишээ зөвлөмжүүд</h3>
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            <li>Ачааллын тэнцвэржүүлэлт хийх (priority review, тасалбарын тоо бууруулах).</li>
            <li>Сэтгэлзүйн дэмжлэгийн нууц сувгууд (EAP, зөвлөгөө) нэвтрүүлэх.</li>
            <li>Менежерүүдэд “psychological safety” сургалт зохион байгуулах.</li>
            <li>Wellbeing богино pulse судалгааг 2–4 долоо хоног тутам давтах.</li>
          </ul>
        </div>
      </div>

      {/* Sample Tasks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Жишээ ажил (Task)</h2>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          {buildSampleTasks(metrics).map((task, idx) => (
            <li key={idx}>{task}</li>
          ))}
        </ul>
      </div>

      {/* Category Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🗺️ Категори тус бүрийн heat map</h2>
        <div className="space-y-3">
          {metrics.categories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-1/3">
                <p className="text-sm font-medium text-gray-900">{cat.categoryMn}</p>
              </div>
              <div className="w-1/3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        cat.color === 'green' ? 'bg-green-500' :
                        cat.color === 'yellow' ? 'bg-yellow-500' :
                        cat.color === 'orange' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(cat.averageScore / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">
                    {cat.averageScore.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="w-1/3 text-right">
                <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                  cat.color === 'green' ? 'bg-green-100 text-green-800' :
                  cat.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  cat.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {cat.icon} {cat.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildHrRecommendations(metrics: DashboardMetrics): string[] {
  const items: string[] = [];

  if (metrics.criticalCount > 0) {
    items.push('Өндөр эрсдэлтэй ажилтнуудад нэн тэргүүнд сэтгэлзүйн дэмжлэгийн хөтөлбөр санал болгох.');
  }

  if (metrics.riskCount > 0) {
    items.push('Эрсдэлтэй бүлэгт чиглэсэн стресс бууруулах сургалт, зөвлөгөө зохион байгуулах.');
  }

  if (metrics.iso45003.requiresAction) {
    items.push('ISO 45003 шаардлагад нийцүүлэх богино хугацааны сайжруулалтын төлөвлөгөө боловсруулах.');
  }

  if (metrics.esgRating === 'D' || metrics.esgRating === 'F') {
    items.push('ESG social score‑ийг нэмэгдүүлэхийн тулд wellbeing ба аюулгүй байдлын бодлого шинэчлэх.');
  }

  if (metrics.averageScore < 3.4) {
    items.push('Дундаж оноо бага тул менежерүүдийн эргэн холбоо, дэмжлэгийн сувгийг идэвхжүүлэх.');
  }

  if (items.length === 0) {
    items.push('Одоогийн түвшин тогтвортой байна. Сар бүрийн мониторинг үргэлжлүүлнэ.');
  }

  return items;
}

function buildSampleTasks(metrics: DashboardMetrics): string[] {
  const tasks: string[] = [];

  if (metrics.criticalCount > 0) {
    tasks.push('1:1 confidential check‑in schedule (HR + Team Lead) – 2 долоо хоногт багтаах.');
  }

  if (metrics.riskCount > 0) {
    tasks.push('Стрессийн менежмент workshop зохион байгуулах – энэ сарын дотор.');
  }

  if (metrics.averageScore < 3.4) {
    tasks.push('Менежерүүдийн engagement feedback session хийх – дараагийн 2 долоо хоногт.');
  }

  if (metrics.iso45003.requiresAction) {
    tasks.push('ISO 45003 action plan draft гаргах – 7 хоногийн дотор.');
  }

  if (tasks.length === 0) {
    tasks.push('Сарын wellbeing pulse‑ийн график шинэчлэх (monitoring).');
  }

  return tasks;
}

function computeAggregateMetrics(responses: any[]): DashboardMetrics {
  let totalScore = 0;
  let scoreCount = 0;
  let criticalCount = 0;
  let riskCount = 0;
  let healthyCount = 0;

  const categoryAggregates: Record<number, { sum: number; count: number }> = {};

  responses.forEach((resp) => {
    resp.questionResponses?.forEach((qr: any) => {
      const answer = parseInt(parseAnswer(qr.answer), 10);
      if (!isNaN(answer)) {
        totalScore += answer;
        scoreCount++;

        const catIndex = Math.floor((qr.question.displayOrder - 1) / 12);
        if (!categoryAggregates[catIndex]) {
          categoryAggregates[catIndex] = { sum: 0, count: 0 };
        }
        categoryAggregates[catIndex].sum += answer;
        categoryAggregates[catIndex].count++;
      }
    });

    const respAvg = computeResponseAvg(resp);
    if (respAvg < 2.6) criticalCount++;
    else if (respAvg < 3.4) riskCount++;
    else if (respAvg >= 4.2) healthyCount++;
  });

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  const categoryNames = [
    'Сэтгэл зүйн эрүүл мэнд & стресс',
    'Байгууллагын сэтгэл зүйн орчин',
    'Хувь хүний сэтгэл зүйн төлөв',
    'Зан төлөв & харилцааны хэв маяг',
    'Ерөнхий wellbeing',
  ];

  const categories: CategoryScore[] = Object.keys(categoryAggregates).map((key) => {
    const catIndex = parseInt(key);
    const agg = categoryAggregates[catIndex];
    const avg = agg.count > 0 ? agg.sum / agg.count : 0;
    const level = getLevel(avg);

    return {
      categoryMn: categoryNames[catIndex] || `Category ${catIndex + 1}`,
      averageScore: parseFloat(avg.toFixed(2)),
      level: level.levelMn,
      color: level.color,
      icon: level.icon,
    };
  });

  const criticalCat = categories.filter((c) => c.color === 'red').length;
  const riskCat = categories.filter((c) => c.color === 'orange').length;

  let iso45003RiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let requiresAction = false;

  if (criticalCat >= 2 || averageScore < 2.5) {
    iso45003RiskLevel = 'critical';
    requiresAction = true;
  } else if (criticalCat >= 1 || riskCat >= 2 || averageScore < 3.4) {
    iso45003RiskLevel = 'high';
    requiresAction = true;
  } else if (riskCat >= 1 || averageScore < 4.0) {
    iso45003RiskLevel = 'medium';
    requiresAction = true;
  }

  const avgESG = ((averageScore / 5) * 100);
  let esgRating: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (avgESG >= 85) esgRating = 'A';
  else if (avgESG >= 70) esgRating = 'B';
  else if (avgESG >= 55) esgRating = 'C';
  else if (avgESG >= 40) esgRating = 'D';

  return {
    totalResponses: responses.length,
    averageScore: parseFloat(averageScore.toFixed(2)),
    criticalCount,
    riskCount,
    healthyCount,
    categories,
    iso45003: {
      riskLevel: iso45003RiskLevel,
      requiresAction,
    },
    esgRating,
  };
}

function parseAnswer(answer: string): string {
  try {
    const parsed = JSON.parse(answer);
    return String(parsed);
  } catch {
    return answer;
  }
}

function computeResponseAvg(resp: any): number {
  const answers = resp.questionResponses?.map((qr: any) => parseInt(parseAnswer(qr.answer), 10)).filter((a: number) => !isNaN(a)) || [];
  return answers.length > 0 ? answers.reduce((sum: number, a: number) => sum + a, 0) / answers.length : 0;
}

function getLevel(score: number): { levelMn: string; color: string; icon: string } {
  if (score >= 4.2) return { levelMn: 'Эрүүл', color: 'green', icon: '🟢' };
  if (score >= 3.4) return { levelMn: 'Анхаарах', color: 'yellow', icon: '🟡' };
  if (score >= 2.6) return { levelMn: 'Эрсдэлтэй', color: 'orange', icon: '🟠' };
  return { levelMn: 'Өндөр эрсдэл', color: 'red', icon: '🔴' };
}
