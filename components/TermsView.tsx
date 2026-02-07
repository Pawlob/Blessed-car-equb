import React from 'react';
import { FileText, Shield, ArrowLeft } from 'lucide-react';
import { Language, ViewState } from '../types';
import { TRANSLATIONS } from '../constants';

interface TermsViewProps {
  language: Language;
  setView: (view: ViewState) => void;
}

const TermsView: React.FC<TermsViewProps> = ({ language, setView }) => {
  const t = TRANSLATIONS[language].terms_page;

  return (
    <div className="pt-24 pb-12 min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => setView('landing')}
          className="flex items-center text-stone-500 hover:text-emerald-700 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {language === 'en' ? 'Back to Home' : 'ወደ መነሻ ተመለስ'}
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="bg-emerald-900 text-white p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Shield className="w-48 h-48" /></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-4 backdrop-blur-sm">
                        <FileText className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{t.title}</h1>
                    <p className="text-emerald-200 text-sm">{t.last_updated}</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-12 space-y-10">
                {t.sections.map((section, index) => (
                    <div key={index} className="border-l-4 border-emerald-100 pl-6 hover:border-emerald-500 transition-colors">
                        <h2 className="text-xl font-bold text-stone-800 mb-3">{section.heading}</h2>
                        <p className="text-stone-600 leading-relaxed text-lg">{section.content}</p>
                    </div>
                ))}
            </div>

            {/* Footer of Card */}
            <div className="bg-stone-50 p-8 border-t border-stone-100 text-center">
                <p className="text-stone-500 text-sm mb-4">
                    {language === 'en' 
                        ? "If you have any questions regarding these terms, please contact us." 
                        : "ስለ እነዚህ ውሎች ማንኛውም ጥያቄ ካለዎት እባክዎ ያነጋግሩን።"}
                </p>
                <button 
                  onClick={() => window.location.href = 'mailto:support@blessedequb.com'}
                  className="text-emerald-700 font-bold hover:underline"
                >
                    support@blessedequb.com
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TermsView;