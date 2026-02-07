import React from 'react';
import { Gem, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface FooterProps {
  language?: Language;
}

const Footer: React.FC<FooterProps> = ({ language = 'en' }) => {
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
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 hover:text-blue-500 cursor-pointer" />
              <Instagram className="w-5 h-5 hover:text-pink-500 cursor-pointer" />
              <Twitter className="w-5 h-5 hover:text-blue-400 cursor-pointer" />
            </div>
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