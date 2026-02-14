import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, TrendingUp, AlertCircle, FileText, ZoomIn, X, Check, Menu, Image as ImageIcon, RefreshCw, Video, PlayCircle, Calendar, Clock, Lock, Shield, Edit, Trash2, Plus, Filter
} from 'lucide-react';
import { User, AppSettings, ViewState, AppNotification } from '../types';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  addNotification: (notification: AppNotification) => void;
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

const AMHARIC_MONTHS = [
    "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሀምሌ", "ነሃሴ", "ጳጉሜ"
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

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings, addNotification }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'payments'>('dashboard');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(MOCK_PAYMENT_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

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
      
      // Calculate new Gregorian date
      const newGregString = getGregorianFromEthiopian(newEthDate.year, newEthDate.month, newEthDate.day);

      // Format display strings
      const monthIndex = newEthDate.month - 1;
      const monthNameEn = ETHIOPIAN_MONTHS[monthIndex]?.name.split(' ')[0] || '';
      const monthNameAm = AMHARIC_MONTHS[monthIndex] || '';

      const nextDrawDateEn = `${monthNameEn} ${newEthDate.day}, ${newEthDate.year}`;
      const nextDrawDateAm = `${monthNameAm} ${newEthDate.day}፣ ${newEthDate.year}`;
      
      // Update global settings
      setSettings(prev => ({ 
          ...prev, 
          drawDate: newGregString,
          nextDrawDateEn,
          nextDrawDateAm
      }));
  };

  // Auto-calculate Pot Value and Total Members based on Users
  useEffect(() => {
    // Calculate pot value based on verified users in the current cycle.
    // Assuming a fixed contribution of 5,000 ETB per verified member for the current cycle.
    const activePot = users.reduce((sum, user) => 
        user.status === 'VERIFIED' ? sum + 5000 : sum, 0
    );
    const memberCount = users.length;

    // Only update if different to avoid redundant renders/updates
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

  // Generic Save Handler
  const handleSaveSection = (sectionName: string) => {
    showConfirm(
        'Save Changes',
        `Are you sure you want to save changes to ${sectionName}?`,
        () => {
             // Simulate API call delay
             setTimeout(() => {
                 showAlert('success', 'Changes Saved', `${sectionName} has been successfully updated.`);
             }, 500);
        }
    );
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = settings.adminPassword || 'admin123';
    if (password === adminPass) {
      setIsAuthenticated(true);
    } else {
      showAlert('error', 'Login Failed', 'The access key you provided is incorrect. Please try again.');
    }
  };

  // User Management
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.phone) {
        showAlert('error', 'Missing Information', 'Name and Phone are required.');
        return;
    }

    if (editingUser.id) {
        // Update existing user
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as User : u));
        showAlert('success', 'User Updated', 'User details have been saved successfully.');
    } else {
        // Create new user
        const newId = Math.max(...users.map(u => u.id || 0), 100) + 1;
        const newUser: User = {
            id: newId,
            name: editingUser.name,
            phone: editingUser.phone,
            status: editingUser.status || 'PENDING',
            contribution: editingUser.contribution || 0,
            prizeNumber: editingUser.prizeNumber,
            joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        setUsers([...users, newUser]);
        showAlert('success', 'User Created', 'New user has been added successfully.');
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: number) => {
    showConfirm('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', () => {
        setUsers(users.filter(u => u.id !== id));
        showAlert('success', 'User Deleted', 'User has been removed from the system.');
    });
  };

  const openAddUser = () => {
    setEditingUser({ status: 'PENDING', contribution: 0 });
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsUserModalOpen(true);
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
      `Are you sure you want to start Cycle ${nextCycle}?\n\nThis will RESET:\n• Pot Value to 0\n• Member Contributions to 0\n• Member Status to Pending\n• Clear all Tickets & Requests\n• Next Draw Date to +30 days`,
      () => {
        // Calculate new draw date (30 days from now)
        const today = new Date();
        const nextDraw = new Date(today);
        nextDraw.setDate(today.getDate() + 30);
        const nextDrawIso = nextDraw.toISOString().split('T')[0];

        // Calculate Ethiopian date for the new draw date
        const newEthDate = getEthiopianFromGregorian(nextDrawIso);
        
        // Format display strings
        const monthIndex = newEthDate.month - 1;
        const monthNameEn = ETHIOPIAN_MONTHS[monthIndex]?.name.split(' ')[0] || '';
        const monthNameAm = AMHARIC_MONTHS[monthIndex] || '';

        const nextDrawDateEn = `${monthNameEn} ${newEthDate.day}, ${newEthDate.year}`;
        const nextDrawDateAm = `${monthNameAm} ${newEthDate.day}፣ ${newEthDate.year}`;

        // 1. Reset Global Settings
        // Note: Pot Value and Total Members will be auto-calculated by useEffect when users are reset
        setSettings(prev => ({
          ...prev,
          cycle: nextCycle,
          daysRemaining: 30, // Reset timer to default 30 days
          drawDate: nextDrawIso,
          nextDrawDateEn: nextDrawDateEn,
          nextDrawDateAm: nextDrawDateAm
        }));

        // Update local state for the date picker inputs
        setEthDate(newEthDate);

        // 2. Reset All Users
        setUsers(prevUsers => prevUsers.map(u => ({
          ...u,
          status: 'PENDING',
          contribution: 0,
          prizeNumber: undefined // Clear tickets
        })));

        // 3. Clear Pending Requests
        setPaymentRequests([]);

        // 4. Notify All Members
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // Helper - No padding
  const formatTicket = (num: number) => num.toString();

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

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={() => setIsUserModalOpen(false)}>
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                   <h3 className="font-bold text-lg text-stone-800 flex items-center">
                       {editingUser.id ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                       {editingUser.id ? 'Edit User' : 'Add New User'}
                   </h3>
                   <button onClick={() => setIsUserModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
               </div>
               <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                       <div className="col-span-2">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Full Name</label>
                           <input 
                             type="text" 
                             required
                             value={editingUser.name || ''}
                             onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                             className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                             placeholder="e.g. Abebe Kebede"
                           />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Phone Number</label>
                           <input 
                             type="text" 
                             required
                             value={editingUser.phone || ''}
                             onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                             className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                             placeholder="0911..."
                           />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Status</label>
                           <select 
                             value={editingUser.status || 'PENDING'}
                             onChange={e => setEditingUser({...editingUser, status: e.target.value as 'PENDING' | 'VERIFIED'})}
                             className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                           >
                               <option value="PENDING">Pending</option>
                               <option value="VERIFIED">Verified</option>
                           </select>
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Total Contribution (ETB)</label>
                           <input 
                             type="number" 
                             value={editingUser.contribution || 0}
                             onChange={e => setEditingUser({...editingUser, contribution: parseInt(e.target.value) || 0})}
                             className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                           />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Ticket Number (Opt)</label>
                           <input 
                             type="number" 
                             value={editingUser.prizeNumber || ''}
                             onChange={e => setEditingUser({...editingUser, prizeNumber: e.target.value ? parseInt(e.target.value) : undefined})}
                             className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                             placeholder="Ticket #"
                           />
                       </div>
                   </div>
                   <div className="pt-4 flex justify-end space-x-3">
                       <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-stone-600 font-bold hover:bg-stone-100 rounded-lg">Cancel</button>
                       <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center">
                           <Save className="w-4 h-4 mr-2" /> Save User
                       </button>
                   </div>
               </form>
           </div>
        </div>
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
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => handleTabChange('users')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Users className="w-5 h-5 mr-3" /> User Management
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
            Verify Payments
          </button>
          <button 
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> App Settings
          </button>
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button 
            onClick={() => setView('landing')}
            className="w-full flex items-center px-4 py-3 text-stone-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Mobile */}
        <header className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center z-30">
           <button onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6 text-stone-700" /></button>
           <h1 className="font-bold text-stone-800">
              {activeTab === 'dashboard' ? 'Dashboard' : 
               activeTab === 'users' ? 'User Management' : 
               activeTab === 'payments' ? 'Payment Verification' : 'Settings'}
           </h1>
           <div className="w-6"></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
            
            {/* --- DASHBOARD TAB --- */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-stone-800 hidden md:block">Dashboard Overview</h1>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-stone-500 text-sm font-bold uppercase">Total Pot</h3>
                              <DollarSign className="w-5 h-5 text-emerald-500" />
                           </div>
                           <p className="text-2xl font-bold text-stone-800">{settings.potValue.toLocaleString()} ETB</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-stone-500 text-sm font-bold uppercase">Total Members</h3>
                              <Users className="w-5 h-5 text-blue-500" />
                           </div>
                           <p className="text-2xl font-bold text-stone-800">{settings.totalMembers.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-stone-500 text-sm font-bold uppercase">Pending Verifications</h3>
                              <FileText className="w-5 h-5 text-amber-500" />
                           </div>
                           <p className="text-2xl font-bold text-stone-800">{paymentRequests.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-stone-500 text-sm font-bold uppercase">Current Cycle</h3>
                              <RefreshCw className="w-5 h-5 text-purple-500" />
                           </div>
                           <p className="text-2xl font-bold text-stone-800">Cycle {settings.cycle}</p>
                        </div>
                    </div>

                    {/* Cycle Control */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-stone-800">Cycle Management</h3>
                                <p className="text-stone-500 text-sm">Control the current lottery cycle status</p>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold uppercase">Active</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                             <button 
                               onClick={handleStartNewCycle}
                               className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg transition-colors flex items-center"
                             >
                                <RefreshCw className="w-4 h-4 mr-2" /> Start New Cycle
                             </button>
                             <div className="px-4 py-2 bg-stone-100 rounded-lg text-stone-600 text-sm flex items-center">
                                <Clock className="w-4 h-4 mr-2" /> Next Draw: {settings.daysRemaining} days remaining
                             </div>
                        </div>
                    </div>

                    {/* Recent Payments Preview */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                           <h3 className="font-bold text-stone-800">Recent Payment Requests</h3>
                           <button onClick={() => setActiveTab('payments')} className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
                        </div>
                        {paymentRequests.length === 0 ? (
                            <div className="p-8 text-center text-stone-500">No pending payments.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Amount</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {paymentRequests.slice(0, 3).map((req) => (
                                        <tr key={req.id}>
                                            <td className="px-6 py-4 font-medium">{req.userName}</td>
                                            <td className="px-6 py-4">{req.amount} ETB</td>
                                            <td className="px-6 py-4 text-stone-500 text-sm">{req.date}</td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => setActiveTab('payments')} className="text-emerald-600 hover:underline text-sm font-bold">Review</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* --- USERS TAB --- */}
            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold text-stone-800">User Management</h1>
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                           {/* Filter */}
                           <div className="relative">
                               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                   <Filter className="w-4 h-4 text-stone-400" />
                               </div>
                               <select 
                                 value={statusFilter}
                                 onChange={(e) => setStatusFilter(e.target.value as any)}
                                 className="pl-9 pr-8 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-auto appearance-none bg-white"
                               >
                                   <option value="ALL">All Status</option>
                                   <option value="VERIFIED">Verified</option>
                                   <option value="PENDING">Pending</option>
                               </select>
                           </div>

                           {/* Search */}
                           <div className="relative flex-grow sm:flex-grow-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search users..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64"
                                />
                           </div>

                            {/* Save Button */}
                            <button 
                             onClick={() => handleSaveSection('User Database')}
                             className="flex items-center justify-center px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 font-bold shadow-md transition-colors"
                           >
                               <Save className="w-4 h-4 mr-2" /> Save Changes
                           </button>

                           {/* Add Button */}
                           <button 
                             onClick={openAddUser}
                             className="flex items-center justify-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow-md transition-colors"
                           >
                               <Plus className="w-4 h-4 mr-2" /> Add User
                           </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">This Month</th>
                                        <th className="px-6 py-3">Total Contrib.</th>
                                        <th className="px-6 py-3">Ticket #</th>
                                        <th className="px-6 py-3">Joined</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-stone-50 group transition-colors">
                                            <td className="px-6 py-4 text-stone-500 text-sm">#{user.id}</td>
                                            <td className="px-6 py-4 font-bold text-stone-800">{user.name}</td>
                                            <td className="px-6 py-4 text-stone-600">{user.phone}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    user.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {user.status === 'VERIFIED' ? (
                                                    <span className="text-emerald-600 font-bold">+5,000</span>
                                                ) : (
                                                    <span className="text-stone-300">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-stone-500">{user.contribution.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                {user.prizeNumber ? (
                                                    <span className="bg-stone-800 text-white px-2 py-1 rounded text-xs font-bold">
                                                        {formatTicket(user.prizeNumber)}
                                                    </span>
                                                ) : <span className="text-stone-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-stone-400 text-sm">{user.joinedDate}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => openEditUser(user)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.id!)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="text-center py-12 text-stone-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="w-8 h-8 text-stone-300 mb-2" />
                                                    <p>No users found matching your search.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-xs text-stone-500 flex justify-between items-center">
                             <span>Showing {filteredUsers.length} users</span>
                             {users.length > 20 && (
                                <div className="flex space-x-1">
                                    <button className="px-2 py-1 border border-stone-300 rounded hover:bg-white disabled:opacity-50">Prev</button>
                                    <button className="px-2 py-1 border border-stone-300 rounded hover:bg-white">Next</button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- PAYMENTS TAB --- */}
            {activeTab === 'payments' && (
                <div className="space-y-6 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-stone-800">Pending Payments</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paymentRequests.map((req) => (
                            <div key={req.id} className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="h-48 bg-stone-100 relative group cursor-pointer" onClick={() => setSelectedReceipt(req.receiptUrl)}>
                                    <img src={req.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ZoomIn className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-stone-800">{req.userName}</h3>
                                            <p className="text-stone-500 text-sm">{req.userPhone}</p>
                                        </div>
                                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">PENDING</span>
                                    </div>
                                    <div className="bg-stone-50 p-3 rounded-lg mb-6 flex justify-between items-center">
                                        <span className="text-stone-500 text-sm">Amount Declared:</span>
                                        <span className="font-bold text-emerald-700">{req.amount.toLocaleString()} ETB</span>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button 
                                            onClick={() => handleRejectPayment(req.id)}
                                            className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleApprovePayment(req.id, req.userId, req.amount)}
                                            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold transition-colors shadow-lg shadow-emerald-200"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {paymentRequests.length === 0 && (
                        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-800 mb-2">All Caught Up!</h3>
                            <p className="text-stone-500">There are no pending payment verifications at the moment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-stone-800">App Settings</h1>
                    
                    {/* Account & Security Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Shield className="w-5 h-5 mr-2 text-stone-600" /> Account & Security
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Registration Control */}
                            <div className="space-y-4">
                                 <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg border border-stone-200">
                                     <div>
                                         <h3 className="font-bold text-stone-800">User Registration</h3>
                                         <p className="text-sm text-stone-500">Allow new users to create accounts</p>
                                     </div>
                                     <button 
                                       onClick={() => setSettings(prev => ({ ...prev, registrationEnabled: !prev.registrationEnabled }))}
                                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.registrationEnabled ? 'bg-emerald-600' : 'bg-stone-300'}`}
                                     >
                                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.registrationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                     </button>
                                 </div>
                                 <p className="text-xs text-stone-500">
                                    When disabled, the registration form will be hidden on the login page.
                                 </p>
                            </div>

                            {/* Password Change */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-stone-700">Change Admin Password</label>
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
                                        Update
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                             <button onClick={() => handleSaveSection('Account & Security')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                             </button>
                        </div>
                    </div>

                    {/* Draw Schedule Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> Draw Schedule
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-stone-700">Set Next Draw Date (Ethiopian Calendar)</label>
                                <div className="flex space-x-2">
                                    <select 
                                        value={ethDate.month}
                                        onChange={(e) => handleEthDateChange('month', parseInt(e.target.value))}
                                        className="flex-1 p-2 border border-stone-300 rounded-lg"
                                    >
                                        {ETHIOPIAN_MONTHS.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                                    </select>
                                    <select 
                                        value={ethDate.day}
                                        onChange={(e) => handleEthDateChange('day', parseInt(e.target.value))}
                                        className="w-20 p-2 border border-stone-300 rounded-lg"
                                    >
                                        {[...Array(30)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                                    </select>
                                    <input 
                                        type="number" 
                                        value={ethDate.year}
                                        onChange={(e) => handleEthDateChange('year', parseInt(e.target.value))}
                                        className="w-24 p-2 border border-stone-300 rounded-lg"
                                    />
                                </div>
                                <p className="text-xs text-stone-500">
                                    This will automatically update the countdown and Gregorian date.
                                </p>
                            </div>

                            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                                <h3 className="text-sm font-bold text-stone-500 uppercase mb-2">Preview</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Amharic Date:</span>
                                        <span className="font-bold text-stone-800">{settings.nextDrawDateAm}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">English Date:</span>
                                        <span className="font-bold text-stone-800">{settings.nextDrawDateEn}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-600">Gregorian (System):</span>
                                        <span className="font-mono text-stone-800">{settings.drawDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                             <button onClick={() => handleSaveSection('Draw Schedule')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                             </button>
                        </div>
                    </div>

                    {/* Prize Settings Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Trophy className="w-5 h-5 mr-2 text-amber-500" /> Current Prize
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">Prize Name</label>
                                    <input 
                                        type="text" 
                                        value={settings.prizeName}
                                        onChange={(e) => setSettings({...settings, prizeName: e.target.value})}
                                        className="w-full p-2 border border-stone-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">Prize Value Display</label>
                                    <input 
                                        type="text" 
                                        value={settings.prizeValue}
                                        onChange={(e) => setSettings({...settings, prizeValue: e.target.value})}
                                        className="w-full p-2 border border-stone-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1">Prize Image URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={settings.prizeImage}
                                            onChange={(e) => setSettings({...settings, prizeImage: e.target.value})}
                                            className="w-full p-2 border border-stone-300 rounded-lg text-sm"
                                        />
                                        <button className="p-2 bg-stone-100 rounded border border-stone-300">
                                            <ImageIcon className="w-5 h-5 text-stone-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="h-48 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative">
                                <img src={settings.prizeImage} alt="Prize Preview" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 bg-black/60 text-white px-3 py-1 text-xs font-bold m-2 rounded">
                                    Preview
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                             <button onClick={() => handleSaveSection('Current Prize')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                             </button>
                        </div>
                    </div>

                    {/* Live Stream Settings Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                         <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Video className="w-5 h-5 mr-2 text-red-600" /> Live Stream Configuration
                        </h2>
                        
                        <div className="space-y-4">
                             <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg border border-stone-200">
                                 <div>
                                     <h3 className="font-bold text-stone-800">Live Status</h3>
                                     <p className="text-sm text-stone-500">Toggle this ON when the draw event starts</p>
                                 </div>
                                 <button 
                                   onClick={() => setSettings(prev => ({ ...prev, isLive: !prev.isLive }))}
                                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isLive ? 'bg-red-600' : 'bg-stone-300'}`}
                                 >
                                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isLive ? 'translate-x-6' : 'translate-x-1'}`} />
                                 </button>
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">Embed URL / Stream Link</label>
                                <input 
                                    type="text" 
                                    placeholder="https://www.youtube.com/embed/..."
                                    value={settings.liveStreamUrl}
                                    onChange={(e) => setSettings({...settings, liveStreamUrl: e.target.value})}
                                    className="w-full p-2 border border-stone-300 rounded-lg font-mono text-sm"
                                />
                                <p className="text-xs text-stone-500 mt-1">Supports YouTube Embeds, Facebook Video links, or custom stream URLs.</p>
                             </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                             <button onClick={() => handleSaveSection('Live Stream Config')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
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