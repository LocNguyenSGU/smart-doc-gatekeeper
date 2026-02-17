import React from 'react';
import { SettingsForm } from './components/SettingsForm';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          ⚙️ Smart Doc Gatekeeper Settings
        </h1>
        <SettingsForm />
      </div>
    </div>
  );
}
