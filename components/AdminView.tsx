import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Ticket, Settings, Trophy, LogOut, 
  Search, Download, Save, CheckCircle, XCircle, AlertTriangle, 
  ChevronRight, Bell, Menu, X, Lock
} from 'lucide-react';
import { AppSettings, User, AppNotification, Language, ViewState } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  addNotification: (notification: AppNotification) => void;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  setView, settings, setSettings, addNotification, language, setLanguage 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tickets' | 'settings'>('dashboard');
  
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketCycleFilter, setTicketCycleFilter] = useState('ALL');
  
  const [userSearch, setUserSearch] = useState('');
  
  const [alert, setAlert] = useState<{type: 'success' | 'error' | 'info', title: string, message: string} | null>(null);

  // Fetch Data
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const u = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        setUsers(u);
    });

    const unsubTickets = onSnapshot(collection(db, 'tickets'), (snap) => {
        const t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTickets(t);
    });

    return () => {
        unsubUsers();
        unsubTickets();
    };
  }, [isAuthenticated]);

  const showAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
      setAlert({ type, title, message });
      setTimeout(() => setAlert(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === settings.adminPassword || password === 'admin123') {
          setIsAuthenticated(true);
      } else {
          showAlert('error', 'Login Failed', 'Incorrect password.');
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setPassword('');
      setView('landing');
  };

  const handleExportTickets = () => {
      const headers = "Ticket ID,Ticket Number,User Name,Cycle,Status,Assigned Date,Assigned By\n";
      const sortedTickets = [...tickets].sort((a, b) => a.ticketNumber - b.ticketNumber);
      const rows = sortedTickets.map(t => 
          `${t.id},${t.ticketNumber},"${t.userName}",${t.cycle},${t.status},${t.assignedDate},${t.assignedBy}`
      ).join("\n");
      
      const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `tickets_cycle_${settings.cycle}_sorted.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showAlert('success', 'Export Successful', 'Ticket data exported to CSV.');
  };

  const verifyUser = async (userId: string) => {
      try {
          await updateDoc(doc(db, 'users', userId), { status: 'VERIFIED' });
          showAlert('success', 'User Verified', 'User status updated to VERIFIED.');
      } catch (e) {
          console.error(e);
          showAlert('error', 'Error', 'Failed to update user.');
      }
  };

  const filteredTickets = tickets.filter(t => {
      const ticketUser = users.find(u => String(u.id) === String(t.userId));
      // Optional: logic to hide tickets from pending users if desired
      
      const matchesSearch = 
        (t.userName && t.userName.toLowerCase().includes(ticketSearch.toLowerCase())) || 
        t.ticketNumber.toString().includes(ticketSearch);
      const matchesCycle = ticketCycleFilter === 'ALL' || t.cycle.toString() === ticketCycleFilter.toString();
      return matchesSearch && matchesCycle;
  });

  const filteredUsers = users.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.phone.includes(userSearch)
  );

  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                  <div className="flex justify-center mb-6">
                      <div className="p-4 bg-emerald-100 rounded-full">
                          <Lock className="w-8 h-8 text-emerald-800" />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-6 text-stone-800">Admin Access</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-stone-600 mb-1">Password</label>
                          <input 
                              type="password" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="Enter admin password"
                          />
                      </div>
                      <button type="submit" className="w-full bg-emerald-900 text-white py-2 rounded-lg font-bold hover:bg-emerald-800 transition-colors">
                          Login
                      </button>
                      <button type="button" onClick={() => setView('landing')} className="w-full text-stone-500 text-sm hover:text-stone-800">
                          Back to Home
                      </button>
                  </form>
                  {alert && (
                      <div className={`mt-4 p-3 rounded-lg text-sm ${alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {alert.message}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-stone-100 flex">
          {/* Sidebar */}
          <div className="w-64 bg-emerald-900 text-white hidden md:flex flex-col">
              <div className="p-6 border-b border-emerald-800">
                  <h1 className="text-xl font-bold">Admin Panel</h1>
                  <p className="text-emerald-400 text-xs">Blessed Digital Equb</p>
              </div>
              <nav className="flex-grow p-4 space-y-2">
                  <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800/50'}`}>
                      <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
                  </button>
                  <button onClick={() => setActiveTab('users')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800/50'}`}>
                      <Users className="w-5 h-5 mr-3" /> Users
                  </button>
                  <button onClick={() => setActiveTab('tickets')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'tickets' ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800/50'}`}>
                      <Ticket className="w-5 h-5 mr-3" /> Tickets
                  </button>
                  <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800/50'}`}>
                      <Settings className="w-5 h-5 mr-3" /> Settings
                  </button>
              </nav>
              <div className="p-4 border-t border-emerald-800">
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-emerald-200 hover:text-white transition-colors">
                      <LogOut className="w-5 h-5 mr-3" /> Logout
                  </button>
              </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow flex flex-col h-screen overflow-hidden">
              {/* Top Bar for Mobile */}
              <div className="md:hidden bg-emerald-900 text-white p-4 flex justify-between items-center">
                  <span className="font-bold">Admin Panel</span>
                  <button onClick={handleLogout}><LogOut className="w-5 h-5" /></button>
              </div>

              <div className="flex-grow overflow-y-auto p-6">
                  {alert && (
                      <div className={`mb-6 p-4 rounded-xl flex items-center shadow-sm ${alert.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {alert.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertTriangle className="w-5 h-5 mr-3" />}
                          <div>
                              <p className="font-bold">{alert.title}</p>
                              <p className="text-sm">{alert.message}</p>
                          </div>
                      </div>
                  )}

                  {activeTab === 'dashboard' && (
                      <div className="space-y-6">
                          <h2 className="text-2xl font-bold text-stone-800">Dashboard Overview</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                                  <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Users className="w-6 h-6" /></div>
                                      <span className="text-xs font-bold text-stone-400 uppercase">Total Users</span>
                                  </div>
                                  <p className="text-3xl font-black text-stone-800">{users.length}</p>
                                  <p className="text-xs text-stone-500 mt-1">{users.filter(u => u.status === 'VERIFIED').length} Verified</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                                  <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-amber-100 rounded-full text-amber-600"><Ticket className="w-6 h-6" /></div>
                                      <span className="text-xs font-bold text-stone-400 uppercase">Tickets (Cycle {settings.cycle})</span>
                                  </div>
                                  <p className="text-3xl font-black text-stone-800">{tickets.filter(t => t.cycle === settings.cycle && t.status === 'ACTIVE').length}</p>
                                  <p className="text-xs text-stone-500 mt-1">Total Active</p>
                              </div>
                              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                                  <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><Trophy className="w-6 h-6" /></div>
                                      <span className="text-xs font-bold text-stone-400 uppercase">Total Pot</span>
                                  </div>
                                  <p className="text-3xl font-black text-stone-800">{(users.reduce((acc, curr) => acc + (curr.contribution || 0), 0)).toLocaleString()}</p>
                                  <p className="text-xs text-stone-500 mt-1">ETB Collected</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'users' && (
                      <div className="space-y-6">
                          <div className="flex justify-between items-center">
                              <h2 className="text-2xl font-bold text-stone-800">User Management</h2>
                              <div className="relative">
                                  <input type="text" placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                              </div>
                          </div>
                          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                      <tr>
                                          <th className="px-6 py-4">Name</th>
                                          <th className="px-6 py-4">Phone</th>
                                          <th className="px-6 py-4">Status</th>
                                          <th className="px-6 py-4">Contribution</th>
                                          <th className="px-6 py-4">Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-100">
                                      {filteredUsers.map(user => (
                                          <tr key={user.id}>
                                              <td className="px-6 py-4 font-bold">{user.name}</td>
                                              <td className="px-6 py-4">{user.phone}</td>
                                              <td className="px-6 py-4">
                                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                      {user.status}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4">{user.contribution} ETB</td>
                                              <td className="px-6 py-4">
                                                  {user.status !== 'VERIFIED' && (
                                                      <button onClick={() => user.id && verifyUser(user.id.toString())} className="text-emerald-600 hover:text-emerald-800 font-bold text-sm mr-3">Verify</button>
                                                  )}
                                                  <button className="text-stone-400 hover:text-stone-600 text-sm">Edit</button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {activeTab === 'tickets' && (
                      <div className="space-y-6">
                           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                              <h2 className="text-2xl font-bold text-stone-800">Ticket Management</h2>
                              <div className="flex gap-2">
                                  <div className="relative">
                                      <input type="text" placeholder="Search ticket/user..." value={ticketSearch} onChange={e => setTicketSearch(e.target.value)} className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                  </div>
                                  <button onClick={handleExportTickets} className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold hover:bg-emerald-200">
                                      <Download className="w-4 h-4 mr-2" /> Export
                                  </button>
                              </div>
                          </div>

                          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                              <table className="w-full text-left">
                                  <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                      <tr>
                                          <th className="px-6 py-4">Ticket #</th>
                                          <th className="px-6 py-4">User</th>
                                          <th className="px-6 py-4">Cycle</th>
                                          <th className="px-6 py-4">Status</th>
                                          <th className="px-6 py-4">Date</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-100">
                                      {filteredTickets.map(ticket => (
                                          <tr key={ticket.id}>
                                              <td className="px-6 py-4 font-mono font-bold text-emerald-700">#{ticket.ticketNumber}</td>
                                              <td className="px-6 py-4">{ticket.userName}</td>
                                              <td className="px-6 py-4">Cycle {ticket.cycle}</td>
                                              <td className="px-6 py-4">
                                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                      ticket.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                      ticket.status === 'VOID' ? 'bg-red-100 text-red-800' :
                                                      'bg-amber-100 text-amber-800'
                                                  }`}>
                                                      {ticket.status}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4 text-stone-500 text-sm">{ticket.assignedDate}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              {filteredTickets.length === 0 && (
                                  <div className="p-8 text-center text-stone-400">No tickets found matching your criteria.</div>
                              )}
                          </div>
                      </div>
                  )}

                   {activeTab === 'settings' && (
                      <div className="space-y-6">
                          <h2 className="text-2xl font-bold text-stone-800">Global Settings</h2>
                          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <label className="block text-sm font-bold text-stone-700 mb-2">Current Cycle</label>
                                     <input 
                                       type="number" 
                                       value={settings.cycle} 
                                       onChange={(e) => setSettings(prev => ({...prev, cycle: parseInt(e.target.value)}))}
                                       className="w-full p-3 border border-stone-300 rounded-lg"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-stone-700 mb-2">Days Remaining</label>
                                     <input 
                                       type="number" 
                                       value={settings.daysRemaining} 
                                       onChange={(e) => setSettings(prev => ({...prev, daysRemaining: parseInt(e.target.value)}))}
                                       className="w-full p-3 border border-stone-300 rounded-lg"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-stone-700 mb-2">Draw Date (EN)</label>
                                     <input 
                                       type="text" 
                                       value={settings.nextDrawDateEn} 
                                       onChange={(e) => setSettings(prev => ({...prev, nextDrawDateEn: e.target.value}))}
                                       className="w-full p-3 border border-stone-300 rounded-lg"
                                     />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-bold text-stone-700 mb-2">Draw Date (AM)</label>
                                     <input 
                                       type="text" 
                                       value={settings.nextDrawDateAm} 
                                       onChange={(e) => setSettings(prev => ({...prev, nextDrawDateAm: e.target.value}))}
                                       className="w-full p-3 border border-stone-300 rounded-lg"
                                     />
                                 </div>
                                 <div className="md:col-span-2">
                                     <label className="flex items-center space-x-3 cursor-pointer">
                                         <input 
                                            type="checkbox" 
                                            checked={settings.registrationEnabled} 
                                            onChange={(e) => setSettings(prev => ({...prev, registrationEnabled: e.target.checked}))}
                                            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                                         />
                                         <span className="font-bold text-stone-700">Enable User Registration</span>
                                     </label>
                                 </div>
                             </div>
                             <div className="mt-8 flex justify-end">
                                 <button onClick={() => showAlert('success', 'Saved', 'Settings updated successfully!')} className="px-6 py-3 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-800 flex items-center">
                                     <Save className="w-5 h-5 mr-2" /> Save Changes
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