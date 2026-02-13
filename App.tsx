import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import PrizesView from './components/PrizesView';
import TermsView from './components/TermsView';
import Footer from './components/Footer';
import { User, ViewState, Language, AppSettings } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('am');

  // Calculate initial target date (14 days from now for demo purposes)
  const initialTargetDate = new Date();
  initialTargetDate.setDate(initialTargetDate.getDate() + 14);
  const initialDateString = initialTargetDate.toISOString().split('T')[0];

  // Global Settings State to be controlled by Admin
  const [appSettings, setAppSettings] = useState<AppSettings>({
    nextDrawDateEn: 'Yekatit 21, 2018',
    nextDrawDateAm: 'የካቲት 21፣ 2018',
    potValue: 50450000,
    totalMembers: 2150,
    cycle: 14,
    daysRemaining: 14,
    drawDate: initialDateString,
    carsDelivered: 142,
    trustScore: 100,
    prizeName: 'Toyota Corolla Cross 2025',
    prizeValue: 'ETB 4.5M',
    prizeImage: 'https://i.postimg.cc/d1xwLLhj/toyota.avif',
    liveStreamUrl: '',
    isLive: false,
    recentWinners: [
      { 
        id: 1, 
        name: "Dawit M.", 
        nameAm: "ዳዊት መ.",
        prize: "Toyota Vitz", 
        prizeAm: "ቶዮታ ቪትዝ",
        cycle: "Tir (Jan)", 
        cycleAm: "ጥር",
        location: "Addis Ababa",
        locationAm: "አዲስ አበባ"
      },
      { 
        id: 2, 
        name: "Sara T.", 
        nameAm: "ሳራ ት.",
        prize: "Hyundai i10", 
        prizeAm: "ሂዩንዳይ i10",
        cycle: "Tahsas (Dec)", 
        cycleAm: "ታህሳስ",
        location: "Adama",
        locationAm: "አዳማ"
      }
    ]
  });

  // Countdown Timer Logic
  useEffect(() => {
    const updateCountdown = () => {
      const today = new Date();
      // Reset time part to ensure clean day calculation
      today.setHours(0, 0, 0, 0);
      
      const target = new Date(appSettings.drawDate);
      target.setHours(0, 0, 0, 0);
      
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Only update if changed to avoid render loops
      const finalDays = diffDays > 0 ? diffDays : 0;
      
      if (finalDays !== appSettings.daysRemaining) {
        setAppSettings(prev => ({ ...prev, daysRemaining: finalDays }));
      }
    };

    updateCountdown();
    // Update every minute to handle midnight transitions while app is open
    const timer = setInterval(updateCountdown, 60000); 
    
    return () => clearInterval(timer);
  }, [appSettings.drawDate, appSettings.daysRemaining]);

  // Handle History and Back Button
  useEffect(() => {
    const getInitialView = (): ViewState => {
       try {
         const hash = window.location.hash.replace('#', '');
         const validViews: ViewState[] = ['landing', 'login', 'dashboard', 'admin', 'prizes', 'terms'];
         return validViews.includes(hash as ViewState) ? (hash as ViewState) : 'landing';
       } catch (e) {
         return 'landing';
       }
    };

    // Set initial view based on URL hash
    const currentView = getInitialView();
    setView(currentView);
    
    // Ensure we have a history state for the initial load
    try {
      if (!window.history.state) {
        window.history.replaceState({ view: currentView }, '', `#${currentView}`);
      }
    } catch (e) {
      // In some environments (like blob URLs or strict iframes), History API might be restricted.
      // We silence the error to allow the app to function without URL sync.
      // console.warn("History API restricted, navigation state will not be synced to URL.");
    }

    const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.view) {
            setView(event.state.view);
        } else {
            // Fallback for scenarios where state might be lost or manual hash change
            setView(getInitialView());
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Custom navigator that syncs with browser history
  const handleSetView = (newView: ViewState) => {
    // Prevent pushing duplicate states
    if (view === newView) return;
    
    setView(newView);
    try {
      window.history.pushState({ view: newView }, '', `#${newView}`);
      window.scrollTo(0, 0);
    } catch (e) {
      // Fallback if History API fails
      window.scrollTo(0, 0);
    }
  };

  const logout = () => {
    setUser(null);
    handleSetView('landing');
  };

  if (view === 'admin') {
    return (
      <AdminView 
        setView={handleSetView} 
        settings={appSettings} 
        setSettings={setAppSettings} 
      />
    );
  }

  return (
    <div className="font-sans text-stone-800 bg-stone-50 min-h-screen flex flex-col">
      <Navbar 
        view={view} 
        setView={handleSetView} 
        language={language} 
        setLanguage={setLanguage} 
        user={user} 
        logout={logout} 
      />
      
      <main className="flex-grow">
        {view === 'landing' && (
          <LandingPage 
            language={language} 
            setView={handleSetView} 
            settings={appSettings}
          />
        )}

        {view === 'login' && (
          <LoginView 
            setView={handleSetView} 
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
                setView={handleSetView}
            />
        )}

        {view === 'terms' && (
            <TermsView 
                language={language}
                setView={handleSetView}
            />
        )}
      </main>

      <Footer language={language} setView={handleSetView} />
    </div>
  );
};

export default App;