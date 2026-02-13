import React from 'react';
import { Gem, Phone, MapPin, Facebook, Instagram, Send } from 'lucide-react';
import { Language, ViewState } from '../types';
import { TRANSLATIONS } from '../constants';

interface FooterProps {
  language?: Language;
  setView: (view: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ language = 'en', setView }) => {
  const t = TRANSLATIONS[language].footer;

  return (
    <footer className="bg-stone-900 text-stone-300 py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-amber-700 p-1.5 rounded-lg">
                <Gem className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Blessed <span className="text-amber-400">የመኪና ዕቁብ</span></span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed">
              {t.desc}
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">{t.contact}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-emerald-500" /> +251 911 234 567
              </li>
              <li className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-emerald-500" /> Bole, Addis Ababa
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">{t.social}</h4>
            <div className="flex space-x-4 items-center">
              <Facebook className="w-5 h-5 hover:text-blue-500 cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 hover:text-pink-500 cursor-pointer transition-colors" />
              <Send className="w-5 h-5 hover:text-blue-400 cursor-pointer transition-colors" />
              <svg 
                className="w-5 h-5 hover:text-white cursor-pointer transition-colors fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => setView('terms')} className="hover:text-amber-400 transition-colors text-left">
                  {t.terms}
                </button>
              </li>
              <li>
                <button onClick={() => setView('terms')} className="hover:text-amber-400 transition-colors text-left">
                  {t.privacy}
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 mt-12 pt-8 text-center text-xs text-stone-600">
          &copy; {new Date().getFullYear()} {t.rights}
        </div>
      </div>
    </footer>
  );
};

export default Footer;