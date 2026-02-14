import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, Ticket, Settings, 
  Search, CheckCircle, XCircle, Bell, LogOut, Save,
  TrendingUp, AlertTriangle, Menu, X
} from 'lucide-react';
import { AppSettings, ViewState, AppNotification } from '../types';

// Define types locally since they aren't in global types
interface TicketType {
  id: string;
  ticketNumber: number;
  userId: number;
  userName: string;
  cycle: number;
  status: 'ACTIVE' | 'WON' | 'VOID';
  assignedDate: string;
  assignedBy: string;
}

interface PaymentRequest {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  method: 'CBE' | 'Telebirr';
  reference: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AdminUser {
    id: number;
    name: string;
    phone: string;
    status: 'PENDING' | 'VERIFIED';
    contribution: number;
    prizeNumber?: number;
    joinedDate: string;
}

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  addNotification: (notification: AppNotification) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings, addNotification }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'payments' | 'tickets' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string, title: string} | null>(null);

  // Mock Data States
  const [users, setUsers] = useState<AdminUser[]>([
    { id: 1, name: "Abebe Kebede", phone: "0911234567", status: "VERIFIED", contribution: 15000, prizeNumber: 12, joinedDate: "2023-11-15" },
    { id: 2, name: "Sara Tadesse", phone: "0922345678", status: "PENDING", contribution: 0, joinedDate: "2024-01-20" },
    { id: 3, name: "Dawit Mulugeta", phone: "0933456789", status: "VERIFIED", contribution: 5000, prizeNumber: 45, joinedDate: "2023-12-10" },
    { id: 4, name: "Hanna Girma", phone: "0944567890", status: "PENDING", contribution: 0, joinedDate: "2024-02-05" },
    { id: 5, name: "Yonas Alemu", phone: "0955678901", status: "VERIFIED", contribution: 30000, prizeNumber: 8, joinedDate: "2023-10-01" },
  ]);

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([
    { id: 101, userId: 2, userName: "Sara Tadesse", amount: 5000, method: "CBE", reference: "TXN-884920", date: "2024-02-18", status: "PENDING" },
    { id: 102, userId: 4, userName: "Hanna Girma", amount: 5000, method: "Telebirr", reference: "7H92K29", date: "2024-02-19", status: "PENDING" },
  ]);

  const [tickets, setTickets] = useState<TicketType[]>([
    { id: "t-1", ticketNumber: 12, userId: 1, userName: "Abebe Kebede", cycle: 14, status: "ACTIVE", assignedDate: "2024-02-01", assignedBy: "SYSTEM" },
    { id: "t-2", ticketNumber: 45, userId: 3, userName: "Dawit Mulugeta", cycle: 14, status: "ACTIVE", assignedDate: "2024-02-02", assignedBy: "SYSTEM" },
    { id: "t-3", ticketNumber: 8, userId: 5, userName: "Yonas Alemu", cycle: 14, status: "ACTIVE", assignedDate: "2024-02-01", assignedBy: "SYSTEM" },
  ]);

  const showAlert = (type: 'success' | 'error', title: string, message: string) => {
    setAlert({ type, title, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApprovePayment = (reqId: number, userId: number, amount: number) => {
    // 1. Get User Details
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'Unknown User';

    // 2. Remove from requests
    setPaymentRequests(prev => prev.filter(req => req.id !== reqId));
    
    // 3. Generate Ticket
    // Find next available ticket number for the current cycle
    const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
    const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
    let nextTicketNum = 1;
    while (takenNumbers.has(nextTicketNum)) {
        nextTicketNum++;
    }

    const newTicket: TicketType = {
        id: `t-${Date.now()}`,
        ticketNumber: nextTicketNum,
        userId: userId,
        userName: userName,
        cycle: settings.cycle,
        status: 'ACTIVE',
        assignedDate: new Date().toISOString().split('T')[0],
        assignedBy: 'SYSTEM'
    };

    // Add to ticket management system
    setTickets(prev => [newTicket, ...prev]);

    // 4. Update user status, contribution, and assign the ticket number
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            status: 'VERIFIED', 
            contribution: u.contribution + amount,
            prizeNumber: nextTicketNum 
          } 
        : u
    ));
    
    showAlert('success', 'Payment Verified', `User verified and Ticket #${nextTicketNum} has been automatically generated.`);

    // 5. Send Notification
    addNotification({
        id: Date.now(),
        title: { en: "Payment Verified", am: "ክፍያ ተረጋግጧል" },
        desc: { 
            en: `Payment for ${userName} verified. Ticket #${nextTicketNum} assigned.`,
            am: `የ${userName} ክፍያ ተረጋግጧል። እጣ ቁጥር #${nextTicketNum} ተሰጥቷል።`
        },
        time: new Date(),
        urgent: false,
        read: false
    });
  };

  const handleRejectPayment = (reqId: number) => {
      setPaymentRequests(prev => prev.filter(req => req.id !== reqId));
      showAlert('error', 'Payment Rejected', 'The payment request has been rejected.');
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 flex items-start justify-between">
      <div>
        <p className="text-stone-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-stone-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-stone-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-stone-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <span className="font-bold text-lg tracking-wide">Blessed Admin</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-stone-800 rounded">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-2 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'users', label: 'Members', icon: Users },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'tickets', label: 'Tickets', icon: Ticket },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-emerald-800 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
              {item.id === 'payments' && paymentRequests.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {paymentRequests.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button onClick={() => setView('landing')} className="flex items-center text-red-400 hover:text-red-300 transition-colors w-full p-2">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3 font-medium">Exit Admin</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-stone-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-stone-800 capitalize">{activeTab}</h2>
          <div className="flex items-center space-x-4">
             <div className="bg-stone-100 p-2 rounded-full relative">
                <Bell className="w-5 h-5 text-stone-600" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </div>
             <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-900 flex items-center justify-center text-white font-bold text-xs">A</div>
                <span className="text-sm font-medium text-stone-700">Admin User</span>
             </div>
          </div>
        </header>

        <div className="p-8">
            {/* Alert */}
            {alert && (
                <div className={`mb-6 p-4 rounded-lg flex items-start ${alert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'} animate-fade-in-down`}>
                    {alert.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 mt-0.5" /> : <AlertTriangle className="w-5 h-5 mr-3 mt-0.5" />}
                    <div>
                        <h4 className="font-bold">{alert.title}</h4>
                        <p className="text-sm">{alert.message}</p>
                    </div>
                    <button onClick={() => setAlert(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard title="Total Members" value={users.length} icon={Users} color="text-blue-500 bg-blue-500" />
                        <StatCard title="Total Pot" value={`${settings.potValue.toLocaleString()} ETB`} icon={TrendingUp} color="text-emerald-500 bg-emerald-500" />
                        <StatCard title="Pending Payments" value={paymentRequests.length} icon={CreditCard} color="text-amber-500 bg-amber-500" />
                        <StatCard title="Active Tickets" value={tickets.filter(t => t.status === 'ACTIVE').length} icon={Ticket} color="text-purple-500 bg-purple-500" />
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div className="p-6 border-b border-stone-100">
                        <h3 className="font-bold text-stone-800">Incoming Payment Requests</h3>
                    </div>
                    {paymentRequests.length === 0 ? (
                        <div className="p-12 text-center text-stone-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>All caught up! No pending payments.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Method / Ref</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {paymentRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-stone-50/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-stone-800">{req.userName}</div>
                                            <div className="text-xs text-stone-400">ID: #{req.userId}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-stone-700">{req.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-stone-800">{req.method}</div>
                                            <div className="text-xs text-stone-400 font-mono">{req.reference}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-600">{req.date}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => handleRejectPayment(req.id)}
                                                className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => handleApprovePayment(req.id, req.userId, req.amount)}
                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm"
                                            >
                                                Verify & Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            
            {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                     <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800">Member Directory</h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input type="text" placeholder="Search members..." className="pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64" />
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Name / ID</th>
                                <th className="px-6 py-4 font-semibold">Phone</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Contribution</th>
                                <th className="px-6 py-4 font-semibold">Ticket</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                             {users.map(u => (
                                 <tr key={u.id} className="hover:bg-stone-50/50">
                                     <td className="px-6 py-4">
                                         <div className="font-bold text-stone-800">{u.name}</div>
                                         <div className="text-xs text-stone-400">#{u.id}</div>
                                     </td>
                                     <td className="px-6 py-4 text-sm text-stone-600">{u.phone}</td>
                                     <td className="px-6 py-4">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                             {u.status}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 font-mono text-stone-700">{u.contribution.toLocaleString()}</td>
                                     <td className="px-6 py-4">
                                         {u.prizeNumber ? (
                                             <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-mono font-bold text-xs">#{u.prizeNumber}</span>
                                         ) : (
                                             <span className="text-stone-300 text-xs">-</span>
                                         )}
                                     </td>
                                 </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 max-w-2xl">
                    <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center">
                        <Settings className="w-5 h-5 mr-2" /> Global App Settings
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Draw Date (ISO Format)</label>
                            <input 
                                type="date" 
                                value={settings.drawDate}
                                onChange={(e) => setSettings({...settings, drawDate: e.target.value})}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Cycle Number</label>
                                <input 
                                    type="number" 
                                    value={settings.cycle}
                                    onChange={(e) => setSettings({...settings, cycle: parseInt(e.target.value)})}
                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">Days Remaining</label>
                                <input 
                                    type="number" 
                                    value={settings.daysRemaining}
                                    onChange={(e) => setSettings({...settings, daysRemaining: parseInt(e.target.value)})}
                                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">Live Stream URL</label>
                            <input 
                                type="text" 
                                value={settings.liveStreamUrl}
                                onChange={(e) => setSettings({...settings, liveStreamUrl: e.target.value})}
                                placeholder="https://youtube.com/embed/..."
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                             <div className="flex items-center">
                                 <input 
                                    type="checkbox" 
                                    id="isLive"
                                    checked={settings.isLive}
                                    onChange={(e) => setSettings({...settings, isLive: e.target.checked})}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                 />
                                 <label htmlFor="isLive" className="ml-2 text-sm text-stone-700 font-medium">Live Stream Active</label>
                             </div>
                             <div className="flex items-center">
                                 <input 
                                    type="checkbox" 
                                    id="regEnabled"
                                    checked={settings.registrationEnabled}
                                    onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                 />
                                 <label htmlFor="regEnabled" className="ml-2 text-sm text-stone-700 font-medium">Registration Open</label>
                             </div>
                        </div>

                        <div className="pt-4 border-t border-stone-100">
                            <button className="px-6 py-2 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors flex items-center">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;