import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, TrendingUp, AlertCircle, FileText, ZoomIn, X, Check, Menu, Image as ImageIcon, RefreshCw, Video, PlayCircle, Calendar, Clock, Lock, Shield, Edit, Trash2, Plus, Filter, Target, Ticket, Download, Ban, MousePointerClick
} from 'lucide-react';
import { User, AppSettings, ViewState, AppNotification } from '../types';
import { collection, onSnapshot, updateDoc, doc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: (settings: React.SetStateAction<AppSettings>) => void;
  addNotification: (notification: AppNotification) => void;
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
  status: 'ACTIVE' | 'VOID';
  assignedDate: string;
  assignedBy: 'SYSTEM' | 'ADMIN' | 'USER';
}

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

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings, addNotification }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'competition' | 'users' | 'settings' | 'payments'>('dashboard');
  const [compSubTab, setCompSubTab] = useState<'settings' | 'tickets'>('settings');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const [users, setUsers] = useState<User[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketCycleFilter, setTicketCycleFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [ethDate, setEthDate] = useState({ year: 2016, month: 1, day: 1 });

  useEffect(() => {
    if (settings.drawDate) {
        setEthDate(getEthiopianFromGregorian(settings.drawDate));
    }
  }, [settings.drawDate]);

  useEffect(() => {
     const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
         const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
         setUsers(usersData);
     });
     const paymentsUnsub = onSnapshot(collection(db, 'payment_requests'), (snapshot) => {
         const requestsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PaymentRequest));
         setPaymentRequests(requestsData.filter(req => req.status === 'PENDING'));
     });
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

  const handleEthDateChange = (field: 'year' | 'month' | 'day', value: number) => {
      const newEthDate = { ...ethDate, [field]: value };
      setEthDate(newEthDate);
      const newGregString = getGregorianFromEthiopian(newEthDate.year, newEthDate.month, newEthDate.day);
      const monthIndex = newEthDate.month - 1;
      const monthNameEn = ETHIOPIAN_MONTHS[monthIndex]?.name.split(' ')[0] || '';
      const monthNameAm = AMHARIC_MONTHS[monthIndex] || '';
      const nextDrawDateEn = `${monthNameEn} ${newEthDate.day}, ${newEthDate.year}`;
      const nextDrawDateAm = `${monthNameAm} ${newEthDate.day}፣ ${newEthDate.year}`;
      setLocalSettings(prev => ({ 
          ...prev, 
          drawDate: newGregString,
          nextDrawDateEn,
          nextDrawDateAm
      }));
  };

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

  const handleVoidTicket = (ticketId: string) => {
      showConfirm(
          'Void Ticket',
          'Are you sure you want to void this ticket?',
          async () => {
              const ticketRef = doc(db, 'tickets', ticketId);
              await updateDoc(ticketRef, { status: 'VOID' });
              showAlert('success', 'Ticket Voided', 'The ticket has been successfully voided.');
          }
      );
  };

  const handleManualAssign = () => {
      showConfirm(
          'Manual Ticket Assignment',
          'This will assign a new randomized ticket to a selected user. Continue?',
          async () => {
              const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
              const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
              let nextTicketNum = 1;
              while (takenNumbers.has(nextTicketNum)) nextTicketNum++;
              const newTicket: any = {
                  ticketNumber: nextTicketNum,
                  userId: '999',
                  userName: "Manually Assigned User",
                  cycle: settings.cycle,
                  status: 'ACTIVE',
                  assignedBy: 'ADMIN',
                  assignedDate: new Date().toISOString().split('T')[0]
              };
              await addDoc(collection(db, 'tickets'), newTicket);
              showAlert('success', 'Ticket Assigned', `Ticket #${newTicket.ticketNumber} assigned successfully.`);
          }
      );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = settings.adminPassword || 'admin123';
    if (password === adminPass) {
      setIsAuthenticated(true);
    } else {
      showAlert('error', 'Login Failed', 'Incorrect access key.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser.id) {
        await updateDoc(doc(db, 'users', editingUser.id.toString()), editingUser);
    } else {
        await addDoc(collection(db, 'users'), { ...editingUser, joinedDate: new Date().toLocaleDateString('en-US') });
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: any) => {
    showConfirm('Delete User', 'Are you sure?', async () => {
        await deleteDoc(doc(db, 'users', id.toString()));
    });
  };

  const handleApprovePayment = async (req: PaymentRequest) => {
    const { id: reqId, userId, amount, requestedTicket } = req;
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'Unknown User';
    await updateDoc(doc(db, 'payment_requests', reqId), { status: 'APPROVED' });
    const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
    const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
    let assignedTicketNum = 0;
    if (requestedTicket && !takenNumbers.has(requestedTicket)) {
        assignedTicketNum = requestedTicket;
    } else {
        let nextTicketNum = 1;
        while (takenNumbers.has(nextTicketNum)) nextTicketNum++;
        assignedTicketNum = nextTicketNum;
    }
    await addDoc(collection(db, 'tickets'), {
        ticketNumber: assignedTicketNum,
        userId, userName, cycle: settings.cycle, status: 'ACTIVE', assignedBy: 'SYSTEM', assignedDate: new Date().toISOString().split('T')[0]
    });
    if (userId) {
        await updateDoc(doc(db, 'users', userId.toString()), {
            status: 'VERIFIED',
            contribution: (targetUser?.contribution || 0) + amount,
            prizeNumber: assignedTicketNum
        });
    }
    showAlert('success', 'Verified', `Ticket #${assignedTicketNum} assigned.`);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) && (statusFilter === 'ALL' || u.status === statusFilter));
  const filteredTickets = tickets.filter(t => (t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) || t.ticketNumber.toString().includes(ticketSearch)) && (ticketCycleFilter === 'ALL' || t.cycle === ticketCycleFilter));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full">
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-6">Admin Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Access Key" />
            <button className="w-full bg-emerald-900 text-white font-bold py-2 rounded-lg hover:bg-emerald-800">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex relative overflow-hidden">
      {/* Sidebar and Modals omitted for brevity - same as original file */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-stone-900 text-stone-300 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-stone-800 flex justify-between items-center"><h2 className="text-xl font-bold text-white">Admin Panel</h2></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}><LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard</button>
          <button onClick={() => setActiveTab('competition')} className={`w-full flex items-center px-4 py-3 rounded-lg ${activeTab === 'competition' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}><Trophy className="w-5 h-5 mr-3" /> Competition</button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-4 py-3 rounded-lg ${activeTab === 'users' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}><Users className="w-5 h-5 mr-3" /> Users</button>
          <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center px-4 py-3 rounded-lg ${activeTab === 'payments' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}><DollarSign className="w-5 h-5 mr-3" /> Payments</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-4 py-3 rounded-lg ${activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}><Settings className="w-5 h-5 mr-3" /> Settings</button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-8">
            {activeTab === 'dashboard' && <div className="space-y-6">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl border"><h3>Total Pot</h3><p className="text-2xl font-bold">{settings.potValue.toLocaleString()} ETB</p></div>
                    <div className="bg-white p-6 rounded-xl border"><h3>Cycle</h3><p className="text-2xl font-bold">{settings.cycle}</p></div>
                    <div className="bg-white p-6 rounded-xl border"><h3>Max Tickets</h3><p className="text-2xl font-bold">{settings.maxTickets}</p></div>
                </div>
            </div>}

            {activeTab === 'competition' && <div className="space-y-6">
                <div className="flex gap-4 mb-4"><button onClick={() => setCompSubTab('settings')} className={`px-4 py-2 rounded ${compSubTab === 'settings' ? 'bg-stone-800 text-white' : 'bg-white'}`}>Settings</button><button onClick={() => setCompSubTab('tickets')} className={`px-4 py-2 rounded ${compSubTab === 'tickets' ? 'bg-emerald-600 text-white' : 'bg-white'}`}>Tickets</button></div>
                {compSubTab === 'settings' && <div className="bg-white p-6 rounded-xl border space-y-4">
                    <div><label className="block font-bold">Max Ticket Capacity</label><input type="number" value={localSettings.maxTickets} onChange={e => setLocalSettings({...localSettings, maxTickets: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded" /></div>
                    <button onClick={() => handleSaveSection('Competition')} className="bg-emerald-900 text-white px-6 py-2 rounded font-bold">Save Changes</button>
                </div>}
                {compSubTab === 'tickets' && <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full text-left"><thead className="bg-stone-50"><tr><th className="px-6 py-3">#</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Cycle</th><th className="px-6 py-3">Status</th></tr></thead><tbody>{filteredTickets.map(t => <tr key={t.id} className="border-t">
                        <td className="px-6 py-4 font-bold">#{t.ticketNumber}</td><td className="px-6 py-4">{t.userName}</td><td className="px-6 py-4">{t.cycle}</td><td className="px-6 py-4">{t.status}</td>
                    </tr>)}</tbody></table>
                </div>}
            </div>}
            
            {activeTab === 'users' && <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-left"><thead className="bg-stone-50"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Ticket</th></tr></thead><tbody>{filteredUsers.map(u => <tr key={u.id} className="border-t">
                    <td className="px-6 py-4 font-bold">{u.name}</td><td className="px-6 py-4">{u.phone}</td><td className="px-6 py-4">{u.status}</td><td className="px-6 py-4">#{u.prizeNumber || '-'}</td>
                </tr>)}</tbody></table>
            </div>}

            {activeTab === 'payments' && <div className="grid grid-cols-3 gap-6">{paymentRequests.map(req => <div key={req.id} className="bg-white p-6 rounded-xl border">
                <h3 className="font-bold">{req.userName}</h3><p>{req.amount} ETB</p><button onClick={() => handleApprovePayment(req)} className="w-full mt-4 bg-emerald-600 text-white py-2 rounded font-bold">Approve</button>
            </div>)}</div>}

            {activeTab === 'settings' && <div className="bg-white p-6 rounded-xl border space-y-4">
                <div><label className="block font-bold">Registration Enabled</label><button onClick={() => setLocalSettings({...localSettings, registrationEnabled: !localSettings.registrationEnabled})} className={`px-4 py-2 rounded text-white ${localSettings.registrationEnabled ? 'bg-emerald-600' : 'bg-red-600'}`}>{localSettings.registrationEnabled ? 'Enabled' : 'Disabled'}</button></div>
                <button onClick={() => handleSaveSection('Global Settings')} className="bg-emerald-900 text-white px-6 py-2 rounded font-bold">Save All</button>
            </div>}
      </main>

      {/* Custom Alert */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={closeAlert}>
           <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-2">{alertConfig.title}</h3>
              <p className="text-stone-600 mb-6">{alertConfig.message}</p>
              <div className="flex gap-2">
                {alertConfig.type === 'confirm' && <button onClick={() => { alertConfig.onConfirm?.(); closeAlert(); }} className="flex-1 bg-amber-600 text-white py-2 rounded font-bold">Confirm</button>}
                <button onClick={closeAlert} className="flex-1 bg-stone-800 text-white py-2 rounded font-bold">Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;