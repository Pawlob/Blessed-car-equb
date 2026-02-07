import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Trophy, Users, Upload, CreditCard, History, Car, Ticket, X } from 'lucide-react';
import { User, Language, FeedItem, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface DashboardViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  language: Language;
  settings: AppSettings;
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

const DashboardView: React.FC<DashboardViewProps> = ({ user, setUser, language, settings }) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTempTicket, setSelectedTempTicket] = useState<number | null>(null);
  
  // Mock available tickets (1-50, some taken)
  const [tickets] = useState(() => Array.from({ length: 40 }, (_, i) => ({
    number: i + 1,
    taken: Math.random() > 0.7 // 30% taken
  })));

  const t = TRANSLATIONS[language].dashboard;

  useEffect(() => {
    // Initialize some feed items
    setFeed([generateMockFeed(t), generateMockFeed(t)]);
    
    // Simulate live feed
    const interval = setInterval(() => {
      setFeed(prev => [generateMockFeed(t), ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(interval);
  }, [language, t]);

  const handlePayment = () => {
    setUploading(true);
    setTimeout(() => {
      setUser((prev: User | null) => prev ? ({ ...prev, status: 'VERIFIED', contribution: prev.contribution + 10000 }) : null);
      setUploading(false);
      // Add self to feed
      setFeed(prev => [{ id: Math.random(), name: "You", action: t.action_verified, time: "Just now" }, ...prev.slice(0, 4)]);
      
      // Open ticket modal after success
      setTimeout(() => setShowTicketModal(true), 500);
    }, 2000);
  };

  const confirmTicket = () => {
    if (selectedTempTicket && user) {
        setUser({ ...user, prizeNumber: selectedTempTicket });
        setShowTicketModal(false);
    }
  };

  // Dynamic Data from Settings
  const paymentDueDate = language === 'en' ? settings.nextDrawDateEn : settings.nextDrawDateAm;
  const cycleText = language === 'en' ? `Cycle ${settings.cycle}` : `ዙር ${settings.cycle}`;
  const potFormatted = settings.potValue.toLocaleString();
  const membersFormatted = settings.totalMembers.toLocaleString();

  const getHistoryDate = (offset: number) => {
      const day = 12 - offset;
      return language === 'en' ? `Tir ${day}, 2018` : `ጥር ${day}፣ 2018`;
  };

  const hallOfFame1 = language === 'en' 
      ? { name: "Dawit M.", desc: "Won Toyota Vitz (Tir)" }
      : { name: "ዳዊት መ.", desc: "ቶዮታ ቪትዝ አሸንፏል (ጥር)" };
      
  const hallOfFame2 = language === 'en'
      ? { name: "Sara T.", desc: "Won Hyundai (Tahsas)" }
      : { name: "ሳራ ት.", desc: "ሂዩንዳይ አሸንፏል (ታህሳስ)" };

  return (
    <div className="min-h-screen bg-stone-50 pt-20 pb-12 relative">
      
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
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 mb-6">
                    {tickets.map((ticket) => (
                        <button
                          key={ticket.number}
                          disabled={ticket.taken}
                          onClick={() => setSelectedTempTicket(ticket.number)}
                          className={`
                             aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all
                             ${ticket.taken 
                                ? 'bg-stone-100 text-stone-300 cursor-not-allowed' 
                                : selectedTempTicket === ticket.number 
                                   ? 'bg-amber-500 text-white shadow-lg scale-110 ring-2 ring-amber-300' 
                                   : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:scale-105'}
                          `}
                        >
                           {ticket.number}
                        </button>
                    ))}
                </div>

                <div className="bg-stone-50 p-4 rounded-xl flex items-center justify-between mb-4">
                    <span className="text-stone-600 font-medium">{t.my_ticket}:</span>
                    <span className="text-2xl font-bold text-amber-600">
                        {selectedTempTicket ? `#${selectedTempTicket}` : '-'}
                    </span>
                </div>

                <button 
                  onClick={confirmTicket}
                  disabled={!selectedTempTicket}
                  className="w-full py-3 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                    {t.confirm_ticket}
                </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-fade-in-down">
           <div>
              <h1 className="text-2xl font-bold text-emerald-900">{t.welcome} {user.name}</h1>
              <p className="text-stone-500">Member ID: #8291 • {cycleText}</p>
           </div>
           <div className="mt-4 md:mt-0 flex space-x-3">
              <button className="p-2 bg-white rounded-full shadow hover:bg-stone-100 text-stone-600 relative transition-transform hover:scale-110">
                 <Bell className="w-5 h-5" />
                 <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>
           </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* Card 1: Status */}
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-500 opacity-0 animate-fade-in-up hover:shadow-lg transition-shadow duration-300">
               <h3 className="text-stone-500 text-sm font-semibold uppercase mb-2">{t.status_card_title}</h3>
               <div className="flex items-center justify-between mb-4">
                  <span className={`text-2xl font-bold ${user.status === 'VERIFIED' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {user.status === 'VERIFIED' ? t.status_verified : t.status_pending}
                  </span>
                  {user.status === 'VERIFIED' ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <Clock className="w-8 h-8 text-red-500" />}
               </div>
               
               {user.prizeNumber ? (
                   <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center justify-between animate-fade-in-down">
                      <div className="flex items-center">
                          <Ticket className="w-5 h-5 text-amber-600 mr-2" />
                          <span className="text-amber-800 font-medium text-sm">{t.my_ticket}</span>
                      </div>
                      <span className="text-xl font-bold text-amber-600">#{user.prizeNumber}</span>
                   </div>
               ) : (
                   <>
                       <div className="w-full bg-stone-100 rounded-full h-2 mb-2">
                          <div className={`h-2 rounded-full ${user.status === 'VERIFIED' ? 'bg-emerald-500 w-full' : 'bg-red-400 w-[10%]'}`}></div>
                       </div>
                       <p className="text-xs text-stone-400">{t.payment_due}: {paymentDueDate}</p>
                   </>
               )}
            </div>

            {/* Card 2: Contribution */}
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-emerald-600 opacity-0 animate-fade-in-up delay-[100ms] hover:shadow-lg transition-shadow duration-300">
               <h3 className="text-stone-500 text-sm font-semibold uppercase mb-2">{t.contribution}</h3>
               <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-stone-800">{user.contribution.toLocaleString()} <span className="text-sm font-normal text-stone-400">ETB</span></span>
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Trophy className="w-6 h-6 text-emerald-600" />
                  </div>
               </div>
               <p className="text-sm text-emerald-600 font-medium">{t.contribution_sub}</p>
            </div>

            {/* Card 3: Pot */}
            <div className="bg-emerald-900 rounded-xl shadow-md p-6 text-white relative overflow-hidden opacity-0 animate-fade-in-up delay-[200ms] hover:shadow-lg transition-shadow duration-300 group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700"><Trophy className="w-24 h-24" /></div>
               <h3 className="text-emerald-200 text-sm font-semibold uppercase mb-2">{t.pot}</h3>
               <div className="text-3xl font-bold mb-1 animate-pulse-slow">{potFormatted} ETB</div>
               <div className="text-sm text-emerald-300 mb-4">{t.pot_sub}</div>
               <div className="inline-flex items-center px-2 py-1 bg-emerald-800 rounded text-xs">
                 <Users className="w-3 h-3 mr-1" /> {membersFormatted} {t.pot_users}
               </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Action & History */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Hero / Action */}
                <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-2xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl opacity-0 animate-fade-in-up delay-[300ms]">
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mb-16"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-6 md:mb-0">
                           <div className="inline-block bg-red-900/80 px-3 py-1 rounded text-xs font-bold mb-3 border border-red-700 animate-pulse">
                              {t.next_draw.replace('14', settings.daysRemaining.toString())}
                           </div>
                           <h2 className="text-3xl font-bold mb-2">{t.win_title}</h2>
                           <p className="text-stone-300 max-w-sm mb-6">{t.win_desc}</p>
                           
                           <div className="flex flex-wrap gap-4">
                              {user.status === 'VERIFIED' && !user.prizeNumber ? (
                                  <button 
                                    onClick={() => setShowTicketModal(true)}
                                    className="flex items-center px-6 py-3 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-stone-900 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
                                  >
                                     <Ticket className="w-5 h-5 mr-2" /> {t.select_ticket}
                                  </button>
                              ) : (
                                  <button 
                                    onClick={handlePayment} 
                                    disabled={user.status === 'VERIFIED' || uploading}
                                    className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 ${user.status === 'VERIFIED' 
                                      ? 'bg-emerald-600 text-white cursor-default hover:scale-100' 
                                      : 'bg-amber-500 hover:bg-amber-400 text-stone-900 shadow-lg shadow-amber-500/20'}`}
                                  >
                                    {uploading ? (
                                       <><span className="w-4 h-4 border-2 border-stone-800/30 border-t-stone-800 rounded-full animate-spin mr-2"></span> {t.btn_processing || 'Processing...'}</>
                                    ) : user.status === 'VERIFIED' ? (
                                       <><CheckCircle className="w-5 h-5 mr-2" /> {t.btn_paid}</>
                                    ) : (
                                       <><Upload className="w-5 h-5 mr-2" /> {t.upload}</>
                                    )}
                                  </button>
                              )}
                              
                              {user.status !== 'VERIFIED' && (
                                <button className="flex items-center px-6 py-3 bg-transparent border border-stone-500 hover:border-white text-stone-300 hover:text-white rounded-lg font-medium transition-all hover:bg-white/5">
                                  <CreditCard className="w-5 h-5 mr-2" /> {t.pay_telebirr}
                                </button>
                              )}
                           </div>
                        </div>
                        <div className="w-48 md:w-64 relative group">
                            <Car className="w-full h-auto text-stone-600 transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/20 text-4xl font-black rotate-[-12deg] group-hover:rotate-0 transition-all duration-500">PRIZE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 opacity-0 animate-fade-in-up delay-[400ms]">
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center">
                       <History className="w-5 h-5 mr-2 text-stone-400" /> {t.history}
                    </h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors px-2 -mx-2 rounded-lg">
                              <div className="flex items-center">
                                 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                                    <CheckCircle className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="font-medium text-stone-800">Monthly Contribution</p>
                                    <p className="text-xs text-stone-500">{getHistoryDate(i)}</p>
                                 </div>
                              </div>
                              <span className="font-bold text-stone-700">-10,000 ETB</span>
                           </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Live Feed & Winners */}
            <div className="space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 opacity-0 animate-fade-in-up delay-[500ms]">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">{t.live_activity}</h3>
                  <div className="space-y-4 max-h-[300px] overflow-hidden relative">
                     {/* Fade overlay at bottom */}
                     <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                     
                     {feed.map((item) => (
                        <div key={item.id} className="flex items-start animate-fade-in-down">
                           <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
                           <div>
                              <p className="text-sm font-medium text-stone-800">
                                 <span className="font-bold">{item.name}</span> {item.action}
                              </p>
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
                         <p className="text-sm font-bold text-amber-900">{hallOfFame1.name}</p>
                         <p className="text-xs text-amber-700">{hallOfFame1.desc}</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-3 p-2 hover:bg-amber-100 rounded-lg transition-colors cursor-default">
                      <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-stone-600 font-bold">S</div>
                      <div>
                         <p className="text-sm font-bold text-stone-800">{hallOfFame2.name}</p>
                         <p className="text-xs text-stone-500">{hallOfFame2.desc}</p>
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