'use client';

import { useEffect, useState } from 'react';

interface QuickMetrics {
  totalSurveys: number;
  totalResponses: number;
  averageScore: number;
  criticalAlerts: number;
  iso45003Risk: string;
  esgRating: string;
}

export function HRQuickInsights() {
  const [metrics, setMetrics] = useState<QuickMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuickMetrics();
  }, []);

  const fetchQuickMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/surveys');
      const data = await res.json();

      if (data.success && data.data && data.data.length > 0) {
        // Get latest survey with responses
        const latestSurvey = data.data[0];
        
        const respRes = await fetch(`/api/v1/surveys/${latestSurvey.id}/responses`);
        const respData = await respRes.json();

        if (respData.success && respData.data) {
          const computed = computeQuickMetrics(data.data, respData.data);
          setMetrics(computed);
        }
      }
    } catch (err) {
      console.error('Failed to load quick metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <p className="text-sm">Ачааллаж байна...</p>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">📊 Wellbeing Quick Insights</h2>
          <p className="text-indigo-100 text-sm mt-1">Real-time employee wellness monitoring</p>
        </div>
        <a
          href="/analytics"
          className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium text-sm"
        >
          Дэлгэрэнгүй →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Surveys */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-indigo-200 text-xs font-medium mb-1">Судалгаа</p>
          <p className="text-2xl font-bold">{metrics.totalSurveys}</p>
        </div>

        {/* Total Responses */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-indigo-200 text-xs font-medium mb-1">Хариулт</p>
          <p className="text-2xl font-bold">{metrics.totalResponses}</p>
        </div>

        {/* Average Score */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-indigo-200 text-xs font-medium mb-1">Дундаж оноо</p>
          <p className="text-2xl font-bold">{metrics.averageScore.toFixed(2)}</p>
        </div>

        {/* Critical Alerts */}
        <div className={`backdrop-blur-sm rounded-lg p-4 ${
          metrics.criticalAlerts > 0 ? 'bg-red-500/30 ring-2 ring-red-300' : 'bg-white/10'
        }`}>
          <p className="text-indigo-200 text-xs font-medium mb-1">🚨 Анхааруулга</p>
          <p className="text-2xl font-bold">{metrics.criticalAlerts}</p>
        </div>

        {/* ISO 45003 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-indigo-200 text-xs font-medium mb-1">ISO 45003</p>
          <p className={`text-lg font-bold uppercase ${
            metrics.iso45003Risk === 'critical' || metrics.iso45003Risk === 'high'
              ? 'text-red-200'
              : 'text-green-200'
          }`}>
            {metrics.iso45003Risk}
          </p>
        </div>

        {/* ESG Rating */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-indigo-200 text-xs font-medium mb-1">ESG Score</p>
          <p className={`text-2xl font-bold ${
            metrics.esgRating === 'A' ? 'text-green-200' :
            metrics.esgRating === 'B' ? 'text-blue-200' :
            metrics.esgRating === 'C' ? 'text-yellow-200' :
            'text-red-200'
          }`}>
            {metrics.esgRating}
          </p>
        </div>
      </div>

      {metrics.criticalAlerts > 0 && (
        <div className="mt-4 bg-red-500/20 border border-red-300/50 rounded-lg p-3">
          <p className="text-sm font-medium">
            ⚠️ {metrics.criticalAlerts} ажилтанд өндөр эрсдэл илэрсэн. Analytics хуудсанд дэлгэрэнгүй харна уу.
          </p>
        </div>
      )}
    </div>
  );
}

function computeQuickMetrics(surveys: any[], responses: any[]): QuickMetrics {
  let totalScore = 0;
  let scoreCount = 0;
  let criticalAlerts = 0;

  responses.forEach((resp) => {
    resp.questionResponses?.forEach((qr: any) => {
      const answer = parseInt(parseAnswer(qr.answer), 10);
      if (!isNaN(answer)) {
        totalScore += answer;
        scoreCount++;
      }
    });

    const respAvg = computeResponseAvg(resp);
    if (respAvg < 2.6) {
      criticalAlerts++;
    }
  });

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  // ISO 45003
  let iso45003Risk = 'low';
  if (averageScore < 2.5) iso45003Risk = 'critical';
  else if (averageScore < 3.4) iso45003Risk = 'high';
  else if (averageScore < 4.0) iso45003Risk = 'medium';

  // ESG
  const avgESG = (averageScore / 5) * 100;
  let esgRating = 'F';
  if (avgESG >= 85) esgRating = 'A';
  else if (avgESG >= 70) esgRating = 'B';
  else if (avgESG >= 55) esgRating = 'C';
  else if (avgESG >= 40) esgRating = 'D';

  return {
    totalSurveys: surveys.length,
    totalResponses: responses.length,
    averageScore: parseFloat(averageScore.toFixed(2)),
    criticalAlerts,
    iso45003Risk,
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
  const answers =
    resp.questionResponses
      ?.map((qr: any) => parseInt(parseAnswer(qr.answer), 10))
      .filter((a: number) => !isNaN(a)) || [];
  return answers.length > 0
    ? answers.reduce((sum: number, a: number) => sum + a, 0) / answers.length
    : 0;
}
