
import React, { useState } from 'react';
import { PartyPopper, Video, CheckCircle, Trophy, Star, Plus, Trash2, X } from 'lucide-react';
import { AppSettings, User, Winner } from '../../types';

interface AdminPrizesProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  tickets: any[];
  users: User[];
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  t: any;
}

const AdminPrizes: React.FC<AdminPrizesProps> = ({
  settings,
  setSettings,
  tickets,
  users,
  showAlert,
  showConfirm,
  t
}) => {
  const [drawTicketSearch, setDrawTicketSearch] = useState('');
  const [foundWinningTicket, setFoundWinningTicket] = useState<any | null>(null);
  const [newPastWinner, setNewPastWinner] = useState<Partial<Winner>>({});
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

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
        name: newPastWinner.name!,
        nameAm: newPastWinner.nameAm || newPastWinner.name!,
        prize: newPastWinner.prize!,
        prizeAm: newPastWinner.prizeAm || newPastWinner.prize!,
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

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-800">{t.prizes.title}</h1>

        {/* Section 1: Live Draw Announcer */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><PartyPopper className="w-64 h-64" /></div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                    <Video className="w-6 h-6 mr-3 text-red-500 animate-pulse" /> {t.prizes.liveAnnouncer}
                </h2>
                <p className="text-stone-400 mb-8 max-w-2xl">
                    {t.prizes.liveDesc}
                </p>
                
                <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/10 max-w-xl">
                    <label className="block text-sm font-bold text-stone-300 mb-2">{t.prizes.winTicket}</label>
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
                            {t.prizes.verify}
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
                        <PartyPopper className="w-6 h-6 mr-2" /> {t.prizes.announce}
                    </button>
                </div>
            </div>
        </div>

        {/* Section 2: Hall of Fame Management */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-stone-800 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-amber-500" /> {t.prizes.hallOfFame}
                    </h2>
                    <p className="text-stone-500 text-sm">{t.prizes.hallDesc}</p>
                </div>
                <button 
                    onClick={() => setIsWinnerModalOpen(true)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold text-sm flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" /> {t.prizes.addWinner}
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

        {/* New Winner History Modal */}
        {isWinnerModalOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={() => setIsWinnerModalOpen(false)}>
                <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-amber-50">
                        <h3 className="font-bold text-lg text-amber-800 flex items-center">
                            <Trophy className="w-5 h-5 mr-2" /> {t.prizes.addWinner}
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
    </div>
  );
};

export default AdminPrizes;
