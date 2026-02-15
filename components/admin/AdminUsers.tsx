
import React, { useState } from 'react';
import { Search, Filter, CheckCircle, Clock, Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { User } from '../../types';
import { doc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AdminUsersProps {
  users: User[];
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  t: any;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, showAlert, showConfirm, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-stone-800">{t.users.title}</h1>
            <button 
                onClick={openAddUser}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold flex items-center shadow-lg transition-transform active:scale-95"
            >
                <Plus className="w-4 h-4 mr-2" /> {t.users.addNew}
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
                    placeholder={t.users.search}
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
                    <option value="ALL">{t.users.allStatus}</option>
                    <option value="VERIFIED">{t.users.verified}</option>
                    <option value="PENDING">{t.users.pending}</option>
                </select>
            </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-stone-50 text-stone-500 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">{t.dashboard.user}</th>
                            <th className="px-6 py-3">{t.users.phone}</th>
                            <th className="px-6 py-3">{t.users.status}</th>
                            <th className="px-6 py-3">{t.users.contrib}</th>
                            <th className="px-6 py-3">{t.users.ticket}</th>
                            <th className="px-6 py-3 text-right">{t.users.actions}</th>
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
                <span>{t.users.showing} {filteredUsers.length} users</span>
                <span>{t.users.total}: {users.length}</span>
            </div>
        </div>

        {/* User Modal */}
        {isUserModalOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-down" onClick={() => setIsUserModalOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                    <h3 className="font-bold text-lg text-stone-800 flex items-center">
                        {editingUser.id ? <Edit className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                        {editingUser.id ? 'Edit User' : t.users.addNew}
                    </h3>
                    <button onClick={() => setIsUserModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSaveUser} className="p-6 space-y-4">
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
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t.users.phone}</label>
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
                            <label className="block text-sm font-bold text-stone-700 mb-1">{t.users.status}</label>
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
    </div>
  );
};

export default AdminUsers;
