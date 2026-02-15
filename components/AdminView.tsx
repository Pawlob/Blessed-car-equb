
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Save, DollarSign, 
  Trophy, TrendingUp, AlertCircle, FileText, ZoomIn, X, Check, Menu, Image as ImageIcon, RefreshCw, Video, PlayCircle, Calendar, Clock, Lock, Shield, Edit, Trash2, Plus, Filter, Target, Ticket, Download, Ban, MousePointerClick, Link, Gift, Star, PartyPopper, Globe
} from 'lucide-react';
import { User, AppSettings, ViewState, AppNotification, Winner, Language } from '../types';
import { collection, onSnapshot, updateDoc, doc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: (settings: React.SetStateAction<AppSettings>) => void;
  addNotification: (notification: AppNotification) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

interface PaymentRequest {
  id: string; // Changed to string for Firestore ID
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
    
    const nextGregYear = gregYear + 1;
    const isNextGregLeap = (nextGregYear % 4 === 0 && nextGregYear % 100 !== 0) || (nextGregYear % 400 === 0);
    const newYearDayInThisGregYear = isNextGregLeap ? 12 : 11;
    const ethNewYearDate = new Date(gregYear, 8, newYearDayInThisGregYear); // Sept
    
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
  
  // Competition Sub-tabs
  const [compSubTab, setCompSubTab] = useState<'settings' | 'tickets'>('settings');
  
  // Local Settings State (Buffer)
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // State for new image input
  const [newImageUrl, setNewImageUrl] = useState('');

  // Prize Management State
  const [drawTicketSearch, setDrawTicketSearch] = useState('');
  const [foundWinningTicket, setFoundWinningTicket] = useState<TicketType | null>(null);
  const [newPastWinner, setNewPastWinner] = useState<Partial<Winner>>({});
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Sync local settings with global settings when they change (e.g. from DB)
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Real-time Data State
  const [users, setUsers] = useState<User[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketCycleFilter, setTicketCycleFilter] = useState<number | 'ALL'>('ALL');

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
         setPaymentRequests(requestsData.filter(req => req.status === 'PENDING')); // Filter for pending in this view or keep all? Keeping all for now then local filter
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
  // Note: Since setSettings now updates Firestore, be careful with infinite loops.
  // We should check values before setting.
  useEffect(() => {
    // Calculate pot value based on verified users in the current cycle.
    const activePot = users.reduce((sum, user) => 
        user.status === 'VERIFIED' ? sum + 5000 : sum, 0
    );
    const memberCount = users.length;

    // Only update if different to avoid redundant DB writes
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
        async () => {
             // Commit local settings to Global Firestore State
             await setSettings(localSettings);
             showAlert('success', 'Changes Saved', `${sectionName} settings updated.`);
        }
    );
  };

  // Ticket Management Handlers
  const handleVoidTicket = (ticketId: string) => {
      showConfirm(
          'Void Ticket',
          'Are you sure you want to void this ticket? This action cannot be undone and will remove the user from the current draw.',
          async () => {
              // Update in Firestore
              const ticketRef = doc(db, 'tickets', ticketId);
              await updateDoc(ticketRef, { status: 'VOID' });
              showAlert('success', 'Ticket Voided', 'The ticket has been successfully voided.');
          }
      );
  };

  const handleManualAssign = () => {
      // Mock Manual Assignment flow
      showConfirm(
          'Manual Ticket Assignment',
          'This will assign a new randomized ticket to a selected user. Continue?',
          async () => {
              // Find next available ticket
              const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
              const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
              let nextTicketNum = 1;
              while (takenNumbers.has(nextTicketNum)) nextTicketNum++;

              const newTicket: any = {
                  ticketNumber: nextTicketNum,
                  userId: '999', // Placeholder
                  userName: "Manually Assigned User",
                  cycle: settings.cycle,
                  status: 'ACTIVE',
                  assignedDate: new Date().toISOString().split('T')[0],
                  assignedBy: 'ADMIN'
              };
              
              await addDoc(collection(db, 'tickets'), newTicket);
              showAlert('success', 'Ticket Assigned', `Ticket #${newTicket.ticketNumber} assigned successfully.`);
          }
      );
  };

  const handleExportTickets = () => {
      // Create CSV content
      const headers = "Ticket ID,Ticket Number,User Name,Cycle,Status,Assigned Date,Assigned By\n";
      const rows = tickets.map(t => 
          `${t.id},${t.ticketNumber},"${t.userName}",${t.cycle},${t.status},${t.assignedDate},${t.assignedBy}`
      ).join("\n");
      
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
      // Exclude if user status is PENDING
      const ticketUser = users.find(u => String(u.id) === String(t.userId));
      if (ticketUser && ticketUser.status === 'PENDING') {
          return false;
      }

      const matchesSearch = t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) || t.ticketNumber.toString().includes(ticketSearch);
      const matchesCycle = ticketCycleFilter === 'ALL' || t.cycle === ticketCycleFilter;
      return matchesSearch && matchesCycle;
  });


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
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.phone) {
        showAlert('error', 'Missing Information', 'Name and Phone are required.');
        return;
    }

    if (editingUser.id) {
        // Update existing user
        const userRef = doc(db, 'users', editingUser.id.toString());
        await updateDoc(userRef, editingUser);
        showAlert('success', 'User Updated', 'User details have been saved successfully.');
    } else {
        // Create new user
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

  // Payment Verification Actions
  const handleApprovePayment = async (req: PaymentRequest) => {
    const { id: reqId, userId, amount, requestedTicket } = req;
    
    // 1. Get User Details
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'Unknown User';

    // 2. Update Request Status
    const reqRef = doc(db, 'payment_requests', reqId);
    await updateDoc(reqRef, { status: 'APPROVED' });
    
    // 3. Handle Ticket Assignment
    let assignedTicketNum = 0;
    
    // Check if the requested ticket is already in the system (could be PENDING reservation)
    if (requestedTicket) {
        const existingTicket = tickets.find(t => 
            t.cycle === settings.cycle && 
            t.ticketNumber === requestedTicket
        );

        if (existingTicket) {
            // Case A: It's the reservation for this user (Status: PENDING)
            if (existingTicket.userId === userId && existingTicket.status === 'PENDING') {
                const ticketRef = doc(db, 'tickets', existingTicket.id);
                await updateDoc(ticketRef, { status: 'ACTIVE', assignedBy: 'ADMIN' });
                assignedTicketNum = requestedTicket;
            } 
            // Case B: It's taken by someone else or already active
            else {
                // Conflict resolution: Find next available
                const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
                const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
                
                let nextTicketNum = 1;
                while (takenNumbers.has(nextTicketNum)) {
                    nextTicketNum++;
                }
                assignedTicketNum = nextTicketNum;
                
                // Create NEW ticket since the requested one was unavailable
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

                showAlert('warning', 'Ticket Conflict', `Requested ticket #${requestedTicket} was not available (Status: ${existingTicket.status}). System assigned #${assignedTicketNum} instead.`);
            }
        } else {
            // Case C: Requested, but no record exists (maybe user deleted it or race condition, or legacy request)
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
        // Case D: No specific ticket requested (Auto-assign)
        const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
        const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
        
        let nextTicketNum = 1;
        while (takenNumbers.has(nextTicketNum)) {
            nextTicketNum++;
        }
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

    // 4. Update user status, contribution
    if (userId) {
        const userRef = doc(db, 'users', userId.toString());
        await updateDoc(userRef, {
            status: 'VERIFIED',
            contribution: (targetUser?.contribution || 0) + amount,
            prizeNumber: assignedTicketNum // Keeping for compatibility, though we rely on tickets collection
        });
    }
    
    if (assignedTicketNum === requestedTicket) {
        showAlert('success', 'Payment Verified', `User verified and Ticket #${assignedTicketNum} has been activated.`);
    }
  };

  const handleRejectPayment = async (req: PaymentRequest) => {
    const { id: reqId, userId, requestedTicket } = req;

    // 1. Reject Request
    const reqRef = doc(db, 'payment_requests', reqId);
    await updateDoc(reqRef, { status: 'REJECTED' });

    // 2. Void/Delete Pending Ticket Reservation
    if (requestedTicket) {
        const reservation = tickets.find(t => 
            t.cycle === settings.cycle && 
            t.ticketNumber === requestedTicket &&
            t.userId === userId &&
            t.status === 'PENDING'
        );
        
        if (reservation) {
            await deleteDoc(doc(db, 'tickets', reservation.id));
        }
    }

    showAlert('info', 'Payment Rejected', 'The payment has been rejected and ticket reservation cleared.');
  };

  // Start New Cycle Logic
  const handleStartNewCycle = () => {
    const nextCycle = settings.cycle + 1;
    
    showConfirm(
      'Start New Cycle?',
      `Are you sure you want to start Cycle ${nextCycle}?\n\nThis will RESET:\n• Pot Value to 0\n• Member Contributions to 0\n• Member Status to Pending\n• Clear all Tickets & Requests\n• Next Draw Date to +30 days`,
      async () => {
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
          nextDrawDateAm: nextDrawDateAm,
          currentWinner: null // Reset active winner
        }));

        // Update local state for the date picker inputs
        setEthDate(newEthDate);

        // 2. Reset All Users
        // Batch updates might be better for large sets, but simple loop for now
        // IMPORTANT: Real world apps would use a cloud function for this
        for (const u of users) {
             if (u.id) {
                 await updateDoc(doc(db, 'users', u.id.toString()), {
                     status: 'PENDING',
                     contribution: 0,
                     prizeNumber: null // Use null to remove field or special value
                 } as any);
             }
        }

        // 3. Notify All Members (Mock)
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

  const handleSearchWinningTicket = () => {
    if (!drawTicketSearch) return;
    const ticketNum = parseInt(drawTicketSearch);
    
    const winningTicket = tickets.find(t => 
        t.cycle === settings.cycle && 
        t.ticketNumber === ticketNum && 
        t.status === 'ACTIVE'
    );

    if (winningTicket) {
        // Verify user status
        const ticketUser = users.find(u => String(u.id) === String(winningTicket.userId));
        if (ticketUser && ticketUser.status === 'PENDING') {
             setFoundWinningTicket(null);
             showAlert('error', 'Ineligible Winner', `User ${ticketUser.name} is PENDING. Only verified members can win.`);
             return;
        }

        setFoundWinningTicket(winningTicket);
    } else {
        setFoundWinningTicket(null);
        showAlert('error', 'Ticket Not Found', `No active ticket found with number #${ticketNum} in current cycle.`);
    }
  };

  const handleBroadcastWinner = () => {
      if (!foundWinningTicket) return;
      
      showConfirm(
          'Broadcast Winner?',
          `This will announce ${foundWinningTicket.userName} (Ticket #${foundWinningTicket.ticketNumber}) as the winner of ${settings.prizeName}. This will trigger the celebration screen for the winner.`,
          async () => {
              // Update settings to current winner
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
              
              showAlert('success', 'Winner Announced!', 'The winner has been broadcasted to the application.');
          }
      );
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
    
    // Update settings in Firestore
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
                   {/* ... Form fields identical to existing ... */}
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

      {/* New Winner History Modal */}
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
            onClick={() => handleTabChange('competition')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'competition' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Trophy className="w-5 h-5 mr-3" /> Competition
          </button>
          <button 
            onClick={() => handleTabChange('prizes')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'prizes' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Gift className="w-5 h-5 mr-3" /> Prizes
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
               activeTab === 'competition' ? 'Competition' :
               activeTab === 'prizes' ? 'Prize Management' :
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
                    {/* ... Dashboard content ... */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-stone-500 text-sm font-bold uppercase">Total Pot</h3>
                              <DollarSign className="w-5 h-5 text-emerald-500" />
                           </div>
                           <p className="text-2xl font-bold text-stone-800">{settings.potValue.toLocaleString()} ETB</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                           <div className="flex items-center justify-between mb-2">
                              <h3 className="text-stone-500 text-sm font-bold uppercase">Claimed Tickets</h3>
                              <Ticket className="w-5 h-5 text-teal-500" />
                           </div>
                           <p className="text-2xl font-bold text-stone-800">
                              {tickets.filter(t => t.status === 'ACTIVE' && t.cycle === settings.cycle).length}
                           </p>
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

            {/* --- COMPETITION MANAGEMENT TAB --- */}
            {activeTab === 'competition' && (
                <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
                    {/* ... Existing Competition Tab ... */}
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6">
                        <h1 className="text-2xl font-bold text-stone-800 mb-4 md:mb-0">Competition Management</h1>
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-stone-200 flex">
                            <button 
                                onClick={() => setCompSubTab('settings')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    compSubTab === 'settings' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'
                                }`}
                            >
                                General Settings
                            </button>
                            <button 
                                onClick={() => setCompSubTab('tickets')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                                    compSubTab === 'tickets' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'
                                }`}
                            >
                                <Ticket className="w-4 h-4 mr-2" /> Ticket Management
                            </button>
                        </div>
                    </div>
                    
                    {compSubTab === 'settings' && (
                         <div className="space-y-6 animate-fade-in-down">
                             {/* ... Draw Schedule ... */}
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
                                    </div>
                                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                                        <h3 className="text-sm font-bold text-stone-500 uppercase mb-2">Preview</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-stone-600">English:</span>
                                                <span className="font-bold text-stone-800">{localSettings.nextDrawDateEn}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-stone-600">Amharic:</span>
                                                <span className="font-bold text-stone-800">{localSettings.nextDrawDateAm}</span>
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
                            
                            {/* ... Current Prize ... */}
                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                                    <Trophy className="w-5 h-5 mr-2 text-amber-500" /> Current Prize
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-stone-700 mb-1">Prize Name</label>
                                            <input type="text" value={localSettings.prizeName} onChange={(e) => setLocalSettings(prev => ({...prev, prizeName: e.target.value}))} className="w-full p-2 border border-stone-300 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-stone-700 mb-1">Prize Value</label>
                                            <input type="text" value={localSettings.prizeValue} onChange={(e) => setLocalSettings(prev => ({...prev, prizeValue: e.target.value}))} className="w-full p-2 border border-stone-300 rounded-lg" />
                                        </div>
                                        {/* Image Inputs */}
                                        <div>
                                            <label className="block text-sm font-bold text-stone-700 mb-1">Prize Images</label>
                                            <div className="flex gap-2 mb-2">
                                                <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 p-2 border border-stone-300 rounded-lg text-sm" />
                                                <button onClick={handleAddImage} className="px-4 bg-stone-800 text-white rounded-lg"><Plus className="w-4 h-4" /></button>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {(localSettings.prizeImages || []).map((url, i) => (
                                                    <div key={i} className="w-12 h-12 flex-shrink-0 relative">
                                                        <img src={url} className="w-full h-full object-cover rounded" />
                                                        <button onClick={() => handleRemoveImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col h-full">
                                        <label className="block text-sm font-bold text-stone-700 mb-1">Preview</label>
                                        <div className="flex-grow bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative min-h-[150px]">
                                            <img src={(localSettings.prizeImages && localSettings.prizeImages.length > 0) ? localSettings.prizeImages[0] : ''} className="w-full h-full object-cover absolute inset-0" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                                    <button onClick={() => handleSaveSection('Current Prize')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </button>
                                </div>
                            </div>

                             {/* ... Live Stream ... */}
                             <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                                    <Video className="w-5 h-5 mr-2 text-red-600" /> Live Stream
                                </h2>
                                <div className="flex items-center justify-between mb-4">
                                     <span>Live Status</span>
                                     <button onClick={() => setLocalSettings(prev => ({ ...prev, isLive: !prev.isLive }))} className={`w-11 h-6 rounded-full transition-colors ${localSettings.isLive ? 'bg-red-600' : 'bg-stone-300'}`}>
                                         <span className={`block w-4 h-4 bg-white rounded-full transition-transform ml-1 ${localSettings.isLive ? 'translate-x-5' : ''}`} />
                                     </button>
                                </div>
                                <input type="text" value={localSettings.liveStreamUrl} onChange={(e) => setLocalSettings(prev => ({...prev, liveStreamUrl: e.target.value}))} className="w-full p-2 border border-stone-300 rounded-lg" placeholder="Embed URL" />
                                <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                                    <button onClick={() => handleSaveSection('Live Stream')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </button>
                                </div>
                             </div>
                         </div>
                    )}
                    {compSubTab === 'tickets' && (
                        <div className="space-y-6 animate-fade-in-down">
                            {/* Simplified Ticket Management for Diff context - assumes existing logic present */}
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative flex-grow md:w-64">
                                    <input type="text" placeholder="Search..." value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} className="pl-4 pr-4 py-2 border border-stone-300 rounded-lg w-full" />
                                </div>
                                <button onClick={handleExportTickets} className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold">Export CSV</button>
                             </div>
                             <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                        <tr><th className="px-6 py-3">Ticket #</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Status</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {filteredTickets.slice(0, 5).map(t => (
                                            <tr key={t.id}>
                                                <td className="px-6 py-4 font-mono font-bold">#{t.ticketNumber}</td>
                                                <td className="px-6 py-4">{t.userName}</td>
                                                <td className="px-6 py-4">{t.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- PRIZES MANAGEMENT TAB (NEW) --- */}
            {activeTab === 'prizes' && (
                <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-stone-800">Prize Management</h1>

                    {/* Section 1: Live Draw Announcer */}
                    <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><PartyPopper className="w-64 h-64" /></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-4 flex items-center">
                                <Video className="w-6 h-6 mr-3 text-red-500 animate-pulse" /> Live Draw Announcer
                            </h2>
                            <p className="text-stone-400 mb-8 max-w-2xl">
                                Use this tool during the live event to broadcast the winner to all connected users instantly. 
                                Ensure the ticket number corresponds to the verified winner drawn.
                            </p>
                            
                            <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/10 max-w-xl">
                                <label className="block text-sm font-bold text-stone-300 mb-2">Winning Ticket Number</label>
                                <div className="flex gap-4 mb-6">
                                    <input 
                                        type="number" 
                                        value={drawTicketSearch}
                                        onChange={(e) => setDrawTicketSearch(e.target.value)}
                                        placeholder="e.g. 104"
                                        className="flex-1 bg-stone-900 border border-stone-600 rounded-lg px-4 py-3 text-xl font-mono text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleSearchWinningTicket}
                                        className="px-6 py-3 bg-stone-700 hover:bg-stone-600 rounded-lg font-bold transition-colors"
                                    >
                                        Verify Ticket
                                    </button>
                                </div>

                                {foundWinningTicket && (
                                    <div className="bg-emerald-900/50 border border-emerald-500/50 p-4 rounded-lg mb-6 animate-fade-in-down">
                                        <div className="flex items-center mb-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-400 mr-2" />
                                            <span className="text-emerald-200 font-bold uppercase text-xs">Valid Ticket Found</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1">{foundWinningTicket.userName}</h3>
                                        <p className="text-stone-300 text-sm">Ticket #{foundWinningTicket.ticketNumber} • Cycle {foundWinningTicket.cycle}</p>
                                    </div>
                                )}

                                <button 
                                    onClick={handleBroadcastWinner}
                                    disabled={!foundWinningTicket}
                                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold text-lg rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <PartyPopper className="w-6 h-6 mr-2" /> ANNOUNCE WINNER LIVE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Hall of Fame Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-stone-800 flex items-center">
                                    <Star className="w-5 h-5 mr-2 text-amber-500" /> Hall of Fame (Past Winners)
                                </h2>
                                <p className="text-stone-500 text-sm">Manage the list of winners displayed on the Prizes page.</p>
                            </div>
                            <button 
                                onClick={() => setIsWinnerModalOpen(true)}
                                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold text-sm flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Past Winner
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Prize</th>
                                        <th className="px-6 py-3">Cycle</th>
                                        <th className="px-6 py-3">Location</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {settings.recentWinners.map((winner) => (
                                        <tr key={winner.id} className="hover:bg-stone-50">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-stone-800">{winner.name}</p>
                                                <p className="text-xs text-stone-400">{winner.nameAm}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center text-emerald-700 font-bold">
                                                    <Trophy className="w-4 h-4 mr-2" /> {winner.prize}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-600">
                                                    {winner.cycle}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-stone-500">{winner.location}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeletePastWinner(winner.id)}
                                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {settings.recentWinners.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-8 text-stone-400">No history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- USERS MANAGEMENT TAB --- */}
            {activeTab === 'users' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-2xl font-bold text-stone-800">User Management</h1>
                        <button 
                            onClick={openAddUser}
                            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add New User
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-stone-400" />
                             </div>
                             <input 
                                type="text" 
                                placeholder="Search by name or phone..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg w-full focus:ring-2 focus:ring-emerald-500 outline-none" 
                             />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-stone-500" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="py-2 px-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                            >
                                <option value="ALL">All Status</option>
                                <option value="VERIFIED">Verified</option>
                                <option value="PENDING">Pending</option>
                            </select>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Contribution</th>
                                        <th className="px-6 py-3">Ticket #</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-stone-800">{user.name}</div>
                                                    <div className="text-xs text-stone-400">Joined: {user.joinedDate || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-stone-600">{user.phone}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center ${
                                                        user.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {user.status === 'VERIFIED' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-stone-700">
                                                    {user.contribution.toLocaleString()} ETB
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.prizeNumber ? (
                                                        <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs font-bold border border-stone-200">
                                                            #{user.prizeNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-stone-300 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button 
                                                            onClick={() => openEditUser(user)}
                                                            className="p-1.5 bg-stone-100 hover:bg-emerald-100 text-stone-500 hover:text-emerald-700 rounded-lg transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-1.5 bg-stone-100 hover:bg-red-100 text-stone-500 hover:text-red-700 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-stone-500 bg-stone-50/50">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="w-12 h-12 text-stone-200 mb-3" />
                                                    <p>No users found matching your search.</p>
                                                    <button onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} className="mt-2 text-emerald-600 text-sm font-bold hover:underline">Clear Filters</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-xs text-stone-500 flex justify-between items-center font-medium">
                            <span>Showing {filteredUsers.length} users</span>
                            <span>Total Users: {users.length}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PAYMENTS TAB --- */}
            {activeTab === 'payments' && (
                <div className="space-y-6 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-stone-800">Pending Payments</h1>
                    {paymentRequests.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-800 mb-2">All Caught Up!</h3>
                            <p className="text-stone-500">There are no pending payment requests to verify at this time.</p>
                        </div>
                    ) : (
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
                                        <div className="bg-stone-50 p-3 rounded-lg mb-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-stone-500 text-sm">Amount Declared:</span>
                                                <span className="font-bold text-emerald-700">{req.amount.toLocaleString()} ETB</span>
                                            </div>
                                            {req.requestedTicket && (
                                                <div className="flex items-center text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded">
                                                    <Ticket className="w-3 h-3 mr-2" />
                                                    <span className="text-xs font-bold">Req. Lucky #: {req.requestedTicket}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex space-x-3">
                                            <button 
                                                onClick={() => handleRejectPayment(req.id)}
                                                className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleApprovePayment(req)}
                                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold transition-colors shadow-lg shadow-emerald-200"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- SETTINGS TAB --- */}
            {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-stone-800">App Settings</h1>

                    {/* General Preferences (Language) */}
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Globe className="w-5 h-5 mr-2 text-stone-600" /> General Preferences
                        </h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-stone-800">Application Language</h3>
                                <p className="text-sm text-stone-500">Set the default language for the application interface.</p>
                            </div>
                            <div className="flex bg-stone-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setLanguage('en')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${language === 'en' ? 'bg-white shadow text-emerald-800' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    English
                                </button>
                                <button 
                                    onClick={() => setLanguage('am')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${language === 'am' ? 'bg-white shadow text-emerald-800' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    Amharic
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                            <Shield className="w-5 h-5 mr-2 text-stone-600" /> Account & Security
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                 <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg border border-stone-200">
                                     <div>
                                         <h3 className="font-bold text-stone-800">User Registration</h3>
                                         <p className="text-sm text-stone-500">Allow new users to create accounts</p>
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
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AdminView;
