import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Trophy, Users, Upload, CreditCard, History, Ticket, X, ShieldCheck, ChevronRight, Video, ExternalLink, Building, Smartphone, ArrowLeft, Copy, Info, Activity, UserPlus, AlertCircle, Search, XCircle, Ban } from 'lucide-react';
import { User, Language, FeedItem, AppSettings, AppNotification } from '../types';
import { TRANSLATIONS, PRIZE_IMAGES } from '../constants';
import { doc, onSnapshot, updateDoc, addDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DashboardViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  language: Language;
  settings: AppSettings;
  notifications: AppNotification[];
  markAllAsRead: () => void;
}

const generateMockFeed = (t: any): FeedItem => {
  const names = ["Abebe K.", "Tigist M.", "Dawit L.", "Sara B.", "Yonas T.", "Hanna G."];
  const actions = [t.action_verified, t.action_joined];
  return {
    id: Math.random(),
    name: names[Math.floor(Math.random() * names.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    time: "Just now"
  };
};

const DashboardView: React.FC<DashboardViewProps> = ({ user, setUser, language, settings, notifications, markAllAsRead }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTempTicket, setSelectedTempTicket] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CBE' | 'TELEBIRR' | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Timeline Data State
  const [rawPayments, setRawPayments] = useState<any[]>([]);
  const [rawUserTickets, setRawUserTickets] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  
  // Real ticket data from DB for Grid Selection (Rolling Growth Logic)
  const [tickets, setTickets] = useState<{number: number, taken: boolean}[]>([]);

  // Lucky Search State
  const [luckySearch, setLuckySearch] = useState('');
  const [luckyStatus, setLuckyStatus] = useState<'IDLE' | 'AVAILABLE' | 'TAKEN' | 'INVALID'>('IDLE');

  const t = TRANSLATIONS[language].dashboard;
  const heroT = TRANSLATIONS[language].hero;
  const statsT = TRANSLATIONS[language].stats;

  // Carousel Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % PRIZE_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // --- Real-time User Updates ---
  useEffect(() => {
    if (!user || !user.id) return;

    const userRef = doc(db, 'users', user.id.toString());
    const unsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(prev => ({ ...prev!, ...data }));
        }
    });

    return () => unsub();
  }, [user?.id, setUser]);

  // --- Rolling Growth Ticket Fetch (Grid) ---
  useEffect(() => {
    const q = query(
        collection(db, 'tickets'), 
        where('cycle', '==', settings.cycle),
        where('status', '==', 'ACTIVE')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const takenSet = new Set<number>();
        
        snapshot.forEach(doc => {
            takenSet.add(doc.data().ticketNumber);
        });

        const takenCount = takenSet.size;
        const dynamicLimit = 100 * (Math.floor(takenCount / 2) + 1);

        const allTickets = Array.from({ length: dynamicLimit }, (_, i) => ({
            number: i + 1,
            taken: takenSet.has(i + 1)
        }));
        setTickets(allTickets);
    });

    return () => unsubscribe();
  }, [settings.cycle]);

  // --- Fetch Raw Data for History (Payments & Tickets) ---
  useEffect(() => {
    if (!user || !user.id) return;

    // 1. Fetch Payment Requests
    const qPay = query(collection(db, 'payment_requests'), where('userId', '==', user.id));
    const unsubPay = onSnapshot(qPay, (snapshot) => {
        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setRawPayments(payments);
    });

    // 2. Fetch ALL Tickets for this user (History)
    // We check for string or number ID match just in case
    const qTickets = query(collection(db, 'tickets'), where('userId', '==', user.id));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
        const userTix = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setRawUserTickets(userTix);
    });

    return () => {
        unsubPay();
        unsubTickets();
    };
  }, [user.id]);

  // --- Merge & Sort Activities ---
  useEffect(() => {
      const timeline = [];

      // A. Joined Event
      timeline.push({
          id: 'joined',
          type: 'JOINED',
          date: user.joinedDate || 'Recent',
          title: language === 'en' ? 'Joined the Equb' : 'እቁቡን ተቀላቅለዋል',
          desc: language === 'en' ? 'Account created successfully' : 'መለያዎ በተሳካ ሁኔታ ተፈጥሯል',
          status: 'success',
          timestamp: new Date(user.joinedDate || new Date()).getTime()
      });

      // B. Payments
      rawPayments.forEach(pay => {
          let statusText = language === 'en' ? 'Pending' : 'በመጠባበቅ ላይ';
          if (pay.status === 'APPROVED') {
              statusText = language === 'en' ? 'Approved' : 'ተረጋግጧል';
          } else if (pay.status === 'REJECTED') {
              statusText = language === 'en' ? 'Rejected' : 'ተሰርዟል';
          }

          timeline.push({
              id: pay.id,
              type: 'PAYMENT',
              date: pay.date,
              title: language === 'en' ? 'Payment Submitted' : 'ክፍያ ተፈጽሟል',
              desc: `${pay.amount} ETB - ${statusText}`,
              status: pay.status === 'APPROVED' ? 'success' : pay.status === 'REJECTED' ? 'error' : 'warning',
              timestamp: new Date(pay.date).getTime()
          });
      });

      // C. Tickets (Active & Past)
      rawUserTickets.forEach(t => {
          const isCurrentCycle = t.cycle === settings.cycle;
          const isActive = t.status === 'ACTIVE';
          const isLucky = isActive && isCurrentCycle;

          let title = '';
          let desc = '';
          let status = 'neutral';

          if (language === 'en') {
              title = isLucky ? `Lucky Ticket #${t.ticketNumber}` : `Ticket #${t.ticketNumber} (Cycle ${t.cycle})`;
              if (t.status === 'VOID') desc = 'Voided / Cancelled';
              else if (!isCurrentCycle) desc = `Past Cycle Participation`;
              else desc = 'Active for Upcoming Draw';
          } else {
              title = isLucky ? `እድለኛ ቁጥር #${t.ticketNumber}` : `እጣ ቁጥር #${t.ticketNumber} (ዙር ${t.cycle})`;
              if (t.status === 'VOID') desc = 'ተሰርዟል';
              else if (!isCurrentCycle) desc = `የያለፈ ዙር ተሳትፎ`;
              else desc = 'ንቁ እና ለእጣው ዝግጁ';
          }

          if (t.status === 'VOID') status = 'error';
          else if (isLucky) status = 'success';
          else status = 'neutral';

          timeline.push({
              id: t.id,
              type: 'TICKET_HISTORY',
              date: t.assignedDate || 'N/A',
              title: title,
              desc: desc,
              status: status,
              timestamp: new Date(t.assignedDate || new Date()).getTime()
          });
      });

      // Sort by date descending (newest first)
      timeline.sort((a, b) => {
           // Simple date string compare or fallback
           return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setUserActivities(timeline);

  }, [rawPayments, rawUserTickets, user.joinedDate, language, settings.cycle]);

  // --- Mock Feed Init ---
  useEffect(() => {
    setFeed([generateMockFeed(t), generateMockFeed(t)]);
    const interval = setInterval(() => {
      setFeed(prev => [generateMockFeed(t), ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [language, t]);

  const handlePayment = async () => {
    if (!user || !user.id) return;
    setUploading(true);

    try {
        await addDoc(collection(db, 'payment_requests'), {
            userId: user.id,
            userName: user.name,
            userPhone: user.phone,
            amount: 5000,
            date: new Date().toLocaleDateString(),
            receiptUrl: "https://via.placeholder.com/150",
            status: 'PENDING',
            requestedTicket: selectedTempTicket
        });

        setTimeout(() => {
            setUploading(false);
            setPaymentMethod(null);
            setPaymentConfirmed(false);
            alert(language === 'en' ? "Receipt uploaded successfully! Waiting for admin verification." : "ደረሰኝ በተሳካ ሁኔታ ተላከ! አስተዳዳሪው እስኪያረጋግጥ ይጠብቁ።");
        }, 1000);

    } catch (error) {
        console.error("Payment Error", error);
        setUploading(false);
    }
  };

  const confirmTicket = async () => {
    if (selectedTempTicket && user && user.id) {
        setShowTicketModal(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLuckySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLuckySearch(val);
    
    if (!val) {
        setLuckyStatus('IDLE');
        return;
    }

    const num = parseInt(val);
    if (isNaN(num)) {
         setLuckyStatus('IDLE');
         return;
    }

    const ticket = tickets.find(t => t.number === num);
    if (ticket) {
        setLuckyStatus(ticket.taken ? 'TAKEN' : 'AVAILABLE');
    } else {
        setLuckyStatus('IDLE');
    }
  };

  const formatTime = (date: any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffInSeconds < 60) return language === 'en' ? 'Just now' : 'አሁን';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return language === 'en' ? `${diffInMinutes}m ago` : `ከ${diffInMinutes} ደቂቃ በፊት`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return language === 'en' ? `${diffInHours}h ago` : `ከ${diffInHours} ሰዓት በፊት`;
    const diffInDays = Math.floor(diffInHours / 24);
    return language === 'en' ? `${diffInDays}d ago` : `ከ${diffInDays} ቀን በፊት`;
  };

  if (!user) return null; // Safety check during transition

  const unreadCount = notifications.filter(n => !n.read).length;
  const paymentDueDate = language === 'en' ? settings.nextDrawDateEn : settings.nextDrawDateAm;
  const cycleText = language === 'en' ? `Cycle ${settings.cycle}` : `ዙር ${settings.cycle}`;

  const formatTicket = (num: number) => num.toString();

  const getActivityIcon = (type: string, status: string) => {
      if (type === 'TICKET_HISTORY') {
          if (status === 'success') return <Ticket className="w-5 h-5 text-emerald-600" />;
          if (status === 'error') return <Ban className="w-5 h-5 text-red-500" />;
          return <Ticket className="w-5 h-5 text-stone-400" />;
      }
      if (type === 'TICKET') return <Ticket className="w-5 h-5 text-emerald-600" />;
      if (type === 'JOINED') return <UserPlus className="w-5 h-5 text-blue-500" />;
      if (type === 'PAYMENT') {
          if (status === 'success') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
          if (status === 'error') return <X className="w-5 h-5 text-red-500" />;
          return <Clock className="w-5 h-5 text-amber-500" />;
      }
      return <Activity className="w-5 h-5 text-stone-400" />;
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-20 pb-12 relative">
      
      {/* Notifications Modal Window */}
      {showNotifications && (
        <div className="fixed inset-0 z-[60] flex items-start justify-end px-4 sm:px-8 pt-20" onClick={() => setShowNotifications(false)}>
           <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
           <div 
             className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down border border-stone-200 mt-2"
             onClick={e => e.stopPropagation()}
           >
              <div className="bg-stone-900 text-white p-4 flex justify-between items-center border-b border-stone-800">
                 <h3 className="font-bold flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-amber-400" /> 
                    {language === 'en' ? "Notifications" : "ማሳወቂያዎች"}
                 </h3>
                 <button onClick={() => setShowNotifications(false)} className="text-stone-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                 {notifications.length > 0 ? (
                    notifications.map((note) => (
                        <div key={note.id} className={`p-4 border-b border-stone-100 hover:bg-stone-50 transition-colors ${note.urgent ? 'bg-amber-50/40' : ''} ${!note.read ? 'bg-emerald-50/20' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold flex items-center ${note.urgent ? 'text-amber-800' : 'text-stone-800'}`}>
                                {!note.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>}
                                {language === 'en' ? note.title.en : note.title.am}
                            </h4>
                            <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">{formatTime(note.time)}</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">{language === 'en' ? note.desc.en : note.desc.am}</p>
                        </div>
                    ))
                 ) : (
                    <div className="p-8 text-center text-stone-500 text-sm">
                        {language === 'en' ? "No new notifications" : "ምንም አዲስ ማሳወቂያ የለም"}
                    </div>
                 )}
              </div>
              <div className="p-3 bg-stone-50 text-center border-t border-stone-200">
                 <button onClick={markAllAsRead} className="text-emerald-700 text-xs font-bold hover:underline">
                    {language === 'en' ? "Mark all as read" : "ሁሉንም እንዳነበብኩ ቁጠር"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Ticket Selection Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-emerald-900 text-white">
               <div>
                  <h3 className="text-xl font-bold flex items-center">
                    <Ticket className="w-5 h-5 mr-2" /> {t.select_ticket}
                  </h3>
                  <p className="text-emerald-200 text-xs mt-1">{t.select_ticket_desc}</p>
               </div>
               <button onClick={() => setShowTicketModal(false)} className="text-emerald-200 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-6">
                <p className="text-sm text-stone-500 mb-4">{t.ticket_instruction}</p>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 mb-6 max-h-80 overflow-y-auto p-2">
                    {tickets.map((ticket) => (
                        <button
                          key={ticket.number}
                          disabled={ticket.taken}
                          onClick={() => setSelectedTempTicket(ticket.number)}
                          className={`
                             aspect-square rounded-xl flex items-center justify-center text-2xl font-black transition-all shadow-sm
                             ${ticket.taken 
                                ? 'bg-stone-100 text-stone-300 cursor-not-allowed opacity-50' 
                                : selectedTempTicket === ticket.number 
                                   ? 'bg-amber-500 text-white shadow-xl scale-110 ring-4 ring-amber-200' 
                                   : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white hover:scale-105 active:scale-95'}
                          `}
                        >
                           {formatTicket(ticket.number)}
                        </button>
                    ))}
                </div>

                <div className="bg-emerald-50 p-5 rounded-2xl flex items-center justify-between mb-6 border border-emerald-100">
                    <span className="text-emerald-900 font-bold">{t.my_ticket}:</span>
                    <span className="text-5xl font-black text-emerald-700 tracking-tighter">
                        {selectedTempTicket ? `#${formatTicket(selectedTempTicket)}` : '-'}
                    </span>
                </div>

                <button 
                  onClick={confirmTicket}
                  disabled={!selectedTempTicket}
                  className="w-full py-4 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-xl active:scale-95"
                >
                    {t.confirm_ticket}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-900 text-white">
               <h3 className="text-xl font-bold flex items-center">
                 <History className="w-5 h-5 mr-2" /> {t.history}
               </h3>
               <button onClick={() => setShowHistoryModal(false)} className="text-stone-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
               <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-full">{userActivities.length} Events</span>
                </div>
                {userActivities.length === 0 ? (
                     <div className="text-center py-8 text-stone-400 text-sm">No recent activity. Make a payment to get started!</div>
                ) : (
                    <div className="relative border-l-2 border-stone-100 ml-3 space-y-8 py-2">
                        {userActivities.map((item, i) => (
                           <div key={item.id} className="relative pl-8">
                              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                  item.status === 'success' ? 'bg-emerald-500' : 
                                  item.status === 'error' ? 'bg-red-500' : 
                                  item.status === 'warning' ? 'bg-amber-500' : 
                                  item.status === 'neutral' ? 'bg-stone-400' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                                  <h4 className="font-bold text-stone-800 text-sm flex items-center">
                                      {getActivityIcon(item.type, item.status)}
                                      <span className="ml-2">{item.title}</span>
                                  </h4>
                                  <span className="text-xs text-stone-400 font-mono mt-1 sm:mt-0">{item.date}</span>
                              </div>
                              <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-2 rounded border border-stone-100 inline-block">
                                  {item.desc}
                              </p>
                           </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-fade-in-down">
           <div>
              <h1 className="text-2xl font-bold text-emerald-900">{t.welcome} {user.name}</h1>
              <p className="text-stone-500 text-xs sm:text-base">Member ID: #{user.id?.toString().slice(0,6)}... • {cycleText}</p>
           </div>
           <div className="mt-4 md:mt-0 flex space-x-3">
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="p-2 bg-white rounded-full shadow hover:bg-stone-100 text-stone-600 transition-transform hover:scale-110"
              >
                 <History className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-white rounded-full shadow hover:bg-stone-100 text-stone-600 relative transition-transform hover:scale-110"
              >
                 <Bell className="w-5 h-5" />
                 {unreadCount > 0 && (
                     <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                 )}
              </button>
           </div>
        </div>

        {/* Live Stream Section */}
        {settings.isLive && (
          <div className="mb-8 animate-fade-in-down">
            <div className="bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-800 relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse"></div>
               <div className="p-4 bg-stone-800 flex items-center justify-between">
                  <div className="flex items-center text-white">
                     <span className="flex h-3 w-3 relative mr-3">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                     </span>
                     <h3 className="font-bold text-lg tracking-wide uppercase">Live Draw Now</h3>
                  </div>
                  <div className="text-xs font-bold text-stone-400 bg-black/30 px-2 py-1 rounded border border-stone-700">
                     TikTok / Instagram
                  </div>
               </div>
               
               <div className="relative aspect-video bg-black flex flex-col items-center justify-center">
                  {settings.liveStreamUrl ? (
                     <iframe 
                       src={settings.liveStreamUrl} 
                       className="w-full h-full border-0" 
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                       allowFullScreen
                     ></iframe>
                  ) : (
                     <div className="text-center p-8">
                        <Video className="w-16 h-16 text-stone-700 mx-auto mb-4" />
                        <p className="text-stone-500">Connecting to stream...</p>
                     </div>
                  )}
                  
                  <div className="absolute bottom-4 right-4">
                     <a 
                       href={settings.liveStreamUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg text-sm font-bold border border-white/20 transition-all"
                     >
                        <ExternalLink className="w-4 h-4 mr-2" /> Open in App
                     </a>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid - Status and Contribution Cards Side-by-Side on Mobile */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-t-4 border-amber-500 opacity-0 animate-fade-in-up hover:shadow-lg transition-shadow duration-300">
               <h3 className="text-stone-400 text-[10px] md:text-sm font-semibold uppercase mb-1 md:mb-2 leading-tight">{t.status_card_title}</h3>
               <div className="flex items-center justify-between mb-2 md:mb-4">
                  <span className={`text-base md:text-2xl font-bold truncate pr-1 ${user.status === 'VERIFIED' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {user.status === 'VERIFIED' ? t.status_verified : t.status_pending}
                  </span>
                  {user.status === 'VERIFIED' ? <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-emerald-500 flex-shrink-0" /> : <Clock className="w-5 h-5 md:w-8 md:h-8 text-red-500 flex-shrink-0" />}
               </div>
               
               {user.prizeNumber ? (
                   <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 md:p-3 flex items-center justify-between animate-fade-in-down overflow-hidden">
                      <div className="flex items-center min-w-0">
                          <Ticket className="w-3 h-3 md:w-5 md:h-5 text-amber-600 mr-1 md:mr-2 flex-shrink-0" />
                          <span className="text-amber-800 font-medium text-[10px] md:text-sm truncate">{t.my_ticket}</span>
                      </div>
                      <span className="text-sm md:text-xl font-extrabold text-amber-600 flex-shrink-0 ml-1">#{formatTicket(user.prizeNumber)}</span>
                   </div>
               ) : (
                   <>
                       <div className="w-full bg-stone-100 rounded-full h-1.5 md:h-2 mb-1 md:mb-2">
                          <div className={`h-1.5 md:h-2 rounded-full ${user.status === 'VERIFIED' ? 'bg-emerald-500 w-full' : 'bg-red-400 w-[10%]'}`}></div>
                       </div>
                       <p className="text-[10px] md:text-xs text-stone-400 truncate">{t.payment_due}: {paymentDueDate}</p>
                   </>
               )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border-t-4 border-emerald-600 opacity-0 animate-fade-in-up delay-[100ms] hover:shadow-lg transition-shadow duration-300">
               <h3 className="text-stone-400 text-[10px] md:text-sm font-semibold uppercase mb-1 md:mb-2 leading-tight">{t.contribution}</h3>
               <div className="flex items-center justify-between mb-2 md:mb-4">
                  <span className="text-lg md:text-3xl font-bold text-stone-800 truncate pr-1">
                    {user.contribution.toLocaleString()} <span className="text-[10px] md:text-sm font-normal text-stone-400">ETB</span>
                  </span>
                  <div className="bg-emerald-100 p-1.5 md:p-2 rounded-lg flex-shrink-0">
                    <Trophy className="w-4 h-4 md:w-6 md:h-6 text-emerald-600" />
                  </div>
               </div>
               <p className="text-[10px] md:text-sm text-emerald-600 font-medium leading-tight truncate">{t.contribution_sub}</p>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl opacity-0 animate-fade-in-up delay-[300ms]">
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mb-16"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                           <div className="text-center md:text-left">
                               <div className="inline-block bg-red-900/80 px-3 py-1 rounded text-xs font-bold mb-3 border border-red-700 animate-pulse">
                                  {settings.daysRemaining === 0 
                                    ? t.next_draw_today 
                                    : t.next_draw.replace('14', settings.daysRemaining.toString())
                                  }
                               </div>
                               <h2 className="text-3xl font-bold mb-2 leading-tight">{t.win_title}</h2>
                               <p className="text-stone-300 text-sm md:text-base">{t.win_desc}</p>
                           </div>

                           <div className="bg-white/5 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                     <h3 className="font-bold text-sm text-emerald-300 uppercase tracking-wide flex items-center">
                                       {user.status === 'VERIFIED' ? <CheckCircle className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                       {user.status === 'VERIFIED' ? t.status_verified : t.upload}
                                     </h3>
                                     <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${user.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                       {user.status === 'VERIFIED' ? 'Active' : 'Pending'}
                                     </span>
                                </div>
                                
                                {user.status === 'VERIFIED' && !user.prizeNumber ? (
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => setShowTicketModal(true)}
                                            className="w-full flex justify-center items-center px-4 py-3 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-stone-900 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
                                        >
                                            <Ticket className="w-5 h-5 mr-2" /> {t.select_ticket}
                                        </button>
                                    </div>
                                ) : user.status === 'VERIFIED' ? (
                                    <button disabled className="w-full flex justify-center items-center px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold cursor-default">
                                         <CheckCircle className="w-5 h-5 mr-2" /> {t.btn_paid}
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {!paymentMethod ? (
                                            <>
                                                <button onClick={() => { setPaymentMethod('CBE'); setPaymentConfirmed(false); }} className="w-full flex justify-between items-center px-4 py-3 bg-purple-900/50 hover:bg-purple-900 border border-purple-500/30 text-white rounded-lg transition-all group">
                                                    <span className="flex items-center"><Building className="w-5 h-5 mr-3 text-purple-300" /> {t.pay_cbe}</span>
                                                    <ChevronRight className="w-4 h-4 text-purple-300 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                                <button onClick={() => { setPaymentMethod('TELEBIRR'); setPaymentConfirmed(false); }} className="w-full flex justify-between items-center px-4 py-3 bg-blue-900/50 hover:bg-blue-900 border border-blue-500/30 text-white rounded-lg transition-all group">
                                                    <span className="flex items-center"><Smartphone className="w-5 h-5 mr-3 text-blue-300" /> {t.pay_telebirr}</span>
                                                    <ChevronRight className="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="animate-fade-in-up">
                                               <button onClick={() => { setPaymentMethod(null); setPaymentConfirmed(false); }} className="text-stone-400 text-xs flex items-center mb-3 hover:text-white">
                                                  <ArrowLeft className="w-3 h-3 mr-1" /> {t.change_method}
                                               </button>
                                               {paymentMethod === 'CBE' ? (
                                                   <div className="bg-white/10 p-4 rounded-lg mb-4 border border-white/10">
                                                       <p className="text-stone-400 text-xs mb-1">{t.account_no}</p>
                                                       <div className="flex justify-between items-center mb-2">
                                                           <p className="text-lg font-bold font-mono tracking-wide">1000234567890</p>
                                                           <button onClick={() => copyToClipboard('1000234567890')} className="text-purple-300 hover:text-white p-1">
                                                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                           </button>
                                                       </div>
                                                       <p className="text-stone-400 text-xs">{t.acc_name}: Blessed Digital Equb</p>
                                                   </div>
                                               ) : (
                                                   <div className="bg-white/10 p-4 rounded-lg mb-4 border border-white/10">
                                                       <p className="text-stone-400 text-xs mb-1">{t.merchant_id}</p>
                                                       <div className="flex justify-between items-center mb-2">
                                                           <p className="text-lg font-bold font-mono tracking-wide">707070</p>
                                                           <button onClick={() => copyToClipboard('707070')} className="text-blue-300 hover:text-white p-1">
                                                              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                           </button>
                                                       </div>
                                                        <p className="text-stone-400 text-xs">{t.acc_name}: Blessed Equb Service</p>
                                                   </div>
                                               )}
                                               {!paymentConfirmed ? (
                                                   <button onClick={() => setPaymentConfirmed(true)} className="w-full flex justify-center items-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg">
                                                      <CheckCircle className="w-5 h-5 mr-2" /> {t.confirm_paid}
                                                   </button>
                                               ) : (
                                                   <button onClick={handlePayment} disabled={uploading} className="w-full flex justify-center items-center px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-all shadow-lg animate-fade-in-up">
                                                     {uploading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> {t.btn_processing}</> : <><Upload className="w-5 h-5 mr-2" /> {t.upload}</>}
                                                   </button>
                                               )}
                                            </div>
                                        )}
                                    </div>
                                )}
                           </div>
                        </div>
                        <div className="relative w-full flex justify-center">
                          <div className="relative z-10 w-full max-w-sm bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl border border-stone-700 p-2 shadow-2xl animate-wiggle-interval">
                            <div className="bg-stone-800/50 rounded-xl overflow-hidden relative group">
                                <div className="h-48 bg-stone-700 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-emerald-900/20 group-hover:bg-emerald-900/10 transition-colors"></div>
                                    <div className="absolute inset-0 z-10 pointer-events-none opacity-100">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 flex items-center justify-center z-20">
                                              <img src="https://i.postimg.cc/hvkdcQC4/rebbon-final.png" alt="Ribbon" className="w-full h-full object-contain drop-shadow-2xl scale-[1.5]" />
                                        </div>
                                    </div>
                                    
                                    {/* Carousel Images */}
                                    {PRIZE_IMAGES.map((img, index) => (
                                        <img 
                                        key={index}
                                        src={img}
                                        alt={`${settings.prizeName} view ${index + 1}`}
                                        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                    ))}

                                    <div className="absolute inset-0 flex items-end justify-end z-20 p-2">
                                        <span className="text-stone-100 font-bold text-xs border border-dashed border-stone-500/50 bg-stone-900/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-xl transform rotate-[-2deg]">
                                            {settings.prizeName}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">{heroT.prize_label}</p>
                                            <h3 className="text-lg font-bold text-white leading-tight">Luxury Package</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-stone-400 text-xs">{heroT.prize_value}</p>
                                            <p className="text-lg font-bold text-white">{settings.prizeValue}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          </div>
                        </div>
                    </div>
                </div>

                <div id="history-section" className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 opacity-0 animate-fade-in-up delay-[400ms]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-stone-800 flex items-center">
                           <Activity className="w-5 h-5 mr-2 text-stone-400" /> {t.history}
                        </h3>
                        <button 
                            onClick={() => setShowHistoryModal(true)}
                            className="text-xs font-bold bg-stone-100 text-stone-600 px-3 py-1 rounded-full hover:bg-stone-200 transition-colors"
                        >
                            View All ({userActivities.length})
                        </button>
                    </div>
                    {userActivities.length === 0 ? (
                         <div className="text-center py-8 text-stone-400 text-sm">No recent activity. Make a payment to get started!</div>
                    ) : (
                        <div className="relative border-l-2 border-stone-100 ml-3 space-y-8 py-2">
                            {userActivities.slice(0, 3).map((item, i) => (
                               <div key={item.id} className="relative pl-8">
                                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                      item.status === 'success' ? 'bg-emerald-500' : 
                                      item.status === 'error' ? 'bg-red-500' : 
                                      item.status === 'warning' ? 'bg-amber-500' : 
                                      item.status === 'neutral' ? 'bg-stone-400' : 'bg-blue-500'
                                  }`}></div>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                                      <h4 className="font-bold text-stone-800 text-sm flex items-center">
                                          {getActivityIcon(item.type, item.status)}
                                          <span className="ml-2">{item.title}</span>
                                      </h4>
                                      <span className="text-xs text-stone-400 font-mono mt-1 sm:mt-0">{item.date}</span>
                                  </div>
                                  <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-2 rounded border border-stone-100 inline-block">
                                      {item.desc}
                                  </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 animate-fade-in-up delay-[450ms]">
                  
                  {/* SEARCH BOX CONTAINER (LANDING PAGE STYLE) */}
                  <div className="flex flex-col mb-6">
                    <div>
                        <h3 className="text-lg font-bold flex items-center text-stone-900 mb-1">
                            <Search className="w-5 h-5 mr-2 text-emerald-600" />
                            {language === 'en' ? 'Check Lucky Number' : 'እድለኛ ቁጥር ይፈልጉ'}
                        </h3>
                    </div>
                     <div className="flex space-x-3 text-[10px] font-bold mt-2 bg-stone-100 p-2 rounded-lg self-start">
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded bg-emerald-500 mr-1.5"></span>
                            <span className="text-emerald-700">{statsT.lucky}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded bg-stone-300 mr-1.5"></span>
                            <span className="text-stone-500">{statsT.taken}</span>
                        </div>
                    </div>
                  </div>

                  {/* SEARCH INPUT */}
                  <div className="relative mb-6">
                      <input 
                          type="number" 
                          value={luckySearch}
                          onChange={handleLuckySearch}
                          placeholder={language === 'en' ? "Enter number" : "ቁጥር ያስገቡ"}
                          className={`w-full pl-4 pr-10 py-3 text-lg border-2 rounded-xl outline-none transition-all ${
                              luckyStatus === 'AVAILABLE' ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-emerald-50/30' :
                              luckyStatus === 'TAKEN' ? 'border-red-300 ring-4 ring-red-200 bg-red-50/30' :
                              'border-stone-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                          }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                           {luckyStatus === 'AVAILABLE' && <CheckCircle className="w-6 h-6 text-emerald-500 animate-bounce" />}
                           {luckyStatus === 'TAKEN' && <XCircle className="w-6 h-6 text-red-500" />}
                           {luckyStatus === 'IDLE' && <Search className="w-5 h-5 text-stone-300" />}
                      </div>
                  </div>
                  
                  {/* STATUS MESSAGES */}
                  {luckyStatus === 'AVAILABLE' && (
                      <div className="mb-6 animate-fade-in-down">
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                               <div className="flex items-center mb-3">
                                  <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                                  <div>
                                      <p className="text-emerald-800 font-bold">
                                          #{luckySearch} {language === 'en' ? 'is Available!' : 'ክፍት ነው!'}
                                      </p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => { setSelectedTempTicket(parseInt(luckySearch)); setShowTicketModal(true); }}
                                 className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold shadow hover:bg-emerald-500 transition-colors text-sm"
                               >
                                   {language === 'en' ? `Select #${luckySearch}` : `#${luckySearch} ምረጥ`}
                               </button>
                          </div>
                      </div>
                  )}
                  
                  {luckyStatus === 'TAKEN' && (
                       <div className="mb-6 animate-fade-in-down">
                          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center">
                              <XCircle className="w-5 h-5 text-red-500 mr-2" />
                              <p className="text-red-700 font-bold text-sm">
                                  #{luckySearch} {language === 'en' ? 'is already taken.' : 'ተይዟል።'}
                              </p>
                          </div>
                      </div>
                  )}

                  {/* GRID */}
                  <div className="relative pt-4 border-t border-stone-100">
                     <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">
                        {language === 'en' ? 'Live Availability Board' : 'የእጣ ቁጥሮች ሰሌዳ'}
                     </h4>
                     <div className="relative grid grid-cols-6 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {tickets.map((ticket) => (
                            <button
                                key={ticket.number}
                                disabled={ticket.taken}
                                onClick={() => {
                                  if (!ticket.taken) {
                                      setLuckySearch(ticket.number.toString());
                                      setLuckyStatus('AVAILABLE');
                                  } else {
                                      setLuckySearch(ticket.number.toString());
                                      setLuckyStatus('TAKEN');
                                  }
                                }}
                                className={`
                                    aspect-square rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-300
                                    ${ticket.taken 
                                    ? 'bg-stone-200 text-stone-400 border border-stone-200 cursor-not-allowed' 
                                    : 'bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:scale-110 hover:shadow-md hover:z-10'}
                                    ${luckySearch === ticket.number.toString() ? 'ring-2 ring-amber-400 z-20 scale-110' : ''}
                                `}
                            >
                                {formatTicket(ticket.number)}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-stone-400 text-center mt-3">
                          {language === 'en' ? 'Click on any green number to select it.' : 'ማንኛውንም አረንጓዴ ቁጥር በመጫን ይምረጡ።'}
                    </p>
                </div>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 opacity-0 animate-fade-in-up delay-[500ms]">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">{t.live_activity}</h3>
                  <div className="space-y-4 max-h-[300px] overflow-hidden relative">
                     <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                     {feed.map((item) => (
                        <div key={item.id} className="flex items-start animate-fade-in-down">
                           <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
                           <div>
                              <p className="text-sm font-medium text-stone-800"><span className="font-bold">{item.name}</span> {item.action}</p>
                              <p className="text-xs text-stone-400">{item.time}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-amber-50 rounded-xl border border-amber-100 p-6 opacity-0 animate-fade-in-up delay-[600ms]">
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center">
                     <Trophy className="w-4 h-4 mr-2" /> {t.hall_of_fame}
                  </h3>
                  <div className="flex items-center space-x-3 mb-3 p-2 hover:bg-amber-100 rounded-lg transition-colors cursor-default">
                      <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-bold">D</div>
                      <div>
                         <p className="text-sm font-bold text-amber-900">Dawit M.</p>
                         <p className="text-xs text-amber-700">Won Toyota Vitz (Tir)</p>
                      </div>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;