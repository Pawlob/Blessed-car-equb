import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, TrendingUp, AlertCircle, FileText, ZoomIn, X, Check, Menu, Image as ImageIcon, RefreshCw, Video, PlayCircle, Calendar, Clock
} from 'lucide-react';
import { User, AppSettings, ViewState } from '../types';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

interface PaymentRequest {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  amount: number;
  date: string;
  receiptUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// --- Ethiopian Calendar Utils ---

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

// Convert Ethiopian Date to Gregorian string (YYYY-MM-DD)
const getGregorianFromEthiopian = (year: number, month: number, day: number) => {
    // Eth New Year is Sep 11, or Sep 12 if the *next* Gregorian year is a leap year.
    // Greg Leap years: 2024, 2028, 2032...
    // Sep 2023 -> Next is 2024 (Leap) -> Sep 12
    // Sep 2024 -> Next is 2025 (Not Leap) -> Sep 11
    // Sep 2025 -> Next is 2026 (Not Leap) -> Sep 11
    // Sep 2026 -> Next is 2027 (Not Leap) -> Sep 11
    // Sep 2027 -> Next is 2028 (Leap) -> Sep 12
    
    // Determine the Gregorian year that contains the start of this Ethiopian year
    // Eth Year Y starts in Greg Year Y + 7
    const startGregYear = year + 7;
    const nextGregYear = startGregYear + 1;
    const isNextGregLeap = (nextGregYear % 4 === 0 && nextGregYear % 100 !== 0) || (nextGregYear % 400 === 0);
    const startDay = isNextGregLeap ? 12 : 11;

    // Create anchor date (Meskerem 1)
    const anchor = new Date(startGregYear, 8, startDay); // Sept is month 8
    
    // Add days
    // (Month-1) * 30 + (Day-1)
    const daysToAdd = (month - 1) * 30 + (day - 1);
    anchor.setDate(anchor.getDate() + daysToAdd);

    // Format to YYYY-MM-DD
    return anchor.toISOString().split('T')[0];
};

// Convert Gregorian string to Ethiopian Date Object
const getEthiopianFromGregorian = (gregDateStr: string) => {
    const date = new Date(gregDateStr);
    const gregYear = date.getFullYear();
    
    // Determine the start of the Ethiopian year for this Gregorian year
    // Check if we are before or after the Eth New Year (Sep 11/12) of this Greg year
    
    const nextGregYear = gregYear + 1;
    const isNextGregLeap = (nextGregYear % 4 === 0 && nextGregYear % 100 !== 0) || (nextGregYear % 400 === 0);
    const newYearDayInThisGregYear = isNextGregLeap ? 12 : 11;
    const ethNewYearDate = new Date(gregYear, 8, newYearDayInThisGregYear); // Sept
    
    let ethYear, diffDays;

    if (date >= ethNewYearDate) {
        // We are in the beginning of Eth Year = gregYear - 7
        ethYear = gregYear - 7;
        const diffTime = date.getTime() - ethNewYearDate.getTime();
        diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
        // We are at the end of Eth Year = gregYear - 8
        ethYear = gregYear - 8;
        // Find New Year of previous Greg year
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

// --- Mock Data ---

const MOCK_USERS: User[] = [
  { id: 101, name: "Abebe Kebede", phone: "0911234567", status: "VERIFIED", contribution: 30000, prizeNumber: 14, joinedDate: "Jan 12, 2024" },
  { id: 102, name: "Tigist Haile", phone: "0922558899", status: "PENDING", contribution: 0, joinedDate: "Feb 01, 2024" },
  { id: 103, name: "Dawit Mulugeta", phone: "0933447788", status: "VERIFIED", contribution: 60000, prizeNumber: 42, joinedDate: "Dec 10, 2023" },
  { id: 104, name: "Sara Tesfaye", phone: "0944112233", status: "PENDING", contribution: 5000, joinedDate: "Feb 15, 2024" },
  { id: 105, name: "Yonas Alemu", phone: "0912341234", status: "VERIFIED", contribution: 15000, prizeNumber: 5, joinedDate: "Jan 20, 2024" },
];

const MOCK_PAYMENT_REQUESTS: PaymentRequest[] = [
  {
    id: 1,
    userId: 102,
    userName: "Tigist Haile",
    userPhone: "0922558899",
    amount: 5000,
    date: "Feb 28, 2024",
    receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400", 
    status: 'PENDING'
  },
  {
    id: 2,
    userId: 104,
    userName: "Sara Tesfaye",
    userPhone: "0944112233",
    amount: 5000,
    date: "Feb 27, 2024",
    receiptUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=400", 
    status: 'PENDING'
  }
];

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'payments'>('dashboard');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(MOCK_PAYMENT_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Handle Eth Date Change
  const handleEthDateChange = (field: 'year' | 'month' | 'day', value: number) => {
      const newEthDate = { ...ethDate, [field]: value };
      setEthDate(newEthDate);
      
      // Calculate new Gregorian date and update global settings
      const newGregString = getGregorianFromEthiopian(newEthDate.year, newEthDate.month, newEthDate.day);
      setSettings(prev => ({ ...prev, drawDate: newGregString }));
  };

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

  // Alert Helpers
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };
  
  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      showAlert('error', 'Login Failed', 'The access key you provided is incorrect. Please try again.');
    }
  };

  // User Management
  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, status: u.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED' } : u
    ));
  };

  // Payment Verification Actions
  const handleApprovePayment = (reqId: number, userId: number, amount: number) => {
    // Remove from requests
    setPaymentRequests(prev => prev.filter(req => req.id !== reqId));
    
    // Update user status and contribution
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: 'VERIFIED', contribution: u.contribution + amount } 
        : u
    ));
    showAlert('success', 'Payment Verified', 'User has been verified and contribution updated successfully.');
  };

  const handleRejectPayment = (reqId: number) => {
    setPaymentRequests(prev => prev.filter(req => req.id !== reqId));
    showAlert('info', 'Payment Rejected', 'The payment has been rejected. A notification has been sent to the user.');
  };

  // Start New Cycle Logic
  const handleStartNewCycle = () => {
    const nextCycle = settings.cycle + 1;
    
    showConfirm(
      'Start New Cycle?',
      `Are you sure you want to start Cycle ${nextCycle}?\n\nThis will RESET:\n• Pot Value to 0\n• Member Contributions to 0\n• Member Status to Pending\n• Clear all Tickets & Requests`,
      () => {
        // 1. Reset Global Settings
        setSettings(prev => ({
          ...prev,
          cycle: nextCycle,
          potValue: 0,
          daysRemaining: 30, // Reset timer to default 30 days
        }));

        // 2. Reset All Users
        setUsers(prevUsers => prevUsers.map(u => ({
          ...u,
          status: 'PENDING',
          contribution: 0,
          prizeNumber: undefined // Clear tickets
        })));

        // 3. Clear Pending Requests
        setPaymentRequests([]);

        showAlert('success', 'Cycle Started', `Cycle ${nextCycle} has been started successfully!`);
      }
    );
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // Helper
  const formatTicket = (num: number) => num.toString().padStart(3, '0');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 relative">
        {/* Render Alert in Login View too if needed */}
        {alertConfig.isOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={closeAlert}>
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-100" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-red-50 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-red-800 flex items-center">
                        <XCircle className="w-6 h-6 mr-2" /> Login Failed
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
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-6">Admin Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">Access Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Enter password"
              />
            </div>
            <button className="w-full bg-emerald-900 text-white font-bold py-2 rounded-lg hover:bg-emerald-800 transition-colors">
              Login
            </button>
            <button 
              type="button" 
              onClick={() => setView('landing')}
              className="w-full text-stone-500 text-sm hover:text-stone-800"
            >
              Back to Site
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={closeAlert}>
           <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-100" onClick={e => e.stopPropagation()}>
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
                    {alertConfig.type === 'info' && <AlertCircle className="w-6 h-6 mr-2" />}
                    {alertConfig.title}
                 </h3>
                 <button onClick={closeAlert} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                 <p className="text-stone-600 whitespace-pre-line leading-relaxed">{alertConfig.message}</p>
                 
                 <div className="mt-6 flex justify-end gap-3">
                    {alertConfig.type === 'confirm' ? (
                       <>
                          <button 
                            onClick={closeAlert}
                            className="px-4 py-2 text-stone-500 font-bold hover:bg-stone-100 rounded-lg transition-colors"
                          >
                             Cancel
                          </button>
                          <button 
                            onClick={() => {
                               if (alertConfig.onConfirm) alertConfig.onConfirm();
                               closeAlert();
                            }}
                            className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-colors"
                          >
                             Confirm
                          </button>
                       </>
                    ) : (
                       <button 
                         onClick={closeAlert}
                         className="w-full px-4 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-700 transition-colors"
                       >
                          OK
                       </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-down" onClick={() => setSelectedReceipt(null)}>
           <div className="relative max-w-3xl w-full h-full max-h-[85vh] flex flex-col justify-center" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute -top-12 right-0 text-white hover:text-stone-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img 
                src={selectedReceipt} 
                alt="Payment Receipt" 
                className="w-full h-full object-contain rounded-lg shadow-2xl bg-stone-900" 
              />
           </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-stone-300 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center">
             <Trophy className="w-6 h-6 mr-2 text-amber-500" /> Blessed Admin
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-stone-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => handleTabChange('payments')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'payments' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <FileText className="w-5 h-5 mr-3" /> Verification
            {paymentRequests.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {paymentRequests.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => handleTabChange('users')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Users className="w-5 h-5 mr-3" /> Members
          </button>
          <button 
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> App Settings
          </button>
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={() => setView('landing')} className="w-full flex items-center px-4 py-2 text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-screen w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-8">
            <div className="flex items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-3 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 active:scale-95 transition-transform">
                    <Menu className="w-6 h-6" /> 
                </button>
                <h1 className="text-2xl font-bold text-stone-800">Admin</h1>
            </div>
            <button onClick={() => setView('landing')} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-stone-800 hidden md:block">Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Total Pot</p>
                    <h3 className="text-2xl font-bold text-emerald-600">{settings.potValue.toLocaleString()} ETB</h3>
                  </div>
                  <div className="bg-emerald-100 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-emerald-600" /></div>
                </div>
                <div className="text-xs text-stone-400">Current Cycle Target</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Total Members</p>
                    <h3 className="text-2xl font-bold text-stone-800">{settings.totalMembers.toLocaleString()}</h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                </div>
                <div className="text-xs text-stone-400">+12 this week</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('payments')}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Pending Approvals</p>
                    <h3 className="text-2xl font-bold text-amber-600">{paymentRequests.length}</h3>
                  </div>
                  <div className="bg-amber-100 p-2 rounded-lg"><FileText className="w-6 h-6 text-amber-600" /></div>
                </div>
                <div className="text-xs text-stone-400">Requires verification</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Cycle</p>
                    <h3 className="text-2xl font-bold text-emerald-800">#{settings.cycle}</h3>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-emerald-800" /></div>
                </div>
                <div className="text-xs text-stone-400">Next draw: {settings.nextDrawDateEn}</div>
              </div>
            </div>

            {/* Recent Table Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h3 className="font-bold text-stone-800 mb-4">Recent Verified Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-stone-400 text-xs uppercase bg-stone-50">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.filter(u => u.status === 'VERIFIED').slice(0, 3).map((user) => (
                      <tr key={user.id}>
                         <td className="px-4 py-3 font-medium text-stone-700">{user.name}</td>
                         <td className="px-4 py-3 text-stone-600">{user.contribution.toLocaleString()} ETB</td>
                         <td className="px-4 py-3 text-stone-500">{user.joinedDate}</td>
                         <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Paid</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-stone-800 hidden md:block">Payment Verification</h2>
            
            {paymentRequests.length === 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">All Caught Up!</h3>
                  <p className="text-stone-500">There are no pending payment verifications at the moment.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentRequests.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                       <div>
                          <p className="font-bold text-stone-800">{req.userName}</p>
                          <p className="text-xs text-stone-500">{req.userPhone}</p>
                       </div>
                       <div className="text-right">
                          <p className="font-bold text-emerald-700">{req.amount.toLocaleString()} ETB</p>
                          <p className="text-xs text-stone-400">{req.date}</p>
                       </div>
                    </div>

                    {/* Image Preview */}
                    <div className="relative h-48 bg-stone-200 group overflow-hidden">
                       <img src={req.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => setSelectedReceipt(req.receiptUrl)}
                            className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                          >
                             <ZoomIn className="w-5 h-5 mr-2" /> View Full
                          </button>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 mt-auto grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handleRejectPayment(req.id)}
                         className="flex items-center justify-center py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                       >
                         <XCircle className="w-5 h-5 mr-2" /> Reject
                       </button>
                       <button 
                         onClick={() => handleApprovePayment(req.id, req.userId, req.amount)}
                         className="flex items-center justify-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-600/20"
                       >
                         <CheckCircle className="w-5 h-5 mr-2" /> Verify
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-stone-800 hidden md:block">Members Management</h2>
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-auto pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Contribution</th>
                      <th className="px-6 py-4">Ticket</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 text-stone-500">#{user.id}</td>
                        <td className="px-6 py-4 font-bold text-stone-800">{user.name}</td>
                        <td className="px-6 py-4 text-stone-600">{user.phone}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-700">{user.contribution.toLocaleString()} ETB</td>
                        <td className="px-6 py-4 text-amber-600 font-bold">{user.prizeNumber ? `#${formatTicket(user.prizeNumber)}` : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleUserStatus(user.id!)}
                            className={`p-2 rounded-lg transition-colors mr-2 ${user.status === 'VERIFIED' ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                            title={user.status === 'VERIFIED' ? "Revoke Verification" : "Verify User"}
                          >
                            {user.status === 'VERIFIED' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-stone-500">No members found matching your search.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl animate-fade-in-up">
            <h2 className="text-3xl font-bold text-stone-800 hidden md:block">App Configuration</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-6">
               
               <div className="pb-4 border-b border-stone-100">
                  <h3 className="font-bold text-stone-800 flex items-center mb-4"><Settings className="w-5 h-5 mr-2 text-emerald-600"/> General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Total Pot Value (ETB)</label>
                          <input 
                            type="number" 
                            value={settings.potValue}
                            onChange={(e) => setSettings({...settings, potValue: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Total Members</label>
                          <input 
                            type="number" 
                            value={settings.totalMembers}
                            onChange={(e) => setSettings({...settings, totalMembers: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Current Cycle</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={settings.cycle}
                              onChange={(e) => setSettings({...settings, cycle: parseInt(e.target.value)})}
                              className="w-24 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <button 
                              onClick={handleStartNewCycle}
                              className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center transition-colors"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Start Cycle {settings.cycle + 1}
                            </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Draw Date (Ethiopian Cal.)</label>
                          <div className="grid grid-cols-3 gap-2">
                              {/* Month */}
                              <select 
                                value={ethDate.month}
                                onChange={(e) => handleEthDateChange('month', parseInt(e.target.value))}
                                className="col-span-1 px-2 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                              >
                                {ETHIOPIAN_MONTHS.map(m => (
                                    <option key={m.val} value={m.val}>{m.name}</option>
                                ))}
                              </select>
                              
                              {/* Day */}
                              <input 
                                type="number" 
                                min="1" max="30"
                                value={ethDate.day}
                                onChange={(e) => handleEthDateChange('day', parseInt(e.target.value))}
                                className="col-span-1 px-2 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                                placeholder="Day"
                              />

                              {/* Year */}
                              <input 
                                type="number" 
                                min="2000" max="2100"
                                value={ethDate.year}
                                onChange={(e) => handleEthDateChange('year', parseInt(e.target.value))}
                                className="col-span-1 px-2 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                                placeholder="Year"
                              />
                          </div>
                          <div className="mt-1 text-xs text-stone-400">
                             System Date: {settings.drawDate}
                          </div>
                      </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                     <span className="text-sm font-bold text-emerald-800 flex items-center">
                       <Clock className="w-4 h-4 mr-2" /> Live Countdown
                     </span>
                     <span className="text-xl font-bold text-emerald-600">{settings.daysRemaining} Days</span>
                  </div>

                   <div className="mt-4">
                       <label className="block text-sm font-bold text-stone-700 mb-2">Next Draw Date (English Display)</label>
                       <input 
                         type="text" 
                         value={settings.nextDrawDateEn}
                         onChange={(e) => setSettings({...settings, nextDrawDateEn: e.target.value})}
                         className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                         placeholder="e.g. Yekatit 21, 2018"
                       />
                   </div>

                   <div className="mt-4">
                       <label className="block text-sm font-bold text-stone-700 mb-2">Next Draw Date (Amharic Display)</label>
                       <input 
                         type="text" 
                         value={settings.nextDrawDateAm}
                         onChange={(e) => setSettings({...settings, nextDrawDateAm: e.target.value})}
                         className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-sans"
                         placeholder="e.g. የካቲት 21፣ 2018"
                       />
                   </div>
               </div>

               {/* Live Stream Settings */}
               <div className="pb-4 border-b border-stone-100">
                   <h3 className="font-bold text-stone-800 flex items-center mb-4"><Video className="w-5 h-5 mr-2 text-red-500"/> Live Stream Configuration</h3>
                   
                   <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                       <div className="flex items-center justify-between mb-4">
                           <span className="font-bold text-stone-700">Live Status</span>
                           <button 
                             onClick={() => setSettings({...settings, isLive: !settings.isLive})}
                             className={`px-4 py-1.5 rounded-full font-bold text-sm transition-colors ${settings.isLive ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-stone-300 text-stone-500'}`}
                           >
                              {settings.isLive ? 'LIVE NOW' : 'OFFLINE'}
                           </button>
                       </div>
                       
                       <div>
                           <label className="block text-sm font-bold text-stone-700 mb-2">Stream URL (TikTok/Instagram)</label>
                           <input 
                             type="text" 
                             value={settings.liveStreamUrl}
                             onChange={(e) => setSettings({...settings, liveStreamUrl: e.target.value})}
                             className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                             placeholder="e.g. https://www.tiktok.com/@user/live or Embed URL"
                           />
                           <p className="text-xs text-stone-400 mt-2">
                             Enter the full URL to the live stream. If the platform allows embedding, it will be displayed directly. Otherwise, a button will be provided to open the app.
                           </p>
                       </div>
                   </div>
               </div>

               <div className="pb-4 border-b border-stone-100">
                   <h3 className="font-bold text-stone-800 flex items-center mb-4"><Trophy className="w-5 h-5 mr-2 text-amber-500"/> Winner Spotlight</h3>
                   
                   <div className="space-y-4">
                      {settings.recentWinners.map((winner, index) => (
                        <div key={winner.id} className="bg-stone-50 p-4 rounded-lg border border-stone-200 relative">
                           <div className="absolute top-2 right-2 text-xs font-bold text-stone-300">#{index + 1}</div>
                           
                           {/* English Fields */}
                           <div className="mb-4 pb-4 border-b border-stone-200">
                               <p className="text-xs font-bold text-stone-400 mb-2 uppercase">English Details</p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Name (EN)</label>
                                      <input 
                                        type="text" 
                                        value={winner.name}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, name: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Prize (EN)</label>
                                      <input 
                                        type="text" 
                                        value={winner.prize}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, prize: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Cycle (EN)</label>
                                      <input 
                                        type="text" 
                                        value={winner.cycle}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, cycle: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Location (EN)</label>
                                      <input 
                                        type="text" 
                                        value={winner.location}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, location: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                      />
                                  </div>
                               </div>
                           </div>

                           {/* Amharic Fields */}
                           <div>
                               <p className="text-xs font-bold text-emerald-600 mb-2 uppercase">Amharic Details</p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Name (AM)</label>
                                      <input 
                                        type="text" 
                                        value={winner.nameAm}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, nameAm: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Prize (AM)</label>
                                      <input 
                                        type="text" 
                                        value={winner.prizeAm}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, prizeAm: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Cycle (AM)</label>
                                      <input 
                                        type="text" 
                                        value={winner.cycleAm}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, cycleAm: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-stone-500 mb-1">Location (AM)</label>
                                      <input 
                                        type="text" 
                                        value={winner.locationAm}
                                        onChange={(e) => {
                                          const newWinners = [...settings.recentWinners];
                                          newWinners[index] = { ...winner, locationAm: e.target.value };
                                          setSettings({ ...settings, recentWinners: newWinners });
                                        }}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                                      />
                                  </div>
                                </div>
                           </div>
                        </div>
                      ))}
                   </div>
               </div>

               <div className="pb-4 border-b border-stone-100">
                   <h3 className="font-bold text-stone-800 flex items-center mb-4"><Trophy className="w-5 h-5 mr-2 text-amber-500"/> Prize Configuration</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Prize Name</label>
                          <input 
                            type="text" 
                            value={settings.prizeName}
                            onChange={(e) => setSettings({...settings, prizeName: e.target.value})}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Toyota Corolla Cross 2025"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Prize Value Label</label>
                          <input 
                            type="text" 
                            value={settings.prizeValue}
                            onChange={(e) => setSettings({...settings, prizeValue: e.target.value})}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. ETB 4.5M"
                          />
                      </div>
                   </div>
                   <div className="mt-4">
                      <label className="block text-sm font-bold text-stone-700 mb-2">Prize Image URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={settings.prizeImage}
                          onChange={(e) => setSettings({...settings, prizeImage: e.target.value})}
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="https://..."
                        />
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex-shrink-0 border border-stone-200 overflow-hidden">
                           <img src={settings.prizeImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'} />
                        </div>
                      </div>
                   </div>
               </div>

               <div>
                   <h3 className="font-bold text-stone-800 flex items-center mb-4"><TrendingUp className="w-5 h-5 mr-2 text-blue-500"/> Platform Stats</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Cars Delivered</label>
                          <input 
                            type="number" 
                            value={settings.carsDelivered}
                            onChange={(e) => setSettings({...settings, carsDelivered: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Trust Score (%)</label>
                          <input 
                            type="number" 
                            value={settings.trustScore}
                            onChange={(e) => setSettings({...settings, trustScore: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                   </div>
               </div>

               <div className="pt-4 border-t border-stone-100 flex justify-end">
                   <button className="flex items-center px-6 py-2 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors w-full md:w-auto justify-center">
                       <Save className="w-5 h-5 mr-2" /> Save Changes
                   </button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminView;