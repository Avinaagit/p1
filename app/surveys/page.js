import { Navigation } from '../_components/Navigation';
import { SurveyList } from '../_components/SurveyList';
import { SurveyImportExport } from '../_components/SurveyImportExport';

export const metadata = {
  title: 'Surveys - Employee Pulse',
};

export default function SurveysPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 md:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Surveys</h1>
              <p className="text-white mt-2">Participate in surveys to share your feedback</p>
            </div>
            <SurveyImportExport />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <SurveyList />
          </div>
        </div>
      </div>
    </>
  );
}
