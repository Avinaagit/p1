import EmployeeImport from '@/app/_components/EmployeeImport';

export const metadata = {
  title: 'Ажилтан импортлох',
};

export default function EmployeeImportPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <EmployeeImport />
    </div>
  );
}
