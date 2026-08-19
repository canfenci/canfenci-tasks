import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Task } from '../../types/models';
import { getRelativeDateLabel } from '../../utils/dateUtils';

interface SortableTaskListProps {
  tasks: Task[];
  onReorder: (tasks: Task[]) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string) => void;
  swipeState: { taskId: string | null; offsetX: number; isOpen: boolean };
  handleTouchStart: (e: React.TouchEvent, taskId: string) => void;
  handleTouchMove: (e: React.TouchEvent, taskId: string) => void;
  handleTouchEnd: (e: React.TouchEvent, taskId: string) => void;
  priorityLabels: Record<string, string>;
  priorityColors: Record<string, string>;
}

function SortableTaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onContextMenu,
  swipeState,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  priorityLabels,
  priorityColors,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string) => void;
  swipeState: { taskId: string | null; offsetX: number; isOpen: boolean };
  handleTouchStart: (e: React.TouchEvent, taskId: string) => void;
  handleTouchMove: (e: React.TouchEvent, taskId: string) => void;
  handleTouchEnd: (e: React.TouchEvent, taskId: string) => void;
  priorityLabels: Record<string, string>;
  priorityColors: Record<string, string>;
}) {
  void onEdit;
  void onDelete;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const relativeDate = task.dueDate ? getRelativeDateLabel(task.dueDate) : null;
  const swipe = swipeState.taskId === task.id ? swipeState : { offsetX: 0, isOpen: false };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="card"
      onTouchStart={(e) => handleTouchStart(e, task.id)}
      onTouchMove={(e) => handleTouchMove(e, task.id)}
      onTouchEnd={(e) => handleTouchEnd(e, task.id)}
    >
      <div className="swipe-delete" style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '100px',
        background: 'var(--color-danger)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        opacity: swipe.isOpen ? 1 : Math.abs(swipe.offsetX) / 100,
        pointerEvents: 'none',
      }}>
        <GripVertical size={24} /> Sırala
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: 'var(--space-3)',
        position: 'relative',
        zIndex: 1,
      }}>
        <button
          {...attributes}
          {...listeners}
          className="drag-handle top-bar-icon-btn"
          aria-label="Sürüklemek için tutun"
          style={{ padding: 4, alignSelf: 'flex-start', flexShrink: 0, cursor: 'grab', color: 'var(--color-text-tertiary)' }}
        >
          <GripVertical size={20} />
        </button>

        <button
          className={`card-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={() => onToggle(task.id)}
          aria-label="Tamamlandı olarak işaretle"
        />
        <div className="card-body" style={{ flex: 1, minWidth: 0 }}>
          <div className={`card-title ${task.completed ? 'completed' : ''}`}>{task.title}</div>
          <div className="card-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span 
              className="card-priority-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: `${priorityColors[task.priority]}20`,
                color: priorityColors[task.priority],
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                border: `1px solid ${priorityColors[task.priority]}40`,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority] }} />
              {priorityLabels[task.priority]}
            </span>
            {relativeDate && (
              <span 
                className={`card-due-badge ${relativeDate.className}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                }}
              >
                {relativeDate.label}
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {task.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="badge badge-neutral" style={{ fontSize: 'var(--font-size-xs)' }}>#{tag}</span>
                ))}
                {task.tags.length > 3 && (
                  <span className="badge badge-neutral" style={{ fontSize: 'var(--font-size-xs)' }}>+{task.tags.length - 3}</span>
                )}
              </span>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                <div style={{ 
                  flex: 1, 
                  height: 4, 
                  background: 'var(--color-bg-hover)', 
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`, 
                      background: 'var(--color-primary)', 
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.3s ease',
                    }} 
                  />
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => onContextMenu(e, task.id)}
          className="top-bar-icon-btn"
          aria-label="Daha fazla seçenek"
          style={{ padding: 4, alignSelf: 'flex-start', flexShrink: 0 }}
        >
          <GripVertical size={20} />
        </button>
      </div>
    </div>
  );
}

export function SortableTaskList({
  tasks,
  onReorder,
  onToggle,
  onEdit,
  onDelete,
  onContextMenu,
  swipeState,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  priorityLabels,
  priorityColors,
}: SortableTaskListProps) {
  const [activeTasks, setActiveTasks] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    // onEdit and onDelete are passed to SortableTaskItem
    void onEdit;
    void onDelete;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeTasks.findIndex(t => t.id === active.id);
      const newIndex = activeTasks.findIndex(t => t.id === over.id);
      const newTasks = arrayMove(activeTasks, oldIndex, newIndex);
      
      // order alanını güncelle
      const updatedTasks = newTasks.map((task, idx) => ({ ...task, order: idx }));
      setActiveTasks(updatedTasks);
      onReorder(updatedTasks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {activeTasks.map((task) => (
          <SortableTaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onContextMenu={onContextMenu}
            swipeState={swipeState}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            priorityLabels={priorityLabels}
            priorityColors={priorityColors}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}