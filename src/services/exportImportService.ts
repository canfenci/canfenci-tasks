import { taskService } from './db/taskService';
import { projectService } from './db/projectService';
import { ideaService } from './db/ideaService';
import type { Task, Project, Idea } from '../types/models';

export interface BackupData {
  version: string;
  timestamp: string;
  tasks: Task[];
  projects: Project[];
  ideas: Idea[];
}

export async function exportData(): Promise<BackupData> {
  const [tasks, projects, ideas] = await Promise.all([
    taskService.getAll(),
    projectService.getAll(),
    ideaService.getAll(),
  ]);

  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    tasks,
    projects,
    ideas,
  };
}

export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `canfenci-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(
  jsonString: string,
  options: { merge: boolean; replace: boolean } = { merge: true, replace: false }
): Promise<{ success: boolean; message: string; counts?: { tasks: number; projects: number; ideas: number } }> {
  try {
    const data = JSON.parse(jsonString) as BackupData;

    if (!data.tasks || !data.projects || !data.ideas) {
      return { success: false, message: 'Geçersiz yedek dosyası formatı' };
    }

    if (options.replace) {
      // Tüm veriyi temizle (IndexedDB'yi temizlemek için her kaydı sil)
      const existingTasks = await taskService.getAll();
      const existingProjects = await projectService.getAll();
      const existingIdeas = await ideaService.getAll();

      await Promise.all([
        ...existingTasks.map(t => taskService.remove(t.id)),
        ...existingProjects.map(p => projectService.remove(p.id)),
        ...existingIdeas.map(i => ideaService.remove(i.id)),
      ]);
    }

    let taskCount = 0;
    let projectCount = 0;
    let ideaCount = 0;

    if (options.merge) {
      // Mevcut verilerle birleştir
      const existingTasks = await taskService.getAll();
      const existingTaskIds = new Set(existingTasks.map(t => t.id));
      
      for (const task of data.tasks) {
        if (!existingTaskIds.has(task.id)) {
          await taskService.create(task);
          taskCount++;
        }
      }

      const existingProjects = await projectService.getAll();
      const existingProjectIds = new Set(existingProjects.map(p => p.id));
      
      for (const project of data.projects) {
        if (!existingProjectIds.has(project.id)) {
          await projectService.create(project);
          projectCount++;
        }
      }

      const existingIdeas = await ideaService.getAll();
      const existingIdeaIds = new Set(existingIdeas.map(i => i.id));
      
      for (const idea of data.ideas) {
        if (!existingIdeaIds.has(idea.id)) {
          await ideaService.create(idea);
          ideaCount++;
        }
      }
    } else {
      // Tüm veriyi ekle (replace modunda zaten temizlendi)
      for (const task of data.tasks) {
        await taskService.create(task);
        taskCount++;
      }
      for (const project of data.projects) {
        await projectService.create(project);
        projectCount++;
      }
      for (const idea of data.ideas) {
        await ideaService.create(idea);
        ideaCount++;
      }
    }

    return { 
      success: true, 
      message: `İçe aktarma başarılı: ${taskCount} görev, ${projectCount} proje, ${ideaCount} fikir`,
      counts: { tasks: taskCount, projects: projectCount, ideas: ideaCount }
    };
  } catch (error) {
    return { success: false, message: `İçe aktarma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` };
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}