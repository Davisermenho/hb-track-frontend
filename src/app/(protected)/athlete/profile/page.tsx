'use client';

/**
 * Athlete Profile Page
 * 
 * Personal profile page for athletes to view and export their data
 * LGPD Compliance: Art. 18, II (Data Portability)
 */

import { DataExportSection } from '@/components/profile/DataExportSection';

export default function AthleteProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Meu Perfil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gerencie suas informações pessoais e privacidade
          </p>
        </div>

        {/* Data Export Section */}
        <DataExportSection />
      </div>
    </div>
  );
}
