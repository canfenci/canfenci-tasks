export type Priority = 'high' | 'medium' | 'low' | 'none';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // for custom: every N days
  daysOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: string; // ISO date string
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // ISO date string
  projectId?: string;
  tags?: string[];
  subtasks?: Subtask[];
  recurrence?: RecurrenceRule;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
