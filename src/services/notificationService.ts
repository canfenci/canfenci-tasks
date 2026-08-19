type NotificationTask = {
  id: string;
  title: string;
  dueDate?: string;
};

let scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Bu tarayıcı bildirimleri desteklemiyor');
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export function scheduleTaskNotification(task: NotificationTask): void {
  if (!task.dueDate) return;
  if (getNotificationPermission() !== 'granted') return;

  const due = new Date(task.dueDate);
  const now = new Date();
  
  // Bildirimi 1 saat öncesine planla
  const notifyTime = due.getTime() - 60 * 60 * 1000;
  const delay = notifyTime - now.getTime();

  if (delay <= 0) return; // Geçmişse planlama yapma

  // Eski timeout varsa temizle
  const existingTimeout = scheduledTimeouts.get(task.id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    showNotification(task);
    scheduledTimeouts.delete(task.id);
  }, delay);

  scheduledTimeouts.set(task.id, timeout);
}

export function cancelTaskNotification(taskId: string): void {
  const timeout = scheduledTimeouts.get(taskId);
  if (timeout) {
    clearTimeout(timeout);
    scheduledTimeouts.delete(taskId);
  }
}

export function showNotification(task: NotificationTask): void {
  if (getNotificationPermission() !== 'granted') return;

  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '';
  const timeStr = task.dueDate ? new Date(task.dueDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

  const notification = new Notification('Canfenci Tasks - Hatırlatıcı', {
    body: `${task.title}${dueDate ? ` - ${dueDate}${timeStr ? ` ${timeStr}` : ''}` : ''}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `task-${task.id}`,
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function scheduleAllTaskNotifications(tasks: (NotificationTask & { completed?: boolean })[]): void {
  tasks.forEach(task => {
    if (!task.completed && task.dueDate) {
      scheduleTaskNotification({ id: task.id, title: task.title, dueDate: task.dueDate });
    }
  });
}

export function clearAllNotifications(): void {
  scheduledTimeouts.forEach(timeout => clearTimeout(timeout));
  scheduledTimeouts.clear();
}

// Service Worker üzerinden bildirim gönderme (background için)
export function sendPushNotification(title: string, body: string, tag: string): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      tag,
    });
  }
}