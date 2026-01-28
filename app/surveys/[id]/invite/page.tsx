import SurveyInvite from '@/app/_components/SurveyInvite';
import { Navigation } from '@/app/_components/Navigation';

async function getSurvey(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/surveys/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Failed to fetch survey:', error);
    return null;
  }
}

export default async function SurveyInvitePage({ params }: { params: { id: string } }) {
  const survey = await getSurvey(params.id);

  if (!survey) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Судалгаа олдсонгүй</h1>
            <p className="text-gray-600">Энэ судалгаа олдсонгүй эсвэл устгагдсан байна.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <a
              href="/surveys"
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
            >
              ← Буцах
            </a>
          </div>

          <SurveyInvite surveyId={survey.id} surveyTitle={survey.title} />
        </div>
      </div>
    </>
  );
}
