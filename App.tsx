import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import PrizesView from './components/PrizesView';
import TermsView from './components/TermsView';
import Footer from './components/Footer';
import { User, ViewState, Language, AppSettings, AppNotification } from './types';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// Default settings if DB is empty
const DEFAULT_SETTINGS: AppSettings = {
  nextDrawDateEn: 'Yekatit 21, 2018',
  nextDrawDateAm: 'የካቲት 21፣ 2018',
  potValue: 50450000,
  totalMembers: 2150,
  cycle: 1,
  daysRemaining: 14,
  drawDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
  carsDelivered: 142,
  trustScore: 100,
  prizeName: 'Toyota Corolla Cross 2025',
  prizeValue: 'ETB 4.5M',
  prizeImage: 'https://i.postimg.cc/d1xwLLhj/toyota.avif',
  liveStreamUrl: '',
  isLive: false,
  registrationEnabled: true,
  adminPassword: 'admin123',
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
};

const App: React.FC = () => {
  // --- Initialize State from LocalStorage for persistence ---
  const [view, setView] = useState<ViewState>(() => {
    const hash = window.location.hash.replace('#', '');
    const validViews: ViewState[] = ['landing', 'login', 'dashboard', 'admin', 'prizes', 'terms'];
    return (validViews.includes(hash as ViewState) ? (hash as ViewState) : 'landing');
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('blessed_session_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('blessed_language');
    return (savedLang === 'en' || savedLang === 'am') ? savedLang : 'am';
  });

  const [hasShownPreloader, setHasShownPreloader] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Sync user and language to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('blessed_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('blessed_session_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('blessed_language', language);
  }, [language]);

  // Initial Mock Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { 
      id: 1,
      title: { en: "Welcome!", am: "እንኳን ደህና መጡ!" },
      desc: { 
        en: "Thank you for joining Blessed Digital Equb.",
        am: "ብለስድ ዲጂታል እቁብን ስለተቀላቀሉ እናመሰግናለን።"
      },
      time: new Date(), 
      urgent: false,
      read: false
    }
  ]);

  // --- Firestore Integration for Settings ---
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data() as AppSettings);
      } else {
        setDoc(settingsRef, DEFAULT_SETTINGS).catch(console.error);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSettingsUpdate = async (newSettings: React.SetStateAction<AppSettings>) => {
      const resolvedSettings = typeof newSettings === 'function' ? newSettings(appSettings) : newSettings;
      setAppSettings(resolvedSettings);
      try {
        await setDoc(doc(db, 'settings', 'global'), resolvedSettings, { merge: true });
      } catch (err) {
        console.error("Failed to save settings to DB", err);
      }
  };

  const addNotification = (notification: AppNotification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Countdown Timer Logic
  useEffect(() => {
    const updateCountdown = () => {
      if (!appSettings.drawDate) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(appSettings.drawDate);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const finalDays = diffDays > 0 ? diffDays : 0;
      if (finalDays !== appSettings.daysRemaining) {
         setAppSettings(prev => ({ ...prev, daysRemaining: finalDays }));
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000); 
    return () => clearInterval(timer);
  }, [appSettings.drawDate, appSettings.daysRemaining]);

  // Route Protection & Popstate handling
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.view) {
            setView(event.state.view);
        } else {
            const hash = window.location.hash.replace('#', '');
            setView(hash as ViewState || 'landing');
        }
    };

    // Protect dashboard view on fresh reload
    if (view === 'dashboard' && !user) {
        setView('login');
        window.history.replaceState({ view: 'login' }, '', '#login');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, view]);

  const handleSetView = (newView: ViewState) => {
    if (view === newView) return;
    // Prevent unauthorized dashboard access
    if (newView === 'dashboard' && !user) {
        setView('login');
        window.history.pushState({ view: 'login' }, '', '#login');
        return;
    }
    setView(newView);
    try {
      window.history.pushState({ view: newView }, '', `#${newView}`);
      window.scrollTo(0, 0);
    } catch (e) {
      window.scrollTo(0, 0);
    }
  };

  const logout = () => {
    localStorage.removeItem('blessed_session_user');
    setUser(null);
    handleSetView('landing');
  };

  if (view === 'admin') {
    return (
      <AdminView 
        setView={handleSetView} 
        settings={appSettings} 
        setSettings={handleSettingsUpdate} 
        addNotification={addNotification}
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
            enablePreloader={!hasShownPreloader}
            onPreloaderComplete={() => setHasShownPreloader(true)}
          />
        )}

        {view === 'login' && (
          <LoginView 
            setView={handleSetView} 
            setUser={setUser} 
            language={language}
            settings={appSettings}
          />
        )}

        {view === 'dashboard' && user && (
          <DashboardView 
            user={user} 
            setUser={setUser} 
            language={language} 
            settings={appSettings}
            notifications={notifications}
            markAllAsRead={markAllNotificationsAsRead}
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