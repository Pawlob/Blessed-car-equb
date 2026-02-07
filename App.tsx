import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import PrizesView from './components/PrizesView';
import Footer from './components/Footer';
import { User, ViewState, Language, AppSettings } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  // Global Settings State to be controlled by Admin
  const [appSettings, setAppSettings] = useState<AppSettings>({
    nextDrawDateEn: 'Yekatit 21, 2018',
    nextDrawDateAm: 'የካቲት 21፣ 2018',
    potValue: 50450000,
    totalMembers: 2150,
    cycle: 14,
    daysRemaining: 14,
    carsDelivered: 142,
    trustScore: 100,
    prizeName: 'Toyota Corolla Cross 2025',
    prizeValue: 'ETB 4.5M',
    prizeImage: 'https://i.postimg.cc/d1xwLLhj/toyota.avif',
    recentWinners: [
      { id: 1, name: "Dawit M.", prize: "Toyota Vitz", cycle: "Tir (Jan)", location: "Addis Ababa" },
      { id: 2, name: "Sara T.", prize: "Hyundai i10", cycle: "Tahsas (Dec)", location: "Adama" }
    ]
  });

  // Handle URL hash for Admin routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setView('admin');
      }
    };

    // Check on initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const logout = () => {
    setUser(null);
    setView('landing');
  };

  if (view === 'admin') {
    return (
      <AdminView 
        setView={setView} 
        settings={appSettings} 
        setSettings={setAppSettings} 
      />
    );
  }

  return (
    <div className="font-sans text-stone-800 bg-stone-50 min-h-screen flex flex-col">
      <Navbar 
        view={view} 
        setView={setView} 
        language={language} 
        setLanguage={setLanguage} 
        user={user} 
        logout={logout} 
      />
      
      <main className="flex-grow">
        {view === 'landing' && (
          <LandingPage 
            language={language} 
            setView={setView} 
            settings={appSettings}
          />
        )}

        {view === 'login' && (
          <LoginView 
            setView={setView} 
            setUser={setUser} 
            language={language} 
          />
        )}

        {view === 'dashboard' && user && (
          <DashboardView 
            user={user} 
            setUser={setUser} 
            language={language} 
            settings={appSettings}
          />
        )}

        {view === 'prizes' && (
            <PrizesView 
                language={language}
                settings={appSettings}
                setView={setView}
            />
        )}
      </main>

      <Footer language={language} />
    </div>
  );
};

export default App;