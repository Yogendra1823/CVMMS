export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  description: string;
  status: 'Not Yet Started' | 'In Progress' | 'Resolved';
  created_at: string;
  image_url?: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export type AuthView = 'login' | 'register';
export type AppSection = 'home' | 'report' | 'track' | 'feedback' | 'contact';