export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  ESCALATED = 'Escalated'
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Channel {
  EMAIL = 'Email',
  CHAT = 'Chat',
  VOICE = 'Voice'
}

export enum Sentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative',
  ANGRY = 'Angry'
}

export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}

export interface TicketAnalysis {
  summary: string;
  sentiment: Sentiment;
  urgencyScore: number; // 1-10
  category: string;
  suggestedRoute: string;
  riskFactors: string[];
}

export interface Ticket {
  id: string;
  subject: string;
  customerName: string;
  customerEmail: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: Channel;
  createdAt: Date;
  messages: Message[];
  analysis?: TicketAnalysis; // Populated by AI
  assignedTo?: string;
}

export interface DashboardStats {
  ticketsResolved: number;
  avgResponseTime: string;
  csatScore: number;
  costSaved: number;
}