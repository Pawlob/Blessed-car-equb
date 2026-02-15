import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, TrendingUp, AlertCircle, FileText, ZoomIn, X, Check, Menu, Image as ImageIcon, RefreshCw, Video, PlayCircle, Calendar, Clock, Lock, Shield, Edit, Trash2, Plus, Filter, Target, Ticket, Download, Ban, MousePointerClick, Link, Gift, Star, PartyPopper
} from 'lucide-react';
import { User, AppSettings, ViewState, AppNotification, Winner } from '../types';
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
  status: 'ACTIVE' | 'VOID' | 'PENDING' | 'RESERVED';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'competition' | 'users' | 'settings' | 'payments' | 'prizes'>('dashboard');
  const [compSubTab, setCompSubTab] = useState<'settings' | 'tickets'>('settings');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [drawTicketSearch, setDrawTicketSearch] = useState('');
  const [foundWinningTicket, setFoundWinningTicket] = useState<TicketType | null>(null);
  const [newPastWinner, setNewPastWinner] = useState<Partial<Winner>>({});
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
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

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

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

  const handleAddImage = () => {
    if (newImageUrl && !localSettings.prizeImages?.includes(newImageUrl)) {
        const updatedImages = [...(localSettings.prizeImages || []), newImageUrl];
        setLocalSettings(prev => ({
            ...prev,
            prizeImages: updatedImages,
            prizeImage: updatedImages[0]
        }));
        setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = localSettings.prizeImages?.filter((_, i) => i !== index) || [];
    setLocalSettings(prev => ({
        ...prev,
        prizeImages: updatedImages,
        prizeImage: updatedImages.length > 0 ? updatedImages[0] : ''
    }));
  };

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
    showConfirm('Save Changes', `Are you sure you want to save changes to ${sectionName}?`, async () => {
             await setSettings(localSettings);
             showAlert('success', 'Changes Saved', `${sectionName} settings updated.`);
    });
  };

  const handleVoidTicket = (ticketId: string) => {
      showConfirm('Void Ticket', 'Are you sure you want to void this ticket? This action cannot be undone.', async () => {
              const ticketRef = doc(db, 'tickets', ticketId);
              await updateDoc(ticketRef, { status: 'VOID' });
              showAlert('success', 'Ticket Voided', 'The ticket has been successfully voided.');
      });
  };

  const handleManualAssign = () => {
      showConfirm('Manual Ticket Assignment', 'This will assign a new randomized ticket to a selected user. Continue?', async () => {
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
                  assignedDate: new Date().toISOString().split('T')[0],
                  assignedBy: 'ADMIN'
              };
              await addDoc(collection(db, 'tickets'), newTicket);
              showAlert('success', 'Ticket Assigned', `Ticket #${newTicket.ticketNumber} assigned successfully.`);
      });
  };

  const handleExportTickets = () => {
      const headers = "Ticket ID,Ticket Number,User Name,Cycle,Status,Assigned Date,Assigned By\n";
      const rows = tickets.map(t => `${t.id},${t.ticketNumber},"${t.userName}",${t.cycle},${t.status},${t.assignedDate},${t.assignedBy}`).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `tickets_cycle_${settings.cycle}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert('success', 'Export Successful', 'Ticket data exported to CSV.');
  };

  const filteredTickets = tickets.filter(t => {
      const matchesSearch = t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) || t.ticketNumber.toString().includes(ticketSearch);
      const matchesCycle = ticketCycleFilter === 'ALL' || t.cycle === ticketCycleFilter;
      return matchesSearch && matchesCycle;
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = settings.adminPassword || 'admin123';
    if (password === adminPass) {
      setIsAuthenticated(true);
    } else {
      showAlert('error', 'Login Failed', 'The access key you provided is incorrect. Please try again.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.phone) {
        showAlert('error', 'Missing Information', 'Name and Phone are required.');
        return;
    }
    if (editingUser.id) {
        const userRef = doc(db, 'users', editingUser.id.toString());
        await updateDoc(userRef, editingUser);
        showAlert('success', 'User Updated', 'User details have been saved successfully.');
    } else {
        const newUser: User = {
            name: editingUser.name,
            phone: editingUser.phone,
            status: editingUser.status || 'PENDING',
            contribution: editingUser.contribution || 0,
            prizeNumber: editingUser.prizeNumber,
            joinedDate: new Date().toLocaleDateString('en-US')
        };
        await addDoc(collection(db, 'users'), newUser);
        showAlert('success', 'User Created', 'New user has been added successfully.');
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: any) => {
    showConfirm('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', async () => {
        await deleteDoc(doc(db, 'users', id.toString()));
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

  const handleApprovePayment = async (req: PaymentRequest) => {
    const { id: reqId, userId, amount, requestedTicket } = req;
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'Unknown User';
    const reqRef = doc(db, 'payment_requests', reqId);
    await updateDoc(reqRef, { status: 'APPROVED' });
    
    let assignedTicketNum = 0;
    if (requestedTicket) {
        const existingTicket = tickets.find(t => t.cycle === settings.cycle && t.ticketNumber === requestedTicket);
        if (existingTicket) {
            if (existingTicket.userId === userId && existingTicket.status === 'PENDING') {
                const ticketRef = doc(db, 'tickets', existingTicket.id);
                await updateDoc(ticketRef, { status: 'ACTIVE', assignedBy: 'ADMIN' });
                assignedTicketNum = requestedTicket;
            } else {
                const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
                const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
                let nextTicketNum = 1;
                while (takenNumbers.has(nextTicketNum)) { nextTicketNum++; }
                assignedTicketNum = nextTicketNum;
                const newTicket: any = {
                    ticketNumber: assignedTicketNum,
                    userId: userId,
                    userName: userName,
                    cycle: settings.cycle,
                    status: 'ACTIVE',
                    assignedDate: new Date().toISOString().split('T')[0],
                    assignedBy: 'SYSTEM'
                };
                await addDoc(collection(db, 'tickets'), newTicket);
                showAlert('warning', 'Ticket Conflict', `Requested ticket #${requestedTicket} was not available. System assigned #${assignedTicketNum} instead.`);
            }
        } else {
            assignedTicketNum = requestedTicket;
            const newTicket: any = {
                ticketNumber: assignedTicketNum,
                userId: userId,
                userName: userName,
                cycle: settings.cycle,
                status: 'ACTIVE',
                assignedDate: new Date().toISOString().split('T')[0],
                assignedBy: 'USER'
            };
            await addDoc(collection(db, 'tickets'), newTicket);
        }
    } else {
        const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
        const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
        let nextTicketNum = 1;
        while (takenNumbers.has(nextTicketNum)) { nextTicketNum++; }
        assignedTicketNum = nextTicketNum;
        const newTicket: any = {
            ticketNumber: assignedTicketNum,
            userId: userId,
            userName: userName,
            cycle: settings.cycle,
            status: 'ACTIVE',
            assignedDate: new Date().toISOString().split('T')[0],
            assignedBy: 'SYSTEM'
        };
        await addDoc(collection(db, 'tickets'), newTicket);
    }

    if (userId) {
        const userRef = doc(db, 'users', userId.toString());
        await updateDoc(userRef, {
            status: 'VERIFIED',
            contribution: (targetUser?.contribution || 0) + amount,
            prizeNumber: assignedTicketNum 
        });
    }
    
    if (assignedTicketNum === requestedTicket) {
        showAlert('success', 'Payment Verified', `User verified and Ticket #${assignedTicketNum} has been activated.`);
    }
  };

  const handleRejectPayment = async (req: PaymentRequest) => {
    const { id: reqId, userId, requestedTicket } = req;
    const reqRef = doc(db, 'payment_requests', reqId);
    await updateDoc(reqRef, { status: 'REJECTED' });
    if (requestedTicket) {
        const reservation = tickets.find(t => t.cycle === settings.cycle && t.ticketNumber === requestedTicket && t.userId === userId && t.status === 'PENDING');
        if (reservation) {
            await deleteDoc(doc(db, 'tickets', reservation.id));
        }
    }
    showAlert('info', 'Payment Rejected', 'The payment has been rejected and ticket reservation cleared.');
  };

  const handleStartNewCycle = () => {
    const nextCycle = settings.cycle + 1;
    showConfirm('Start New Cycle?', `Are you sure you want to start Cycle ${nextCycle}?\n\nThis will RESET all cycle data.`, async () => {
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
          desc: { en: `Cycle ${nextCycle} has begun.`, am: `ዙር ${nextCycle} ተጀምሯል።` },
          time: new Date(),
          urgent: true,
          read: false
        };
        addNotification(newNotification);
        showAlert('success', 'Cycle Started', `Cycle ${nextCycle} has been started successfully!`);
      }
    );
  };

  const handleSearchWinningTicket = () => {
    if (!drawTicketSearch) return;
    const ticketNum = parseInt(drawTicketSearch);
    const winningTicket = tickets.find(t => t.cycle === settings.cycle && t.ticketNumber === ticketNum && t.status === 'ACTIVE');
    if (winningTicket) {
        setFoundWinningTicket(winningTicket);
    } else {
        setFoundWinningTicket(null);
        showAlert('error', 'Ticket Not Found', `No active ticket found with number #${ticketNum}.`);
    }
  };

  const handleBroadcastWinner = () => {
      if (!foundWinningTicket) return;
      showConfirm('Broadcast Winner Globally?', `Confirm broadcasting winner for ${settings.prizeName}?`, async () => {
              await setSettings(prev => ({
                  ...prev,
                  currentWinner: {
                      userId: foundWinningTicket.userId,
                      userName: foundWinningTicket.userName,
                      ticketNumber: foundWinningTicket.ticketNumber,
                      prizeName: settings.prizeName,
                      announcedAt: new Date().toISOString()
                  }
              }));
              showAlert('success', 'Winner Announced!', 'The winner has been broadcasted.');
      });
  };

  const handleSavePastWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPastWinner.name || !newPastWinner.prize) return;
    const newWinnerEntry: Winner = {
        id: Date.now(),
        name: newPastWinner.name,
        nameAm: newPastWinner.nameAm || newPastWinner.name,
        prize: newPastWinner.prize,
        prizeAm: newPastWinner.prizeAm || newPastWinner.prize,
        cycle: newPastWinner.cycle || 'New',
        cycleAm: newPastWinner.cycleAm || 'New',
        location: newPastWinner.location || 'Ethiopia',
        locationAm: newPastWinner.locationAm || 'ኢትዮጵያ',
    };
    const updatedWinners = [newWinnerEntry, ...settings.recentWinners];
    await setSettings(prev => ({ ...prev, recentWinners: updatedWinners }));
    setIsWinnerModalOpen(false);
    setNewPastWinner({});
    showAlert('success', 'History Updated', 'New winner added to the Hall of Fame.');
  };

  const handleDeletePastWinner = (id: number | string) => {
      showConfirm('Delete Entry', 'Remove this winner from history?', async () => {
          const updatedWinners = settings.recentWinners.filter(w => w.id !== id);
          await setSettings(prev => ({ ...prev, recentWinners: updatedWinners }));
      });
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4 relative">
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
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in-down"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
                           <input type="text" required value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Phone Number</label>
                           <input type="text" required value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Status</label>
                           <select value={editingUser.status || 'PENDING'} onChange={e => setEditingUser({...editingUser, status: e.target.value as 'PENDING' | 'VERIFIED'})} className="w-full px-4 py-2 border border-stone-300 rounded-lg">
                               <option value="PENDING">Pending</option>
                               <option value="VERIFIED">Verified</option>
                           </select>
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Contribution</label>
                           <input type="number" value={editingUser.contribution || 0} onChange={e => setEditingUser({...editingUser, contribution: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" />
                       </div>
                       <div className="col-span-2 md:col-span-1">
                           <label className="block text-sm font-bold text-stone-700 mb-1">Ticket #</label>
                           <input type="number" value={editingUser.prizeNumber || ''} onChange={e => setEditingUser({...editingUser, prizeNumber: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" />
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

      {isWinnerModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={() => setIsWinnerModalOpen(false)}>
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-amber-50">
                      <h3 className="font-bold text-lg text-amber-800 flex items-center">
                          <Trophy className="w-5 h-5 mr-2" /> Add Past Winner
                      </h3>
                      <button onClick={() => setIsWinnerModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleSavePastWinner} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                              <label className="block text-sm font-bold text-stone-700 mb-1">Winner Name</label>
                              <input type="text" required value={newPastWinner.name || ''} onChange={e => setNewPastWinner({...newPastWinner, name: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" placeholder="English Name" />
                          </div>
                          <div className="col-span-2">
                              <label className="block text-sm font-bold text-stone-700 mb-1">Name (Amharic)</label>
                              <input type="text" value={newPastWinner.nameAm || ''} onChange={e => setNewPastWinner({...newPastWinner, nameAm: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" placeholder="Amharic Name" />
                          </div>
                          <div className="col-span-1">
                              <label className="block text-sm font-bold text-stone-700 mb-1">Prize</label>
                              <input type="text" required value={newPastWinner.prize || ''} onChange={e => setNewPastWinner({...newPastWinner, prize: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" placeholder="Toyota Vitz" />
                          </div>
                          <div className="col-span-1">
                              <label className="block text-sm font-bold text-stone-700 mb-1">Cycle</label>
                              <input type="text" required value={newPastWinner.cycle || ''} onChange={e => setNewPastWinner({...newPastWinner, cycle: e.target.value})} className="w-full px-4 py-2 border border-stone-300 rounded-lg" placeholder="Jan 2024" />
                          </div>
                      </div>
                      <button type="submit" className="w-full py-2 bg-emerald-900 text-white font-bold rounded-lg hover:bg-emerald-800">Save Winner</button>
                  </form>
              </div>
          </div>
      )}

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
                      {alertConfig.type === 'info' && <FileText className="w-6 h-6 mr-2" />}
                      {alertConfig.title}
                  </h3>
                  <button onClick={closeAlert} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                  <p className="text-stone-600 mb-6 text-sm leading-relaxed">{alertConfig.message}</p>
                  <div className="flex space-x-3">
                      {alertConfig.type === 'confirm' && (
                          <button onClick={closeAlert} className="flex-1 px-4 py-2 border border-stone-300 text-stone-600 font-bold rounded-lg hover:bg-stone-50 transition-colors">Cancel</button>
                      )}
                      <button 
                        onClick={() => {
                            if (alertConfig.onConfirm) alertConfig.onConfirm();
                            closeAlert();
                        }} 
                        className={`flex-1 px-4 py-2 text-white font-bold rounded-lg transition-colors ${
                            alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                            alertConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                            alertConfig.type === 'warning' || alertConfig.type === 'confirm' ? 'bg-amber-600 hover:bg-amber-700' :
                            'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                          {alertConfig.type === 'confirm' ? 'Confirm' : 'OK'}
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      <aside className={`fixed md:relative z-30 w-64 h-full bg-stone-900 text-stone-300 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
         <div className="p-6 border-b border-stone-800 flex items-center justify-between">
             <span className="text-xl font-bold text-white tracking-wide">Admin<span className="text-emerald-500">Panel</span></span>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-stone-400"><X className="w-6 h-6" /></button>
         </div>
         <div className="p-4 space-y-2">
             <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-800' : 'hover:bg-stone-800 hover:text-white'}`}>
                 <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
             </button>
             <button onClick={() => handleTabChange('competition')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'competition' ? 'bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-800' : 'hover:bg-stone-800 hover:text-white'}`}>
                 <Target className="w-5 h-5 mr-3" /> Tickets & Cycle
             </button>
             <button onClick={() => handleTabChange('users')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-800' : 'hover:bg-stone-800 hover:text-white'}`}>
                 <Users className="w-5 h-5 mr-3" /> Users
             </button>
             <button onClick={() => handleTabChange('payments')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'payments' ? 'bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-800' : 'hover:bg-stone-800 hover:text-white'}`}>
                 <DollarSign className="w-5 h-5 mr-3" /> Requests <span className="ml-auto bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">{paymentRequests.length}</span>
             </button>
             <button onClick={() => handleTabChange('prizes')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'prizes' ? 'bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-800' : 'hover:bg-stone-800 hover:text-white'}`}>
                 <Trophy className="w-5 h-5 mr-3" /> Prize History
             </button>
             <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-800' : 'hover:bg-stone-800 hover:text-white'}`}>
                 <Settings className="w-5 h-5 mr-3" /> App Settings
             </button>
         </div>
         <div className="absolute bottom-0 w-full p-4 border-t border-stone-800">
             <button onClick={() => setView('landing')} className="w-full flex items-center justify-center px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors">
                 <LogOut className="w-4 h-4 mr-2" /> Exit to App
             </button>
         </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
         <div className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
             <div className="flex items-center">
                 <button onClick={() => setIsSidebarOpen(true)} className="mr-4 md:hidden text-stone-500"><Menu className="w-6 h-6" /></button>
                 <h2 className="text-2xl font-bold text-stone-800 capitalize">{activeTab}</h2>
             </div>
             <div className="flex items-center space-x-4">
                 <div className="hidden md:flex flex-col text-right">
                     <span className="text-sm font-bold text-stone-800">Administrator</span>
                     <span className="text-xs text-stone-400">Super User</span>
                 </div>
                 <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">A</div>
             </div>
         </div>

         <div className="p-6">
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg"><Users className="w-6 h-6 text-blue-500" /></div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">+5%</span>
                            </div>
                            <h3 className="text-3xl font-bold text-stone-800 mb-1">{settings.totalMembers}</h3>
                            <p className="text-stone-500 text-sm">Total Members</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-lg"><DollarSign className="w-6 h-6 text-emerald-500" /></div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Cycle {settings.cycle}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-stone-800 mb-1">{settings.potValue.toLocaleString()}</h3>
                            <p className="text-stone-500 text-sm">Current Pot (ETB)</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-lg"><Ticket className="w-6 h-6 text-amber-500" /></div>
                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">{Math.floor((tickets.filter(t => t.cycle === settings.cycle && t.status === 'ACTIVE').length / 2150) * 100)}% Full</span>
                            </div>
                            <h3 className="text-3xl font-bold text-stone-800 mb-1">{tickets.filter(t => t.cycle === settings.cycle && t.status === 'ACTIVE').length}</h3>
                            <p className="text-stone-500 text-sm">Active Tickets</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg"><Clock className="w-6 h-6 text-purple-500" /></div>
                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">Target</span>
                            </div>
                            <h3 className="text-3xl font-bold text-stone-800 mb-1">{settings.daysRemaining}</h3>
                            <p className="text-stone-500 text-sm">Days to Draw</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                            <input 
                              type="text" 
                              placeholder="Search users by name or phone..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select 
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value as any)}
                              className="px-4 py-2 border border-stone-300 rounded-lg outline-none bg-stone-50"
                            >
                                <option value="ALL">All Status</option>
                                <option value="VERIFIED">Verified</option>
                                <option value="PENDING">Pending</option>
                            </select>
                            <button onClick={openAddUser} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center">
                                <Plus className="w-5 h-5 mr-2" /> Add User
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50 text-stone-500 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Phone</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Contribution</th>
                                    <th className="p-4 font-semibold">Ticket</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="p-4 font-bold text-stone-800">{user.name}</td>
                                        <td className="p-4 text-stone-600">{user.phone}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono">{user.contribution.toLocaleString()}</td>
                                        <td className="p-4 font-mono text-purple-600 font-bold">{user.prizeNumber ? `#${user.prizeNumber}` : '-'}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openEditUser(user)} className="text-stone-400 hover:text-blue-600 mr-3"><Edit className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-stone-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeTab === 'payments' && (
                <div className="grid grid-cols-1 gap-6">
                    {paymentRequests.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
                            <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-stone-400">All Caught Up!</h3>
                            <p className="text-stone-400">No pending payment requests.</p>
                        </div>
                    ) : (
                        paymentRequests.map((req) => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center mb-1">
                                        <h4 className="font-bold text-lg text-stone-800 mr-3">{req.userName}</h4>
                                        <span className="text-sm text-stone-500 bg-stone-100 px-2 py-0.5 rounded">{req.userPhone}</span>
                                    </div>
                                    <p className="text-stone-500 text-sm mb-2">Requested Ticket: <span className="font-bold text-amber-600">#{req.requestedTicket || 'Auto'}</span></p>
                                    <div className="flex items-center text-xs text-stone-400">
                                        <Calendar className="w-3 h-3 mr-1" /> {req.date}
                                        <span className="mx-2">•</span>
                                        <DollarSign className="w-3 h-3 mr-1" /> {req.amount} ETB
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {req.receiptUrl && (
                                        <button 
                                          onClick={() => window.open(req.receiptUrl, '_blank')}
                                          className="flex items-center px-3 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 text-sm font-bold"
                                        >
                                            <ImageIcon className="w-4 h-4 mr-2" /> Receipt
                                        </button>
                                    )}
                                    <button onClick={() => handleRejectPayment(req)} className="flex-1 md:flex-none px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors">Reject</button>
                                    <button onClick={() => handleApprovePayment(req)} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 transition-colors shadow-sm">Approve</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'competition' && (
                <div className="space-y-6">
                    <div className="flex space-x-2 bg-white p-1 rounded-lg border border-stone-200 w-fit mb-6">
                        <button onClick={() => setCompSubTab('settings')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${compSubTab === 'settings' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>Cycle Settings</button>
                        <button onClick={() => setCompSubTab('tickets')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${compSubTab === 'tickets' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-50'}`}>Ticket Manager</button>
                    </div>

                    {compSubTab === 'settings' && (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
                           <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-6">
                               <div>
                                   <h3 className="text-xl font-bold text-stone-800">Cycle Management</h3>
                                   <p className="text-stone-500">Manage the current draw cycle and dates.</p>
                               </div>
                               <button onClick={handleStartNewCycle} className="px-6 py-3 bg-red-900 text-white rounded-xl font-bold hover:bg-red-800 shadow-lg flex items-center">
                                   <RefreshCw className="w-5 h-5 mr-2" /> Start New Cycle
                               </button>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8">
                               <div>
                                   <label className="block text-sm font-bold text-stone-700 mb-2">Next Draw Date (Ethiopian Calendar)</label>
                                   <div className="grid grid-cols-3 gap-2">
                                       <select 
                                         value={ethDate.month} 
                                         onChange={(e) => handleEthDateChange('month', parseInt(e.target.value))}
                                         className="px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                       >
                                           {ETHIOPIAN_MONTHS.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                                       </select>
                                       <input 
                                         type="number" 
                                         value={ethDate.day} 
                                         onChange={(e) => handleEthDateChange('day', parseInt(e.target.value))}
                                         className="px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                         min="1" max="30"
                                       />
                                       <input 
                                         type="number" 
                                         value={ethDate.year} 
                                         onChange={(e) => handleEthDateChange('year', parseInt(e.target.value))}
                                         className="px-3 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                       />
                                   </div>
                                   <p className="text-xs text-stone-400 mt-2">Will update English & Amharic display dates automatically.</p>
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-stone-700 mb-2">Current Prize Name</label>
                                   <input 
                                     type="text" 
                                     value={localSettings.prizeName}
                                     onChange={(e) => setLocalSettings({...localSettings, prizeName: e.target.value})}
                                     className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                   />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-stone-700 mb-2">Prize Value Display</label>
                                   <input 
                                     type="text" 
                                     value={localSettings.prizeValue}
                                     onChange={(e) => setLocalSettings({...localSettings, prizeValue: e.target.value})}
                                     className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                   />
                               </div>
                               <div>
                                   <label className="block text-sm font-bold text-stone-700 mb-2">Days Remaining Override</label>
                                   <input 
                                     type="number" 
                                     value={localSettings.daysRemaining}
                                     onChange={(e) => setLocalSettings({...localSettings, daysRemaining: parseInt(e.target.value)})}
                                     className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                   />
                               </div>
                           </div>
                           <div className="mt-8 flex justify-end">
                               <button onClick={() => handleSaveSection('Cycle')} className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 flex items-center">
                                   <Save className="w-5 h-5 mr-2" /> Save Changes
                               </button>
                           </div>
                        </div>
                    )}

                    {compSubTab === 'tickets' && (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                            <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex gap-4 flex-1">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <input 
                                          type="text" 
                                          placeholder="Search Ticket # or User..." 
                                          value={ticketSearch}
                                          onChange={(e) => setTicketSearch(e.target.value)}
                                          className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 rounded-lg outline-none"
                                        />
                                    </div>
                                    <select 
                                      value={ticketCycleFilter}
                                      onChange={(e) => setTicketCycleFilter(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                                      className="px-3 py-2 text-sm border border-stone-300 rounded-lg outline-none bg-stone-50"
                                    >
                                        <option value="ALL">All Cycles</option>
                                        <option value={settings.cycle}>Current Cycle ({settings.cycle})</option>
                                        <option value={settings.cycle - 1}>Previous Cycle</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleManualAssign} className="px-3 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-200">
                                        + Manual Assign
                                    </button>
                                    <button onClick={handleExportTickets} className="px-3 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 flex items-center">
                                        <Download className="w-3 h-3 mr-1" /> Export CSV
                                    </button>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Ticket #</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Cycle</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Assigned</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredTickets.slice(0, 50).map(t => (
                                        <tr key={t.id} className="hover:bg-stone-50">
                                            <td className="p-4 font-bold font-mono">#{t.ticketNumber}</td>
                                            <td className="p-4">{t.userName}</td>
                                            <td className="p-4">Cycle {t.cycle}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                    t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                    t.status === 'VOID' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>{t.status}</span>
                                            </td>
                                            <td className="p-4 text-stone-500 text-xs">{t.assignedDate}</td>
                                            <td className="p-4 text-right">
                                                {t.status === 'ACTIVE' && (
                                                    <button onClick={() => handleVoidTicket(t.id)} className="text-red-400 hover:text-red-600 font-bold text-xs">Void</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTickets.length > 50 && (
                                <div className="p-4 text-center text-xs text-stone-400 bg-stone-50">Showing first 50 results...</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center"><Image className="w-5 h-5 mr-2 text-stone-500" /> Prize Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {(localSettings.prizeImages || []).map((url, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                                    <img src={url} alt="Prize" className="w-full h-full object-cover" />
                                    <button onClick={() => handleRemoveImage(idx)} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <div className="aspect-square rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center p-4">
                                <div className="text-center w-full">
                                    <input 
                                      type="text" 
                                      placeholder="Image URL..." 
                                      value={newImageUrl}
                                      onChange={(e) => setNewImageUrl(e.target.value)}
                                      className="w-full text-xs p-2 border border-stone-200 rounded mb-2 outline-none"
                                    />
                                    <button onClick={handleAddImage} disabled={!newImageUrl} className="px-3 py-1 bg-stone-800 text-white text-xs font-bold rounded hover:bg-stone-700 disabled:opacity-50">Add</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center"><Video className="w-5 h-5 mr-2 text-red-500" /> Live Stream</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-2">Embed URL (YouTube/TikTok)</label>
                                <input 
                                  type="text" 
                                  value={localSettings.liveStreamUrl} 
                                  onChange={(e) => setLocalSettings({...localSettings, liveStreamUrl: e.target.value})}
                                  className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={localSettings.isLive} 
                                      onChange={(e) => setLocalSettings({...localSettings, isLive: e.target.checked})}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                    <span className="ml-3 text-sm font-bold text-stone-700">Live Mode Active</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                        <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2 text-stone-500" /> Admin Access</h3>
                         <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">Change Admin Password</label>
                            <input 
                              type="text" 
                              value={localSettings.adminPassword} 
                              onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
                              className="w-full px-4 py-2 border border-stone-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 max-w-md"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={() => handleSaveSection('General Settings')} className="px-8 py-3 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-800 shadow-lg flex items-center">
                            <Save className="w-5 h-5 mr-2" /> Save All Settings
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'prizes' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl shadow-sm border border-amber-100">
                            <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center"><Target className="w-5 h-5 mr-2" /> Winner Selector</h3>
                            <div className="flex gap-2 mb-4">
                                <input 
                                  type="number" 
                                  placeholder="Ticket Number" 
                                  value={drawTicketSearch}
                                  onChange={(e) => setDrawTicketSearch(e.target.value)}
                                  className="flex-1 px-4 py-2 border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <button onClick={handleSearchWinningTicket} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700">Verify</button>
                            </div>
                            
                            {foundWinningTicket && (
                                <div className="bg-white p-4 rounded-lg border border-amber-200 animate-fade-in-down mb-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-bold text-stone-400">Ticket #{foundWinningTicket.ticketNumber}</span>
                                        <span className="text-xs font-bold text-emerald-600">Verified Active</span>
                                    </div>
                                    <p className="font-bold text-lg text-stone-800 mb-1">{foundWinningTicket.userName}</p>
                                    <p className="text-xs text-stone-500 mb-4">Cycle {foundWinningTicket.cycle}</p>
                                    <button onClick={handleBroadcastWinner} className="w-full py-2 bg-gradient-to-r from-amber-500 to-red-500 text-white font-bold rounded-lg hover:shadow-lg flex items-center justify-center">
                                        <PartyPopper className="w-4 h-4 mr-2" /> Broadcast Winner
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-lg font-bold text-stone-800">Hall of Fame</h3>
                                 <button onClick={() => setIsWinnerModalOpen(true)} className="text-sm font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                     + Add Past Winner
                                 </button>
                             </div>
                             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                 {settings.recentWinners.map(w => (
                                     <div key={w.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg hover:bg-stone-100 group">
                                         <div>
                                             <p className="font-bold text-stone-800 text-sm">{w.name}</p>
                                             <p className="text-xs text-stone-500">{w.prize} • {w.cycle}</p>
                                         </div>
                                         <button onClick={() => handleDeletePastWinner(w.id)} className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     </div>
                                 ))}
                             </div>
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