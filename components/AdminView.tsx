import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, AlertCircle, FileText, ZoomIn, X, Menu, RefreshCw, Video, Calendar, Clock, Shield, Edit, Trash2, Plus, Filter, Ticket, Gift, Star, PartyPopper
} from 'lucide-react';
import { collection, onSnapshot, updateDoc, doc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, AppSettings, ViewState, AppNotification, Winner, PaymentRequest, TicketType } from '../types';
import { ETHIOPIAN_MONTHS, AMHARIC_MONTHS, getGregorianFromEthiopian, getEthiopianFromGregorian } from '../lib/dateUtils';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: (settings: React.SetStateAction<AppSettings>) => void;
  addNotification: (notification: AppNotification) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings, addNotification }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'competition' | 'users' | 'settings' | 'payments' | 'prizes'>('dashboard');
  const [compSubTab, setCompSubTab] = useState<'settings' | 'tickets'>('settings');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  
  // Settings Buffer
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [ethDate, setEthDate] = useState({ year: 2016, month: 1, day: 1 });

  // Filter & Search State
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketCycleFilter, setTicketCycleFilter] = useState<number | 'ALL'>('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [drawTicketSearch, setDrawTicketSearch] = useState('');

  // Modals & Active Item State
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [foundWinningTicket, setFoundWinningTicket] = useState<TicketType | null>(null);
  const [newPastWinner, setNewPastWinner] = useState<Partial<Winner>>({});
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'info', title: '', message: '' });

  // --- Effects ---

  // Sync settings
  useEffect(() => {
    setLocalSettings(settings);
    if (settings.drawDate) {
        setEthDate(getEthiopianFromGregorian(settings.drawDate));
    }
  }, [settings]);

  // Real-time Data Listeners
  useEffect(() => {
     const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
         setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)));
     });
     const paymentsUnsub = onSnapshot(collection(db, 'payment_requests'), (snapshot) => {
         setPaymentRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PaymentRequest)).filter(req => req.status === 'PENDING'));
     });
     const ticketsUnsub = onSnapshot(collection(db, 'tickets'), (snapshot) => {
         setTickets(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TicketType)));
     });
     return () => { usersUnsub(); paymentsUnsub(); ticketsUnsub(); };
  }, []);

  // Update Global Stats
  useEffect(() => {
    const activePot = users.reduce((sum, user) => user.status === 'VERIFIED' ? sum + 5000 : sum, 0);
    const memberCount = users.length;
    if (settings.potValue !== activePot || settings.totalMembers !== memberCount) {
        setSettings(prev => ({ ...prev, potValue: activePot, totalMembers: memberCount }));
    }
  }, [users, settings.potValue, settings.totalMembers, setSettings]);

  // --- Computed / Memoized Data ---

  const filteredTickets = useMemo(() => {
      return tickets.filter(t => {
          const ticketUser = users.find(u => String(u.id) === String(t.userId));
          if (ticketUser && ticketUser.status === 'PENDING') return false;
          const matchesSearch = t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) || t.ticketNumber.toString().includes(ticketSearch);
          const matchesCycle = ticketCycleFilter === 'ALL' || t.cycle === ticketCycleFilter;
          return matchesSearch && matchesCycle;
      });
  }, [tickets, users, ticketSearch, ticketCycleFilter]);

  const filteredUsers = useMemo(() => {
      return users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.phone.includes(userSearchTerm);
        const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [users, userSearchTerm, userStatusFilter]);

  // --- Actions ---

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlertConfig({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };
  
  const closeAlert = () => setAlertConfig(prev => ({ ...prev, isOpen: false }));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (settings.adminPassword || 'admin123')) setIsAuthenticated(true);
    else showAlert('error', 'Login Failed', 'Incorrect access key.');
  };

  const handleEthDateChange = (field: 'year' | 'month' | 'day', value: number) => {
      const newEthDate = { ...ethDate, [field]: value };
      setEthDate(newEthDate);
      const newGregString = getGregorianFromEthiopian(newEthDate.year, newEthDate.month, newEthDate.day);
      const monthIndex = newEthDate.month - 1;
      
      setLocalSettings(prev => ({ 
          ...prev, 
          drawDate: newGregString,
          nextDrawDateEn: `${ETHIOPIAN_MONTHS[monthIndex]?.name.split(' ')[0] || ''} ${newEthDate.day}, ${newEthDate.year}`,
          nextDrawDateAm: `${AMHARIC_MONTHS[monthIndex] || ''} ${newEthDate.day}፣ ${newEthDate.year}`
      }));
  };

  const handleApprovePayment = async (req: PaymentRequest) => {
    const { id, userId, amount, requestedTicket } = req;
    const targetUser = users.find(u => u.id === userId);
    
    await updateDoc(doc(db, 'payment_requests', id), { status: 'APPROVED' });
    
    let assignedTicketNum = requestedTicket || 0;
    const isRequestedReserved = requestedTicket && tickets.some(t => t.ticketNumber === requestedTicket && t.userId === userId && t.status === 'PENDING');

    if (requestedTicket && !isRequestedReserved) {
        // Conflict or new request logic simplified
        const taken = tickets.filter(t => t.cycle === settings.cycle).map(t => t.ticketNumber);
        if (taken.includes(requestedTicket)) {
             let next = 1; while(taken.includes(next)) next++;
             assignedTicketNum = next;
             showAlert('warning', 'Ticket Conflict', `Ticket #${requestedTicket} taken. Assigned #${assignedTicketNum}.`);
        }
    }

    // Determine assign method (existing reservation update or new creation)
    const reservation = tickets.find(t => t.ticketNumber === assignedTicketNum && t.userId === userId && t.cycle === settings.cycle);
    
    if (reservation) {
        await updateDoc(doc(db, 'tickets', reservation.id), { status: 'ACTIVE', assignedBy: 'ADMIN' });
    } else {
        // Auto assign if no reservation or conflict handled
        if (!assignedTicketNum) {
             const taken = tickets.filter(t => t.cycle === settings.cycle).map(t => t.ticketNumber);
             let next = 1; while(taken.includes(next)) next++;
             assignedTicketNum = next;
        }
        await addDoc(collection(db, 'tickets'), {
            ticketNumber: assignedTicketNum,
            userId,
            userName: targetUser?.name || 'User',
            cycle: settings.cycle,
            status: 'ACTIVE',
            assignedDate: new Date().toISOString().split('T')[0],
            assignedBy: 'SYSTEM'
        });
    }

    if (userId) {
        await updateDoc(doc(db, 'users', userId.toString()), {
            status: 'VERIFIED',
            contribution: (targetUser?.contribution || 0) + amount,
            prizeNumber: assignedTicketNum
        });
    }
    showAlert('success', 'Payment Verified', `Ticket #${assignedTicketNum} activated.`);
  };

  const handleRejectPayment = async (req: PaymentRequest) => {
    await updateDoc(doc(db, 'payment_requests', req.id), { status: 'REJECTED' });
    if (req.requestedTicket) {
        const reservation = tickets.find(t => t.cycle === settings.cycle && t.ticketNumber === req.requestedTicket && t.userId === req.userId && t.status === 'PENDING');
        if (reservation) await deleteDoc(doc(db, 'tickets', reservation.id));
    }
    showAlert('info', 'Payment Rejected', 'Payment rejected and reservation cleared.');
  };

  const handleStartNewCycle = () => {
    showConfirm('Start New Cycle?', 'This resets pot, contributions, and tickets.', async () => {
        const nextCycle = settings.cycle + 1;
        const nextDraw = new Date(); nextDraw.setDate(nextDraw.getDate() + 30);
        const nextDrawIso = nextDraw.toISOString().split('T')[0];
        const newEth = getEthiopianFromGregorian(nextDrawIso);
        
        setSettings(prev => ({
          ...prev, cycle: nextCycle, daysRemaining: 30, drawDate: nextDrawIso, currentWinner: null,
          nextDrawDateEn: `${ETHIOPIAN_MONTHS[newEth.month-1].name.split(' ')[0]} ${newEth.day}, ${newEth.year}`,
          nextDrawDateAm: `${AMHARIC_MONTHS[newEth.month-1]} ${newEth.day}፣ ${newEth.year}`
        }));
        setEthDate(newEth);
        
        // Reset users
        users.forEach(u => {
             if (u.id) updateDoc(doc(db, 'users', u.id.toString()), { status: 'PENDING', contribution: 0, prizeNumber: null } as any);
        });

        addNotification({
          id: Date.now(),
          title: { en: `Cycle ${nextCycle} Started`, am: `ዙር ${nextCycle} ተጀምሯል` },
          desc: { en: `New cycle begun.`, am: `አዲስ ዙር ተጀምሯል።` },
          time: new Date(), urgent: true, read: false
        });
        showAlert('success', 'Cycle Started', `Cycle ${nextCycle} is now active.`);
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.phone) return showAlert('error', 'Error', 'Name & Phone required');
    
    if (editingUser.id) await updateDoc(doc(db, 'users', editingUser.id.toString()), editingUser);
    else await addDoc(collection(db, 'users'), { ...editingUser, status: editingUser.status || 'PENDING', contribution: editingUser.contribution || 0, joinedDate: new Date().toLocaleDateString('en-US') });
    
    setIsUserModalOpen(false);
    showAlert('success', 'Success', 'User saved successfully.');
  };

  const handleSaveSection = async (sectionName: string) => {
    try {
        await setDoc(doc(db, 'settings', 'global'), localSettings, { merge: true });
        setSettings(localSettings);
        showAlert('success', 'Settings Saved', `${sectionName} updated successfully.`);
    } catch (error) {
        console.error("Error saving settings:", error);
        showAlert('error', 'Save Failed', 'Could not save settings.');
    }
  };

  const openAddUser = () => {
    setEditingUser({});
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string | number | undefined) => {
    if (!userId) return;
    showConfirm('Delete User?', 'This action cannot be undone.', async () => {
        try {
            await deleteDoc(doc(db, 'users', userId.toString()));
            showAlert('success', 'User Deleted', 'User removed successfully.');
        } catch (error) {
            console.error("Error deleting user:", error);
            showAlert('error', 'Error', 'Failed to delete user.');
        }
    });
  };

  const handleBroadcastWinner = async () => {
    if (!foundWinningTicket) return;

    showConfirm('Announce Winner?', `Announce ${foundWinningTicket.userName} as winner?`, async () => {
        const winnerData = {
            userId: foundWinningTicket.userId,
            userName: foundWinningTicket.userName,
            ticketNumber: foundWinningTicket.ticketNumber,
            prizeName: localSettings.prizeName,
            announcedAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, 'settings', 'global'), { currentWinner: winnerData }, { merge: true });
            setSettings(prev => ({ ...prev, currentWinner: winnerData }));
            showAlert('success', 'Winner Announced', 'The winner is being broadcasted live!');
        } catch (error) {
            console.error("Error broadcasting winner:", error);
            showAlert('error', 'Error', 'Failed to broadcast winner.');
        }
    });
  };

  // --- Render Helpers ---

  if (!isAuthenticated) return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        {alertConfig.isOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeAlert}>
                <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                    <p className="text-red-600 font-bold mb-2">{alertConfig.title}</p>
                    <p className="mb-4">{alertConfig.message}</p>
                    <button onClick={closeAlert} className="w-full bg-stone-800 text-white py-2 rounded">OK</button>
                </div>
            </div>
        )}
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full">
          <div className="flex justify-center mb-6"><div className="bg-stone-800 p-3 rounded-lg"><Settings className="w-8 h-8 text-white" /></div></div>
          <h2 className="text-2xl font-bold text-center text-stone-800 mb-6">Admin Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="Access Key" />
            <button className="w-full bg-emerald-900 text-white font-bold py-2 rounded-lg hover:bg-emerald-800">Login</button>
            <button type="button" onClick={() => setView('landing')} className="w-full text-stone-500 text-sm">Back to Site</button>
          </form>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 flex relative overflow-hidden">
      
      {/* Alert Modal */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeAlert}>
           <div className={`bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border-l-4 ${alertConfig.type === 'error' ? 'border-red-500' : 'border-emerald-500'}`} onClick={e => e.stopPropagation()}>
              <div className="p-6">
                 <h3 className="font-bold text-lg mb-2">{alertConfig.title}</h3>
                 <p className="text-stone-600 mb-6 text-sm">{alertConfig.message}</p>
                 <div className="flex space-x-3">
                    {alertConfig.type === 'confirm' && <button onClick={() => { alertConfig.onConfirm?.(); closeAlert(); }} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg">Confirm</button>}
                    <button onClick={closeAlert} className="flex-1 px-4 py-2 bg-stone-800 text-white rounded-lg">{alertConfig.type === 'confirm' ? 'Cancel' : 'OK'}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-stone-900 text-stone-300 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-stone-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'competition', label: 'Competition', icon: Trophy },
            { id: 'prizes', label: 'Prizes', icon: Gift },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'payments', label: 'Verify Payments', icon: DollarSign, badge: paymentRequests.length },
            { id: 'settings', label: 'App Settings', icon: Settings }
          ].map((item) => (
             <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}>
                <div className="relative mr-3">
                    <item.icon className="w-5 h-5" />
                    {item.badge ? <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full animate-pulse">{item.badge}</span> : null}
                </div>
                {item.label}
             </button>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={() => setView('landing')} className="w-full flex items-center px-4 py-3 text-stone-400 hover:text-white"><LogOut className="w-5 h-5 mr-3" /> Exit Admin</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center z-30">
           <button onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6 text-stone-700" /></button>
           <h1 className="font-bold text-stone-800 capitalize">{activeTab}</h1>
           <div className="w-6"></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-stone-800 hidden md:block">Dashboard Overview</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { title: 'Total Pot', value: `${settings.potValue.toLocaleString()} ETB`, icon: DollarSign, color: 'text-emerald-500' },
                          { title: 'Total Members', value: settings.totalMembers.toLocaleString(), icon: Users, color: 'text-blue-500' },
                          { title: 'Pending Verifications', value: paymentRequests.length, icon: FileText, color: 'text-amber-500' },
                          { title: 'Current Cycle', value: `Cycle ${settings.cycle}`, icon: RefreshCw, color: 'text-purple-500' }
                        ].map((stat, i) => (
                           <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                               <div className="flex justify-between mb-2"><h3 className="text-stone-500 text-sm font-bold uppercase">{stat.title}</h3><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                               <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                           </div>
                        ))}
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-stone-800">Cycle Management</h3>
                            <div className="flex items-center text-sm text-stone-500 mt-1"><Clock className="w-4 h-4 mr-1" /> Next Draw: {settings.daysRemaining} days</div>
                        </div>
                        <button onClick={handleStartNewCycle} className="px-6 py-2 bg-red-900 text-white font-bold rounded-lg hover:bg-red-800 flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Start New Cycle</button>
                    </div>
                </div>
            )}

            {activeTab === 'competition' && (
                <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-stone-800">Competition Management</h1>
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-stone-200 flex">
                            <button onClick={() => setCompSubTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold ${compSubTab === 'settings' ? 'bg-stone-800 text-white' : 'text-stone-500'}`}>Settings</button>
                            <button onClick={() => setCompSubTab('tickets')} className={`px-4 py-2 rounded-lg text-sm font-bold ${compSubTab === 'tickets' ? 'bg-emerald-600 text-white' : 'text-stone-500'}`}>Tickets</button>
                        </div>
                    </div>
                    {compSubTab === 'settings' ? (
                       <div className="space-y-6">
                           <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
                               <h2 className="font-bold text-lg mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2" /> Draw Schedule (Ethiopian)</h2>
                               <div className="flex gap-2 mb-4">
                                   <select value={ethDate.month} onChange={(e) => handleEthDateChange('month', +e.target.value)} className="p-2 border rounded">{ETHIOPIAN_MONTHS.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}</select>
                                   <select value={ethDate.day} onChange={(e) => handleEthDateChange('day', +e.target.value)} className="p-2 border rounded">{[...Array(30)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}</select>
                                   <input type="number" value={ethDate.year} onChange={(e) => handleEthDateChange('year', +e.target.value)} className="p-2 border rounded w-24" />
                               </div>
                               <button onClick={() => handleSaveSection('Draw Schedule')} className="px-4 py-2 bg-emerald-900 text-white rounded font-bold"><Save className="w-4 h-4 inline mr-2" /> Save</button>
                           </div>
                           
                           <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200">
                               <h2 className="font-bold text-lg mb-4 flex items-center"><Trophy className="w-5 h-5 mr-2" /> Prize Info</h2>
                               <div className="grid gap-4 mb-4">
                                   <input value={localSettings.prizeName} onChange={e => setLocalSettings(p => ({...p, prizeName: e.target.value}))} className="p-2 border rounded w-full" placeholder="Prize Name" />
                                   <input value={localSettings.prizeValue} onChange={e => setLocalSettings(p => ({...p, prizeValue: e.target.value}))} className="p-2 border rounded w-full" placeholder="Prize Value" />
                               </div>
                               <button onClick={() => handleSaveSection('Prize Info')} className="px-4 py-2 bg-emerald-900 text-white rounded font-bold"><Save className="w-4 h-4 inline mr-2" /> Save</button>
                           </div>
                       </div>
                    ) : (
                       <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                           <div className="p-4 border-b flex justify-between">
                               <input placeholder="Search Tickets..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} className="p-2 border rounded w-64" />
                           </div>
                           <table className="w-full text-left">
                               <thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-6 py-3">#</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Status</th></tr></thead>
                               <tbody>{filteredTickets.slice(0, 10).map(t => (
                                   <tr key={t.id} className="border-t border-stone-50"><td className="px-6 py-3 font-bold">#{t.ticketNumber}</td><td className="px-6 py-3">{t.userName}</td><td className="px-6 py-3">{t.status}</td></tr>
                               ))}</tbody>
                           </table>
                       </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center"><h1 className="text-2xl font-bold text-stone-800">Users</h1><button onClick={openAddUser} className="px-4 py-2 bg-stone-800 text-white rounded font-bold"><Plus className="w-4 h-4 inline mr-2"/> Add User</button></div>
                    <div className="flex gap-4 mb-4">
                        <input placeholder="Search users..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="flex-1 p-2 border rounded" />
                        <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value as any)} className="p-2 border rounded"><option value="ALL">All</option><option value="VERIFIED">Verified</option><option value="PENDING">Pending</option></select>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th></tr></thead>
                            <tbody>{filteredUsers.map(u => (
                                <tr key={u.id} className="border-t border-stone-50 hover:bg-stone-50">
                                    <td className="px-6 py-3 font-bold">{u.name}</td>
                                    <td className="px-6 py-3 font-mono text-sm">{u.phone}</td>
                                    <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${u.status==='VERIFIED'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}`}>{u.status}</span></td>
                                    <td className="px-6 py-3 flex gap-2"><button onClick={() => openEditUser(u)}><Edit className="w-4 h-4 text-stone-500"/></button><button onClick={() => handleDeleteUser(u.id)}><Trash2 className="w-4 h-4 text-red-500"/></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-stone-800">Pending Payments</h1>
                    {paymentRequests.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-stone-200 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-stone-800">All Caught Up!</h3>
                            <p className="text-stone-500">No pending payments.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paymentRequests.map(req => (
                                <div key={req.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                                    <div className="h-40 bg-stone-100 relative group cursor-pointer" onClick={() => setSelectedReceipt(req.receiptUrl)}>
                                        <img src={req.receiptUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white"/></div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold">{req.userName}</h4>
                                        <p className="text-sm text-stone-500 mb-2">{req.amount.toLocaleString()} ETB</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRejectPayment(req)} className="flex-1 py-1 border border-red-200 text-red-600 rounded font-bold hover:bg-red-50">Reject</button>
                                            <button onClick={() => handleApprovePayment(req)} className="flex-1 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500">Approve</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'prizes' && (
                <div className="space-y-8 max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-stone-800">Prize Management</h1>
                    <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-4 flex items-center"><Video className="w-5 h-5 mr-2 text-red-500" /> Live Announcer</h2>
                            <div className="bg-white/10 p-6 rounded-xl border border-white/10 max-w-xl">
                                <div className="flex gap-4 mb-4">
                                    <input type="number" value={drawTicketSearch} onChange={(e) => setDrawTicketSearch(e.target.value)} placeholder="Ticket #" className="flex-1 bg-stone-900 border border-stone-600 rounded px-4 py-2 text-white" />
                                    <button onClick={() => {
                                        const t = tickets.find(x => x.cycle === settings.cycle && x.ticketNumber === +drawTicketSearch && x.status === 'ACTIVE');
                                        if(t) setFoundWinningTicket(t); else showAlert('error', 'Not Found', 'Invalid Ticket');
                                    }} className="px-4 bg-stone-700 rounded font-bold">Verify</button>
                                </div>
                                {foundWinningTicket && <div className="bg-emerald-900/50 p-4 rounded mb-4"><h3 className="font-bold">{foundWinningTicket.userName}</h3></div>}
                                <button onClick={handleBroadcastWinner} disabled={!foundWinningTicket} className="w-full py-3 bg-amber-500 text-stone-900 font-bold rounded shadow-lg disabled:opacity-50">ANNOUNCE WINNER</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-stone-800 mb-6">App Settings</h1>
                    <div className="bg-white rounded-xl border border-stone-200 p-6">
                        <h2 className="font-bold text-lg mb-4">Security</h2>
                        <div className="flex items-center justify-between bg-stone-50 p-4 rounded mb-4">
                             <span>Registration Enabled</span>
                             <button onClick={() => setLocalSettings(p => ({...p, registrationEnabled: !p.registrationEnabled}))} className={`w-10 h-6 rounded-full ${localSettings.registrationEnabled ? 'bg-emerald-500' : 'bg-stone-300'} relative`}>
                                 <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${localSettings.registrationEnabled ? 'left-5' : 'left-1'}`} />
                             </button>
                        </div>
                        <button onClick={() => handleSaveSection('Security')} className="px-4 py-2 bg-emerald-900 text-white rounded font-bold">Save Changes</button>
                    </div>
                </div>
            )}
        </div>

        {/* User Edit Modal */}
        {isUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 className="font-bold text-lg mb-4">{editingUser.id ? 'Edit User' : 'New User'}</h3>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <input placeholder="Name" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-2 border rounded"/>
                        <input placeholder="Phone" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full p-2 border rounded"/>
                        <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})} className="w-full p-2 border rounded"><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option></select>
                        <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-stone-500">Cancel</button><button className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Save</button></div>
                    </form>
                </div>
            </div>
        )}
        
        {/* Receipt Modal */}
        {selectedReceipt && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90" onClick={() => setSelectedReceipt(null)}><img src={selectedReceipt} className="max-w-full max-h-full rounded" onClick={e => e.stopPropagation()}/></div>}

      </main>
    </div>
  );
};

export default AdminView;