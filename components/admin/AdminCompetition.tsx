
import React, { useState } from 'react';
import { Calendar, Save, Trophy, Video, Ticket, X, Plus } from 'lucide-react';
import { AppSettings, User } from '../../types';

interface AdminCompetitionProps {
  settings: AppSettings; // Global settings
  localSettings: AppSettings; // Buffer settings
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  handleSaveSection: (sectionName: string) => void;
  ethDate: { year: number; month: number; day: number };
  handleEthDateChange: (field: 'year' | 'month' | 'day', value: number) => void;
  newImageUrl: string;
  setNewImageUrl: (url: string) => void;
  handleAddImage: () => void;
  handleRemoveImage: (index: number) => void;
  tickets: any[];
  users: User[];
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  t: any;
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

const AdminCompetition: React.FC<AdminCompetitionProps> = ({
  settings,
  localSettings,
  setLocalSettings,
  handleSaveSection,
  ethDate,
  handleEthDateChange,
  newImageUrl,
  setNewImageUrl,
  handleAddImage,
  handleRemoveImage,
  tickets,
  users,
  showAlert,
  t
}) => {
  const [compSubTab, setCompSubTab] = useState<'settings' | 'tickets'>('settings');
  const [ticketSearch, setTicketSearch] = useState('');

  // Helper to check if user is valid (Strictly VERIFIED)
  const isUserValid = (userId: string | number) => {
      const u = users.find(user => String(user.id) === String(userId));
      return !!u && u.status === 'VERIFIED';
  };

  const filteredTickets = tickets.filter(t => {
      // 1. Check User Status - Must be VERIFIED
      if (!isUserValid(t.userId)) return false;

      // 2. Check Search & Cycle
      const matchesSearch = t.userName.toLowerCase().includes(ticketSearch.toLowerCase()) || t.ticketNumber.toString().includes(ticketSearch);
      const matchesCycle = t.cycle === settings.cycle; 
      return matchesSearch && matchesCycle;
  }).sort((a, b) => Number(a.ticketNumber) - Number(b.ticketNumber));

  const handleExportTickets = () => {
      // Create CSV content
      const headers = "Ticket ID,Lucky Number,User Name,Cycle,Status,Assigned Date,Assigned By\n";
      
      // Sort tickets by lucky number (ticketNumber) ascending
      const sortedTickets = [...tickets]
        .filter(t => t.cycle === settings.cycle && isUserValid(t.userId)) // Apply user status filter
        .sort((a, b) => {
            const numA = Number(a.ticketNumber);
            const numB = Number(b.ticketNumber);
            return numA - numB;
        });

      const rows = sortedTickets.map(t => 
          `${t.id},${t.ticketNumber},"${t.userName}",${t.cycle},${t.status},${t.assignedDate},${t.assignedBy}`
      ).join("\n");
      
      const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `lucky_numbers_cycle_${settings.cycle}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showAlert('success', 'Export Successful', 'Ticket data exported to CSV in ascending order (Pending/Unverified users excluded).');
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6">
            <h1 className="text-2xl font-bold text-stone-800 mb-4 md:mb-0">{t.competition.title}</h1>
            <div className="bg-white p-1 rounded-xl shadow-sm border border-stone-200 flex">
                <button 
                    onClick={() => setCompSubTab('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        compSubTab === 'settings' ? 'bg-stone-800 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                >
                    {t.competition.general}
                </button>
                <button 
                    onClick={() => setCompSubTab('tickets')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${
                        compSubTab === 'tickets' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'
                    }`}
                >
                    <Ticket className="w-4 h-4 mr-2" /> {t.competition.tickets}
                </button>
            </div>
        </div>
        
        {compSubTab === 'settings' && (
             <div className="space-y-6 animate-fade-in-down">
                 {/* ... Draw Schedule ... */}
                 <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                        <Calendar className="w-5 h-5 mr-2 text-emerald-600" /> {t.competition.drawSchedule}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-stone-700">{t.competition.setNextDraw}</label>
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
                            <h3 className="text-sm font-bold text-stone-500 uppercase mb-2">{t.competition.preview}</h3>
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
                            <Save className="w-4 h-4 mr-2" /> {t.competition.save}
                        </button>
                    </div>
                </div>
                
                {/* ... Current Prize ... */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                        <Trophy className="w-5 h-5 mr-2 text-amber-500" /> {t.competition.currentPrize}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">{t.competition.prizeName}</label>
                                <input type="text" value={localSettings.prizeName} onChange={(e) => setLocalSettings(prev => ({...prev, prizeName: e.target.value}))} className="w-full p-2 border border-stone-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">{t.competition.prizeValue}</label>
                                <input type="text" value={localSettings.prizeValue} onChange={(e) => setLocalSettings(prev => ({...prev, prizeValue: e.target.value}))} className="w-full p-2 border border-stone-300 rounded-lg" />
                            </div>
                            {/* Image Inputs */}
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-1">{t.competition.prizeImages}</label>
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
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t.competition.preview}</label>
                            <div className="flex-grow bg-stone-100 rounded-lg overflow-hidden border border-stone-200 relative min-h-[150px]">
                                <img src={(localSettings.prizeImages && localSettings.prizeImages.length > 0) ? localSettings.prizeImages[0] : ''} className="w-full h-full object-cover absolute inset-0" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                        <button onClick={() => handleSaveSection('Current Prize')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                            <Save className="w-4 h-4 mr-2" /> {t.competition.save}
                        </button>
                    </div>
                </div>

                 {/* ... Live Stream ... */}
                 <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                    <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center border-b border-stone-100 pb-2">
                        <Video className="w-5 h-5 mr-2 text-red-600" /> {t.competition.liveStream}
                    </h2>
                    <div className="flex items-center justify-between mb-4">
                         <span>{t.competition.liveStatus}</span>
                         <button onClick={() => setLocalSettings(prev => ({ ...prev, isLive: !prev.isLive }))} className={`w-11 h-6 rounded-full transition-colors ${localSettings.isLive ? 'bg-red-600' : 'bg-stone-300'}`}>
                             <span className={`block w-4 h-4 bg-white rounded-full transition-transform ml-1 ${localSettings.isLive ? 'translate-x-5' : ''}`} />
                         </button>
                    </div>
                    <input type="text" value={localSettings.liveStreamUrl} onChange={(e) => setLocalSettings(prev => ({...prev, liveStreamUrl: e.target.value}))} className="w-full p-2 border border-stone-300 rounded-lg" placeholder="Embed URL" />
                    <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
                        <button onClick={() => handleSaveSection('Live Stream')} className="flex items-center px-4 py-2 bg-emerald-900 text-white rounded-lg hover:bg-emerald-800 font-bold shadow transition-colors">
                            <Save className="w-4 h-4 mr-2" /> {t.competition.save}
                        </button>
                    </div>
                 </div>
             </div>
        )}
        {compSubTab === 'tickets' && (
            <div className="space-y-6 animate-fade-in-down">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-grow md:w-64">
                        <input type="text" placeholder="Search..." value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} className="pl-4 pr-4 py-2 border border-stone-300 rounded-lg w-full" />
                    </div>
                    <button onClick={handleExportTickets} className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold">Export CSV</button>
                 </div>
                 <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-stone-50 text-stone-500 text-xs uppercase sticky top-0 z-10 shadow-sm">
                                <tr><th className="px-6 py-3">{t.users.ticket}</th><th className="px-6 py-3">{t.dashboard.user}</th><th className="px-6 py-3">{t.users.status}</th></tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredTickets.length > 0 ? (
                                    filteredTickets.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-6 py-4 font-mono font-bold">#{t.ticketNumber}</td>
                                            <td className="px-6 py-4">{t.userName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-stone-500">
                                            No verified tickets found in this cycle.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default AdminCompetition;
