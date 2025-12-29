import React, { useState, useEffect, useMemo } from 'react';
import { Country, Service, Job } from './types';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from "jspdf";

const GOOGLE_FORM_VIEW_LINK = "https://docs.google.com/forms/d/1daGS4bNnDPDsQSQUKSDm6cjvNVjZHC2gFcHBdHPFoDQ/viewform?embedded=true";

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
    'Open': 'bg-green-100 text-green-700 border-green-200',
    'Winter Intake Open': 'bg-blue-100 text-blue-700 border-blue-200',
    'On Hold': 'bg-red-100 text-red-700 border-red-200',
    'Study Only': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
};

const PromotionalPopup: React.FC<{ onClose: () => void, onApply: () => void, onWhatsApp: () => void }> = ({ onClose, onApply, onWhatsApp }) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
    <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="bg-gradient-to-br from-red-600 to-blue-800 p-8 text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Urgent Announcement</span>
        <h2 className="text-3xl font-serif font-bold leading-tight">Winter Intake & <br />Exclusive Offers 2026</h2>
        <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition">✕</button>
      </div>
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-2xl mr-4">🇩🇪</span>
            <div>
              <p className="font-bold text-slate-900">Germany Winter Intake</p>
              <p className="text-sm text-slate-600">Open for All Medical Fields. Apply now for Jan 2026.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-2xl mr-4">🇮🇹</span>
            <div>
              <p className="font-bold text-slate-900">Italy Winter Intake</p>
              <p className="text-sm text-slate-600">Open for All Medical Fields (Masters).</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <span className="text-2xl mr-4">🇸🇪</span>
            <div>
              <p className="font-bold text-blue-800">Sweden Official Status</p>
              <p className="text-sm text-blue-700 font-medium">No Assessment fee till 31 Dec. Apply Now!</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onApply} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl">Start My Application</button>
          <button onClick={onWhatsApp} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition flex items-center justify-center gap-2">💬 WhatsApp</button>
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
    const purposeText = "The Applicant appoints the Service Provider to provide professional consultancy services for foreign visa guidance, PG residency applications, and clinical licensing pathways. The Service Provider shall act as an advisor and documentation expert.";
    const purposeLines = doc.splitTextToSize(purposeText, contentWidth);
    doc.text(purposeLines, margin, yPos);
    yPos += (purposeLines.length * 6) + 5;

    doc.setFont('helvetica', 'bold');
    doc.text('3. CONSULTANCY FEES', margin, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const feesText = "The consultancy fee is agreed upon registration. A 30% non-refundable advance is required to initiate the file. All third-party expenses (embassy fees, translation, courier) are responsibility of the applicant.";
    const feesLines = doc.splitTextToSize(feesText, contentWidth);
    doc.text(feesLines, margin, yPos);
    yPos += (feesLines.length * 6) + 10;

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 bg-slate-50 border-b border-slate-200 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Electronic Consultancy Agreement</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">NextStep Consultancy & Applicant</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition text-slate-500">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 bg-white">
          <div className="max-w-3xl mx-auto space-y-10 text-slate-800 leading-relaxed font-serif text-justify">
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
              <section><h4 className="font-bold uppercase mb-2">4. Digital Signature</h4><p>By typing your name below and clicking 'Accept', you acknowledge that this acts as a legally binding electronic signature.</p></section>
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
                  className="h-16 w-full border-b-2 border-slate-900 text-2xl font-serif italic outline-none focus:border-blue-500 bg-transparent" 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-between items-center">
          <button 
            onClick={handleDownloadPDF}
            className="px-8 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm"
          >
            <span>📄</span> Download as PDF
          </button>
          <div className="space-x-4">
            <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
            <button 
              disabled={!signature || signature.length < 3} 
              onClick={onSign} 
              className="px-12 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50 shadow-xl shadow-blue-500/20"
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
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
    <div className="relative bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
      <div className="bg-blue-700 p-8 md:p-10 text-white relative shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2">NextStep Registry Portal</h2>
            <p className="text-blue-100 text-sm">Please complete the official Google Form below to initiate your clinical pathway.</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition p-3 rounded-full hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row">
        <div className="flex-1 h-full bg-slate-50">
          <iframe src={GOOGLE_FORM_VIEW_LINK} className="w-full h-full border-none" title="Registration Form">Loading…</iframe>
        </div>
        <div className="lg:w-80 border-l border-slate-100 bg-white p-8 flex flex-col shrink-0">
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Onboarding Progress</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</div><span className="text-sm font-bold text-slate-800">Submit Google Form</span></div>
              <div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full ${agreementSigned ? 'bg-green-600' : 'bg-slate-200'} text-white text-[10px] flex items-center justify-center font-bold`}>2</div><span className={`text-sm font-bold ${agreementSigned ? 'text-green-600' : 'text-slate-400'}`}>Sign E-Agreement</span></div>
            </div>
          </div>
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Status: Live Registry</p>
              <p className="text-xs text-blue-900 leading-relaxed">Once you've submitted the form, proceed to the Electronic Agreement.</p>
            </div>
            <button onClick={onShowAgreement} className={`w-full py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 ${agreementSigned ? 'bg-green-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
              {agreementSigned ? '✓ Agreement Signed' : '📝 Step 2: Sign Agreement'}
            </button>
            <button onClick={onWhatsApp} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition text-sm">💬 Support on WhatsApp</button>
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
  <div className="animate-in fade-in duration-500 pb-24">
    <div className="relative h-[350px] md:h-[450px] w-full">
      <img src={country.image} alt={country.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
      <div className="absolute bottom-12 left-0 w-full px-4 max-w-7xl mx-auto">
        <button onClick={onBack} className="text-white/80 hover:text-white mb-6 text-sm font-medium transition">← Back to Destintations</button>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white">{country.name}</h1>
          <StatusBadge status={country.status} />
        </div>
        <p className="text-xl text-slate-200 max-w-2xl">{country.statusNote}</p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center"><span className="mr-3">⚕️</span> Professional Pathway & Status</h2>
            <div className="p-5 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl mb-8"><p className="text-blue-900 font-bold mb-1">Status Overview:</p><p className="text-blue-800 text-lg">{country.jobInsights}</p></div>
            <div className="grid sm:grid-cols-2 gap-4">
              {country.benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center p-4 bg-slate-50 rounded-xl text-slate-700 font-medium border border-slate-100"><span className="mr-3 text-blue-600">✔</span> {benefit}</div>
              ))}
            </div>
          </section>
          <section className="bg-slate-900 text-white p-8 md:p-12 rounded-[40px] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-serif font-bold mb-8">Regional Insights 2025</h2>
              {isSearching ? <div className="space-y-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-4 bg-white/10 rounded w-full"></div></div> : searchData ? (
                <div className="space-y-8">
                  <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-line">{searchData.text}</p>
                  {searchData.sources.length > 0 && (
                    <div className="pt-8 border-t border-white/10">
                      <div className="flex flex-wrap gap-3">
                        {searchData.sources.map((source, idx) => (
                          <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-blue-400 hover:bg-white/10 transition">{source.title} ↗</a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : <p className="text-slate-500 italic">Insights currently unavailable.</p>}
            </div>
          </section>
        </div>
        <div className="space-y-8">
          <div className="bg-slate-950 rounded-3xl p-8 text-white"><h3 className="text-xl font-bold mb-6">Financial Insights</h3><div className="space-y-6 text-sm"><div><p className="text-slate-400 uppercase tracking-widest font-bold mb-1">Accommodation</p><p className="text-lg font-semibold">{country.livingCosts.rent}</p></div><div className="pt-6 border-t border-white/10"><p className="text-blue-400 uppercase tracking-widest font-bold mb-1">Est. Total Monthly</p><p className="text-2xl font-bold">{country.livingCosts.total}</p></div></div></div>
          <div className="bg-blue-700 rounded-3xl p-8 text-white"><h3 className="text-xl font-bold mb-4">Education Hubs</h3><ul className="text-sm space-y-3 mb-8">{country.universityRankings.map((u, i) => (<li key={i} className="flex items-center"><span className="mr-2">🎓</span> {u}</li>))}</ul><button onClick={onApply} className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl shadow-xl">Apply for Registration</button></div>
        </div>
      </div>
    </div>
  </div>
);

const countries: EnhancedCountry[] = [
  { name: 'Germany', code: 'DE', status: 'Winter Intake Open', statusNote: 'Winter Intake Open for All Medical Fields', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80', description: 'Primary destination for International Medical Graduates.', benefits: ['Paid Residency training', 'No Tuition for MD/PhDs', 'Structured Facharzt Pathway'], jobInsights: 'WINTER INTAKE 2025/26 IS FULLY OPEN.', universityRankings: ['Heidelberg University', 'Charité Berlin'], livingCosts: { rent: '€600 - €950', general: '€350 - €450', total: '€950 - €1,400/mo' }, jobs: [] },
  { name: 'Sweden', code: 'SE', status: 'Open', statusNote: 'Application Are Open', image: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=1200&q=80', description: 'Direct clinical pathways for IMGs and nurses.', benefits: ['Family friendly', 'No Assessment Fee (Limited Time)'], jobInsights: 'APPLICATIONS ARE OPEN.', universityRankings: ['Karolinska Institute'], livingCosts: { rent: 'SEK 6,000 - 9,500', general: 'SEK 3,500 - 5,000', total: 'SEK 9,500 - 14,500/mo' }, jobs: [] },
  { name: 'Italy', code: 'IT', status: 'Winter Intake Open', statusNote: 'Winter Intake for Master Open Now', image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80', description: 'Affordable medical specialization.', benefits: ['Low tuition fees', 'Doctors & Paramedics accepted'], jobInsights: 'WINTER INTAKE OPEN.', universityRankings: ['Sapienza University'], livingCosts: { rent: '€550 - €900', general: '€300 - €500', total: '€850 - €1,400/mo' }, jobs: [] },
  { name: 'Denmark', code: 'DK', status: 'On Hold', statusNote: 'Currently on Hold for Doctor and Nurse', image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', description: 'High-standard healthcare.', benefits: ['Work-life balance'], jobInsights: 'CURRENTLY ON HOLD.', universityRankings: ['Copenhagen University'], livingCosts: { rent: 'DKK 5,500 - 8,500', general: 'DKK 3,500 - 4,500', total: 'DKK 9,000 - 13,000/mo' }, jobs: [] },
  { name: 'Canada', code: 'CA', status: 'Study Only', statusNote: 'Only Study Related Consultancy', image: 'https://images.unsplash.com/photo-1503942142281-94af0ade523e?auto=format&fit=crop&w=1200&q=80', description: 'Premier medical education.', benefits: ['World-recognized degrees'], jobInsights: 'STUDY ONLY.', universityRankings: ['University of Toronto'], livingCosts: { rent: 'CAD 1,300 - 2,200', general: 'CAD 700 - 1,100', total: 'CAD 2,000 - 3,300/mo' }, jobs: [] }
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isPromoPopupOpen && <PromotionalPopup onClose={() => setIsPromoPopupOpen(false)} onApply={() => { setIsPromoPopupOpen(false); setIsApplyModalOpen(true); }} onWhatsApp={openWhatsApp} />}
      {isApplyModalOpen && <ApplyModal onClose={() => setIsApplyModalOpen(false)} onShowAgreement={() => setShowAgreement(true)} agreementSigned={agreementSigned} onWhatsApp={openWhatsApp} />}
      {showAgreement && <AgreementView onClose={() => setShowAgreement(false)} signature={applicantSignature} onSignatureChange={setApplicantSignature} onSign={() => { setAgreementSigned(true); setShowAgreement(false); }} />}
      
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 h-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <button onClick={() => setSelectedCountry(null)} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
            <span className="text-2xl font-serif font-bold text-slate-800">NextStep <span className="text-blue-700">Consultancy</span></span>
          </button>
          <div className="hidden md:flex space-x-8 font-medium text-slate-600">
            <button onClick={() => scrollToSection('destinations')} className="hover:text-blue-700">Destinations</button>
            <button onClick={() => scrollToSection('services')} className="hover:text-blue-700">Services</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-blue-700 transition">Contact</button>
          </div>
          <button onClick={() => setIsApplyModalOpen(true)} className="bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-500/20">Sign Up</button>
        </div>
      </nav>

      {selectedCountry ? <CountryDetail country={selectedCountry} onBack={() => setSelectedCountry(null)} onApply={() => setIsApplyModalOpen(true)} isSearching={isSearching} searchData={searchCache[selectedCountry.code]} /> : (
        <>
          <section className="relative py-32 bg-slate-950 text-white overflow-hidden text-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-4">
              <span className="inline-block py-1 px-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-8 border border-blue-500/20 uppercase tracking-widest">Elite Foreign Career Partners</span>
              <h1 className="text-6xl md:text-9xl font-serif font-bold mb-10 text-white">Your Career <br /><span className="text-blue-500">Without Limits.</span></h1>
              <p className="text-2xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed">Peshawar's leading professional consultancy. High-impact pathways to Germany, Sweden, Italy, and Canada.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-white text-slate-950 px-12 py-6 rounded-3xl font-bold text-xl shadow-2xl hover:scale-105 transition">Get Registered</button>
                <button onClick={openWhatsApp} className="bg-green-600 text-white px-12 py-6 rounded-3xl font-bold text-xl flex items-center justify-center gap-2 hover:scale-105 transition">💬 WhatsApp Hub</button>
              </div>
            </div>
          </section>
          <section id="destinations" className="py-24 max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-serif font-bold text-center mb-16">Core Pathways</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
              {countries.map(c => (
                <div key={c.code} onClick={() => setSelectedCountry(c)} className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition border border-slate-100 group cursor-pointer flex flex-col">
                  <div className="h-56 relative overflow-hidden"><img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" /><div className="absolute top-5 left-5"><StatusBadge status={c.status} /></div></div>
                  <div className="p-8"><h3 className="text-2xl font-bold mb-3">{c.name}</h3><p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-6">{c.statusNote}</p><span className="text-blue-700 font-bold text-xs uppercase tracking-wider group-hover:translate-x-2 transition inline-block">Explore →</span></div>
                </div>
              ))}
            </div>
          </section>
          <section id="services" className="py-24 bg-white"><div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center"><div><h2 className="text-5xl font-serif font-bold mb-10">Strategic Career Support</h2><div className="grid gap-8">{services.map((s, i) => (<div key={i} className="p-8 bg-slate-50 rounded-[32px] flex items-center hover:bg-blue-50 transition border border-transparent hover:border-blue-100 group"><div className="text-5xl mr-8 group-hover:rotate-12 transition">{s.icon}</div><div><h3 className="text-xl font-bold">{s.title}</h3><p className="text-slate-500">{s.description}</p></div></div>))}</div></div><div className="relative rounded-[64px] overflow-hidden shadow-3xl"><img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80" alt="Consultancy" className="w-full h-full object-cover" /><div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-xl p-10 rounded-[40px] border border-white/20"><p className="text-slate-900 font-bold text-xl mb-2">Direct Official Registry</p><p className="text-slate-600">Secure registration via our digital platform.</p></div></div></div></section>
        </>
      )}

      <footer id="contact" className="bg-slate-950 text-white pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-10"><div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl">N</div><span className="text-3xl font-serif font-bold">NextStep</span></div>
              <p className="text-slate-500 mb-10">Peshawar's elite foreign career partner since 2024.</p>
              <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-3xl bg-white/5 border border-white/10 group transition mx-auto md:mx-0 w-max"><div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl mr-5 group-hover:scale-110 transition">in</div><div><p className="font-bold">Engr. Muhammad Khalid</p><p className="text-xs text-slate-400">Founder</p></div></a>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-16">
              <div><h4 className="font-bold mb-10 text-xl">Direct Assistance</h4><ul className="space-y-4 text-slate-400"><li>📍 Hashtnagary Peshawar, KPK</li><li>📞 +92 311 9548076</li><li>✉️ softengr.ks@gmail.com</li></ul></div>
              <div><h4 className="font-bold mb-10 text-xl">Quick Links</h4><ul className="space-y-4 text-slate-400"><li><button onClick={() => setIsApplyModalOpen(true)}>Registration Portal</button></li><li><button onClick={openWhatsApp}>Consultation Hub</button></li></ul></div>
            </div>
            <div className="md:col-span-1 bg-blue-700/10 border border-blue-500/20 p-10 rounded-[40px]"><h4 className="font-bold mb-6 text-xl">Registry Hub</h4><p className="text-sm text-slate-400 mb-8">Submit your application directly.</p><button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl">Register Now</button></div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-slate-600 text-sm italic">© 2024 NextStep Consultancy Abroad.</div>
        </div>
      </footer>
      <button onClick={openWhatsApp} className="fixed bottom-10 right-10 w-20 h-20 bg-green-500 text-white rounded-[32px] flex items-center justify-center shadow-3xl hover:scale-110 transition z-50"><span className="text-4xl">💬</span></button>
    </div>
  );
};

export default App;