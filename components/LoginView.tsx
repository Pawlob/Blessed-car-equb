import React, { useState } from 'react';
import { User as UserIcon, CheckSquare, Square, AlertCircle, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { ViewState, User, Language, AppSettings } from '../types';
import { TRANSLATIONS } from '../constants';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LoginViewProps {
  setView: (view: ViewState) => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  language: Language;
  settings: AppSettings;
}

const LoginView: React.FC<LoginViewProps> = ({ setView, setUser, language, settings }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = TRANSLATIONS[language].login;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && !agreed) {
        setError(language === 'en' ? 'You must agree to the terms.' : 'በውሎች እና ሁኔታዎች መስማማት አለብዎት።');
        return;
    }

    if (password.length < 4) {
        setError(language === 'en' ? 'Password must be at least 4 characters.' : 'የይለፍ ቃል ቢያንስ 4 ሆሄያት መሆን አለበት።');
        return;
    }

    setLoading(true);

    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (isRegistering) {
            // REGISTRATION LOGIC
            if (!querySnapshot.empty) {
                setError(language === 'en' ? 'Phone number already registered. Please login.' : 'ይህ ስልክ ቁጥር ተመዝግቧል። እባክዎ ይግቡ።');
                setLoading(false);
                return;
            }

            const newUser: any = {
                name: name,
                phone: phone,
                password: password, // Note: In a production app, never store passwords in plain text!
                status: 'PENDING',
                contribution: 0,
                joinedDate: new Date().toLocaleDateString('en-US')
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'users'), newUser);
            
            // Set Local State (exclude password from state)
            const { password: _, ...userState } = newUser;
            setUser({ ...userState, id: docRef.id as any }); 
            setView('dashboard');

        } else {
            // LOGIN LOGIC
            if (querySnapshot.empty) {
                setError(language === 'en' ? 'Account not found. Please register.' : 'መለያ አልተገኘም። እባክዎ ይመዝገቡ።');
                setLoading(false);
                return;
            }

            // Get the first matching user
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // Verify Password
            if (userData.password !== password) {
                setError(language === 'en' ? 'Incorrect password.' : 'የተሳሳተ የይለፍ ቃል');
                setLoading(false);
                return;
            }

            // Append Firestore ID and set user
            const { password: _, ...userState } = userData;
            setUser({ ...userState, id: userDoc.id } as User);
            setView('dashboard');
        }

    } catch (err) {
        console.error("Auth Error", err);
        setError(language === 'en' ? 'Connection error. Please try again.' : 'የግንኙነት ችግር አጋጥሟል። እንደገና ይሞክሩ።');
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
      if (!isRegistering && !settings.registrationEnabled) {
          setError(language === 'en' ? 'Registration is currently closed.' : 'ምዝገባ ለጊዜው ተዘግቷል።');
          return;
      }
      setIsRegistering(!isRegistering);
      setError('');
      setAgreed(false);
      setPassword('');
      setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4 pt-20">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-600 to-amber-500"></div>
        
        <div className="text-center mb-8">
          <div className="bg-emerald-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
             <UserIcon className="w-8 h-8 text-emerald-800" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800">
              {isRegistering ? t.heading_register : t.heading_login}
          </h2>
          <p className="text-stone-500 text-sm">
              {isRegistering ? t.subheading_register : t.subheading}
          </p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Full Name - Only for Registration */}
          {isRegistering && (
            <div className="animate-fade-in-down">
                <label className="block text-sm font-medium text-stone-700 mb-1">{t.label_name}</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-stone-400" />
                    </div>
                    <input 
                    type="text" 
                    required={isRegistering}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="e.g. Abebe Kebede"
                    />
                </div>
                <p className="text-xs text-amber-600 mt-1.5 flex items-center font-medium">
                    <AlertCircle className="w-3 h-3 mr-1.5" />
                    {t.name_notice}
                </p>
            </div>
          )}

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t.label_phone}</label>
            <div className="flex relative">
               <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-stone-300 bg-stone-50 text-stone-500 text-sm font-medium">
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

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
                {language === 'en' ? 'Password' : 'የይለፍ ቃል'}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="••••••••"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
          </div>

          {isRegistering && (
              <div className="animate-fade-in-down">
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-stone-700 mb-1">{t.label_tier}</label>
                    <div className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-stone-50 text-stone-600 font-bold">
                        5,000 ETB
                    </div>
                  </div>

                  <div className="flex items-start">
                      <button 
                        type="button"
                        onClick={() => setAgreed(!agreed)}
                        className={`mt-0.5 mr-2 flex-shrink-0 transition-colors ${agreed ? 'text-emerald-600' : 'text-stone-300 hover:text-stone-400'}`}
                      >
                          {agreed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                      <span className="text-sm text-stone-600">
                          {t.terms_agree} <button type="button" onClick={() => setView('terms')} className="text-emerald-700 font-bold hover:underline">{t.terms_link}</button>
                      </span>
                  </div>
              </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 flex justify-center items-center shadow-lg"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              isRegistering ? t.btn_register_action : t.btn_login
            )}
          </button>
          
          <div className="flex items-center justify-center space-x-1 pt-2">
            <span className="text-stone-500 text-sm">
                {isRegistering ? t.login_prompt : t.register_prompt}
            </span>
            <button 
              type="button" 
              className={`font-bold text-sm hover:underline ${!settings.registrationEnabled && !isRegistering ? 'text-stone-400 cursor-not-allowed' : 'text-emerald-700 hover:text-emerald-900'}`}
              onClick={toggleMode}
            >
              {isRegistering ? t.btn_login_link : t.btn_register}
            </button>
          </div>
          
          {!settings.registrationEnabled && !isRegistering && (
             <div className="text-center text-xs text-amber-600 mt-2">
                 Registration is currently disabled by admin.
             </div>
          )}

        </form>
        <div className="mt-6 text-center border-t border-stone-100 pt-4 flex justify-center items-center">
           <button onClick={() => setView('landing')} className="text-stone-400 text-sm hover:text-stone-600">{t.back}</button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;