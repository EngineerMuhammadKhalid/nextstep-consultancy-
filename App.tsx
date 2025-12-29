import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Country, Service, ChatMessage, Job } from './types';
import { GoogleGenAI } from "@google/genai";

// Extended type for internal use to track statuses and specific organizational links
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
    image: 'https://images.unsplash.com/photo-1505751172107-573225a91719?auto=format&fit=crop&w=1200&q=80', 
    description: 'Premier medical education for international students.', 
    benefits: ['World-recognized degrees', 'MPH & MSc programs', 'Research scholarships'],
    jobInsights: 'STUDY ONLY. We provide consultation for Medical Masters, PhDs, and Health Administration degrees. Clinical job placements are not offered.',
    universityRankings: ['University of Toronto', 'McGill University'],
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
    const data = {
      name: formData.get('fullName'),
      profession: formData.get('profession'),
      goal: formData.get('goal'),
      targetCountry: selectedCountry?.name || 'Any Global Hub'
    };

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Assess this professional profile for NextStep Consultancy: 
                   Candidate Name: ${data.name}
                   Profession: ${data.profession}
                   Career Goal: ${data.goal}
                   Target Destination: ${data.targetCountry}.
                   Provide a 2-sentence encouraging expert recommendation for their pathway.`,
        config: {
          systemInstruction: "You are an elite career consultant at NextStep Consultancy. Be professional, direct, and highly encouraging."
        }
      });
      setAiRecommendation(response.text || "Our experts will review your details immediately.");
      setIsSubmitted(true);
    } catch (error) {
      console.error("AI Assessment error:", error);
      setAiRecommendation("Our consultants will provide a detailed evaluation shortly via WhatsApp.");
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
              Start My Application
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
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="bg-blue-700 p-8 text-white relative shrink-0">
          <h2 className="text-2xl font-serif font-bold mb-2">Profile Assessment</h2>
          <p className="text-blue-100 text-sm">Target: {selectedCountry?.name || 'Global Career'}</p>
          <button onClick={() => { setIsApplyModalOpen(false); setIsSubmitted(false); setAiRecommendation(null); }} className="absolute top-6 right-6 text-white/50 hover:text-white transition p-2 rounded-full hover:bg-white/10">✕</button>
        </div>
        <div className="p-8 overflow-y-auto">
          {isSubmitted ? (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚕️</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Registration Logged!</h3>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl mb-8">
                <p className="text-xs text-blue-700 uppercase font-bold tracking-widest mb-2">AI Consultant Recommendation</p>
                <p className="text-slate-700 leading-relaxed italic">"{aiRecommendation}"</p>
              </div>
              <p className="text-slate-600 text-sm">A human licensing expert will contact you via WhatsApp shortly to finalize your documents.</p>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mr-3 text-sm">01</span>
                  Professional Identity
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input name="fullName" required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-blue-500" placeholder="Full Name (per degree)" />
                  <input name="whatsapp" required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-blue-500" placeholder="WhatsApp Number" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center mr-3 text-sm">02</span>
                  Professional Goal
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <select name="profession" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-blue-500">
                    <option value="">Role</option>
                    <option value="MBBS">MBBS Doctor</option>
                    <option value="BDS">Dentist</option>
                    <option value="Paramedic">Paramedic / Allied Health</option>
                    <option value="Nurse">Registered Nurse</option>
                    <option value="Engineer">Engineer / IT Professional</option>
                  </select>
                  <select name="goal" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-blue-500">
                    <option value="">Objective</option>
                    <option value="Residency">Clinical Residency (Germany/Sweden)</option>
                    <option value="Masters">Masters / PhD Admissions</option>
                    <option value="JobSearch">Direct Employment / Job Search</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-blue-700 text-white font-bold py-5 rounded-2xl hover:bg-blue-800 transition disabled:opacity-50">
                {isLoading ? "Running AI Profile Assessment..." : "Submit Profile for AI Review"}
              </button>
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
                          <button onClick={() => setIsApplyModalOpen(true)} className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg shadow-blue-500/20">Apply Now</button>
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
          <button onClick={() => setIsApplyModalOpen(true)} className="bg-blue-700 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-800 transition shadow-lg shadow-blue-500/20">Consult Now</button>
        </div>
      </nav>

      {selectedCountry ? <CountryDetail country={selectedCountry} /> : (
        <>
          <section className="relative py-28 bg-slate-950 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
              <span className="inline-block py-1 px-4 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold mb-6 border border-blue-500/20 uppercase tracking-widest">Global Specialization Experts</span>
              <h1 className="text-6xl md:text-8xl font-serif font-bold mb-8 leading-none tracking-tighter text-balance">Careers <br /><span className="text-blue-500">Without Borders.</span></h1>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">Peshawar's elite career consultancy. Expert pathways for professionals and paramedics to Germany, Sweden, Italy, and Canada.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => setIsApplyModalOpen(true)} className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-50 transition shadow-2xl">Start AI Assessment</button>
                <button onClick={openWhatsApp} className="bg-green-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center shadow-2xl">💬 WhatsApp Expert</button>
              </div>
            </div>
          </section>

          <section id="destinations" className="py-24">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Destinations</h2>
                <p className="text-slate-600">Explore real-time application status for global career hubs.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                {countries.map((country) => (
                  <div key={country.code} onClick={() => setSelectedCountry(country)} className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 group cursor-pointer flex flex-col">
                    <div className="h-40 relative overflow-hidden">
                      <img src={country.image} alt={country.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                      <div className="absolute top-4 left-4">
                        <StatusBadge status={country.status} />
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-blue-700 transition">{country.name}</h3>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-4">{country.statusNote}</p>
                      <div className="mt-auto">
                        <span className="text-blue-700 font-bold text-[10px] uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-block">Explore Hub →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="services" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">Elite Professional <br /> Coaching & Strategy</h2>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed">From Anabin degree validation and Approbation training in Germany to specialized admissions in Italy, we provide end-to-end strategic support.</p>
                <div className="grid gap-6">
                  {services.map((s, idx) => (
                    <div key={idx} className="p-6 bg-slate-50 rounded-3xl flex items-center hover:bg-blue-50 transition border border-transparent hover:border-blue-100 group">
                      <div className="text-4xl mr-6 group-hover:scale-110 transition">{s.icon}</div>
                      <div>
                        <h3 className="font-bold text-slate-900">{s.title}</h3>
                        <p className="text-sm text-slate-500">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-[48px] overflow-hidden shadow-2xl ring-1 ring-slate-100">
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80" alt="Consultancy Session" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-blue-900/10"></div>
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur p-8 rounded-3xl border border-white/20">
                    <p className="text-slate-900 font-bold text-lg mb-1">Direct Admission Access</p>
                    <p className="text-slate-600 text-sm italic">Connected to official professional boards and international portals.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <footer id="contact" className="bg-slate-950 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-8">
                <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">N</div>
                <span className="text-2xl font-serif font-bold tracking-tight">NextStep <span className="text-blue-700">Consultancy</span></span>
              </div>
              <p className="text-slate-500 mb-8 leading-relaxed">Peshawar's specialized foreign career partner. Professional registration and study consultancy.</p>
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Our Founder</h4>
                <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition group">
                  <div className="w-12 h-12 linkedin-bg rounded-xl flex items-center justify-center text-white text-xl mr-4 group-hover:scale-110 transition">in</div>
                  <div>
                    <p className="font-bold text-sm">Engr. Muhammad Khalid</p>
                    <p className="text-xs text-slate-400">Founder & Tech Lead</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-12">
              <div>
                <h4 className="font-bold mb-8 text-lg">Direct Connect</h4>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-500 text-xl">📍</span>
                    <span className="text-slate-400 text-sm">Hashtnagary Peshawar, KPK, Pakistan</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-4 text-blue-500 text-xl">📞</span>
                    <span className="text-slate-400 text-sm">+92 311 9548076</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-500 text-xl">✉️</span>
                    <div className="text-slate-400 text-xs">
                      <p>softengr.ks@gmail.com</p>
                      <p>dev.engineerkhalid@gmail.com</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-8 text-lg">Quick Links</h4>
                <ul className="space-y-4 text-slate-400 text-sm">
                  <li><a href="https://www.daad.de/en/" target="_blank" className="hover:text-white transition">DAAD Admissions</a></li>
                  <li><button onClick={() => { const s = countries.find(c => c.code === 'SE'); if(s) setSelectedCountry(s); }} className="hover:text-white transition">Sweden Socialstyrelsen</button></li>
                  <li><button onClick={() => { const g = countries.find(c => c.code === 'DE'); if(g) setSelectedCountry(g); }} className="hover:text-white transition">Germany Winter Intake</button></li>
                  <li><button onClick={openWhatsApp} className="hover:text-white transition">Expert WhatsApp Chat</button></li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-blue-700/10 border border-blue-500/20 p-8 rounded-[32px]">
                <h4 className="font-bold mb-4">Register Interest</h4>
                <p className="text-sm text-slate-400 mb-6">Partnered with European boards for seamless professional registration processing.</p>
                <button onClick={() => setIsApplyModalOpen(true)} className="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl hover:bg-blue-800 transition shadow-lg shadow-blue-500/20">
                  Assess My Profile
                </button>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center text-slate-600 text-sm">
            © 2024 NextStep Consultancy Abroad. Specialized Foreign Career & Study Consulting.
          </div>
        </div>
      </footer>

      <button onClick={openWhatsApp} className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 text-white rounded-[24px] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50">
        <span className="text-3xl">💬</span>
      </button>
    </div>
  );
};

export default App;