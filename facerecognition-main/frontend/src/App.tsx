import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WafProvider } from './context/WafContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { ModeConfirmationModal } from './components/ModeConfirmationModal';

import { OverviewPage } from './pages/OverviewPage';
import { LiveTrafficPage } from './pages/LiveTrafficPage';
import { AttacksPage } from './pages/AttacksPage';
import { RulesPage } from './pages/RulesPage';
import { SettingsPage } from './pages/SettingsPage';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage />;
      case 'traffic':
        return <LiveTrafficPage />;
      case 'attacks':
        return <AttacksPage />;
      case 'rules':
        return <RulesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-soc-950 text-slate-900 dark:text-slate-50 font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Body with Sidebar + Responsive Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActivePage()}
          </div>
        </main>
      </div>

      {/* Global Protection Mode Dialog */}
      <ModeConfirmationModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WafProvider>
        <DashboardContent />
      </WafProvider>
    </ThemeProvider>
  );
}
