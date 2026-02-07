import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import Footer from './components/Footer';
import { User, ViewState, Language } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  const logout = () => {
    setUser(null);
    setView('landing');
  };

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
          <LandingPage language={language} setView={setView} />
        )}

        {view === 'login' && (
          <LoginView setView={setView} setUser={setUser} language={language} />
        )}

        {view === 'dashboard' && user && (
          <DashboardView user={user} setUser={setUser} language={language} />
        )}
      </main>

      <Footer language={language} />
    </div>
  );
};

export default App;