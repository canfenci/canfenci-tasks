import { taskService } from '../db/taskService';
import { projectService } from '../db/projectService';
import { ideaService } from '../db/ideaService';

const SEED_FLAG_KEY = 'canfenci-seeded';
const SEED_LOCK_KEY = 'canfenci-seed-lock';

export async function seedInitialData(): Promise<void> {
  if (localStorage.getItem(SEED_FLAG_KEY)) return;

  const lock = localStorage.getItem(SEED_LOCK_KEY);
  if (lock) {
    const lockTime = parseInt(lock, 10);
    if (Date.now() - lockTime < 5000) {
      return;
    }
  }

  localStorage.setItem(SEED_LOCK_KEY, Date.now().toString());

  try {
    const existingTasks = await taskService.getAll();
    if (existingTasks.length > 0) {
      localStorage.setItem(SEED_FLAG_KEY, '1');
      return;
    }

    const project = await projectService.create({
      name: 'Canfenci Tasks Kurulumu',
      description: 'Uygulamanin ilk kurulum ve tanitim gorevleri',
      color: '#4f46e5',
    });

    await taskService.create({
      title: 'Canfenci Tasks uygulamasina hos geldiniz!',
      priority: 'medium',
      projectId: project.id,
      order: 0,
    });

    await taskService.create({
      title: 'Bir gorev olusturmayi deneyin (+ butonuna dokunun)',
      priority: 'low',
      projectId: project.id,
      order: 1,
    });

    await ideaService.create({
      title: 'Uygulamayi ana ekrana ekle',
      notes: 'Paylas menusunden Ana Ekrana Ekle secenegini kullanabilirsiniz (iOS).',
      tags: ['pwa', 'ipucu'],
    });

    localStorage.setItem(SEED_FLAG_KEY, '1');
  } finally {
    localStorage.removeItem(SEED_LOCK_KEY);
  }
}
