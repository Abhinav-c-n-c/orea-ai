'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiMessageCircle, FiLink, FiCalendar } from 'react-icons/fi';
import { ITask } from '../types';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

interface TaskCardProps {
  task: ITask;
  onClick?: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400';
    case 'medium':
      return 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';
    case 'low':
      return 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400';
    default:
      return 'text-gray-600 bg-gray-50 dark:bg-gray-500/10 dark:text-gray-400';
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'done':
      return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400';
    case 'in_progress':
      return 'text-primary-600 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400';
    case 'to_discuss':
      return 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400';
    default:
      return 'text-primary-700 bg-primary-50 dark:bg-primary-500/10 dark:text-primary-400';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'done':
      return 'Complete';
    case 'in_progress':
      return 'In Progress';
    case 'to_discuss':
      return 'To Discuss';
    default:
      return 'To Do';
  }
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };

  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-amber-500',
    low: 'border-l-primary-500'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 p-2.5 rounded-[4px] shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-800 border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors] || 'border-l-slate-300'} transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 ${isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-2 ring-primary-400' : ''}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest ${getStatusBadgeColor(task.status)}`}
        >
          {getStatusText(task.status)}
        </div>
        <div
          className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </div>
      </div>

      <h3 className="font-black text-surface-900 dark:text-white text-[11px] mb-0.5 leading-tight group-hover:text-primary-600 transition-colors uppercase tracking-tight">
        {task.title}
      </h3>
      <p className="text-[10px] text-surface-400 dark:text-slate-500 font-bold uppercase tracking-tighter line-clamp-2 mb-2 leading-relaxed">
        {task.description || 'No operational brief.'}
      </p>

      <div className="space-y-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-surface-400 dark:text-slate-500">
            <FiCalendar className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
                : 'NO DEADLINE'}
            </span>
          </div>
          <div className="flex -space-x-1.5">
            {task.assignees?.slice(0, 3).map((user, i) => (
              <div
                key={user._id}
                className="w-5 h-5 rounded-[2px] border border-white dark:border-slate-800 bg-primary-100 flex items-center justify-center text-[8px] font-black text-primary-700 overflow-hidden shadow-sm"
                style={{ zIndex: task.assignees.length - i }}
                title={user.name}
              >
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
