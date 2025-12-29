import React, { useState, useEffect, useRef } from 'react';
import { Country, Service } from './types';
import { jsPDF } from "jspdf";
import { Analytics } from "@vercel/analytics/react";
// Import GoogleGenAI from the official SDK
import { GoogleGenAI } from "@google/genai";

const GOOGLE_FORM_VIEW_LINK = "https://docs.google.com/forms/d/1daGS4bNnDPDsQSQUKSDm6cjvNVjZHC2gFcHBdHPFoDQ/viewform?embedded=true";

const FAQ_KNOWLEDGE_BASE = {
  "🇩🇰 Denmark": [
    { q: "Is the Denmark process for Medical Doctors open now?", a: "No. The process is on hold until 31 December 2026." },
    { q: "Is the Denmark process open for Paramedics?", a: "Yes, the process is currently open for Paramedics (except Pharmacy)." },
    { q: "Are the Denmark and Norway processes the same?", a: "Yes, the process structure is similar, but Norway has different processing times and language requirements." }
  ],
  "🇸🇪 Sweden": [
    { q: "Does the Sweden Doctor process have any fees?", a: "No. The process is free until 31 December 2026." },
    { q: "How long does the Sweden medical process take?", a: "Approximately 4 to 6 months." },
    { q: "What is the total visa duration for Sweden?", a: "9 months, extendable every year." }
  ],
  "🇩🇪 Germany": [
    { q: "What services are offered for Germany?", a: "Study Visa and Master’s Admission." },
    { q: "What is the total cost for a Master’s degree in Germany?", a: "€70 per university for initial verification; €30 after the first 30 applications. Most public universities do self-verification." },
    { q: "Can I apply for PR after a Germany visa?", a: "Yes, after 1 year of work experience in Germany in a relevant field." },
    { q: "Is a blocked account required for Germany?", a: "Yes, a blocked account is mandatory." },
    { q: "Is English proficiency required for Germany?", a: "Yes, usually IELTS is required. However, with MOI (Medium of Instruction), some universities may accept applications." }
  ],
  "🇮🇹 Italy": [
    { q: "Can I study a Medical-related Master’s degree in Italy?", a: "Yes, Italy offers programs in Public Health, Biomedical Sciences, Healthcare Management, and Medical Research." },
    { q: "Is NEET required for Medical Master’s in Italy?", a: "No, NEET is not required for most programs." },
    { q: "What is the tuition fee for Master’s in Italy?", a: "Public universities: €500 – €3,000 per year. Fees may reduce with ISEE / scholarships." },
    { q: "Can I work part-time in Italy during studies?", a: "Yes, up to 20 hours per week." }
  ],
  "🇨🇦 Canada": [
    { q: "Can I apply for a Master’s degree in Canada?", a: "Yes, programs in Medical Sciences, Public Health, Biotechnology, and Healthcare Management." },
    { q: "Is IELTS required for Canada Master’s?", a: "Yes, IELTS is mandatory." },
    { q: "Is Medical Licensing easy in Canada?", a: "No. Doctors must clear MCC exams, credential verification, and residency matching which is highly competitive." },
    { q: "Can I apply for PR after studies in Canada?", a: "Yes, through Post-Graduation Work Permit (PGWP) and Express Entry / PNP." }
  ]
};

interface GroundingSource {
  uri: string;
  title: string;
}

interface CachedSearchData {
  text: string;
  sources: GroundingSource[];
}

interface EnhancedCountry extends Country {
  status: 'Open' | 'On Hold' | 'Study Only' | 'Winter Intake Open';
  statusNote: string;
  officialOrgLink?: string;
  officialOrgName?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Open': 'bg-green-100 text-green-700 border-green-200 shadow-green-100 animate-pulse-subtle',
    'Winter Intake Open': 'bg-blue-100 text-blue-700 border-blue-200 shadow-blue-100 animate-pulse-subtle',
    'On Hold': 'bg-red-100 text-red-700 border-red-200',
    'Study Only': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border shadow-sm ${styles[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
};

const FAQBot: React.FC<{ isOpen: boolean; onClose: () => void; onWhatsApp: () => void }> = ({ isOpen, onClose, onWhatsApp }) => {
  const [view, setView] = useState<'menu' | 'questions' | 'answer'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<{ q: string, a: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const resetToMenu = () => {
    setView('menu');
    setSelectedCategory(null);
    setSelectedFAQ(null);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setView('questions');
  };

  const handleFAQSelect = (faq: { q: string, a: string }) => {
    setSelectedFAQ(faq);
    setView('answer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 md:right-10 w-[90vw] md:w-96 h-[600px] max-h-[85vh] bg-white rounded-[32px] shadow-2xl z-[200] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 border border-slate-100">
      <div className="bg-blue-700 p-5 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">N</div>
          <div>
            <p className="font-bold text-sm">NextStep Assistant</p>
            <p className="text-[10px] text-blue-100">Expert Knowledge Hub</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">✕</button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="flex justify-start">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-sm text-slate-800 leading-relaxed">
            {view === 'menu' && "Hello! I am the NextStep FAQ Assistant. Please select a destination to see common questions:"}
            {view === 'questions' && `Great! What would you like to know about ${selectedCategory}?`}
            {view === 'answer' && "Here is the information you requested:"}
          </div>
        </div>

        {view === 'menu' && (
          <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {Object.keys(FAQ_KNOWLEDGE_BASE).map(cat => (
              <button 
                key={cat} 
                onClick={() => handleCategorySelect(cat)}
                className="w-full text-left p-4 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-all flex justify-between items-center"
              >
                {cat} <span>→</span>
              </button>
            ))}
          </div>
        )}

        {view === 'questions' && selectedCategory && (
          <div className="grid gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {(FAQ_KNOWLEDGE_BASE as any)[selectedCategory].map((faq: any, i: number) => (
              <button 
                key={i} 
                onClick={() => handleFAQSelect(faq)}
                className="w-full text-left p-4 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 transition-all"
              >
                {faq.q}
              </button>
            ))}
            <button onClick={resetToMenu} className="text-blue-700 text-xs font-bold py-2 hover:underline">← Back to Destinations</button>
          </div>
        )}

        {view === 'answer' && selectedFAQ && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-800 uppercase mb-2">Question:</p>
              <p className="text-sm font-semibold text-blue-900">{selectedFAQ.q}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Answer:</p>
              <p className="text-sm text-slate-700 leading-relaxed">{selectedFAQ.a}</p>
            </div>
            <button onClick={() => setView('questions')} className="text-blue-700 text-xs font-bold py-2 hover:underline">← Back to Questions</button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-3">
        <button 
          onClick={onWhatsApp}
          className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-md active:scale-95"
        >
          💬 Chat with Our Expert on WhatsApp
        </button>
        <p className="text-[10px] text-center text-slate-400">Direct response from Mr. Muhammad Khalid</p>
      </div>
    </div>
  );
};

const PromotionalPopup: React.FC<{ onClose: () => void, onApply: () => void, onWhatsApp: () => void }> = ({ onClose, onApply, onWhatsApp }) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
    <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out">
      <div className="bg-gradient-to-br from-red-600 to-blue-800 p-8 text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 animate-pulse"></div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block animate-fade-in-up">Urgent Announcement</span>
        <h2 className="text-3xl font-serif font-bold leading-tight animate-fade-in-up delay-100">Winter Intake & <br />Exclusive Offers 2026</h2>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors duration-200">✕</button>
      </div>
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          {['🇩🇪 Germany', '🇮🇹 Italy', '🇸🇪 Sweden'].map((label, i) => (
            <div key={i} className={`flex items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-fade-in-up`} style={{ animationDelay: `${200 + (i * 100)}ms` }}>
              <span className="text-2xl mr-4">{label.split(' ')[0]}</span>
              <div>
                <p className="font-bold text-slate-900">{label.split(' ')[1]} Intake</p>
                <p className="text-sm text-slate-600">Apply now for professional 2026 pathways.</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 animate-fade-in-up delay-500">
          <button onClick={onApply} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl hover:-translate-y-1 active:translate-y-0">Start Now</button>
          <button onClick={onWhatsApp} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 active:translate-y-0">💬 WhatsApp</button>
        </div>
      </div>
    </div>
  </div>
);

const AgreementView: React.FC<{ 
  onClose: () => void, 
  signature: string, 
  onSignatureChange: (val: string) => void, 
  onSign: () => void 
}> = ({ onClose, signature, onSignatureChange, onSign }) => {
  
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('NEXTSTEP CONSULTANCY', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('OFFICIAL CONSULTANCY AGREEMENT', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Issue: ${date}`, margin, 45);
    doc.text('Location: Peshawar, KPK, Pakistan', margin, 50);

    doc.setLineWidth(0.5);
    doc.line(margin, 55, pageWidth - margin, 55);

    let yPos = 65;

    doc.setFont('helvetica', 'bold');
    doc.text('1. PARTIES', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const partiesText = `This agreement is between NextStep Consultancy (Service Provider: Mr. Muhammad Khalid) and the Applicant: ${signature || '[Full Legal Name]'}.`;
    const partiesLines = doc.splitTextToSize(partiesText, contentWidth);
    doc.text(partiesLines, margin, yPos);
    yPos += (partiesLines.length * 6) + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('2. PURPOSE & SCOPE', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const purposeText = "The Applicant appoints the Service Provider to provide professional consultancy services for foreign visa guidance, PG residency applications, and clinical licensing pathways.";
    const purposeLines = doc.splitTextToSize(purposeText, contentWidth);
    doc.text(purposeLines, margin, yPos);
    yPos += (purposeLines.length * 6) + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('3. CONSULTANCY FEES', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const feesText = "The consultancy fee is agreed upon registration. A 30% non-refundable advance is required to initiate the file. All third-party expenses are responsibility of the applicant.";
    const feesLines = doc.splitTextToSize(feesText, contentWidth);
    doc.text(feesLines, margin, yPos);
    yPos += (feesLines.length * 6) + 15;

    doc.setLineWidth(0.2);
    doc.line(margin, yPos, margin + 70, yPos);
    doc.line(pageWidth - margin - 70, yPos, pageWidth - margin, yPos);
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('NextStep Consultancy', margin, yPos);
    doc.text('Applicant Signature', pageWidth - margin - 70, yPos);
    
    yPos += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('M. Khalid', margin, yPos);
    doc.text(signature || '[Signed Digitally]', pageWidth - margin - 70, yPos);

    const fileName = `NextStep_Agreement_${signature.replace(/\s+/g, '_') || 'Draft'}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
        <div className="p-8 bg-slate-50 border-b border-slate-200 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Electronic Consultancy Agreement</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">NextStep Consultancy & Applicant</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-500">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 bg-white">
          <div className="max-w-3xl mx-auto space-y-10 text-slate-800 leading-relaxed font-serif text-justify animate-fade-in-up">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold underline uppercase">Electronic Consultancy Agreement</h1>
              <p className="font-sans text-sm font-bold text-slate-600">(Medical Job / Residency / Study Abroad)</p>
              <p className="font-sans text-sm">Effective Date: <span className="underline font-bold">{new Date().toLocaleDateString()}</span></p>
            </div>
            <div className="space-y-6">
              <h3 className="font-bold text-xl uppercase border-b pb-2">1. Parties</h3>
              <p><strong>Service Provider:</strong> NextStep Consultancy / Mr. Muhammad Khalid, Overseas Medical Job Provider.</p>
              <p><strong>AND</strong></p>
              <p><strong>Applicant:</strong> <span className="underline font-bold text-blue-700">{signature || '____________________'}</span></p>
            </div>
            <div className="space-y-8 font-sans text-sm leading-relaxed">
              <section><h4 className="font-bold uppercase mb-2">2. Purpose</h4><p>The Applicant appoints the Service Provider for professional guidance regarding foreign medical registration and study pathways.</p></section>
              <section><h4 className="font-bold uppercase mb-2">3. Fees</h4><p>Consultancy fees are strictly non-refundable once the case processing has initiated. 30% advance required.</p></section>
            </div>
            <div className="grid grid-cols-2 gap-12 pt-12 border-t font-sans">
              <div className="space-y-4">
                <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Service Provider</p>
                <div className="h-16 flex items-end border-b-2 border-slate-900 pb-2 italic text-2xl font-serif">M. Khalid</div>
              </div>
              <div className="space-y-4">
                <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Applicant Signature</p>
                <input 
                  autoFocus
                  value={signature} 
                  onChange={(e) => onSignatureChange(e.target.value)} 
                  placeholder="Type Your Full Name" 
                  className="h-16 w-full border-b-2 border-slate-900 text-2xl font-serif italic outline-none focus:border-blue-500 bg-transparent transition-all duration-300" 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-between items-center">
          <button 
            onClick={handleDownloadPDF}
            className="px-8 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            <span>📄</span> Download as PDF
          </button>
          <div className="space-x-4">
            <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
            <button 
              disabled={!signature || signature.length < 3} 
              onClick={onSign} 
              className="px-12 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Sign & Accept Agreement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplyModal: React.FC<{ 
  onClose: () => void, 
  onShowAgreement: () => void, 
  agreementSigned: boolean, 
  onWhatsApp: () => void 
}> = ({ onClose, onShowAgreement, agreementSigned, onWhatsApp }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
    <div className="relative bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[95vh] flex flex-col">
      <div className="bg-blue-700 p-8 md:p-10 text-white relative shrink-0">
        <div className="flex justify-between items-start">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-serif font-bold mb-2">NextStep Registry Portal</h2>
            <p className="text-blue-100 text-sm">Please complete the official Google Form below to initiate your clinical pathway.</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row">
        <div className="flex-1 h-full bg-slate-50">
          <iframe src={GOOGLE_FORM_VIEW_LINK} className="w-full h-full border-none" title="Registration Form">Loading…</iframe>
        </div>
        <div className="lg:w-80 border-l border-slate-100 bg-white p-8 flex flex-col shrink-0 animate-in slide-in-from-right duration-500">
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Onboarding Progress</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">1</div><span className="text-sm font-bold text-slate-800">Submit Google Form</span></div>
              <div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full ${agreementSigned ? 'bg-green-600 animate-bounce' : 'bg-slate-200'} text-white text-[10px] flex items-center justify-center font-bold transition-colors duration-500`}>2</div><span className={`text-sm font-bold ${agreementSigned ? 'text-green-600' : 'text-slate-400'}`}>Sign E-Agreement</span></div>
            </div>
          </div>
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-fade-in-up delay-300">
              <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Status: Live Registry</p>
              <p className="text-xs text-blue-900 leading-relaxed">Once you've submitted the form, proceed to the Electronic Agreement.</p>
            </div>
            <button onClick={onShowAgreement} className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${agreementSigned ? 'bg-green-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
              {agreementSigned ? '✓ Agreement Signed' : '📝 Step 2: Sign Agreement'}
            </button>
            <button onClick={onWhatsApp} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm">💬 Support on WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CountryDetail: React.FC<{ 
  country: EnhancedCountry, 
  onBack: () => void, 
  onApply: () => void, 
  isSearching: boolean, 
  searchData?: CachedSearchData 
}> = ({ country, onBack, onApply, isSearching, searchData }) => (
  <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 pb-24">
    <div className="relative h-[350px] md:h-[450px] w-full overflow-hidden">
      <img src={country.image} alt={country.name} className="w-full h-full object-cover scale-105 animate-in zoom-in duration-[20s]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
      <div className="absolute bottom-12 left-0 w-full px-4 max-w-7xl mx-auto">
        <button onClick={onBack} className="text-white/80 hover:text-white mb-6 text-sm font-medium transition-transform hover:-translate-x-2 inline-block">← Back to Destinations</button>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white animate-fade-in-up">{country.name}</h1>
          <div className="animate-fade-in-up delay-100"><StatusBadge status={country.status} /></div>
        </div>
        <p className="text-xl text-slate-200 max-w-2xl animate-fade-in-up delay-200">{country.statusNote}</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden animate-fade-in-up delay-300">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center"><span className="mr-3">⚕️</span> Professional Pathway & Status</h2>
            <div className="p-5 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl mb-8"><p className="text-blue-900 font-bold mb-1">Status Overview:</p><p className="text-blue-800 text-lg">{country.jobInsights}</p></div>
            <div className="grid sm:grid-cols-2 gap-4">
              {country.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center p-4 bg-slate-50 rounded-xl text-slate-700 font-medium border border-slate-100 transition-transform hover:scale-[1.02] cursor-default">
                  <span className="mr-3 text-blue-600">✔</span> {benefit}
                </div>
              ))}
            </div>
          </section>
          <section className="bg-slate-900 text-white p-8 md:p-12 rounded-[40px] shadow-2xl overflow-hidden relative animate-fade-in-up delay-400">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-serif font-bold mb-8">Regional Insights 2025</h2>
              {isSearching ? <div className="space-y-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-4 bg-white/10 rounded w-full"></div></div> : searchData ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-line">{searchData.text}</p>
                  {searchData.sources.length > 0 && (
                    <div className="pt-8 border-t border-white/10">
                      <div className="flex flex-wrap gap-3">
                        {searchData.sources.map((source, idx) => (
                          <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-blue-400 hover:bg-white/10 transition-colors">{source.title} ↗</a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <p className="text-slate-500 italic">Insights currently unavailable.</p>}
            </div>
          </section>
        </div>
        <div className="space-y-8 animate-in slide-in-from-right duration-700">
          <div className="bg-slate-950 rounded-3xl p-8 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <h3 className="text-xl font-bold mb-6">Financial Insights</h3>
            <div className="space-y-6 text-sm">
              <div><p className="text-slate-400 uppercase tracking-widest font-bold mb-1">Accommodation</p><p className="text-lg font-semibold">{country.livingCosts.rent}</p></div>
              <div className="pt-6 border-t border-white/10"><p className="text-blue-400 uppercase tracking-widest font-bold mb-1">Est. Total Monthly</p><p className="text-2xl font-bold">{country.livingCosts.total}</p></div>
            </div>
          </div>
          <div className="bg-blue-700 rounded-3xl p-8 text-white hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <h3 className="text-xl font-bold mb-4">Education Hubs</h3>
            <ul className="text-sm space-y-3 mb-8">{country.universityRankings.map((u, i) => (<li key={i} className="flex items-center"><span className="mr-2">🎓</span> {u}</li>))}</ul>
            <button onClick={onApply} className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl shadow-xl hover:bg-slate-100 active:scale-95 transition-all">Apply for Registration</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const countries: EnhancedCountry[] = [
  { name: 'Germany', code: 'DE', status: 'Winter Intake Open', statusNote: 'Winter Intake Open for All Medical Fields', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80', description: 'Primary destination for International Medical Graduates.', benefits: ['Paid Residency training', 'No Tuition for MD/PhDs', 'Structured Facharzt Pathway'], jobInsights: 'WINTER INTAKE 2025/26 IS FULLY OPEN.', universityRankings: ['Heidelberg University', 'Charité Berlin'], livingCosts: { rent: '€600 - €950', general: '€350 - €450', total: '€950 - €1,400/mo' }, jobs: [] },
  { name: 'Sweden', code: 'SE', status: 'Open', statusNote: 'Application Are Open', image: 'https://images.unsplash.com/photo-1509339022327-1e1e25360a41?auto=format&fit=crop&w=1200&q=80', description: 'Direct clinical pathways for IMGs and nurses.', benefits: ['Family friendly', 'No Assessment Fee (Limited Time)'], jobInsights: 'APPLICATIONS ARE OPEN.', universityRankings: ['Karolinska Institute'], livingCosts: { rent: 'SEK 6,000 - 9,500', general: 'SEK 3,500 - 5,000', total: 'SEK 9,500 - 14,500/mo' }, jobs: [] },
  { name: 'Italy', code: 'IT', status: 'Winter Intake Open', statusNote: 'Winter Intake for Master Open Now', image: 'https://images.unsplash.com/photo-1529243856184-fd5465488984?auto=format&fit=crop&w=1200&q=80', description: 'Affordable medical specialization.', benefits: ['Low tuition fees', 'Doctors & Paramedics accepted'], jobInsights: 'WINTER INTAKE OPEN.', universityRankings: ['Sapienza University'], livingCosts: { rent: '€550 - €900', general: '€300 - €500', total: '€850 - €1,400/mo' }, jobs: [] },
  { name: 'Denmark', code: 'DK', status: 'On Hold', statusNote: 'Currently on Hold for Doctor and Nurse', image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=80', description: 'High-standard healthcare.', benefits: ['Work-life balance'], jobInsights: 'CURRENTLY ON HOLD.', universityRankings: ['Copenhagen University'], livingCosts: { rent: 'DKK 5,500 - 8,500', general: 'DKK 3,500 - 4,500', total: 'DKK 9,000 - 13,000/mo' }, jobs: [] },
  { name: 'Canada', code: 'CA', status: 'Study Only', statusNote: 'Only Study Related Consultancy', image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80', description: 'Premier medical education and clinical specialization hub.', benefits: ['World-recognized degrees', 'Post-graduation work permits', 'High-quality research facilities'], jobInsights: 'STUDY PATHWAYS ONLY CURRENTLY SUPPORTED.', universityRankings: ['University of Toronto', 'McGill University'], livingCosts: { rent: 'CAD 1,300 - 2,200', general: 'CAD 700 - 1,100', total: 'CAD 2,000 - 3,300/mo' }, jobs: [] }
];

const services: Service[] = [
  { title: 'Residency & PG Support', description: 'Complete guidance for Assistenzarzt and Specialization matching.', icon: '⚕️' },
  { title: 'Medical Licensing', description: 'Expert assistance with Socialstyrelsen and Approbation.', icon: '📜' },
  { title: 'Scholarships & DAAD', description: 'English-taught programs with full scholarship support.', icon: '🎓' },
];

const App: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<EnhancedCountry | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPromoPopupOpen, setIsPromoPopupOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [applicantSignature, setApplicantSignature] = useState('');
  const [searchCache, setSearchCache] = useState<Record<string, CachedSearchData>>({});
  const [isFAQOpen, setIsFAQOpen] = useState(false);

  const linkedInUrl = "https://www.linkedin.com/in/engr-muhammad-khalid-675a61266/";

  useEffect(() => {
    const timer = setTimeout(() => setIsPromoPopupOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchCountryInsights(selectedCountry);
    }
  }, [selectedCountry]);

  const fetchCountryInsights = async (country: EnhancedCountry) => {
    if (searchCache[country.code]) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Healthcare system overview and relocation insights for ${country.name} 2025.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text || "Information updated soon.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.filter((c: any) => c.web).map((c: any) => ({ uri: c.web.uri, title: c.web.title || c.web.uri }));
      setSearchCache(prev => ({ ...prev, [country.code]: { text, sources } }));
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  const openWhatsApp = () => window.open('https://wa.me/923119548076', '_blank');
  const scrollToSection = (id: string) => {
    setSelectedCountry(null);
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      <Analytics />
      {isPromoPopupOpen && <PromotionalPopup onClose={() => setIsPromoPopupOpen(false)} onApply={() => { setIsPromoPopupOpen(false); setIsApplyModalOpen(true); }} onWhatsApp={openWhatsApp} />}
      {isApplyModalOpen && <ApplyModal onClose={() => setIsApplyModalOpen(false)} onShowAgreement={() => setShowAgreement(true)} agreementSigned={agreementSigned} onWhatsApp={openWhatsApp} />}
      {showAgreement && <AgreementView onClose={() => setShowAgreement(false)} signature={applicantSignature} onSignatureChange={setApplicantSignature} onSign={() => { setAgreementSigned(true); setShowAgreement(false); }} />}
      
      <FAQBot isOpen={isFAQOpen} onClose={() => setIsFAQOpen(false)} onWhatsApp={openWhatsApp} />

      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 h-20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <button onClick={() => setSelectedCountry(null)} className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:rotate-12 transition-transform duration-300">N</div>
            <span className="text-2xl font-serif font-bold text-slate-800">NextStep <span className="text-blue-700">Abroad</span></span>
          </button>
          <div className="hidden md:flex space-x-8 font-medium text-slate-600">
            {['destinations', 'services', 'contact'].map(id => (
              <button key={id} onClick={() => scrollToSection(id)} className="hover:text-blue-700 transition-colors relative group py-2 text-sm">
                {id.charAt(0).toUpperCase() + id.slice(1)}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}
          </div>
          <button onClick={() => setIsApplyModalOpen(true)} className="bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:translate-y-0 relative overflow-hidden group">
            <span className="relative z-10">Sign Up</span>
            <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </nav>

      {selectedCountry ? <CountryDetail country={selectedCountry} onBack={() => setSelectedCountry(null)} onApply={() => setIsApplyModalOpen(true)} isSearching={isSearching} searchData={searchCache[selectedCountry.code]} /> : (
        <>
          <section className="relative py-32 bg-slate-950 text-white overflow-hidden text-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10 animate-pulse"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-4">
              <span className="inline-block py-1 px-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-8 border border-blue-500/20 uppercase tracking-widest animate-fade-in-up">Elite Foreign Career Partners</span>
              <h1 className="text-6xl md:text-9xl font-serif font-bold mb-10 text-white leading-tight animate-fade-in-up delay-100">Your Career <br /><span className="text-blue-500">Without Limits.</span></h1>
              <p className="text-2xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed animate-fade-in-up delay-200">Peshawar's leading professional consultancy. High-impact pathways to Germany, Sweden, Italy, and Canada.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up delay-300">
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-white text-slate-950 px-12 py-6 rounded-3xl font-bold text-xl shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all active:scale-100 relative overflow-hidden group">
                  <span className="relative z-10">Get Registered</span>
                  <div className="absolute inset-0 bg-slate-100/50 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
                <button onClick={openWhatsApp} className="bg-green-600 text-white px-12 py-6 rounded-3xl font-bold text-xl flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-1 transition-all active:scale-100 shadow-xl">💬 WhatsApp Hub</button>
              </div>
            </div>
          </section>

          <section id="destinations" className="py-24 max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-serif font-bold text-center mb-16 animate-fade-in-up">Core Pathways</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
              {countries.map((c, i) => (
                <div 
                  key={c.code} 
                  onClick={() => setSelectedCountry(c)} 
                  className={`bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 group cursor-pointer flex flex-col hover:-translate-y-2 animate-fade-in-up`}
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className="h-56 relative overflow-hidden">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    <div className="absolute top-5 left-5 transition-transform duration-500 group-hover:scale-110">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-700 transition-colors">{c.name}</h3>
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-6">{c.statusNote}</p>
                    <span className="text-blue-700 font-bold text-xs uppercase tracking-wider group-hover:translate-x-2 transition-all inline-block">Explore →</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="services" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center">
              <div className="animate-fade-in-up">
                <h2 className="text-5xl font-serif font-bold mb-10">Strategic Career Support</h2>
                <div className="grid gap-8">
                  {services.map((s, i) => (
                    <div 
                      key={i} 
                      className={`p-8 bg-slate-50 rounded-[32px] flex items-center hover:bg-blue-50 transition-all duration-300 border border-transparent hover:border-blue-100 group hover:-translate-x-2`}
                    >
                      <div className="text-5xl mr-8 group-hover:rotate-12 transition-transform duration-300">{s.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-blue-800 transition-colors">{s.title}</h3>
                        <p className="text-slate-500">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-[64px] overflow-hidden shadow-3xl animate-fade-in-up delay-300 group">
                <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80" alt="Consultancy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" />
                <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-xl p-10 rounded-[40px] border border-white/20 shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-slate-900 font-bold text-xl mb-2">Direct Official Registry</p>
                  <p className="text-slate-600">Secure registration via our digital platform.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <footer id="contact" className="bg-slate-950 text-white pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-1 animate-fade-in-up">
              <div className="flex items-center space-x-3 mb-10">
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl animate-pulse">N</div>
                <span className="text-3xl font-serif font-bold">NextStep</span>
              </div>
              <p className="text-slate-500 mb-10">Peshawar's elite foreign career partner since 2021.</p>
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-3xl bg-white/5 border border-white/10 group transition-all mx-auto md:mx-0 w-max hover:bg-white/10">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mr-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">in</div>
                <div><p className="font-bold">Engr. Muhammad Khalid</p><p className="text-xs text-slate-400">Founder</p></div>
              </a>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-16 animate-fade-in-up delay-200">
              <div><h4 className="font-bold mb-10 text-xl">Direct Assistance</h4><ul className="space-y-4 text-slate-400"><li>📍 Hashtnagary Peshawar, KPK</li><li>📞 +92 311 9548076</li><li>✉️ softengr.ks@gmail.com</li></ul></div>
              <div><h4 className="font-bold mb-10 text-xl">Quick Links</h4><ul className="space-y-4 text-slate-400"><li><button onClick={() => setIsApplyModalOpen(true)} className="hover:text-blue-500 transition-colors">Registration Portal</button></li><li><button onClick={openWhatsApp} className="hover:text-green-500 transition-colors">Consultation Hub</button></li></ul></div>
            </div>
            <div className="md:col-span-1 bg-blue-700/10 border border-blue-500/20 p-10 rounded-[40px] animate-fade-in-up delay-400">
              <h4 className="font-bold mb-6 text-xl">Registry Hub</h4>
              <p className="text-sm text-slate-400 mb-8">Submit your application directly.</p>
              <button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl hover:bg-blue-800 transition-all hover:shadow-xl active:scale-95">Register Now</button>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-slate-600 text-sm italic">© 2025 NextStep Consultancy Abroad.</div>
        </div>
      </footer>
      
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 items-end z-50">
        <button 
          onClick={() => setIsFAQOpen(!isFAQOpen)} 
          className="w-20 h-20 bg-blue-700 text-white rounded-[32px] flex items-center justify-center shadow-3xl hover:scale-110 active:scale-95 transition-all animate-float relative"
        >
          <span className="text-3xl">{isFAQOpen ? '✕' : '📚'}</span>
          {!isFAQOpen && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white animate-bounce">FAQ</div>
          )}
        </button>
        <button 
          onClick={openWhatsApp} 
          className="w-16 h-16 bg-green-500 text-white rounded-[24px] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
        >
          <span className="text-3xl">💬</span>
        </button>
      </div>
    </div>
  );
};

export default App;