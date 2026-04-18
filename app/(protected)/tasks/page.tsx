'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiX,
  FiCalendar,
  FiTag,
  FiTrash2,
  FiMessageCircle,
  FiFlag,
  FiUser,
  FiChevronDown,
  FiUpload,
  FiEdit3,
  FiCheckSquare,
  FiZap,
} from 'react-icons/fi';
import { useTaskStore } from '../../../store/taskStore';
import { useSocket } from '../../../hooks/useSocket';
import { TaskStatus, TaskPriority, IUser } from '../../../types';
import { formatDate, getPriorityColor, getInitials, timeAgo } from '../../../utils/formatters';
import { useBoardStore } from '../../../store/boardStore';
import { useUserStore } from '../../../store/userStore';
import TaskCard from '../../../components/TaskCard';
import CreateBoardModal from '../../../components/CreateBoardModal';
import Header from '../../../components/Header';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';


const CLOUD_NAME = 'dybv5ghlb';

const taskColumns = [
  { 
    id: 'todos', 
    label: 'Mission Backlog', 
    description: 'Ongoing and upcoming operational tasks.',
    color: 'bg-primary-500', 
    bgColor: 'bg-white dark:bg-slate-900', 
    statuses: ['to_discuss', 'todo', 'in_progress'] as TaskStatus[] 
  },
  { 
    id: 'done', 
    label: 'Completed Archives', 
    description: 'Tasks successfully archived and finalized.',
    color: 'bg-emerald-500', 
    bgColor: 'bg-white dark:bg-slate-900', 
    statuses: ['done'] as TaskStatus[] 
  },
];

const EmojiBurst = ({ active }: { active: boolean }) => {
  if (!active) return null;
  const emojis = ['🎉', '🚀', '🔥', '✅', '🏆', '🎊', '✨'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ 
            x: (Math.random() - 0.5) * 600, 
            y: (Math.random() - 0.5) * 600, 
            scale: [0, 1.5, 0],
            rotate: Math.random() * 360,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute text-4xl"
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
        </motion.div>
      ))}
    </div>
  );
};

const OhSitAlert = ({ active }: { active: boolean }) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.5 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"
        >
          <span className="text-2xl">😮</span> Oh sit! Mission regressed
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FilterDropdown = ({ 
  label, 
  value, 
  onChange, 
  options, 
  icon: Icon 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[]; 
  icon: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || 'All';

  return (
    <div className="relative w-full">
      <div className="flex flex-col w-full">
        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5 ml-1">
          {label}
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-slate-50 dark:bg-slate-800 border transition-all text-xs font-bold w-full justify-between ${
            isOpen ? 'border-primary-500 shadow-sm' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300 truncate max-w-[80px]">{selectedLabel}</span>
          </div>
          <FiChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-900 rounded-[4px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 z-[90] overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      value === opt.value ? 'text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ColumnContainer = ({ 
  col, 
  columnTasks, 
  tasksLoading, 
  index, 
  setSelectedTask, 
  setShowDetailModal, 
  setNewTaskStatus, 
  setShowCreateTask 
}: any) => {
  const { setNodeRef } = useDroppable({ id: col.id });

  return (
    <React.Fragment>
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col rounded-[2px] shadow-sm ${col.bgColor} p-3 md:p-4 my-1 md:my-2 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-primary-600/5 group/column`}
      >
        <div className="flex items-start justify-between mb-3 md:mb-4 px-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full shadow-sm animate-pulse ${col.id === 'done' ? 'bg-emerald-500' : 'bg-primary-500'}`}></div>
              <h3 className="font-black text-surface-900 dark:text-white text-sm uppercase tracking-widest group-hover/column:text-primary-600 transition-colors">
                {col.label}
              </h3>
              <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black shadow-sm text-surface-500 dark:text-slate-400 ml-1">
                {columnTasks.length}
              </div>
            </div>
            <p className="text-[10px] text-surface-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
              {col.description}
            </p>
          </div>
          <button
            onClick={() => {
              setNewTaskStatus(col.statuses[0]);
              setShowCreateTask(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest group/add"
            title="Add Task"
          >
            <FiPlus className="w-4 h-4 transition-transform group-hover/add:rotate-90" />
            <span className="hidden sm:inline">Add Card</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
          <SortableContext
            items={columnTasks.map((t: any) => t._id)}
            strategy={verticalListSortingStrategy}
            id={col.id}
          >
            <div className="space-y-3">
              {columnTasks.map((task: any) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowDetailModal(true);
                  }}
                />
              ))}
            </div>
          </SortableContext>
          {columnTasks.length === 0 && !tasksLoading && (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-fade-in px-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full shadow-inner flex items-center justify-center mx-auto mb-6 opacity-40">
                {col.id === 'todos' ? (
                  <FiEdit3 className="w-8 h-8 text-slate-400" />
                ) : (
                  <FiCheckSquare className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <h4 className="text-surface-900 dark:text-white font-black text-xs uppercase tracking-widest mb-2">
                {col.id === 'todos' ? "Backlog Empty" : "Archive Pending"}
              </h4>
              <p className="text-[10px] text-surface-400 dark:text-slate-500 font-bold uppercase tracking-tighter leading-relaxed max-w-[200px]">
                {col.id === 'todos' 
                  ? "Awaiting operational data input." 
                  : "Completed objectives will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Visual Bridge */}
      {index === 0 && (
        <>
          <div className="hidden xl:flex flex-col items-center justify-center py-12 px-2 shrink-0">
            <div className="h-20 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 shadow-inner border border-slate-200 dark:border-slate-800 flex items-center justify-center my-4">
              <FiZap className="w-4 h-4 text-primary-500 animate-pulse" />
            </div>
            <div className="h-full w-px bg-slate-200 dark:bg-slate-800"></div>
          </div>
          {/* Mobile Divider */}
          <div className="xl:hidden h-[1px] w-full bg-gradient-to-r from-transparent via-primary-500/20 to-transparent my-6"></div>
        </>
      )}
    </React.Fragment>
  );
};

export default function TasksPage() {
  const {
    tasks,
    isLoading: tasksLoading,
    fetchTasks,
    createTask,
    updateTask,
    setSelectedTask,
    selectedTask,
    deleteTask,
    addComment,
  } = useTaskStore();

  const { boards, activeBoard, fetchBoards, setActiveBoard, deleteBoard } = useBoardStore();
  const { users, fetchUsers } = useUserStore();
  useSocket();

  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newTaskTag, setNewTaskTag] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingNewTaskImage, setUploadingNewTaskImage] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [showBurst, setShowBurst] = useState(false);
  const [showOhSit, setShowOhSit] = useState(false);



  // Filters
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterDueDate, setFilterDueDate] = useState<string>('all');

  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assignees: [] as string[],
    tags: [] as string[],
    dueDate: '',
    images: [] as string[],
  });


  useEffect(() => {
    fetchBoards();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeBoard) {
      fetchTasks({ boardId: activeBoard._id });
    }
  }, [activeBoard]);

  const filteredSearchTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    let newStatus: TaskStatus | null = null;

    // Check if dropped on a column
    const col = taskColumns.find((c) => c.id === overId);
    if (col) {
      newStatus = col.statuses[0];
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus) {
      const task = tasks.find((t) => t._id === taskId);
      if (task && task.status !== newStatus) {
        try {
          if (newStatus === 'done' && task.status !== 'done') {
            setShowBurst(true);
            setTimeout(() => setShowBurst(false), 2000);
          } else if (task.status === 'done' && newStatus !== 'done') {
            setShowOhSit(true);
            setTimeout(() => setShowOhSit(false), 2000);
          }
          await updateTask(taskId, { status: newStatus });
        } catch (error) {
          console.error('Failed to update task status:', error);
        }
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBoard) return;
    try {
      await createTask({
        ...newTaskData,
        status: newTaskStatus || 'todo',
        boardId: activeBoard._id,
      });
      setShowCreateTask(false);
      setNewTaskData({ title: '', description: '', priority: 'medium', assignees: [], tags: [], dueDate: '', images: [] });

    } catch (error) {
      console.error(error);
    }
  };

  const getTasksByColumn = (col: typeof taskColumns[0]) => {
    let filtered = tasks.filter((t) => col.statuses.includes(t.status));

    if (filterPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }
    if (filterAssignee !== 'all') {
      filtered = filtered.filter((t) => t.assignees.some((a) => a._id === filterAssignee));
    }
    if (filterTag !== 'all') {
      filtered = filtered.filter((t) => t.tags?.includes(filterTag));
    }
    if (filterDueDate === 'overdue') {
      filtered = filtered.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
    } else if (filterDueDate === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === today);
    } else if (filterDueDate === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      filtered = filtered.filter((t) => t.dueDate && new Date(t.dueDate) <= weekFromNow);
    } else if (filterDueDate === 'no_date') {
      filtered = filtered.filter((t) => !t.dueDate);
    }

    return filtered;
  };

  // Get all unique tags from tasks
  const allTags = [...new Set(tasks.flatMap((t) => t.tags || []))];

  const handleAddTag = async () => {
    if (!newTag.trim() || !selectedTask) return;
    const updatedTags = [...(selectedTask.tags || []), newTag.trim()];
    await updateTask(selectedTask._id, { tags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedTask) return;
    const updatedTags = (selectedTask.tags || []).filter((t) => t !== tag);
    await updateTask(selectedTask._id, { tags: updatedTags });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedTask) return;
    setUploadingImage(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      formData.append('cloud_name', CLOUD_NAME);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        const updatedImages = [...(selectedTask.images || []), data.secure_url];
        await updateTask(selectedTask._id, { images: updatedImages });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
    setUploadingImage(false);
  };

  const handleRemoveImage = async (imgUrl: string) => {
    if (!selectedTask) return;
    const updatedImages = (selectedTask.images || []).filter((i) => i !== imgUrl);
    await updateTask(selectedTask._id, { images: updatedImages });
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    try {
      await addComment(selectedTask._id, { 
        text: commentText.trim(),
        mentions: mentionedUserIds 
      });
      setCommentText('');
      setMentionedUserIds([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommentText(value);

    const words = value.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setShowMentionList(true);
      setMentionFilter(lastWord.slice(1));
    } else {
      setShowMentionList(false);
    }
  };

  const handleSelectMention = (user: IUser) => {
    const words = commentText.split(' ');
    words[words.length - 1] = `@${user.name} `;
    setCommentText(words.join(' '));
    setMentionedUserIds(prev => [...new Set([...prev, user._id])]);
    setShowMentionList(false);
  };

  const renderCommentText = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="font-bold text-primary-600 dark:text-primary-400">{part}</span>;
      }
      return part;
    });
  };

  const resetFilters = () => {
    setFilterPriority('all');
    setFilterAssignee('all');
    setFilterTag('all');
    setFilterDueDate('all');
  };

  const hasActiveFilters = filterPriority !== 'all' || filterAssignee !== 'all' || filterTag !== 'all' || filterDueDate !== 'all';

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 gap-6 relative">
      <EmojiBurst active={showBurst} />
      <OhSitAlert active={showOhSit} />

      {/* Header */}
          <Header
            title={
              <div className="relative">
                <button
                  onClick={() => setShowBoardDropdown(!showBoardDropdown)}
                  className="flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors rounded-[4px] px-3 py-1.5 border border-transparent hover:border-primary-200 dark:hover:border-slate-600"
                >
                  <span className="font-black tracking-[0.15em] uppercase text-xs text-primary-600 dark:text-primary-400">
                    {activeBoard?.name || 'Loading Boards...'}
                  </span>
                  <FiChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${showBoardDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showBoardDropdown && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setShowBoardDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-[4px] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 z-[70] overflow-hidden"
                      >
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-900/50">
                          Switch Operations
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          {boards.map((b) => (
                            <button
                              key={b._id}
                              onClick={() => {
                                setActiveBoard(b);
                                setShowBoardDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left group ${activeBoard?._id === b._id ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                            >
                              <span className={`text-xs font-bold uppercase tracking-tight ${activeBoard?._id === b._id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {b.name}
                              </span>
                              {activeBoard?._id === b._id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                              )}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setShowCreateBoard(true);
                            setShowBoardDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors text-xs font-black uppercase tracking-widest"
                        >
                          <FiPlus className="w-4 h-4" />
                          New Board
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            }
            subtitle="Secure Archive Management Protocol"
            icon={<FiCheckSquare className="w-5 h-5 text-white" />}
            extra={showFilters ? (
              <div className="grid grid-cols-4 items-center gap-4 w-full">
                <FilterDropdown 
                  label="Priority"
                  value={filterPriority}
                  onChange={setFilterPriority}
                  icon={FiFlag}
                  options={[
                    { label: 'All', value: 'all' },
                    { label: 'High', value: 'high' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Low', value: 'low' },
                  ]}
                />
                <FilterDropdown 
                  label="Assignee"
                  value={filterAssignee}
                  onChange={setFilterAssignee}
                  icon={FiUser}
                  options={[
                    { label: 'All', value: 'all' },
                    ...users.map(u => ({ label: u.name, value: u._id }))
                  ]}
                />
                <FilterDropdown 
                  label="Tag"
                  value={filterTag}
                  onChange={setFilterTag}
                  icon={FiTag}
                  options={[
                    { label: 'All', value: 'all' },
                    ...allTags.map(tag => ({ label: tag, value: tag }))
                  ]}
                />
                <div className="relative w-full">
                  <FilterDropdown 
                    label="Due Date"
                    value={filterDueDate}
                    onChange={setFilterDueDate}
                    icon={FiCalendar}
                    options={[
                      { label: 'All', value: 'all' },
                      { label: 'Overdue', value: 'overdue' },
                      { label: 'Today', value: 'today' },
                      { label: 'This Week', value: 'week' },
                      { label: 'No Date', value: 'no_date' },
                    ]}
                  />
                  {hasActiveFilters && (
                    <button 
                      onClick={resetFilters}
                      className="absolute -bottom-5 right-0 text-[8px] font-black text-rose-500 hover:text-rose-600 dark:text-rose-400 uppercase tracking-widest transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          >
            {/* Search */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(e.target.value.length > 0);
                }}
                onFocus={() => searchTerm.length > 0 && setShowSearchDropdown(true)}
                placeholder="Search Objectives..."
                className="pl-9 pr-4 py-2 rounded-[4px] border border-primary-100 dark:border-slate-700 bg-primary-50/50 dark:bg-slate-800 text-xs focus:ring-1 focus:ring-primary-500 outline-none w-48 md:w-64 dark:text-white transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
              <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-primary-500" />

              <AnimatePresence>
                {showSearchDropdown && searchTerm && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowSearchDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-[400px] bg-white dark:bg-slate-900 rounded-[4px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 z-[70] overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search Sequences</span>
                        <span className="text-[8px] font-bold text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded-[2px]">{filteredSearchTasks.length} MATCHES</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {filteredSearchTasks.length > 0 ? (
                          filteredSearchTasks.map((task) => (
                            <button
                              key={task._id}
                              onClick={() => {
                                setSelectedTask(task);
                                setShowDetailModal(true);
                                setShowSearchDropdown(false);
                                setSearchTerm('');
                              }}
                              className="w-full p-4 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-left transition-all border-b border-slate-50 dark:border-slate-800/50 last:border-0 group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary-600 transition-colors">{task.title}</span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-[2px] uppercase tracking-widest border ${task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                  {task.status === 'done' ? 'DONE' : 'TO DO'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 truncate">
                                {task.description || 'No operational briefing.'}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="p-12 text-center">
                            <FiSearch className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching sequences found</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-[4px] transition-colors ${hasActiveFilters ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
              title="Toggle Filters"
            >
              <FiFilter className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowCreateBoard(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-[4px] text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-sm active:scale-[0.98] hidden sm:flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" /> Board
            </button>
          </Header>

          {/* Kanban Board Container */}
          <div className="flex-1 flex justify-center min-h-0 pb-4 overflow-y-auto md:overflow-x-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row w-full max-w-[1600px] gap-4 md:gap-6 px-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
              >
                {taskColumns.map((col, index) => {
                  const columnTasks = getTasksByColumn(col);
                  return (
                    <ColumnContainer
                      key={col.id}
                      col={col}
                      columnTasks={columnTasks}
                      tasksLoading={tasksLoading}
                      index={index}
                      setSelectedTask={setSelectedTask}
                      setShowDetailModal={setShowDetailModal}
                      setNewTaskStatus={setNewTaskStatus}
                      setShowCreateTask={setShowCreateTask}
                    />
                  );
                })}
              </DndContext>
            </div>
          </div>


        <CreateBoardModal isOpen={showCreateBoard} onClose={() => setShowCreateBoard(false)} />

        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div
              className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 border border-primary-100 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-white">Create New Task</h2>
                <button onClick={() => setShowCreateTask(false)} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-slate-700 text-surface-400">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Title</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white"
                    placeholder="Type task title here..."
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium h-28 resize-none dark:text-white"
                    placeholder="What needs to be done?"
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white"
                      value={newTaskData.priority}
                      onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Status</label>
                    <div className="px-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-bold text-sm border border-primary-100 dark:border-primary-800">
                      {newTaskStatus === 'done' ? 'Done' : 'TODO'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3 block">Assignees</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newTaskData.assignees.map((id) => {
                      const u = users.find((user) => user._id === id);
                      return (
                        <div key={id} className="flex items-center gap-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                          {u?.name}
                          <button
                            type="button"
                            onClick={() => setNewTaskData({ ...newTaskData, assignees: newTaskData.assignees.filter((sid) => sid !== id) })}
                            className="hover:text-primary-900 dark:hover:text-primary-100"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white"
                    onChange={(e) => {
                      if (e.target.value && !newTaskData.assignees.includes(e.target.value)) {
                        setNewTaskData({ ...newTaskData, assignees: [...newTaskData.assignees, e.target.value] });
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">Select Assignees...</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>


                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Deadline</label>
                    <div className="relative">
                      <input
                        type="date"
                        className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white"
                        value={newTaskData.dueDate}
                        onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                      />
                      <FiCalendar className="absolute right-4 top-3.5 text-surface-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 rounded-xl bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium dark:text-white"
                        placeholder="Add tag..."
                        value={newTaskTag}
                        onChange={(e) => setNewTaskTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTaskTag.trim() && !newTaskData.tags.includes(newTaskTag.trim())) {
                              setNewTaskData({ ...newTaskData, tags: [...newTaskData.tags, newTaskTag.trim()] });
                              setNewTaskTag('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTaskTag.trim() && !newTaskData.tags.includes(newTaskTag.trim())) {
                            setNewTaskData({ ...newTaskData, tags: [...newTaskData.tags, newTaskTag.trim()] });
                            setNewTaskTag('');
                          }
                        }}
                        className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        <FiPlus />
                      </button>
                    </div>
                    {newTaskData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {newTaskData.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-surface-100 dark:bg-slate-700 rounded-lg text-[10px] font-bold text-surface-600 dark:text-slate-300">
                            {tag}
                            <button type="button" onClick={() => setNewTaskData({ ...newTaskData, tags: newTaskData.tags.filter(t => t !== tag) })}>
                              <FiX className="w-3 h-3 hover:text-red-500" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-1.5 block">Images</label>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {newTaskData.images.map((img, i) => (
                      <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-primary-100 dark:border-slate-700">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewTaskData({ ...newTaskData, images: newTaskData.images.filter((_, idx) => idx !== i) })}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className={`w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors ${uploadingNewTaskImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <FiUpload className="w-5 h-5" />
                      <span className="text-[10px] font-bold">{uploadingNewTaskImage ? '...' : 'Upload'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          if (e.target.files?.length) {
                            setUploadingNewTaskImage(true);
                            try {
                              const url = await uploadToCloudinary(e.target.files[0]);
                              setNewTaskData({ ...newTaskData, images: [...newTaskData.images, url] });
                            } catch (err) {
                              console.error(err);
                            }
                            setUploadingNewTaskImage(false);
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>



                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateTask(false)}
                    className="flex-1 py-3 text-sm font-bold text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-[0.98]"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Popup Modal */}
        <AnimatePresence>
          {showDetailModal && selectedTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setShowDetailModal(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[2px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 z-50 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Section with optional cover image */}
                {selectedTask.images && selectedTask.images.length > 0 ? (
                  <div className="w-full h-[180px] relative shrink-0">
                    <img 
                      src={selectedTask.images[0]} 
                      alt="Task Cover" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-6 right-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase tracking-widest bg-primary-500 text-white`}>
                          MISSION ID: {selectedTask._id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tight">
                        {selectedTask.title}
                      </h2>
                    </div>
                    {/* Floating Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                       <button
                        onClick={async () => {
                          if (confirm('Verify: Permanent record deletion?')) {
                            await deleteTask(selectedTask._id);
                            setShowDetailModal(false);
                          }
                        }}
                        className="p-2 bg-white/10 hover:bg-red-500 backdrop-blur-md text-white rounded-[2px] transition-all border border-white/10"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-[2px] transition-all border border-white/10"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                      <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-0.5 block">Operational Metadata Alpha</span>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {selectedTask.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (confirm('Verify: Permanent record deletion?')) {
                            await deleteTask(selectedTask._id);
                            setShowDetailModal(false);
                          }
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded transition-colors"
                      >
                        <FiX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* Left Column - Tactical Intel (70%) */}
                  <div className="flex-[7] overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-5 border-r border-slate-100 dark:border-slate-800">
                    <section>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-1.5 h-4 bg-primary-500"></div>
                        <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Operational Briefing</h4>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[2px] border border-slate-100 dark:border-slate-800/50">
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                          {selectedTask.description || 'No tactical intel provided for this mission.'}
                        </p>
                      </div>
                    </section>

                    <section className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-4 bg-primary-500"></div>
                          <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Activity Feed</h4>
                        </div>
                        <span className="text-[9px] font-black bg-primary-500 text-white px-2 py-0.5 rounded-[2px] tracking-widest">
                          {selectedTask.comments.length} LOGS
                        </span>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        {selectedTask.comments.map((c, i) => (
                          <div key={i} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-[2px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center font-black text-primary-500 text-[10px] shadow-sm">
                              {getInitials(c.user?.name || 'U')}
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{c.user?.name}</span>
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">• {timeAgo(c.createdAt)}</span>
                              </div>
                              <div className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 rounded-[2px] text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                                {renderCommentText(c.text)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-4 pb-2">
                        <div className="relative">
                          {showMentionList && (
                            <div className="absolute bottom-full left-0 mb-3 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2px] shadow-2xl z-[150] overflow-hidden animate-scale-in">
                              <div className="p-3 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/50">
                                Deploy User Mention
                              </div>
                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase())).map(user => (
                                  <button
                                    key={user._id}
                                    onClick={() => handleSelectMention(user)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-left transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                  >
                                    <div className="w-8 h-8 rounded-[2px] bg-primary-500 flex items-center justify-center text-[10px] text-white font-black">
                                      {getInitials(user.name)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name}</span>
                                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{user.email}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={commentText}
                              onChange={handleCommentChange}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                              placeholder="Input comms brief..."
                              className="flex-1 px-5 py-3 rounded-[2px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none focus:ring-1 focus:ring-primary-500 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                            <button
                              onClick={handleAddComment}
                              disabled={!commentText.trim()}
                              className="px-8 py-3 bg-primary-600 text-white rounded-[2px] text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-30 shadow-lg shadow-primary-500/20 active:scale-95"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column - Mission Metadata (30%) */}
                  <div className="flex-[3] w-full md:w-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/30 space-y-5 overflow-y-auto custom-scrollbar">
                    <section className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Status</span>
                          <span className={`inline-flex px-2 py-1 rounded-[2px] text-[9px] font-black uppercase tracking-widest border ${selectedTask.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-primary-500/10 text-primary-600 border-primary-500/20'}`}>
                            {selectedTask.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Priority</span>
                          <span className={`inline-flex px-2 py-1 rounded-[2px] text-[9px] font-black uppercase tracking-widest border border-current opacity-80 ${getPriorityColor(selectedTask.priority).split(' ').pop()}`}>
                            {selectedTask.priority}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Deployment Schedule</span>
                        <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black text-[10px] p-3 rounded-[2px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm">
                          <FiCalendar className="w-3.5 h-3.5 text-primary-500" />
                          <span className="tracking-widest uppercase">
                            {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No Deadline Assigned'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Assigned Squad</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.assignees.map((a) => (
                            <div key={a._id} className="flex items-center gap-2 bg-white dark:bg-slate-800 pl-1 pr-3 py-1 rounded-[2px] border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-105">
                              <div className="w-6 h-6 rounded-[2px] bg-primary-500 flex items-center justify-center text-white font-black text-[9px] overflow-hidden shadow-md">
                                {a.avatar ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" /> : getInitials(a.name)}
                              </div>
                              <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{a.name}</span>
                            </div>
                          ))}
                          {!selectedTask.assignees.length && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic opacity-50">Empty Squad</span>}
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800/50">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Mission Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedTask.tags || []).map((tag) => (
                            <span key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded-[2px] bg-primary-500/5 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest border border-primary-500/10 group">
                              {tag}
                              <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition-colors">
                                <FiX className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="Add mission tag..."
                            className="flex-1 min-w-0 px-3 py-1.5 rounded-[2px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                          />
                          <button
                            onClick={handleAddTag}
                            className="px-3 py-1.5 bg-slate-900 dark:bg-primary-600 text-white rounded-[2px] text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary-700 transition-all shadow-md"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800/50">
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block">Payload Intel</span>
                        <div className="grid grid-cols-2 gap-2">
                          {(selectedTask.images || []).map((img, i) => (
                            <div key={i} className="relative group aspect-square rounded-[2px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                              <img src={img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <button
                                onClick={() => handleRemoveImage(img)}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-[2px] opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-[2px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all group ${uploadingImage ? 'opacity-30 pointer-events-none' : ''}`}>
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                             <FiUpload className="w-4 h-4" />
                          </div>
                          {uploadingImage ? 'Uploading...' : 'Upload Payload'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

    </main>
  );
}
