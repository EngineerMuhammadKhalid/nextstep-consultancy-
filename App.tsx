import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Country, Service, ChatMessage, Job } from './types';
import { GoogleGenAI } from "@google/genai";

// TO THE USER: To connect this form to your Google Sheet:
// 1. Open your Google Sheet.
// 2. Go to Extensions -> Apps Script.
// 3. Paste a doPost(e) script that appends rows.
// 4. Deploy as a Web App (set access to "Anyone").
// 5. Replace the placeholder URL below with your Deployment URL.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"; 

interface EnhancedCountry extends Country {
  status: 'Open' | 'On Hold' | 'Study Only' | 'Winter Intake Open';
  statusNote: string;
  officialOrgLink?: string;
  officialOrgName?: string;
}

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState('All Specialties');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  const linkedInUrl = "https://www.linkedin.com/in/engr-muhammad-khalid-675a61266/";

  useEffect(() => {
    const timer = setTimeout(() => setIsPromoPopupOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCountry]);

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

  const handleInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => { data[key] = value; });
    
    // Add context if submitted from a country page
    data.sourceCountry = selectedCountry?.name || 'Home Page';
    data.timestamp = new Date().toLocaleString();

    try {
      // 1. Send to Google Sheets (Conceptual - Requires the Script URL setup)
      // We use 'no-cors' for simple Apps Script triggers if not configured for full CORS
      if (GOOGLE_SCRIPT_URL !== "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec") {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      // 2. AI Assessment
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Assess this registration for NextStep Consultancy: 
                   Name: ${data.fullName}
                   Profession: ${data.profession}
                   Education: ${data.education}
                   Experience: ${data.experience} years
                   Goal: ${data.goal}
                   Destination: ${data.targetDestination}.
                   Provide a professional, specific 2-sentence encouraging recommendation for their specific pathway.`,
        config: {
          systemInstruction: "You are an elite career consultant at NextStep Consultancy. Be professional, direct, and highly encouraging. Mention their target country."
        }
      });
      setAiRecommendation(response.text || "Your profile has been logged for manual review.");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      setAiRecommendation("Profile logged. A consultant will contact you on WhatsApp with a full evaluation.");
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

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

  const PromotionalPopup = () => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsPromoPopupOpen(false)}></div>
      <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-br from-red-600 to-blue-800 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Urgent Announcement</span>
          <h2 className="text-3xl font-serif font-bold leading-tight">Winter Intake & <br />Exclusive Offers 2026</h2>
          <button onClick={() => setIsPromoPopupOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition">✕</button>
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
              onClick={() => { setIsPromoPopupOpen(false); setIsApplyModalOpen(true); }}
              className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl"
            >
              Sign Up Now
            </button>
            <button 
              onClick={openWhatsApp}
              className="flex-1 bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              💬 WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ApplyModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isLoading && setIsApplyModalOpen(false)}></div>
      <div className="relative bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
        <div className="bg-blue-700 p-10 text-white relative shrink-0">
          <h2 className="text-3xl font-serif font-bold mb-2">Registration & Assessment</h2>
          <p className="text-blue-100 text-sm">Join NextStep Consultancy for your global career transition.</p>
          <button onClick={() => { setIsApplyModalOpen(false); setIsSubmitted(false); setAiRecommendation(null); }} className="absolute top-8 right-8 text-white/50 hover:text-white transition p-3 rounded-full hover:bg-white/10">✕</button>
        </div>
        <div className="p-10 overflow-y-auto">
          {isSubmitted ? (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">✓</div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Registration Successful!</h3>
              <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl mb-10 max-w-2xl mx-auto">
                <p className="text-xs text-blue-700 uppercase font-bold tracking-widest mb-3">AI Expert Evaluation</p>
                <p className="text-slate-800 text-lg leading-relaxed font-medium">"{aiRecommendation}"</p>
              </div>
              <p className="text-slate-600 mb-8">Data synced to our master registry. Check your WhatsApp for a follow-up message.</p>
              <button onClick={() => { setIsApplyModalOpen(false); setIsSubmitted(false); }} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold">Return to Dashboard</button>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mr-4 text-sm font-bold">01</span>
                  Personal Details
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
                    <input name="fullName" required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500 transition-all focus:bg-white focus:shadow-lg" placeholder="e.g. Dr. Ahmed Ali" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
                    <input name="email" required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500 transition-all focus:bg-white focus:shadow-lg" placeholder="ahmed@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">WhatsApp Number</label>
                    <input name="whatsapp" required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500 transition-all focus:bg-white focus:shadow-lg" placeholder="+92 311 9548076" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mr-4 text-sm font-bold">02</span>
                  Professional Profile
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Profession</label>
                    <select name="profession" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500 appearance-none">
                      <option value="">Select Role</option>
                      <option value="Doctor">MBBS / Doctor</option>
                      <option value="Dentist">BDS / Dentist</option>
                      <option value="Nurse">RN / Nurse</option>
                      <option value="Paramedic">Paramedic / Allied Health</option>
                      <option value="Student">Current Student</option>
                      <option value="Other">Other Professional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Qualification</label>
                    <input name="education" required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500" placeholder="e.g. MBBS, MSc" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Experience (Years)</label>
                    <input name="experience" required type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Current City</label>
                    <input name="city" required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500" placeholder="Peshawar" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mr-4 text-sm font-bold">03</span>
                  Career Intentions
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Target Destination</label>
                    <select name="targetDestination" required defaultValue={selectedCountry?.name || ""} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500">
                      <option value="">Select Country</option>
                      <option value="Germany">Germany</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Italy">Italy</option>
                      <option value="Canada">Canada</option>
                      <option value="Denmark">Denmark</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Primary Objective</label>
                    <select name="goal" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500">
                      <option value="">Objective</option>
                      <option value="Residency">Clinical Residency</option>
                      <option value="Masters">Masters (Study)</option>
                      <option value="PhD">PhD / Research</option>
                      <option value="Job">Direct Job Placement</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Notes / Resume Link</label>
                    <input name="notes" type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-blue-500" placeholder="Optional" />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white font-bold py-6 rounded-3xl hover:bg-blue-800 transition-all shadow-2xl shadow-blue-500/30 text-xl disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? "Syncing to Global Registry & Running AI Review..." : "Confirm My Registration"}
                </button>
                <p className="text-center text-slate-400 text-xs mt-6">By signing up, you agree to receive career assessment details via WhatsApp/Email from NextStep Consultancy.</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  const CountryDetail = ({ country }: { country: EnhancedCountry }) => {
    const specialties = useMemo(() => {
      const set = new Set(country.jobs.map(j => j.specialty));
      return ['All Specialties', ...Array.from(set)];
    }, [country.jobs]);

    const filteredJobs = country.jobs.filter(job => 
      specialtyFilter === 'All Specialties' || job.specialty === specialtyFilter
    );

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
                {country.status === 'On Hold' && (
                  <div className="absolute inset-0 bg-slate-50/20 backdrop-blur-[2px] flex items-center justify-center z-10 p-8 text-center">
                    <div className="bg-white border-2 border-red-500 p-8 rounded-3xl shadow-2xl max-w-sm">
                      <p className="text-red-600 font-bold mb-2 uppercase tracking-widest text-xs">Applications Paused</p>
                      <p className="text-slate-900 font-bold text-lg mb-4">{country.statusNote}</p>
                      <p className="text-slate-600 text-sm">We are not currently accepting applications for {country.name}. Please explore Germany or Sweden.</p>
                    </div>
                  </div>
                )}
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

              <section>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-8">Admission & Recognition Connect</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-center">
                    <p className="font-bold text-blue-700 mb-2">DAAD Portal</p>
                    <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-tighter">Academic Hub</p>
                    <a href="https://www.daad.de/en/" target="_blank" className="bg-blue-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl block hover:bg-blue-700 transition">Visit Website</a>
                  </div>
                  {country.officialOrgLink && (
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-center ring-2 ring-blue-500/20">
                      <p className="font-bold text-blue-700 mb-2 truncate" title={country.officialOrgName}>{country.officialOrgName}</p>
                      <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-tighter">Official Assessment</p>
                      <a href={country.officialOrgLink} target="_blank" className="bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl block hover:bg-slate-800 transition">Go to Org</a>
                    </div>
                  )}
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm text-center">
                    <p className="font-bold text-blue-700 mb-2">Expertio Connect</p>
                    <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-tighter">Expert Support</p>
                    <button onClick={openWhatsApp} className="bg-green-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl block w-full">Chat Expert</button>
                  </div>
                </div>
              </section>

              {country.jobs.length > 0 && (
                <section id="jobs">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-serif font-bold text-slate-900">Current Vacancies</h2>
                    <select value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)} className="bg-white border rounded-lg px-4 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-blue-500/20">
                      {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition">{job.title}</h3>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{job.experienceLevel}</span>
                            </div>
                            <p className="text-slate-600 font-medium">{job.hospital}</p>
                            <div className="flex gap-4 mt-3 text-sm text-slate-500">
                              <span>🏥 {job.specialty}</span>
                              <span>💰 {job.salaryRange}</span>
                            </div>
                          </div>
                          <button onClick={() => setIsApplyModalOpen(true)} className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-500/20">Sign Up</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
            
            <div className="space-y-8">
              <div className="bg-slate-950 rounded-3xl p-8 text-white">
                <h3 className="text-xl font-bold mb-6">Relocation Financials</h3>
                <div className="space-y-6">
                  <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">Accommodation</p><p className="text-xl font-semibold">{country.livingCosts.rent}</p></div>
                  <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-widest font-bold">General Expenses</p><p className="text-xl font-semibold">{country.livingCosts.general}</p></div>
                  <div className="pt-6 border-t border-white/10"><p className="text-blue-400 text-xs mb-1 uppercase tracking-widest font-bold">Est. Monthly Total</p><p className="text-2xl font-bold">{country.livingCosts.total}</p></div>
                </div>
              </div>
              <div className="bg-blue-700 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition duration-500"></div>
                <h3 className="text-xl font-bold mb-4">Study Admissions</h3>
                <p className="text-sm text-blue-100 mb-6">Access top university faculties and international scholarships.</p>
                <ul className="text-sm space-y-3 mb-8">
                  {country.universityRankings.map((u, i) => (
                    <li key={i} className="flex items-center"><span className="mr-2 text-blue-300">🎓</span> {u}</li>
                  ))}
                </ul>
                <button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-white text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-50 transition shadow-xl">Apply for Admission</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isPromoPopupOpen && <PromotionalPopup />}
      {isApplyModalOpen && <ApplyModal />}
      
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <button onClick={() => setSelectedCountry(null)} className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
            <span className="text-2xl font-serif font-bold tracking-tight text-slate-800">NextStep <span className="text-blue-700">Consultancy</span></span>
          </button>
          <div className="hidden md:flex space-x-8 font-medium text-slate-600">
            <button onClick={() => scrollToSection('destinations')} className="hover:text-blue-700 transition">Destinations</button>
            <button onClick={() => scrollToSection('services')} className="hover:text-blue-700 transition">Services</button>
            <button onClick={() => scrollToSection('contact')} className="hover:text-blue-700 transition">Contact</button>
          </div>
          <button onClick={() => setIsApplyModalOpen(true)} className="bg-blue-700 text-white px-8 py-2.5 rounded-full font-semibold hover:bg-blue-800 transition shadow-lg shadow-blue-500/20">Sign Up</button>
        </div>
      </nav>

      {selectedCountry ? <CountryDetail country={selectedCountry} /> : (
        <>
          <section className="relative py-32 bg-slate-950 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <span className="inline-block py-1 px-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold mb-8 border border-blue-500/20 uppercase tracking-widest">Elite Global Specialization Experts</span>
              <h1 className="text-6xl md:text-9xl font-serif font-bold mb-10 leading-none tracking-tighter text-balance">Global Careers <br /><span className="text-blue-500">Starts Here.</span></h1>
              <p className="text-2xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed">Peshawar's leading professional consultancy. High-impact pathways to Germany, Sweden, Italy, and Canada for professionals and medical experts.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-white text-slate-950 px-12 py-6 rounded-3xl font-bold text-xl hover:bg-blue-50 transition-all shadow-2xl hover:scale-105 active:scale-95">Sign Up Now</button>
                <button onClick={openWhatsApp} className="bg-green-600 text-white px-12 py-6 rounded-3xl font-bold text-xl hover:bg-green-700 transition-all flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95">💬 WhatsApp Expert</button>
              </div>
            </div>
          </section>

          <section id="destinations" className="py-24">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Core Destinations</h2>
                <p className="text-slate-600">Explore real-time application status for our premium career hubs.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
                {countries.map((country) => (
                  <div key={country.code} onClick={() => setSelectedCountry(country)} className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 group cursor-pointer flex flex-col">
                    <div className="h-56 relative overflow-hidden">
                      <img src={country.image} alt={country.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                      <div className="absolute top-5 left-5">
                        <StatusBadge status={country.status} />
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-700 transition">{country.name}</h3>
                      <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-6">{country.statusNote}</p>
                      <div className="mt-auto">
                        <span className="text-blue-700 font-bold text-xs uppercase tracking-wider group-hover:translate-x-2 transition-transform inline-block">Explore Pathway →</span>
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
                <h2 className="text-5xl font-serif font-bold text-slate-900 mb-10 leading-tight">Strategic Professional <br /> Coaching</h2>
                <p className="text-xl text-slate-600 mb-12 leading-relaxed">From Anabin degree validation and Approbation training in Germany to specialized admissions in Canada and Italy, we provide total end-to-end support.</p>
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
                    <p className="text-slate-900 font-bold text-xl mb-2">Admission & Registration Access</p>
                    <p className="text-slate-600 leading-relaxed">Direct links to official professional boards and international portals through our expert panel.</p>
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
                <ul className="space-y-5 text-slate-400">
                  <li><a href="https://www.daad.de/en/" target="_blank" className="hover:text-white transition">DAAD Admissions Portal</a></li>
                  <li><button onClick={() => { const s = countries.find(c => c.code === 'SE'); if(s) setSelectedCountry(s); }} className="hover:text-white transition">Sweden Socialstyrelsen</button></li>
                  <li><button onClick={() => { const g = countries.find(c => c.code === 'DE'); if(g) setSelectedCountry(g); }} className="hover:text-white transition">Germany Winter Intake</button></li>
                  <li><button onClick={openWhatsApp} className="hover:text-white transition">Expert Consult Chat</button></li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-blue-700/10 border border-blue-500/20 p-10 rounded-[40px]">
                <h4 className="font-bold mb-6 text-xl">Global Registry</h4>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">Partnered with European and North American boards for seamless degree and professional registration processing.</p>
                <button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl hover:bg-blue-800 transition-all shadow-xl shadow-blue-500/20">
                  Sign Up Now
                </button>
              </div>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-slate-600 text-sm">
            © 2024 NextStep Consultancy Abroad. Professional Foreign Career & Study Consulting.
          </div>
        </div>
      </footer>

      <button onClick={openWhatsApp} className="fixed bottom-10 right-10 w-20 h-20 bg-green-500 text-white rounded-[32px] flex items-center justify-center shadow-3xl hover:scale-110 transition-transform z-50 group">
        <span className="text-4xl group-hover:rotate-12 transition">💬</span>
      </button>
    </div>
  );
};

export default App;