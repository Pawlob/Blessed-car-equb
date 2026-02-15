
import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp, query, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AppNotification } from '../../types';

interface AdminNotificationsProps {
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ showAlert }) => {
  const [titleEn, setTitleEn] = useState('');
  const [titleAm, setTitleAm] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAm, setDescAm] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [history, setHistory] = useState<AppNotification[]>([]);

  useEffect(() => {
      const q = query(collection(db, 'notifications'), orderBy('time', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
          const data = snap.docs.map(d => ({ 
              id: d.id, 
              ...d.data(), 
              time: d.data().time?.toDate() 
          })) as AppNotification[];
          setHistory(data);
      });
      return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn || !titleAm || !descEn || !descAm) {
        showAlert('error', 'Missing Fields', 'Please fill in all title and description fields.');
        return;
    }

    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'notifications'), {
            title: { en: titleEn, am: titleAm },
            desc: { en: descEn, am: descAm },
            urgent,
            read: false,
            time: serverTimestamp()
        });
        showAlert('success', 'Notification Sent', 'Broadcasted to all users successfully.');
        setTitleEn(''); setTitleAm(''); setDescEn(''); setDescAm(''); setUrgent(false);
    } catch (err) {
        console.error(err);
        showAlert('error', 'Error', 'Failed to send notification.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(confirm('Delete this notification? Users will no longer see it.')) {
          await deleteDoc(doc(db, 'notifications', id));
      }
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-800">Notification Center</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center">
                    <Send className="w-5 h-5 mr-2 text-emerald-600" /> Compose Broadcast
                </h2>
                <form onSubmit={handleSend} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Title (English)</label>
                            <input 
                                type="text" 
                                value={titleEn} 
                                onChange={e => setTitleEn(e.target.value)} 
                                className="w-full p-2 border border-stone-300 rounded-lg"
                                placeholder="e.g. System Update" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Title (Amharic)</label>
                            <input 
                                type="text" 
                                value={titleAm} 
                                onChange={e => setTitleAm(e.target.value)} 
                                className="w-full p-2 border border-stone-300 rounded-lg"
                                placeholder="e.g. የስርዓት ማሻሻያ" 
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Message (English)</label>
                            <textarea 
                                value={descEn} 
                                onChange={e => setDescEn(e.target.value)} 
                                className="w-full p-2 border border-stone-300 rounded-lg h-24 resize-none"
                                placeholder="Notification content..." 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-1">Message (Amharic)</label>
                            <textarea 
                                value={descAm} 
                                onChange={e => setDescAm(e.target.value)} 
                                className="w-full p-2 border border-stone-300 rounded-lg h-24 resize-none"
                                placeholder="የመልእክት ይዘት..." 
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${urgent ? 'bg-red-500' : 'bg-stone-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${urgent ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-sm font-bold text-stone-700 flex items-center">
                                Mark as Urgent {urgent && <AlertCircle className="w-4 h-4 ml-1 text-red-500" />}
                            </div>
                        </label>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-stone-800 hover:bg-stone-700 text-white px-6 py-2 rounded-lg font-bold flex items-center disabled:opacity-50"
                        >
                            {isSubmitting ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Broadcast</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview / Recent */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 flex flex-col h-full">
                <h3 className="font-bold text-stone-800 mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-stone-500" /> Recent History
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2">
                    {history.length === 0 && <p className="text-stone-400 text-sm text-center py-4">No notifications sent yet.</p>}
                    {history.map(note => (
                        <div key={note.id} className="bg-white p-3 rounded-lg shadow-sm border border-stone-100 relative group">
                            <button 
                                onClick={() => handleDelete(note.id.toString())}
                                className="absolute top-2 right-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center mb-1">
                                {note.urgent && <AlertCircle className="w-3 h-3 text-red-500 mr-1" />}
                                <span className="font-bold text-stone-800 text-sm">{note.title.en}</span>
                            </div>
                            <p className="text-xs text-stone-500 truncate">{note.desc.en}</p>
                            <p className="text-[10px] text-stone-400 mt-2 text-right">
                                {note.time ? new Date(note.time).toLocaleDateString() : 'Just now'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminNotifications;
