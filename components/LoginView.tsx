import React, { useState } from 'react';
import { User as UserIcon, Lock } from 'lucide-react';
import { ViewState, User, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LoginViewProps {
  setView: (view: ViewState) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  language: Language;
}

const LoginView: React.FC<LoginViewProps> = ({ setView, setUser, language }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[language].login;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({
        name: name || "Blessed Member",
        phone: phone,
        status: 'PENDING',
        contribution: 60000
      });
      setView('dashboard');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4 pt-20">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 to-amber-500"></div>
        <div className="text-center mb-8">
          <div className="bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
             <UserIcon className="w-8 h-8 text-emerald-800" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">{t.heading}</h2>
          <p className="text-stone-500 text-sm">{t.subheading}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t.label_name}</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="e.g. Abebe Kebede"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t.label_phone}</label>
            <div className="flex">
               <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-stone-300 bg-stone-50 text-stone-500 text-sm">
                  +251
               </span>
               <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-r-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="911 234 567"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 flex justify-center items-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              t.btn_login
            )}
          </button>
          
          <div className="flex items-center justify-center space-x-1 pt-2">
            <span className="text-stone-500 text-sm">{t.register_prompt}</span>
            <button 
              type="button" 
              className="text-emerald-700 font-bold text-sm hover:text-emerald-900 hover:underline"
              onClick={() => {
                 const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                 if (nameInput) nameInput.focus();
              }}
            >
              {t.btn_register}
            </button>
          </div>

        </form>
        <div className="mt-6 text-center border-t border-stone-100 pt-4 flex justify-between items-center">
           <button onClick={() => setView('landing')} className="text-stone-400 text-sm hover:text-stone-600">{t.back}</button>
           <button onClick={() => setView('admin')} className="flex items-center text-stone-300 hover:text-stone-500 text-xs transition-colors">
              <Lock className="w-3 h-3 mr-1" /> Admin
           </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;