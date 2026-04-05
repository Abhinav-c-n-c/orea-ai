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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 p-4 rounded-[4px] shadow-md hover:shadow-xl border border-primary-50 dark:border-slate-800 transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-2 ring-primary-400' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeColor(task.status)}`}
        >
          <div
            className={`w-1 h-1 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-current'}`}
          ></div>
          {getStatusText(task.status)}
        </div>
        <div
          className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </div>
      </div>

      <h3 className="font-bold text-surface-900 dark:text-white text-sm mb-0.5 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {task.title}
      </h3>
      <p className="text-[11px] text-surface-500 dark:text-slate-400 line-clamp-1 mb-3">
        {task.description || 'No description provided.'}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-surface-400 dark:text-slate-500">
            <FiCalendar className="w-3 h-3" />
            <span className="text-[10px] font-medium">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-GB')
                : 'No date'}
            </span>
          </div>
          <div className="flex -space-x-1.5 ring-offset-2 ring-white dark:ring-slate-800">
            {task.assignees?.slice(0, 3).map((user, i) => (
              <div
                key={user._id}
                className="w-5 h-5 rounded border border-white dark:border-slate-800 bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden"
                style={{ zIndex: task.assignees.length - i }}
                title={user.name}
              >
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
            ))}
            {task.assignees?.length > 3 && (
              <div className="w-5 h-5 rounded border border-white dark:border-slate-800 bg-surface-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-surface-500 z-0">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-primary-50 dark:border-slate-700/50">
          <div className="flex items-center gap-1 text-surface-400 dark:text-slate-500">
            <FiMessageCircle className="w-3 h-3" />
            <span className="text-[9px] font-medium">{task.comments?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-surface-400 dark:text-slate-500">
            <FiLink className="w-3 h-3" />
            <span className="text-[9px] font-medium">{task.links || 0}</span>
          </div>
        </div>
      </div>
    </div>

  );
}
