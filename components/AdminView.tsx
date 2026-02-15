
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, AlertCircle, X, Menu, Shield, Globe, Gift
} from 'lucide-react';
import { User, AppSettings, ViewState, AppNotification, Language } from '../types';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import AdminDashboard from './admin/AdminDashboard';
import AdminCompetition from './admin/AdminCompetition';
import AdminPrizes from './admin/AdminPrizes';
import AdminUsers from './admin/AdminUsers';
import AdminPayments from './admin/AdminPayments';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: (settings: React.SetStateAction<AppSettings>) => void;
  addNotification: (notification: AppNotification) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

interface PaymentRequest {
  id: string; 
  userId: string | number;
  userName: string;
  userPhone: string;
  amount: number;
  date: string;
  receiptUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedTicket?: number;
}

interface TicketType {
  id: string;
  ticketNumber: number;
  userId: string | number;
  userName: string;
  cycle: number;
  status: 'ACTIVE' | 'VOID' | 'PENDING' | 'RESERVED';
  assignedDate: string;
  assignedBy: 'SYSTEM' | 'ADMIN' | 'USER';
}

// --- Translations ---
const ADMIN_TRANSLATIONS = {
  en: {
    sidebar: {
      title: "Admin Panel",
      dashboard: "Dashboard",
      competition: "Competition",
      prizes: "Prizes",
      users: "User Management",
      payments: "Verify Payments",
      settings: "App Settings",
      exit: "Exit Admin"
    },
    dashboard: {
      overview: "Dashboard Overview",
      totalPot: "Total Pot",
      claimedTickets: "Claimed Tickets",
      totalMembers: "Total Members",
      pending: "Pending Verifications",
      cycle: "Current Cycle",
      cycleTitle: "Cycle Management",
      cycleDesc: "Control the current lottery cycle status",
      active: "Active",
      startNew: "Start New Cycle",
      nextDraw: "Next Draw",
      daysRem: "days remaining",
      recentPay: "Recent Payment Requests",
      viewAll: "View All",
      noPending: "No pending payments.",
      user: "User",
      amount: "Amount",
      date: "Date",
      action: "Action",
      review: "Review"
    },
    competition: {
      title: "Competition Management",
      general: "General Settings",
      tickets: "Ticket Management",
      drawSchedule: "Draw Schedule",
      setNextDraw: "Set Next Draw Date (Ethiopian Calendar)",
      preview: "Preview",
      save: "Save Changes",
      currentPrize: "Current Prize",
      prizeName: "Prize Name",
      prizeValue: "Prize Value",
      prizeImages: "Prize Images",
      liveStream: "Live Stream",
      liveStatus: "Live Status"
    },
    prizes: {
      title: "Prize Management",
      liveAnnouncer: "Live Draw Announcer",
      liveDesc: "Use this tool during the live event to broadcast the winner to all connected users instantly.",
      winTicket: "Winning Ticket Number",
      verify: "Verify Ticket",
      announce: "ANNOUNCE WINNER LIVE",
      hallOfFame: "Hall of Fame (Past Winners)",
      hallDesc: "Manage the list of winners displayed on the Prizes page.",
      addWinner: "Add Past Winner"
    },
    users: {
      title: "User Management",
      addNew: "Add New User",
      search: "Search by name or phone...",
      allStatus: "All Status",
      verified: "Verified",
      pending: "Pending",
      contrib: "Contribution",
      ticket: "Ticket #",
      actions: "Actions",
      showing: "Showing",
      total: "Total Users",
      status: "Status",
      phone: "Phone"
    },
    payments: {
      title: "Pending Payments",
      allCaughtUp: "All Caught Up!",
      noRequests: "There are no pending payment requests to verify at this time.",
      amount: "Amount Declared",
      reject: "Reject",
      approve: "Approve"
    },
    settings: {
      title: "App Settings",
      general: "General Preferences",
      langTitle: "Admin Dashboard Language",
      langDesc: "Toggle the language settings for the admin dashboard.",
      security: "Account & Security",
      userReg: "User Registration",
      userRegDesc: "Allow new users to create accounts",
      changePass: "Change Admin Password",
      update: "Update",
      save: "Save Changes"
    },
    login: {
      title: "Admin Portal",
      label: "Access Key",
      btn: "Login",
      back: "Back to Site",
      placeholder: "Enter password",
      failed: "Login Failed",
      failedMsg: "The access key you provided is incorrect. Please try again."
    }
  },
  am: {
    sidebar: {
      title: "አድሚን ፓነል",
      dashboard: "ዳሽቦርድ",
      competition: "ውድድር",
      prizes: "ሽልማቶች",
      users: "ተጠቃሚዎች",
      payments: "ክፍያ ማረጋገጫ",
      settings: "ቅንብሮች",
      exit: "ውጣ"
    },
    dashboard: {
      overview: "የዳሽቦርድ አጠቃላይ እይታ",
      totalPot: "ጠቅላላ ገንዘብ",
      claimedTickets: "የተያዙ ቲኬቶች",
      totalMembers: "ጠቅላላ አባላት",
      pending: "ማረጋገጫ የሚጠብቁ",
      cycle: "የአሁኑ ዙር",
      cycleTitle: "የዙር አስተዳደር",
      cycleDesc: "የአሁኑን የሎተሪ ዙር ሁኔታ ይቆጣጠሩ",
      active: "ንቁ",
      startNew: "አዲስ ዙር ጀምር",
      nextDraw: "ቀጣይ እጣ",
      daysRem: "ቀናት ቀርተዋል",
      recentPay: "የቅርብ ጊዜ የክፍያ ጥያቄዎች",
      viewAll: "ሁሉንም አሳይ",
      noPending: "ምንም በመጠባበቅ ላይ ያሉ ክፍያዎች የሉም።",
      user: "ተጠቃሚ",
      amount: "መጠን",
      date: "ቀን",
      action: "ተግባር",
      review: "ገምግም"
    },
    competition: {
      title: "የውድድር አስተዳደር",
      general: "አጠቃላይ ቅንብሮች",
      tickets: "ቲኬት አስተዳደር",
      drawSchedule: "የእጣ ፕሮግራም",
      setNextDraw: "ቀጣይ የእጣ ቀን ያዘጋጁ (በኢትዮጵያ አቆጣጠር)",
      preview: "ቅድመ እይታ",
      save: "ለውጦችን አስቀምጥ",
      currentPrize: "የአሁኑ ሽልማት",
      prizeName: "የሽልማት ስም",
      prizeValue: "የሽልማት ዋጋ",
      prizeImages: "የሽልማት ምስሎች",
      liveStream: "የቀጥታ ስርጭት",
      liveStatus: "የቀጥታ ሁኔታ"
    },
    prizes: {
      title: "ሽልማት አስተዳደር",
      liveAnnouncer: "የቀጥታ እጣ አወጣጥ",
      liveDesc: "ይህንን መሳሪያ በቀጥታ ስርጭት ወቅት አሸናፊውን ለተጠቃሚዎች ለማሳወቅ ይጠቀሙበት።",
      winTicket: "አሸናፊ የቲኬት ቁጥር",
      verify: "ቲኬት አረጋግጥ",
      announce: "አሸናፊውን አብስር",
      hallOfFame: "የዝና አዳራሽ (ያለፉት አሸናፊዎች)",
      hallDesc: "በሽልማት ገጹ ላይ የሚታዩትን የአሸናፊዎች ዝርዝር ያስተዳድሩ።",
      addWinner: "ያለፈ አሸናፊ ጨምር"
    },
    users: {
      title: "ተጠቃሚ አስተዳደር",
      addNew: "አዲስ ተጠቃሚ ጨምር",
      search: "በስም ወይም ስልክ ይፈልጉ...",
      allStatus: "ሁሉም ሁኔታዎች",
      verified: "የተረጋገጠ",
      pending: "በመጠባበቅ ላይ",
      contrib: "መዋጮ",
      ticket: "ቲኬት #",
      actions: "ተግባራት",
      showing: "በማሳየት ላይ",
      total: "ጠቅላላ ተጠቃሚዎች",
      status: "ሁኔታ",
      phone: "ስልክ"
    },
    payments: {
      title: "ክፍያ ማረጋገጫ",
      allCaughtUp: "ሁሉም ተጠናቋል!",
      noRequests: "በአሁኑ ሰዓት ማረጋገጫ የሚጠብቅ ክፍያ የለም።",
      amount: "የተገለጸው መጠን",
      reject: "ውድቅ አድርግ",
      approve: "አረጋግጥ"
    },
    settings: {
      title: "የመተግበሪያ ቅንብሮች",
      general: "አጠቃላይ ምርጫዎች",
      langTitle: "የአድሚን ቋንቋ",
      langDesc: "የአድሚን ዳሽቦርድ ቋንቋ ይቀይሩ።",
      security: "መለያ እና ደህንነት",
      userReg: "ተጠቃሚ ምዝገባ",
      userRegDesc: "አዳዲስ ተጠቃሚዎች መለያ እንዲፈጥሩ ፍቀድ",
      changePass: "የአድሚን የይለፍ ቃል ቀይር",
      update: "አዘምን",
      save: "ለውጦችን አስቀምጥ"
    },
    login: {
      title: "አድሚን ፓነል",
      label: "የይለፍ ቃል",
      btn: "ግባ",
      back: "ወደ ጣቢያው ተመለስ",
      placeholder: "የይለፍ ቃል ያስገቡ",
      failed: "መግባት አልተሳካም",
      failedMsg: "ያስገቡት የይለፍ ቃል ትክክል አይደለም።"
    }
  }
};

const ETHIOPIAN_MONTHS = [
    { val: 1, name: "Meskerem (Sep-Oct)" },
    { val: 2, name: "Tikimt (Oct-Nov)" },
    { val: 3, name: "Hidar (Nov-Dec)" },
    { val: 4, name: "Tahsas (Dec-Jan)" },
    { val: 5, name: "Tir (Jan-Feb)" },
    { val: 6, name: "Yekatit (Feb-Mar)" },
    { val: 7, name: "Megabit (Mar-Apr)" },
    { val: 8, name: "Miyazia (Apr-May)" },
    { val: 9, name: "Ginbot (May-Jun)" },
    { val: 10, name: "Sene (Jun-Jul)" },
    { val: 11, name: "Hamle (Jul-Aug)" },
    { val: 12, name: "Nehase (Aug-Sep)" },
    { val: 13, name: "Pagume (Sep)" },
];

const AMHARIC_MONTHS = [
    "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሀምሌ", "ነሃሴ", "ጳጉሜ"
];

// Convert Ethiopian Date to Gregorian string (YYYY-MM-DD)
const getGregorianFromEthiopian = (year: number, month: number, day: number) => {
    const startGregYear = year + 7;
    const nextGregYear = startGregYear + 1;
    const isNextGregLeap = (nextGregYear % 4 === 0 && nextGregYear % 100 !== 0) || (nextGregYear % 400 === 0);
    const startDay = isNextGregLeap ? 12 : 11;

    const anchor = new Date(startGregYear, 8, startDay); 
    const daysToAdd = (month - 1) * 30 + (day - 1);
    anchor.setDate(anchor.getDate() + daysToAdd);

    return anchor.toISOString().split('T')[0];
};

// Convert Gregorian string to Ethiopian Date Object
const getEthiopianFromGregorian = (gregDateStr: string) => {
    const date = new Date(gregDateStr);
    const gregYear = date.getFullYear();
    
    const nextGregYear = gregYear + 1;
    const isNextGregLeap = (nextGregYear % 4 === 0 && nextGregYear % 100 !== 0) || (nextGregYear % 400 === 0);
    const newYearDayInThisGregYear = isNextGregLeap ? 12 : 11;
    const ethNewYearDate = new Date(gregYear, 8, newYearDayInThisGregYear);
    
    let ethYear, diffDays;

    if (date >= ethNewYearDate) {
        ethYear = gregYear - 7;
        const diffTime = date.getTime() - ethNewYearDate.getTime();
        diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
        ethYear = gregYear - 8;
        const currentGregLeap = (gregYear % 4 === 0 && gregYear % 100 !== 0) || (gregYear % 400 === 0);
        const prevNewYearDay = currentGregLeap ? 12 : 11;
        const prevEthNewYearDate = new Date(gregYear - 1, 8, prevNewYearDay);
        
        const diffTime = date.getTime() - prevEthNewYearDate.getTime();
        diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const ethMonth = Math.floor(diffDays / 30) + 1;
    const ethDay = (diffDays % 30) + 1;

    return { year: ethYear, month: ethMonth, day: ethDay };
};

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings, addNotification, language, setLanguage }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'competition' | 'users' | 'settings' | 'payments' | 'prizes'>('dashboard');
  
  // Local Settings State (Buffer)
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // State for new image input in competition/settings tabs
  const [newImageUrl, setNewImageUrl] = useState('');

  const t = ADMIN_TRANSLATIONS[language];

  // Sync local settings with global settings when they change (e.g. from DB)
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Real-time Data State
  const [users, setUsers] = useState<User[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Local state for Ethiopian Date Inputs
  const [ethDate, setEthDate] = useState({ year: 2016, month: 1, day: 1 });

  // Sync Eth date state when settings.drawDate changes (e.g. initial load)
  useEffect(() => {
    if (settings.drawDate) {
        setEthDate(getEthiopianFromGregorian(settings.drawDate));
    }
  }, [settings.drawDate]);

  // --- Real-Time Listeners ---
  useEffect(() => {
     // Users Listener
     const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
         const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
         setUsers(usersData);
     });

     // Payment Requests Listener
     const paymentsUnsub = onSnapshot(collection(db, 'payment_requests'), (snapshot) => {
         const requestsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PaymentRequest));
         setPaymentRequests(requestsData.filter(req => req.status === 'PENDING'));
     });

     // Tickets Listener
     const ticketsUnsub = onSnapshot(collection(db, 'tickets'), (snapshot) => {
         const ticketsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TicketType));
         setTickets(ticketsData);
     });

     return () => {
         usersUnsub();
         paymentsUnsub();
         ticketsUnsub();
     };
  }, []);

  // Handle Eth Date Change
  const handleEthDateChange = (field: 'year' | 'month' | 'day', value: number) => {
      const newEthDate = { ...ethDate, [field]: value };
      setEthDate(newEthDate);
      
      // Calculate new Gregorian date
      const newGregString = getGregorianFromEthiopian(newEthDate.year, newEthDate.month, newEthDate.day);

      // Format display strings
      const monthIndex = newEthDate.month - 1;
      const monthNameEn = ETHIOPIAN_MONTHS[monthIndex]?.name.split(' ')[0] || '';
      const monthNameAm = AMHARIC_MONTHS[monthIndex] || '';

      const nextDrawDateEn = `${monthNameEn} ${newEthDate.day}, ${newEthDate.year}`;
      const nextDrawDateAm = `${monthNameAm} ${newEthDate.day}፣ ${newEthDate.year}`;
      
      // Update LOCAL settings buffer
      setLocalSettings(prev => ({ 
          ...prev, 
          drawDate: newGregString,
          nextDrawDateEn,
          nextDrawDateAm
      }));
  };

  // Handle adding a new prize image URL
  const handleAddImage = () => {
    if (newImageUrl && !localSettings.prizeImages?.includes(newImageUrl)) {
        const updatedImages = [...(localSettings.prizeImages || []), newImageUrl];
        setLocalSettings(prev => ({
            ...prev,
            prizeImages: updatedImages,
            prizeImage: updatedImages[0] // Update single image fallback
        }));
        setNewImageUrl('');
    }
  };

  // Handle removing a prize image URL
  const handleRemoveImage = (index: number) => {
    const updatedImages = localSettings.prizeImages?.filter((_, i) => i !== index) || [];
    setLocalSettings(prev => ({
        ...prev,
        prizeImages: updatedImages,
        prizeImage: updatedImages.length > 0 ? updatedImages[0] : ''
    }));
  };

  // Auto-calculate Pot Value and Total Members based on Users
  useEffect(() => {
    const activePot = users.reduce((sum, user) => 
        user.status === 'VERIFIED' ? sum + 5000 : sum, 0
    );
    const memberCount = users.length;

    if (settings.potValue !== activePot || settings.totalMembers !== memberCount) {
        setSettings(prev => ({
            ...prev,
            potValue: activePot,
            totalMembers: memberCount
        }));
    }
  }, [users, settings.potValue, settings.totalMembers, setSettings]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };
  
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Generic Save Handler
  const handleSaveSection = (sectionName: string) => {
    showConfirm(
        'Save Changes',
        `Are you sure you want to save changes to ${sectionName}?`,
        async () => {
             await setSettings(localSettings);
             showAlert('success', 'Changes Saved', `${sectionName} settings updated.`);
        }
    );
  };

  // Start New Cycle Logic
  const handleStartNewCycle = () => {
    const nextCycle = settings.cycle + 1;
    
    showConfirm(
      'Start New Cycle?',
      `Are you sure you want to start Cycle ${nextCycle}?\n\nThis will RESET:\n• Pot Value to 0\n• Member Contributions to 0\n• Member Status to Pending\n• Clear all Tickets & Requests\n• Next Draw Date to +30 days`,
      async () => {
        const today = new Date();
        const nextDraw = new Date(today);
        nextDraw.setDate(today.getDate() + 30);
        const nextDrawIso = nextDraw.toISOString().split('T')[0];

        const newEthDate = getEthiopianFromGregorian(nextDrawIso);
        
        const monthIndex = newEthDate.month - 1;
        const monthNameEn = ETHIOPIAN_MONTHS[monthIndex]?.name.split(' ')[0] || '';
        const monthNameAm = AMHARIC_MONTHS[monthIndex] || '';

        const nextDrawDateEn = `${monthNameEn} ${newEthDate.day}, ${newEthDate.year}`;
        const nextDrawDateAm = `${monthNameAm} ${newEthDate.day}፣ ${newEthDate.year}`;

        setSettings(prev => ({
          ...prev,
          cycle: nextCycle,
          daysRemaining: 30,
          drawDate: nextDrawIso,
          nextDrawDateEn: nextDrawDateEn,
          nextDrawDateAm: nextDrawDateAm,
          currentWinner: null
        }));

        setEthDate(newEthDate);

        for (const u of users) {
             if (u.id) {
                 await updateDoc(doc(db, 'users', u.id.toString()), {
                     status: 'PENDING',
                     contribution: 0,
                     prizeNumber: null
                 } as any);
             }
        }

        const newNotification: AppNotification = {
          id: Date.now(),
          title: { en: `Cycle ${nextCycle} Started`, am: `ዙር ${nextCycle} ተጀምሯል` },
          desc: { 
            en: `Cycle ${nextCycle} has officially begun! The next draw is scheduled for ${nextDrawDateEn}. Please settle your payments.`,
            am: `ዙር ${nextCycle} በይፋ ተጀምሯል! ቀጣዩ እጣ የሚወጣው ${nextDrawDateAm} ነው። እባክዎ ክፍያዎን ያጠናቅቁ።` 
          },
          time: new Date(),
          urgent: true,
          read: false
        };
        addNotification(newNotification);

        showAlert('success', 'Cycle Started', `Cycle ${nextCycle} has been started successfully! Next draw set for ${nextDrawDateEn}.`);
      }
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = settings.adminPassword || 'admin123';
    if (password === adminPass) {
      setIsAuthenticated(true);
    } else {
      showAlert('error', t.login.failed, t.login.failedMsg);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 relative">
        {alertConfig.isOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={closeAlert}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-100" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-red-50 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-red-800 flex items-center">
                        <XCircle className="w-6 h-6 mr-2" /> {t.login.failed}
                    </h3>
                    <button onClick={closeAlert} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                    <p className="text-stone-600 mb-6">{alertConfig.message}</p>
                    <button onClick={closeAlert} className="w-full px-4 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-700 transition-colors">OK</button>
                </div>
            </div>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-stone-800 p-3 rounded-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-6">{t.login.title}</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">{t.login.label}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder={t.login.placeholder}
              />
            </div>
            <button className="w-full bg-emerald-900 text-white font-bold py-2 rounded-lg hover:bg-emerald-800 transition-colors">
              {t.login.btn}
            </button>
            <button 
              type="button" 
              onClick={() => setView('landing')}
              className="w-full text-stone-500 text-sm hover:text-stone-800"
            >
              {t.login.back}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex relative overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in-down"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Custom Alert/Confirm Modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={closeAlert}>
           <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 border border-stone-200" onClick={e => e.stopPropagation()}>
              <div className={`p-4 flex items-center justify-between ${
                 alertConfig.type === 'error' ? 'bg-red-50' : 
                 alertConfig.type === 'success' ? 'bg-emerald-50' : 
                 alertConfig.type === 'warning' || alertConfig.type === 'confirm' ? 'bg-amber-50' : 'bg-blue-50'
              }`}>
                 <h3 className={`font-bold text-lg flex items-center ${
                     alertConfig.type === 'error' ? 'text-red-800' : 
                     alertConfig.type === 'success' ? 'text-emerald-800' : 
                     alertConfig.type === 'warning' || alertConfig.type === 'confirm' ? 'text-amber-800' : 'text-blue-800'
                 }`}>
                    {alertConfig.type === 'error' && <XCircle className="w-6 h-6 mr-2" />}
                    {alertConfig.type === 'success' && <CheckCircle className="w-6 h-6 mr-2" />}
                    {(alertConfig.type === 'warning' || alertConfig.type === 'confirm') && <AlertCircle className="w-6 h-6 mr-2" />}
                    {alertConfig.title}
                 </h3>
                 <button onClick={closeAlert} className="opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                 <p className="text-stone-600 mb-6 whitespace-pre-line text-sm leading-relaxed">{alertConfig.message}</p>
                 <div className="flex space-x-3">
                    {alertConfig.type === 'confirm' && (
                        <button 
                            onClick={() => { alertConfig.onConfirm?.(); closeAlert(); }}
                            className="flex-1 px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 shadow-md transition-colors"
                        >
                            Confirm
                        </button>
                    )}
                    <button 
                        onClick={closeAlert} 
                        className={`flex-1 px-4 py-2 font-bold rounded-lg transition-colors ${alertConfig.type === 'confirm' ? 'bg-stone-200 text-stone-700 hover:bg-stone-300' : 'bg-stone-800 text-white hover:bg-stone-700'}`}
                    >
                        {alertConfig.type === 'confirm' ? 'Cancel' : 'OK'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Image Modal for Receipts */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in-down" onClick={() => setSelectedReceipt(null)}>
           <div className="relative max-w-2xl w-full">
              <button className="absolute -top-12 right-0 text-white hover:text-red-500" onClick={() => setSelectedReceipt(null)}>
                 <X className="w-8 h-8" />
              </button>
              <img src={selectedReceipt} alt="Receipt" className="w-full rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
           </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
         fixed md:relative z-50 w-64 h-full bg-stone-900 text-stone-300 flex flex-col transition-transform duration-300
         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{t.sidebar.title}</h2>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> {t.sidebar.dashboard}
          </button>
          <button 
            onClick={() => handleTabChange('competition')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'competition' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Trophy className="w-5 h-5 mr-3" /> {t.sidebar.competition}
          </button>
          <button 
            onClick={() => handleTabChange('prizes')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'prizes' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Gift className="w-5 h-5 mr-3" /> {t.sidebar.prizes}
          </button>
          <button 
            onClick={() => handleTabChange('users')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Users className="w-5 h-5 mr-3" /> {t.sidebar.users}
          </button>
          <button 
            onClick={() => handleTabChange('payments')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'payments' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <div className="relative mr-3">
               <DollarSign className="w-5 h-5" />
               {paymentRequests.length > 0 && (
                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 h-4 min-w-[16px] flex items-center justify-center rounded-full animate-pulse">
                       {paymentRequests.length}
                   </span>
               )}
            </div>
            {t.sidebar.payments}
          </button>
          <button 
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> {t.sidebar.settings}
          </button>
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button 
            onClick={() => setView('landing')}
            className="w-full flex items-center px-4 py-3 text-stone-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> {t.sidebar.exit}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Mobile */}
        <header className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center z-30">
           <button onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6 text-stone-700" /></button>
           <h1 className="font-bold text-stone-800">
              {activeTab === 'dashboard' ? t.sidebar.dashboard : 
               activeTab === 'competition' ? t.sidebar.competition :
               activeTab === 'prizes' ? t.sidebar.prizes :
               activeTab === 'users' ? t.sidebar.users : 
               activeTab === 'payments' ? t.sidebar.payments : t.sidebar.settings}
           </h1>
           <div className="w-6"></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
            {activeTab === 'dashboard' && (
                <AdminDashboard 
                    settings={settings}
                    tickets={tickets}
                    users={users}
                    paymentRequests={paymentRequests}
                    setActiveTab={setActiveTab}
                    handleStartNewCycle={handleStartNewCycle}
                    t={t}
                />
            )}

            {activeTab === 'competition' && (
                <AdminCompetition 
                    settings={settings}
                    localSettings={localSettings}
                    setLocalSettings={setLocalSettings}
                    handleSaveSection={handleSaveSection}
                    ethDate={ethDate}
                    handleEthDateChange={handleEthDateChange}
                    newImageUrl={newImageUrl}
                    setNewImageUrl={setNewImageUrl}
                    handleAddImage={handleAddImage}
                    handleRemoveImage={handleRemoveImage}
                    tickets={tickets}
                    users={users}
                    showAlert={showAlert}
                    t={t}
                />
            )}

            {activeTab === 'prizes' && (
                <AdminPrizes 
                    settings={settings}
                    setSettings={setSettings}
                    tickets={tickets}
                    users={users}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                    t={t}
                />
            )}

            {activeTab === 'users' && (
                <AdminUsers 
                    users={users}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                    t={t}
                />
            )}

            {activeTab === 'payments' && (
                <AdminPayments 
                    paymentRequests={paymentRequests}
                    users={users}
                    tickets={tickets}
                    settings={settings}
                    showAlert={showAlert}
                    setSelectedReceipt={setSelectedReceipt}
                    t={t}
                />
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-stone-800">{t.settings.title}</h1>

                    {/* General Preferences (Language) */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Globe className="w-5 h-5 mr-2 text-stone-600" /> {t.settings.general}
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-stone-800">{t.settings.langTitle}</h3>
                                <p className="text-sm text-stone-500">{t.settings.langDesc}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-lg border border-stone-100">
                                <span className={`text-xs font-bold ${language === 'en' ? 'text-stone-800' : 'text-stone-400'}`}>ENG</span>
                                <button 
                                    onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${language === 'am' ? 'bg-emerald-600' : 'bg-stone-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${language === 'am' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className={`text-xs font-bold ${language === 'am' ? 'text-emerald-800' : 'text-stone-400'}`}>AMH</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Shield className="w-5 h-5 mr-2 text-stone-600" /> {t.settings.security}
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                 <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg border border-stone-200">
                                     <div>
                                         <h3 className="font-bold text-stone-800">{t.settings.userReg}</h3>
                                         <p className="text-sm text-stone-500">{t.settings.userRegDesc}</p>
                                     </div>
                                     <button 
                                       onClick={() => setLocalSettings(prev => ({ ...prev, registrationEnabled: !prev.registrationEnabled }))}
                                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.registrationEnabled ? 'bg-emerald-600' : 'bg-stone-300'}`}
                                     >
                                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                     </button>
                                 </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-stone-700">{t.settings.changePass}</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        placeholder="New Password"
                                        className="flex-1 p-2 border border-stone-300 rounded-lg"
                                        id="new-admin-password" 
                                    />
                                    <button 
                                        onClick={() => {
                                            const input = document.getElementById('new-admin-password') as HTMLInputElement;
                                            if(input.value) {
                                                 setSettings(prev => ({ ...prev, adminPassword: input.value }));
                                                 input.value = '';
                                                 showAlert('success', 'Password Updated', 'Admin access key has been changed.');
                                            }
                                        }}
                                        className="px-4 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-700"
                                    >
                                        {t.settings.update}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                             <button onClick={() => handleSaveSection('Account & Security')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                <Save className="w-4 h-4 mr-2" /> {t.settings.save}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AdminView;
