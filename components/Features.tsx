import React from 'react';
import { ShieldCheck, Calculator, Trophy } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface FeaturesProps {
  language: Language;
}

const Features: React.FC<FeaturesProps> = ({ language }) => {
  const t = TRANSLATIONS[language].features;

  return (
    <section id="how-it-works" className="py-24 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-emerald-900 font-bold tracking-wide uppercase text-sm mb-2">{t.heading_sub}</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-stone-900 mb-4">
            {t.heading_main} <span className="text-amber-700">{t.heading_highlight}</span>
          </h3>
          <p className="text-stone-600 text-lg">
            {t.desc}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {[
            { title: t.step1_title, desc: t.step1_desc, step: "01", color: "bg-emerald-900", icon: ShieldCheck },
            { title: t.step2_title, desc: t.step2_desc, step: "02", color: "bg-amber-800", icon: Calculator },
            { title: t.step3_title, desc: t.step3_desc, step: "03", color: "bg-red-900", icon: Trophy }
          ].map((feature, idx) => (
            <div key={idx} className={`bg-white rounded-2xl p-5 md:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border-b-4 border-transparent hover:border-amber-600 relative overflow-hidden group ${idx === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
              <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <span className="text-7xl md:text-9xl font-black text-stone-900">{feature.step}</span>
              </div>
              <div className={`${feature.color} w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-white shadow-md relative z-10`}>
                <feature.icon className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <h4 className="text-base md:text-xl font-bold text-stone-900 mb-2 md:mb-3 relative z-10">{feature.title}</h4>
              <p className="text-xs md:text-base text-stone-600 leading-relaxed relative z-10">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;