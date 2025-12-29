import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Country, Service, ChatMessage, Job } from './types';
import { GoogleGenAI } from "@google/genai";

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeRj8hN-x5-Wv7V7z8Z7-W-Y-0-0-0/viewform?embedded=true"; // Placeholder for the actual public view link derived from ID
// Since I only have the ID 1daGS4bNnDPDsQSQUKSDm6cjvNVjZHC2gFcHBdHPFoDQ, I will use the standard view link format
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
          <button 
            onClick={onApply}
            className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl"
          >
            Start My Application
          </button>
          <button 
            onClick={onWhatsApp}
            className="flex-1 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            💬 WhatsApp
          </button>
        </div>
      </div>
    </div>
  </div>
);

const countries: EnhancedCountry[] = [
  { 
    name: 'Germany', 
    code: 'DE', 
    status: 'Winter Intake Open',
    statusNote: 'Winter Intake Open for All Medical Fields',
    officialOrgName: 'Approbation Authorities (LPA)',
    officialOrgLink: 'https://www.anerkennung-in-deutschland.de/en/interest/m/doctor',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80', 
    description: 'The primary destination for International Medical Graduates (IMGs) seeking Facharzt (Specialization).', 
    benefits: ['Paid Residency training', 'No Tuition for MD/PhDs', 'Structured Facharzt Pathway'],
    jobInsights: 'WINTER INTAKE 2025/26 IS FULLY OPEN. Specialized support for Approbation, FSP, and KP exams.',
    universityRankings: ['Heidelberg University', 'Charité Berlin', 'LMU Munich'],
    livingCosts: {
      rent: '€600 - €950',
      general: '€350 - €450',
      total: '€950 - €1,400/mo'
    },
    jobs: [
      { id: 'DE-1', title: 'Assistenzarzt (Internal Medicine)', hospital: 'Vivantes Klinikum Berlin', specialty: 'Medical Residency', experienceLevel: 'Entry', salaryRange: '€58,000 - €65,000' },
      { id: 'DE-2', title: 'Facharzt (Anesthesiology)', hospital: 'University Hospital Heidelberg', specialty: 'Specialist', experienceLevel: 'Senior', salaryRange: '€85,000 - €105,000' },
    ]
  },
  { 
    name: 'Sweden', 
    code: 'SE', 
    status: 'Open',
    statusNote: 'Application Are Open',
    officialOrgName: 'Socialstyrelsen (National Board of Health)',
    officialOrgLink: 'https://legitimation.socialstyrelsen.se/en/licence-from-outside-eu-and-eea/doctor-of-medicine/',
    image: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?auto=format&fit=crop&w=1200&q=80', 
    description: 'Direct clinical pathways for IMGs and nurses. Egalitarian and high-quality lifestyle.', 
    benefits: ['Democratic management', 'Family friendly', 'No Assessment Fee (Limited Time)'],
    jobInsights: 'APPLICATIONS ARE OPEN. Use our streamlined connection to Socialstyrelsen for degree verification.',
    universityRankings: ['Karolinska Institute', 'Uppsala University'],
    livingCosts: {
      rent: 'SEK 6,000 - 9,500',
      general: 'SEK 3,500 - 5,000',
      total: 'SEK 9,500 - 14,500/mo'
    },
    jobs: [
      { id: 'SE-1', title: 'Specialist Physician', hospital: 'Sahlgrenska University Hospital', specialty: 'Specialist', experienceLevel: 'Senior', salaryRange: 'SEK 72,000 - 98,000/mo' },
    ]
  },
  { 
    name: 'Italy', 
    code: 'IT', 
    status: 'Winter Intake Open',
    statusNote: 'Winter Intake for Master Open Now',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80', 
    description: 'Affordable medical specialization and paramedic master\'s programs.', 
    benefits: ['Low tuition fees', 'Doctors & Paramedics accepted', 'Clinical Research focus'],
    jobInsights: 'WINTER INTAKE OPEN. Special pathways for Doctors and Paramedics (Physiotherapists, Nursing, Lab Techs).',
    universityRankings: ['Sapienza University', 'University of Padua'],
    livingCosts: {
      rent: '€550 - €900',
      general: '€300 - €500',
      total: '€850 - €1,400/mo'
    },
    jobs: [
      { id: 'IT-1', title: 'Clinical Fellow', hospital: 'Milan Institute of Cardiology', specialty: 'Specialist', experienceLevel: 'Mid', salaryRange: '€45,000 - €60,000' },
    ]
  },
  { 
    name: 'Denmark', 
    code: 'DK', 
    status: 'On Hold',
    statusNote: 'Currently on Hold for Doctor and Nurse',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', 
    description: 'High-standard healthcare with temporary application adjustments.', 
    benefits: ['Work-life balance', 'Innovative hospitals', 'Social security'],
    jobInsights: 'CURRENTLY ON HOLD. We are not processing new Doctor or Nursing licenses for Denmark at this moment. Please check Germany or Sweden.',
    universityRankings: ['Copenhagen University', 'Aarhus University'],
    livingCosts: {
      rent: 'DKK 5,500 - 8,500',
      general: 'DKK 3,500 - 4,500',
      total: 'DKK 9,000 - 13,000/mo'
    },
    jobs: []
  },
  { 
    name: 'Canada', 
    code: 'CA', 
    status: 'Study Only',
    statusNote: 'Only Study Related Consultancy',
    image: 'https://images.unsplash.com/photo-1503942142281-94af0ade523e?auto=format&fit=crop&w=1200&q=80', 
    description: 'Premier medical education for international students.', 
    benefits: ['World-recognized degrees', 'MPH & MSc programs', 'Research scholarships'],
    jobInsights: 'STUDY ONLY. We provide consultation for Medical Masters, PhDs, and Health Administration degrees at top universities like UofT and McGill.',
    universityRankings: ['University of Toronto', 'McGill University', 'University of British Columbia'],
    livingCosts: {
      rent: 'CAD 1,300 - 2,200',
      general: 'CAD 700 - 1,100',
      total: 'CAD 2,000 - 3,300/mo'
    },
    jobs: []
  }
];

const services: Service[] = [
  { title: 'Residency & PG Support', description: 'Complete guidance for Assistenzarzt (Germany) and Specialization matching.', icon: '⚕️' },
  { title: 'Medical Licensing', description: 'Expert assistance with Socialstyrelsen (Sweden) and Approbation (Germany).', icon: '📜' },
  { title: 'Scholarships & DAAD', description: 'English-taught medical Master\'s and PhD programs with full scholarship support.', icon: '🎓' },
];

const App: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<EnhancedCountry | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPromoPopupOpen, setIsPromoPopupOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties');
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [applicantSignature, setApplicantSignature] = useState('');
  const [tempFullName, setTempFullName] = useState('');
  
  const [searchCache, setSearchCache] = useState<Record<string, CachedSearchData>>({});

  const linkedInUrl = "https://www.linkedin.com/in/engr-muhammad-khalid-675a61266/";

  useEffect(() => {
    const timer = setTimeout(() => setIsPromoPopupOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (selectedCountry) {
      fetchCountryInsights(selectedCountry);
    }
  }, [selectedCountry]);

  const fetchCountryInsights = async (country: EnhancedCountry) => {
    if (searchCache[country.code]) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `Provide a detailed overview of the current healthcare system nuances and economic status for foreign medical professionals looking to relocate to ${country.name} in 2025. Focus on practical insights for residency and licensing.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      const text = response.text || "Information currently being updated by our analysts.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.filter((c: any) => c.web).map((c: any) => ({ uri: c.web.uri, title: c.web.title || c.web.uri }));
      const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
      setSearchCache(prev => ({ ...prev, [country.code]: { text, sources: uniqueSources } }));
    } catch (error) { console.error("Search grounding error:", error); } 
    finally { setIsSearching(false); }
  };

  const scrollToSection = (id: string) => {
    if (selectedCountry) setSelectedCountry(null);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 10);
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/923119548076', '_blank');
  };

  const AgreementView = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 bg-slate-50 border-b border-slate-200 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">Electronic Consultancy Agreement</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">NextStep Consultancy & Applicant</p>
          </div>
          <button onClick={() => setShowAgreement(false)} className="p-3 hover:bg-slate-200 rounded-full transition text-slate-500">✕</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-12 bg-white">
          <div className="max-w-3xl mx-auto space-y-10 text-slate-800 leading-relaxed font-serif text-justify">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold underline">ELECTRONIC CONSULTANCY AGREEMENT</h1>
              <p className="font-sans text-sm font-bold text-slate-600">(Medical Job / Residency / Study Abroad)</p>
              <p className="font-sans text-sm">This Electronic Consultancy Agreement (“Agreement”) is entered into electronically on <span className="underline font-bold">{new Date().toLocaleDateString()}</span></p>
            </div>

            <div className="space-y-6">
              <h3 className="font-bold text-xl uppercase border-b pb-2">Parties</h3>
              <p><strong>Service Provider:</strong> Mr. Muhammad Khalid, Overseas Medical Job / Residency / Study Consultancy Provider (hereinafter referred to as the “Service Provider”)</p>
              <p><strong>AND</strong></p>
              <p><strong>Applicant:</strong> <span className="underline font-bold">{applicantSignature || '____________________'}</span> (hereinafter referred to as the “Applicant”)</p>
            </div>

            <div className="space-y-8 font-sans text-sm leading-relaxed">
              <section>
                <h4 className="font-bold uppercase mb-2">1. PURPOSE</h4>
                <p>The Applicant appoints the Service Provider to provide professional consultancy services for visa guidance related to medical job, residency, or study abroad. The Service Provider agrees to provide consultancy only, subject to the terms herein.</p>
              </section>

              <section>
                <h4 className="font-bold uppercase mb-2">2. NATURE OF SERVICES</h4>
                <p>The Service Provider shall provide guidance, procedural assistance, and consultancy for visa and assessment processes. The Service Provider does not guarantee visa approval, job placement, residency confirmation, or admission. Final decisions rest solely with embassies, immigration authorities, or relevant institutions.</p>
              </section>

              <section>
                <h4 className="font-bold uppercase mb-2">3. CONSULTANCY FEES & PAYMENT TERMS</h4>
                <p>The total consultancy fee shall be mutually agreed. 30% of the consultancy fee shall be paid as advance at the start of the application. The remaining 70% shall be paid in three (3) installments as agreed. All consultancy payments are non-refundable under all circumstances.</p>
              </section>

              <section>
                <h4 className="font-bold uppercase mb-2">4. GOVERNMENT, EMBASSY & THIRD-PARTY FEES</h4>
                <p>All embassy fees, assessment fees, medical fees, courier fees, or third-party charges shall not be paid to the Service Provider. Such fees shall be paid directly by the Applicant via card, bank transfer, or cash.</p>
              </section>

              <section>
                <h4 className="font-bold uppercase mb-2">7. VISA REJECTION & LIMITATION OF LIABILITY</h4>
                <p>The Service Provider shall not be liable for rejection, delay, or refusal caused by embassy policy, government changes, security checks, or incomplete documentation. Consultancy fees remain payable and non-refundable.</p>
              </section>

              <section>
                <h4 className="font-bold uppercase mb-2">13. ELECTRONIC ACCEPTANCE & SIGNATURE</h4>
                <p>This Agreement is executed electronically. Acceptance via e-signature, email confirmation, WhatsApp message, checkbox selection, or digital signing platform shall constitute legal and binding consent.</p>
              </section>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-12 border-t font-sans">
              <div className="space-y-4">
                <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Service Provider</p>
                <div className="h-16 flex items-end border-b-2 border-slate-900 pb-2 italic text-2xl font-serif">M. Khalid</div>
                <p className="text-sm font-bold">Mr. Muhammad Khalid</p>
                <p className="text-xs text-slate-400">Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="space-y-4">
                <p className="font-bold text-xs uppercase tracking-widest text-slate-500">Applicant Signature</p>
                <input 
                  value={applicantSignature}
                  onChange={(e) => setApplicantSignature(e.target.value)}
                  placeholder="Type Full Legal Name"
                  className="h-16 w-full border-b-2 border-slate-900 text-2xl font-serif italic outline-none focus:border-blue-500 bg-transparent"
                />
                <p className="text-xs text-slate-400">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200 shrink-0 text-right space-x-4">
          <button onClick={() => setShowAgreement(false)} className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
          <button 
            disabled={!applicantSignature || applicantSignature.length < 3}
            onClick={() => { setAgreementSigned(true); setShowAgreement(false); }}
            className="px-12 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50 shadow-xl shadow-blue-500/20"
          >
            Sign & Accept Agreement
          </button>
        </div>
      </div>
    </div>
  );

  const ApplyModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsApplyModalOpen(false)}></div>
      <div className="relative bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        <div className="bg-blue-700 p-8 md:p-10 text-white relative shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-2">NextStep Registry Portal</h2>
              <p className="text-blue-100 text-sm">Please complete the official Google Form below to initiate your clinical pathway.</p>
            </div>
            <button onClick={() => setIsApplyModalOpen(false)} className="text-white/50 hover:text-white transition p-3 rounded-full hover:bg-white/10">✕</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden relative flex flex-col lg:flex-row">
          {/* Main Google Form Embed */}
          <div className="flex-1 h-full bg-slate-50">
            <iframe 
              src={GOOGLE_FORM_VIEW_LINK}
              className="w-full h-full border-none"
              title="Registration Form"
            >
              Loading…
            </iframe>
          </div>

          {/* Sidebar for Next Steps */}
          <div className="lg:w-80 border-l border-slate-100 bg-white p-8 flex flex-col shrink-0">
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Onboarding Progress</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</div>
                  <span className="text-sm font-bold text-slate-800">Submit Google Form</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${agreementSigned ? 'bg-green-600' : 'bg-slate-200'} text-white text-[10px] flex items-center justify-center font-bold`}>2</div>
                  <span className={`text-sm font-bold ${agreementSigned ? 'text-green-600' : 'text-slate-400'}`}>Sign E-Agreement</span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Status: Live Registry</p>
                <p className="text-xs text-blue-900 leading-relaxed">Once you've submitted the form, proceed to the Electronic Agreement for legal confirmation.</p>
              </div>
              
              <button 
                onClick={() => setShowAgreement(true)}
                className={`w-full py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 ${agreementSigned ? 'bg-green-600 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
              >
                {agreementSigned ? '✓ Agreement Signed' : '📝 Step 2: Sign Agreement'}
              </button>

              <button 
                onClick={openWhatsApp}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition text-sm"
              >
                💬 Support on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

  const CountryDetail = ({ country }: { country: EnhancedCountry }) => {
    const searchData = searchCache[country.code];

    return (
      <div className="animate-in fade-in duration-500 pb-24">
        <div className="relative h-[350px] md:h-[450px] w-full">
          <img src={country.image} alt={country.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          <div className="absolute bottom-12 left-0 w-full px-4 max-w-7xl mx-auto">
            <button onClick={() => setSelectedCountry(null)} className="text-white/80 hover:text-white mb-6 text-sm font-medium transition">← Back to Destintations</button>
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
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center">
                  <span className="mr-3">⚕️</span> Professional Pathway & Status
                </h2>
                <div className="p-5 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl mb-8">
                  <p className="text-blue-900 font-bold mb-1">Status Overview:</p>
                  <p className="text-blue-800 text-lg">{country.jobInsights}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {country.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center p-4 bg-slate-50 rounded-xl text-slate-700 font-medium border border-slate-100">
                      <span className="mr-3 text-blue-600">✔</span> {benefit}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 text-white p-8 md:p-12 rounded-[40px] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-serif font-bold mb-2">Regional Insights 2025</h2>
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Real-time Grounded AI Analysis</p>
                    </div>
                  </div>

                  {isSearching ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-full"></div>
                    </div>
                  ) : searchData ? (
                    <div className="space-y-8">
                      <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-line">{searchData.text}</p>
                      {searchData.sources.length > 0 && (
                        <div className="pt-8 border-t border-white/10">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Grounded Sources</h4>
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
              <div className="bg-slate-950 rounded-3xl p-8 text-white">
                <h3 className="text-xl font-bold mb-6">Financial Insights</h3>
                <div className="space-y-6 text-sm">
                  <div><p className="text-slate-400 uppercase tracking-widest font-bold mb-1">Accommodation</p><p className="text-lg font-semibold">{country.livingCosts.rent}</p></div>
                  <div className="pt-6 border-t border-white/10"><p className="text-blue-400 uppercase tracking-widest font-bold mb-1">Est. Total Monthly</p><p className="text-2xl font-bold">{country.livingCosts.total}</p></div>
                </div>
              </div>
              <div className="bg-blue-700 rounded-3xl p-8 text-white">
                <h3 className="text-xl font-bold mb-4">Education Hubs</h3>
                <ul className="text-sm space-y-3 mb-8">
                  {country.universityRankings.map((u, i) => (
                    <li key={i} className="flex items-center"><span className="mr-2">🎓</span> {u}</li>
                  ))}
                </ul>
                <button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl shadow-xl">Apply for Registration</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isPromoPopupOpen && (
        <PromotionalPopup 
          onClose={() => setIsPromoPopupOpen(false)} 
          onApply={() => { setIsPromoPopupOpen(false); setIsApplyModalOpen(true); }}
          onWhatsApp={openWhatsApp}
        />
      )}
      {isApplyModalOpen && <ApplyModal />}
      {showAgreement && <AgreementView />}
      
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

      {selectedCountry ? <CountryDetail country={selectedCountry} /> : (
        <>
          <section className="relative py-32 bg-slate-950 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <span className="inline-block py-1 px-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-8 border border-blue-500/20 uppercase tracking-widest">Elite Foreign Career Partners</span>
              <h1 className="text-6xl md:text-9xl font-serif font-bold mb-10 leading-none tracking-tighter text-white">Your Career <br /><span className="text-blue-500">Without Limits.</span></h1>
              <p className="text-2xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed">Peshawar's leading professional consultancy. High-impact pathways to Germany, Sweden, Italy, and Canada for healthcare and skilled professionals.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-white text-slate-950 px-12 py-6 rounded-3xl font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition">Get Registered</button>
                <button onClick={openWhatsApp} className="bg-green-600 text-white px-12 py-6 rounded-3xl font-bold text-xl flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition">💬 WhatsApp Consultant</button>
              </div>
            </div>
          </section>

          <section id="destinations" className="py-24">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Core Pathways</h2>
                <p className="text-slate-600">Select your destination for specialized clinical and study guidance.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
                {countries.map((country) => (
                  <div key={country.code} onClick={() => setSelectedCountry(country)} className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition border border-slate-100 group cursor-pointer flex flex-col">
                    <div className="h-56 relative overflow-hidden">
                      <img src={country.image} alt={country.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                      <div className="absolute top-5 left-5">
                        <StatusBadge status={country.status} />
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-700">{country.name}</h3>
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-6">{country.statusNote}</p>
                      <div className="mt-auto">
                        <span className="text-blue-700 font-bold text-xs uppercase tracking-wider group-hover:translate-x-2 transition inline-block">Explore Pathway →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="services" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-5xl font-serif font-bold text-slate-900 mb-10 leading-tight">Strategic Global <br /> Career Support</h2>
                <p className="text-xl text-slate-600 mb-12 leading-relaxed">From Anabin degree validation and Approbation training in Germany to specialized clinical licensing in Sweden, we provide end-to-end relocation expertise.</p>
                <div className="grid gap-8">
                  {services.map((s, idx) => (
                    <div key={idx} className="p-8 bg-slate-50 rounded-[32px] flex items-center hover:bg-blue-50 transition border border-transparent hover:border-blue-100 group">
                      <div className="text-5xl mr-8 group-hover:rotate-12 transition">{s.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-[64px] overflow-hidden shadow-3xl ring-1 ring-slate-100">
                <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80" alt="Consultancy Session" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-blue-900/10"></div>
                <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-xl p-10 rounded-[40px] border border-white/20">
                    <p className="text-slate-900 font-bold text-xl mb-2">Direct Official Registry</p>
                    <p className="text-slate-600 leading-relaxed">Secure registration via our digital platform, providing direct links to international professional boards.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <footer id="contact" className="bg-slate-950 text-white pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-10">
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl">N</div>
                <span className="text-3xl font-serif font-bold tracking-tight">NextStep <span className="text-blue-700">Consultancy</span></span>
              </div>
              <p className="text-slate-500 mb-10 leading-relaxed">Peshawar's elite foreign career partner. Leading professional registration and clinical study consultancy since 2024.</p>
              
              <div className="space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Head of Operations</h4>
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition group">
                  <div className="w-14 h-14 linkedin-bg rounded-2xl flex items-center justify-center text-white text-2xl mr-5 group-hover:scale-110 transition">in</div>
                  <div>
                    <p className="font-bold text-base">Engr. Muhammad Khalid</p>
                    <p className="text-sm text-slate-400">Founder & Tech Lead</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-16">
              <div>
                <h4 className="font-bold mb-10 text-xl">Direct Assistance</h4>
                <ul className="space-y-8">
                  <li className="flex items-start">
                    <span className="mr-5 text-blue-500 text-2xl">📍</span>
                    <span className="text-slate-400 leading-relaxed">Hashtnagary Peshawar,<br />KPK, Pakistan</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-5 text-blue-500 text-2xl">📞</span>
                    <span className="text-slate-400">+92 311 9548076</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-5 text-blue-500 text-2xl">✉️</span>
                    <div className="text-slate-400 text-sm space-y-1">
                      <p>softengr.ks@gmail.com</p>
                      <p>dev.engineerkhalid@gmail.com</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-10 text-xl">Quick Pathways</h4>
                <ul className="space-y-5 text-slate-400 text-sm">
                  <li><button onClick={() => setIsApplyModalOpen(true)} className="hover:text-white transition">Application Portal</button></li>
                  <li><button onClick={openWhatsApp} className="hover:text-white transition">Consultation Hub</button></li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-blue-700/10 border border-blue-500/20 p-10 rounded-[40px]">
                <h4 className="font-bold mb-6 text-xl">Registry Hub</h4>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">Submit your application via our integrated Google Form for direct professional review.</p>
                <button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-500/20">
                  Register Now
                </button>
              </div>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-slate-600 text-sm italic">
            © 2024 NextStep Consultancy Abroad. Regulated Career Guidance & Relocation Services.
          </div>
        </div>
      </footer>

      <button onClick={openWhatsApp} className="fixed bottom-10 right-10 w-20 h-20 bg-green-500 text-white rounded-[32px] flex items-center justify-center shadow-3xl hover:scale-110 transition-transform z-50">
        <span className="text-4xl">💬</span>
      </button>
    </div>
  );
};

export default App;