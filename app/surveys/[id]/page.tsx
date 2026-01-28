import { Navigation } from '../../_components/Navigation';
import { SurveyDetail } from '../../_components/SurveyDetail';

export const metadata = {
  title: 'Survey Details - Employee Pulse',
};

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <SurveyDetail surveyId={id} />
        </div>
      </div>
    </>
  );
}
