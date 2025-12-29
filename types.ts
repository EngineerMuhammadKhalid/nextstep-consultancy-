
export interface Job {
  id: string;
  title: string;
  hospital: string;
  specialty: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Expert';
  salaryRange: string;
}

export interface Country {
  name: string;
  code: string;
  image: string;
  description: string;
  benefits: string[];
  jobInsights: string;
  universityRankings: string[];
  livingCosts: {
    rent: string;
    general: string;
    total: string;
  };
  jobs: Job[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}
