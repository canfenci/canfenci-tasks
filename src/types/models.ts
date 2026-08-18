export type Priority = 'high' | 'medium' | 'low' | 'none';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string; // ISO date string
  projectId?: string;
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
