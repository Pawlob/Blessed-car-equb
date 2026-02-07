import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, XCircle, Edit2, Save, DollarSign, Calendar, 
  Trophy, TrendingUp, AlertCircle 
} from 'lucide-react';
import { User, AppSettings, ViewState } from '../types';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

// Mock Database of Users
const MOCK_USERS: User[] = [
  { id: 101, name: "Abebe Kebede", phone: "0911234567", status: "VERIFIED", contribution: 60000, prizeNumber: 14, joinedDate: "Jan 12, 2024" },
  { id: 102, name: "Tigist Haile", phone: "0922558899", status: "PENDING", contribution: 0, joinedDate: "Feb 01, 2024" },
  { id: 103, name: "Dawit Mulugeta", phone: "0933447788", status: "VERIFIED", contribution: 120000, prizeNumber: 42, joinedDate: "Dec 10, 2023" },
  { id: 104, name: "Sara Tesfaye", phone: "0944112233", status: "PENDING", contribution: 5000, joinedDate: "Feb 15, 2024" },
  { id: 105, name: "Yonas Alemu", phone: "0912341234", status: "VERIFIED", contribution: 30000, prizeNumber: 5, joinedDate: "Jan 20, 2024" },
];

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid Password');
    }
  };

  // User Management
  const toggleUserStatus = (id: number) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, status: u.status === 'VERIFIED' ? 'PENDING' : 'VERIFIED' } : u
    ));
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm)
  );

  // Stats Calculation
  const totalCollected = users.reduce((acc, curr) => acc + curr.contribution, 0);
  const verifiedCount = users.filter(u => u.status === 'VERIFIED').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-stone-800">
          <h1 className="text-xl font-bold text-white flex items-center">
             <Trophy className="w-6 h-6 mr-2 text-amber-500" /> Blessed Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Users className="w-5 h-5 mr-3" /> Members
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> App Settings
          </button>
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button onClick={() => setView('landing')} className="w-full flex items-center px-4 py-2 text-red-400 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto pt-24 md:pt-8">
        {/* Mobile Header (Simplified) */}
        <div className="md:hidden flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-stone-800">Admin</h1>
            <button onClick={() => setView('landing')} className="p-2 bg-stone-200 rounded-full"><LogOut className="w-5 h-5" /></button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-stone-800">Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Total Pot</p>
                    <h3 className="text-2xl font-bold text-emerald-600">{settings.potValue.toLocaleString()} ETB</h3>
                  </div>
                  <div className="bg-emerald-100 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-emerald-600" /></div>
                </div>
                <div className="text-xs text-stone-400">Current Cycle Target</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Total Members</p>
                    <h3 className="text-2xl font-bold text-stone-800">{settings.totalMembers.toLocaleString()}</h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
                </div>
                <div className="text-xs text-stone-400">+12 this week</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Cycle</p>
                    <h3 className="text-2xl font-bold text-amber-600">#{settings.cycle}</h3>
                  </div>
                  <div className="bg-amber-100 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-amber-600" /></div>
                </div>
                <div className="text-xs text-stone-400">Next draw: {settings.nextDrawDateEn}</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-stone-500 text-sm font-medium">Pending Verifications</p>
                    <h3 className="text-2xl font-bold text-red-500">{users.filter(u => u.status === 'PENDING').length}</h3>
                  </div>
                  <div className="bg-red-100 p-2 rounded-lg"><AlertCircle className="w-6 h-6 text-red-600" /></div>
                </div>
                <div className="text-xs text-stone-400">Action required</div>
              </div>
            </div>

            {/* Recent Table Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h3 className="font-bold text-stone-800 mb-4">Recent Verified Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-stone-400 text-xs uppercase bg-stone-50">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.filter(u => u.status === 'VERIFIED').slice(0, 3).map((user) => (
                      <tr key={user.id}>
                         <td className="px-4 py-3 font-medium text-stone-700">{user.name}</td>
                         <td className="px-4 py-3 text-stone-600">{user.contribution.toLocaleString()} ETB</td>
                         <td className="px-4 py-3 text-stone-500">{user.joinedDate}</td>
                         <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Paid</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-stone-800">Members Management</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Contribution</th>
                    <th className="px-6 py-4">Ticket</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 text-stone-500">#{user.id}</td>
                      <td className="px-6 py-4 font-bold text-stone-800">{user.name}</td>
                      <td className="px-6 py-4 text-stone-600">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-700">{user.contribution.toLocaleString()} ETB</td>
                      <td className="px-6 py-4 text-amber-600 font-bold">{user.prizeNumber ? `#${user.prizeNumber}` : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => toggleUserStatus(user.id!)}
                          className={`p-2 rounded-lg transition-colors mr-2 ${user.status === 'VERIFIED' ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={user.status === 'VERIFIED' ? "Revoke Verification" : "Verify User"}
                        >
                          {user.status === 'VERIFIED' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-stone-500">No members found matching your search.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl animate-fade-in-up">
            <h2 className="text-3xl font-bold text-stone-800">App Configuration</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 space-y-6">
               
               <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="block text-sm font-bold text-stone-700 mb-2">Total Pot Value (ETB)</label>
                       <input 
                         type="number" 
                         value={settings.potValue}
                         onChange={(e) => setSettings({...settings, potValue: parseInt(e.target.value)})}
                         className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-bold text-stone-700 mb-2">Total Members</label>
                       <input 
                         type="number" 
                         value={settings.totalMembers}
                         onChange={(e) => setSettings({...settings, totalMembers: parseInt(e.target.value)})}
                         className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                       />
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="block text-sm font-bold text-stone-700 mb-2">Current Cycle</label>
                       <input 
                         type="number" 
                         value={settings.cycle}
                         onChange={(e) => setSettings({...settings, cycle: parseInt(e.target.value)})}
                         className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-bold text-stone-700 mb-2">Days Remaining</label>
                       <input 
                         type="number" 
                         value={settings.daysRemaining}
                         onChange={(e) => setSettings({...settings, daysRemaining: parseInt(e.target.value)})}
                         className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                       />
                   </div>
               </div>

               <div>
                   <label className="block text-sm font-bold text-stone-700 mb-2">Next Draw Date (English)</label>
                   <input 
                     type="text" 
                     value={settings.nextDrawDateEn}
                     onChange={(e) => setSettings({...settings, nextDrawDateEn: e.target.value})}
                     className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                     placeholder="e.g. Yekatit 21, 2018"
                   />
               </div>

               <div>
                   <label className="block text-sm font-bold text-stone-700 mb-2">Next Draw Date (Amharic)</label>
                   <input 
                     type="text" 
                     value={settings.nextDrawDateAm}
                     onChange={(e) => setSettings({...settings, nextDrawDateAm: e.target.value})}
                     className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-sans"
                     placeholder="e.g. የካቲት 21፣ 2018"
                   />
               </div>

               <div className="pt-4 border-t border-stone-100 flex justify-end">
                   <button className="flex items-center px-6 py-2 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors">
                       <Save className="w-5 h-5 mr-2" /> Save Changes
                   </button>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminView;