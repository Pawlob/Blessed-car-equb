import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Settings, LogOut, Search, 
  CheckCircle, Clock, Edit, Trash2, Save, X, Plus
} from 'lucide-react';
import { ViewState, AppSettings, AppNotification, User } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AdminViewProps {
  setView: (view: ViewState) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  addNotification: (notification: AppNotification) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ setView, settings, setSettings, addNotification }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Settings form state (local state to handle inputs before save)
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update local settings when prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteUser = async (userId: string | number | undefined) => {
    if (!userId) return;
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId.toString()));
        setUsers(users.filter(u => u.id !== userId));
        addNotification({
           id: Date.now(),
           title: { en: 'User Deleted', am: 'ተጠቃሚ ተሰርዟል' },
           desc: { en: 'User removed successfully.', am: 'ተጠቃሚው በተሳካ ሁኔታ ተወግዷል።' },
           time: new Date(),
           urgent: false,
           read: false
        });
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.id) return;
    
    try {
        const userRef = doc(db, 'users', editingUser.id.toString());
        await updateDoc(userRef, {
            name: editingUser.name,
            phone: editingUser.phone,
            status: editingUser.status,
            contribution: Number(editingUser.contribution)
        });
        
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
        addNotification({
            id: Date.now(),
            title: { en: 'User Updated', am: 'ተጠቃሚ ተዘምኗል' },
            desc: { en: 'User details updated.', am: 'የተጠቃሚ መረጃ ተዘምኗል።' },
            time: new Date(),
            urgent: false,
            read: false
        });
    } catch (error) {
        console.error("Error updating user", error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      // In a real app, you might want to validate
      setSettings(localSettings);
      
      // Simulate DB save delay or if App.tsx handles it async
      setTimeout(() => {
          setIsSaving(false);
           addNotification({
            id: Date.now(),
            title: { en: 'Settings Saved', am: 'ቅንብሮች ተቀምጠዋል' },
            desc: { en: 'Application settings updated.', am: 'የመተግበሪያ ቅንብሮች ተዘምኗል።' },
            time: new Date(),
            urgent: false,
            read: false
        });
      }, 1000);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans text-stone-800">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col fixed h-full z-10">
        <div className="p-6">
          <h2 className="text-white text-xl font-bold flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2 text-emerald-500" /> Admin
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Users className="w-5 h-5 mr-3" /> Users Management
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-emerald-900 text-white' : 'hover:bg-stone-800'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> App Settings
          </button>
        </nav>
        <div className="p-4 border-t border-stone-800">
          <button 
            onClick={() => setView('landing')}
            className="w-full flex items-center px-4 py-2 text-red-400 hover:text-red-300 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-stone-800">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'settings' && 'Application Settings'}
            </h1>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-stone-500">Admin Session Active</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h3 className="text-stone-500 text-sm font-bold uppercase mb-2">Total Users</h3>
                    <p className="text-3xl font-black text-stone-800">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h3 className="text-stone-500 text-sm font-bold uppercase mb-2">Verified Users</h3>
                    <p className="text-3xl font-black text-emerald-600">
                        {users.filter(u => u.status === 'VERIFIED').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                    <h3 className="text-stone-500 text-sm font-bold uppercase mb-2">Total Pot Value</h3>
                    <p className="text-3xl font-black text-amber-600">
                        {(users.reduce((acc, curr) => acc + (curr.contribution || 0), 0)).toLocaleString()} ETB
                    </p>
                </div>
             </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
            <div>
                 {/* Filters */}
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search users by name or phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button 
                           onClick={() => setStatusFilter('ALL')}
                           className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'ALL' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                        >
                            All
                        </button>
                        <button 
                           onClick={() => setStatusFilter('VERIFIED')}
                           className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                            Verified
                        </button>
                        <button 
                           onClick={() => setStatusFilter('PENDING')}
                           className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${statusFilter === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                        >
                            Pending
                        </button>
                    </div>
                 </div>

                 {/* Table Snippet Integration */}
                 <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Contribution</th>
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-stone-500 bg-stone-50/50">
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-stone-200">
                <h3 className="text-xl font-bold mb-6">Global Configuration</h3>
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Current Cycle</label>
                            <input 
                                type="number" 
                                value={localSettings.cycle}
                                onChange={(e) => setLocalSettings({...localSettings, cycle: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Days Remaining</label>
                            <input 
                                type="number" 
                                value={localSettings.daysRemaining}
                                onChange={(e) => setLocalSettings({...localSettings, daysRemaining: parseInt(e.target.value)})}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Next Draw (EN)</label>
                            <input 
                                type="text" 
                                value={localSettings.nextDrawDateEn}
                                onChange={(e) => setLocalSettings({...localSettings, nextDrawDateEn: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Next Draw (AM)</label>
                            <input 
                                type="text" 
                                value={localSettings.nextDrawDateAm}
                                onChange={(e) => setLocalSettings({...localSettings, nextDrawDateAm: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                         <div className="col-span-2">
                             <label className="flex items-center space-x-2 cursor-pointer">
                                 <input 
                                    type="checkbox"
                                    checked={localSettings.registrationEnabled}
                                    onChange={(e) => setLocalSettings({...localSettings, registrationEnabled: e.target.checked})}
                                    className="w-5 h-5 text-emerald-600 rounded"
                                 />
                                 <span className="text-stone-700 font-medium">Enable User Registration</span>
                             </label>
                             <p className="text-xs text-stone-500 mt-1 pl-7">If unchecked, new users cannot sign up on the login page.</p>
                         </div>
                         
                         <div className="col-span-2 border-t pt-4">
                             <h4 className="font-bold mb-4 text-emerald-900">Live Stream Config</h4>
                              <label className="flex items-center space-x-2 cursor-pointer mb-4">
                                 <input 
                                    type="checkbox"
                                    checked={localSettings.isLive}
                                    onChange={(e) => setLocalSettings({...localSettings, isLive: e.target.checked})}
                                    className="w-5 h-5 text-red-600 rounded"
                                 />
                                 <span className="text-stone-700 font-medium">Live Stream Active</span>
                             </label>
                             
                             <label className="block text-sm font-medium text-stone-700 mb-1">Stream URL (Embed/Link)</label>
                             <input 
                                type="text" 
                                value={localSettings.liveStreamUrl}
                                onChange={(e) => setLocalSettings({...localSettings, liveStreamUrl: e.target.value})}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="https://..."
                             />
                         </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full py-3 bg-emerald-900 text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors flex justify-center items-center"
                    >
                        {isSaving ? 'Saving...' : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                    </button>
                </form>
            </div>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-down">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-xl font-bold">Edit User</h3>
                    <button onClick={() => setEditingUser(null)} className="text-stone-400 hover:text-stone-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                        <input 
                           type="text" 
                           value={editingUser.name} 
                           onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                           className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                        <input 
                           type="text" 
                           value={editingUser.phone} 
                           onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                           className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
                        <select 
                           value={editingUser.status}
                           onChange={(e) => setEditingUser({...editingUser, status: e.target.value as 'PENDING' | 'VERIFIED'})}
                           className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="VERIFIED">VERIFIED</option>
                        </select>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-stone-700 mb-1">Contribution (ETB)</label>
                        <input 
                           type="number" 
                           value={editingUser.contribution} 
                           onChange={(e) => setEditingUser({...editingUser, contribution: Number(e.target.value)})}
                           className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div className="flex space-x-3 pt-4">
                        <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 border border-stone-300 rounded-lg text-stone-600 font-bold hover:bg-stone-50">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-emerald-600 rounded-lg text-white font-bold hover:bg-emerald-500">Update User</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;