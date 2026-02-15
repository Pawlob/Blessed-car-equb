
import React from 'react';
import { LayoutDashboard, DollarSign, Ticket, Users, FileText, RefreshCw, Clock } from 'lucide-react';
import { User, AppSettings } from '../../types';

interface AdminDashboardProps {
  settings: AppSettings;
  tickets: any[];
  users: User[];
  paymentRequests: any[];
  setActiveTab: (tab: any) => void;
  handleStartNewCycle: () => void;
  t: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  tickets,
  users,
  paymentRequests,
  setActiveTab,
  handleStartNewCycle,
  t
}) => {
  return (
    <div className="space-y-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-stone-800 hidden md:block">{t.dashboard.overview}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="text-stone-500 text-sm font-bold uppercase">{t.dashboard.totalPot}</h3>
                  <DollarSign className="w-5 h-5 text-emerald-500" />
               </div>
               <p className="text-2xl font-bold text-stone-800">{settings.potValue.toLocaleString()} ETB</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="text-stone-500 text-sm font-bold uppercase">{t.dashboard.claimedTickets}</h3>
                  <Ticket className="w-5 h-5 text-teal-500" />
               </div>
               <p className="text-2xl font-bold text-stone-800">
                  {tickets.filter(t => t.status === 'ACTIVE' && t.cycle === settings.cycle).length}
               </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="text-stone-500 text-sm font-bold uppercase">{t.dashboard.totalMembers}</h3>
                  <Users className="w-5 h-5 text-blue-500" />
               </div>
               <p className="text-2xl font-bold text-stone-800">{settings.totalMembers.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="text-stone-500 text-sm font-bold uppercase">{t.dashboard.pending}</h3>
                  <FileText className="w-5 h-5 text-amber-500" />
               </div>
               <p className="text-2xl font-bold text-stone-800">{paymentRequests.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
               <div className="flex items-center justify-between mb-2">
                  <h3 className="text-stone-500 text-sm font-bold uppercase">{t.dashboard.cycle}</h3>
                  <RefreshCw className="w-5 h-5 text-purple-500" />
               </div>
               <p className="text-2xl font-bold text-stone-800">#{settings.cycle}</p>
            </div>
        </div>

        {/* Cycle Control */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-stone-800">{t.dashboard.cycleTitle}</h3>
                    <p className="text-stone-500 text-sm">{t.dashboard.cycleDesc}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold uppercase">{t.dashboard.active}</span>
            </div>
            <div className="flex flex-wrap gap-4">
                 <button 
                   onClick={handleStartNewCycle}
                   className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white font-bold rounded-lg transition-colors flex items-center"
                 >
                    <RefreshCw className="w-4 h-4 mr-2" /> {t.dashboard.startNew}
                 </button>
                 <div className="px-4 py-2 bg-stone-100 rounded-lg text-stone-600 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> {t.dashboard.nextDraw}: {settings.daysRemaining} {t.dashboard.daysRem}
                 </div>
            </div>
        </div>

        {/* Recent Payments Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
               <h3 className="font-bold text-stone-800">{t.dashboard.recentPay}</h3>
               <button onClick={() => setActiveTab('payments')} className="text-emerald-600 text-sm font-bold hover:underline">{t.dashboard.viewAll}</button>
            </div>
            {paymentRequests.length === 0 ? (
                <div className="p-8 text-center text-stone-500">{t.dashboard.noPending}</div>
            ) : (
                <table className="w-full text-left">
                    <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">{t.dashboard.user}</th>
                            <th className="px-6 py-3">{t.dashboard.amount}</th>
                            <th className="px-6 py-3">{t.dashboard.date}</th>
                            <th className="px-6 py-3">{t.dashboard.action}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {paymentRequests.slice(0, 3).map((req) => (
                            <tr key={req.id}>
                                <td className="px-6 py-4 font-medium">{req.userName}</td>
                                <td className="px-6 py-4">{req.amount} ETB</td>
                                <td className="px-6 py-4 text-stone-500 text-sm">{req.date}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setActiveTab('payments')} className="text-emerald-600 hover:underline text-sm font-bold">{t.dashboard.review}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};

export default AdminDashboard;
