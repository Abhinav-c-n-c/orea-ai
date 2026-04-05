'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
    label: 'TODOs', 
    description: 'Ongoing and upcoming tasks to handle.',
    color: 'bg-primary-500', 
    bgColor: 'bg-slate-50 dark:bg-slate-800', 
    statuses: ['to_discuss', 'todo', 'in_progress'] as TaskStatus[] 
  },
  { 
    id: 'done', 
    label: 'Done', 
    description: 'Tasks that have been successfully completed.',
    color: 'bg-emerald-500', 
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10', 
    statuses: ['done'] as TaskStatus[] 
  },
];

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

  const [showBoardPanel, setShowBoardPanel] = useState(false);
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
      fetchTasks({ boardId: activeBoard._id, search: searchTerm });
    }
  }, [activeBoard, searchTerm]);

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
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6">
      {/* Header */}
          <Header
            title={
              <button
                onClick={() => setShowBoardPanel(true)}
                className="flex items-center gap-2 hover:bg-primary-50 dark:hover:bg-slate-700 transition-colors rounded pr-2"
              >
                <span className="font-bold tracking-tight uppercase tracking-widest text-sm">{activeBoard?.name || 'Loading Boards...'}</span>
                <FiChevronDown className="w-4 h-4 text-surface-400" />
              </button>
            }
            subtitle="Organize and track your board tasks"
            icon={<FiCheckSquare className="w-5 h-5" />}
          >
            {/* Search */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-2 rounded-[4px] border border-primary-100 dark:border-slate-700 bg-primary-50/50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48 md:w-64 dark:text-white transition-all"
              />
              <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-[4px] transition-colors ${hasActiveFilters ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-surface-50 dark:bg-slate-700 text-surface-500 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-slate-600'}`}
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

          {/* Filter Bar */}
          {showFilters && (
            <div className="mb-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-primary-100 dark:border-slate-700 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-surface-700 dark:text-white flex items-center gap-2">
                  <FiFilter className="w-4 h-4 text-primary-500" /> Filters
                </h4>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    Reset All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Priority Filter */}
                <div>
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1 block">
                    <FiFlag className="w-3 h-3 inline mr-1" />Priority
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-slate-700 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Assignee Filter */}
                <div>
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1 block">
                    <FiUser className="w-3 h-3 inline mr-1" />Assignee
                  </label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-slate-700 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  >
                    <option value="all">All</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter */}
                <div>
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1 block">
                    <FiTag className="w-3 h-3 inline mr-1" />Tag
                  </label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-slate-700 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  >
                    <option value="all">All</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date Filter */}
                <div>
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1 block">
                    <FiCalendar className="w-3 h-3 inline mr-1" />Due Date
                  </label>
                  <select
                    value={filterDueDate}
                    onChange={(e) => setFilterDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-slate-700 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="no_date">No Date</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Kanban Board */}
          <div className="flex-1 flex gap-6 min-h-0 pb-4 overflow-x-auto custom-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleDragEnd}
            >
              {taskColumns.map((col, index) => {
                const columnTasks = getTasksByColumn(col);
                return (
                  <React.Fragment key={col.id}>
                    <div
                      className={`flex-1 max-w-[480px] min-w-[320px] flex flex-col rounded-[4px] shadow-2xl ${col.bgColor} p-4 md:p-6 my-2 md:my-4 transition-all duration-300 border border-surface-200 dark:border-slate-700/50 hover:shadow-primary-500/10 hover:-translate-y-1 group/column`}
                    >
                      <div className="flex items-start justify-between mb-4 md:mb-6 px-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm animate-pulse ${col.id === 'done' ? 'bg-emerald-500' : 'bg-primary-500'}`}></div>
                            <h3 className="font-bold text-surface-900 dark:text-white text-lg tracking-tight group-hover/column:text-primary-600 dark:group-hover/column:text-primary-400 transition-colors">
                              {col.label}
                            </h3>
                            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900/50 flex items-center justify-center text-[10px] font-bold shadow-sm text-surface-600 dark:text-slate-300 ml-1">
                              {columnTasks.length}
                            </div>
                          </div>
                          <p className="text-xs text-surface-500 dark:text-slate-400 font-medium">
                            {col.description}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setNewTaskStatus(col.statuses[0]);
                            setShowCreateTask(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded bg-white dark:bg-slate-700/50 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-primary-100/50 dark:border-primary-900/20 text-[10px] font-bold uppercase tracking-wider group/add"
                          title="Add Task"
                        >
                          <FiPlus className="w-4 h-4 transition-transform group-hover/add:rotate-90" />
                          <span className="hidden sm:inline">Add Card</span>
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
                      <SortableContext
                        items={columnTasks.map((t) => t._id)}
                        strategy={verticalListSortingStrategy}
                        id={col.id}
                      >
                        {columnTasks.map((task) => (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onClick={() => {
                              setSelectedTask(task);
                              setShowDetailModal(true);
                            }}
                          />
                        ))}
                      </SortableContext>
                      {columnTasks.length === 0 && !tasksLoading && (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-fade-in px-4">
                          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 transform transition-transform hover:rotate-12">
                            {col.id === 'todos' ? (
                              <FiEdit3 className="w-8 h-8 text-primary-500" />
                            ) : (
                              <FiCheckSquare className="w-8 h-8 text-emerald-500" />
                            )}
                          </div>
                          <h4 className="text-surface-900 dark:text-white font-bold mb-2">
                            {col.id === 'todos' ? "Your board is empty" : "No results yet"}
                          </h4>
                          <p className="text-xs text-surface-500 dark:text-slate-400 font-medium max-w-[200px] leading-relaxed">
                            {col.id === 'todos' 
                              ? "Hey, what's on your mind today? Add your first task and let's get started!" 
                              : "Get things done to see them here. Let's finish something today!"}
                          </p>
                          {col.id === 'todos' && (
                            <button
                              onClick={() => {
                                setNewTaskStatus('todo');
                                setShowCreateTask(true);
                              }}
                              className="mt-6 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded font-bold text-xs shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                            >
                              Add First Task
                            </button>
                          )}
                        </div>
                      )}
                      {tasksLoading && (
                        <div className="skeleton rounded-2xl h-40 w-full opacity-50"></div>
                      )}
                    </div>
                    </div>
                    {/* Visual Bridge / Divider between columns */}
                    {index === 0 && (
                      <div className="hidden xl:flex flex-col items-center justify-center py-12 px-2">
                        <div className="h-full w-px bg-gradient-to-b from-transparent via-primary-300/30 to-transparent"></div>
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-primary-100 dark:border-slate-700 flex items-center justify-center my-4 relative">
                          <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20"></div>
                          <FiZap className="w-5 h-5 text-primary-500 relative z-10" />
                        </div>
                        <div className="h-full w-px bg-gradient-to-b from-transparent via-primary-300/30 to-transparent"></div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </DndContext>
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
        {showDetailModal && selectedTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[4px] shadow-2xl overflow-hidden flex flex-col border border-primary-100 dark:border-slate-700 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cover Image */}
              {selectedTask.images && selectedTask.images.length > 0 && (
                <div className="w-full h-[240px] relative shrink-0">
                  <img 
                    src={selectedTask.images[0]} 
                    alt="Task Cover" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-3xl font-black text-white leading-tight drop-shadow-lg">
                      {selectedTask.title}
                    </h2>
                  </div>
                </div>
              )}

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-primary-50 dark:border-slate-700 bg-surface-50/30 dark:bg-slate-800/50">
                {!selectedTask.images?.length && (
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white truncate pr-4">
                    {selectedTask.title}
                  </h2>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={async () => {
                      if (confirm('Delete this task?')) {
                        await deleteTask(selectedTask._id);
                        setShowDetailModal(false);
                      }
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 rounded transition-colors"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-surface-100 dark:hover:bg-slate-700 text-surface-400 rounded transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row h-full">
                  
                  {/* Left Column - Main Content */}
                  <div className="flex-1 p-6 md:p-8 space-y-8 border-r border-primary-50 dark:border-slate-700/50">
                    <div>
                      <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-4 block">Description</span>
                      <p className="text-surface-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedTask.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Comments Section */}
                    <div className="pt-6 border-t border-primary-50 dark:border-slate-700">
                      <h4 className="text-sm font-bold dark:text-white mb-6 flex items-center gap-2">
                        <FiMessageCircle className="w-4 h-4 text-primary-500" />
                        Activity & Comments
                        <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 px-2 py-0.5 rounded">
                          {selectedTask.comments.length}
                        </span>
                      </h4>
                      
                      <div className="space-y-6 mb-8">
                        {selectedTask.comments.map((c, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex-shrink-0 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 text-xs">
                              {getInitials(c.user?.name || 'U')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-surface-900 dark:text-white">{c.user?.name}</span>
                                <span className="text-[10px] font-medium text-surface-400 dark:text-slate-500">• {timeAgo(c.createdAt)}</span>
                              </div>
                              <div className="bg-surface-50 dark:bg-slate-700/50 rounded p-3 text-xs text-surface-600 dark:text-slate-300 leading-relaxed">
                                {renderCommentText(c.text)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="relative">
                        {showMentionList && (
                          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-primary-100 dark:border-slate-700 rounded shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar animate-scale-in">
                            <div className="p-2 border-b border-primary-50 dark:border-slate-700 text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                              Mention User
                            </div>
                            {users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase())).map(user => (
                              <button
                                key={user._id}
                                onClick={() => handleSelectMention(user)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-left transition-colors"
                              >
                                <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center text-[10px] text-white font-bold">
                                  {getInitials(user.name)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-surface-900 dark:text-white">{user.name}</span>
                                  <span className="text-[10px] text-surface-400 dark:text-slate-500">{user.email}</span>
                                </div>
                              </button>
                            ))}
                            {users.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase())).length === 0 && (
                              <div className="p-4 text-xs text-surface-400 italic text-center">
                                No users found
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 py-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={handleCommentChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2 rounded bg-surface-50 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 text-sm outline-none focus:ring-1 focus:ring-primary-500 dark:text-white transition-all"
                          />
                          <button
                            onClick={handleAddComment}
                            disabled={!commentText.trim()}
                            className="px-6 py-2 bg-primary-600 text-white rounded text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50 shadow-sm shadow-primary-500/20"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Sidebar Info */}
                  <div className="w-full md:w-80 p-6 md:p-8 bg-surface-50/20 dark:bg-slate-900/10 space-y-8">
                    {/* Status & Priority Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Status</span>
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${selectedTask.status === 'done' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'}`}>
                          {selectedTask.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Priority</span>
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-3 block">Assignees</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.assignees.map((a) => (
                          <div key={a._id} className="flex items-center gap-2 bg-white dark:bg-slate-800 pr-3 pl-1 py-1 rounded border border-primary-100 dark:border-slate-700 shadow-sm">
                            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center text-white font-bold text-[10px] overflow-hidden">
                              {a.avatar ? <img src={a.avatar} alt={a.name} className="w-full h-full object-cover" /> : getInitials(a.name)}
                            </div>
                            <span className="text-[11px] font-bold text-surface-700 dark:text-slate-200">{a.name}</span>
                          </div>
                        ))}
                        {!selectedTask.assignees.length && <span className="text-xs text-surface-400 italic">No assignees</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block">Deadline</span>
                      <div className="flex items-center gap-2 text-surface-900 dark:text-white font-bold text-xs ring-1 ring-primary-100 dark:ring-slate-700 p-3 rounded bg-white dark:bg-slate-800/50 shadow-sm">
                        <FiCalendar className="w-4 h-4 text-primary-500" />
                        {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No deadline set'}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-3 block">Tags</span>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(selectedTask.tags || []).map((tag) => (
                          <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase tracking-tight">
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 flex items-center">
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
                          placeholder="Add tag..."
                          className="flex-1 min-w-0 px-3 py-1.5 rounded bg-white dark:bg-slate-800 border border-primary-100 dark:border-slate-700 text-[10px] outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                        />
                        <button
                          onClick={handleAddTag}
                          className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-[10px] font-bold hover:bg-primary-100 dark:hover:bg-primary-900/50"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-3 block">Attachments</span>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {(selectedTask.images || []).map((img, i) => (
                          <div key={i} className="relative group aspect-square rounded overflow-hidden border border-primary-100 dark:border-slate-700">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleRemoveImage(img)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <FiX className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded border-2 border-dashed border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-[10px] font-bold cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                        <FiUpload className="w-3.5 h-3.5" />
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Board Panel */}
        {showBoardPanel && (
          <div className="fixed inset-0 z-50 flex animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBoardPanel(false)}></div>
            
            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl border-l border-primary-100 dark:border-slate-700 p-6 flex flex-col animate-slide-in-right">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-white">Your Boards</h2>
                <button onClick={() => setShowBoardPanel(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-slate-700 text-surface-400 rounded transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 block">
                {boards.map((b) => (
                  <div key={b._id} className={`group flex items-center justify-between p-3 rounded border transition-all ${activeBoard?._id === b._id ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-800 border-surface-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-slate-600'}`}>
                    <button onClick={() => { setActiveBoard(b); setShowBoardPanel(false); }} className="flex-1 text-left font-semibold text-sm text-surface-800 dark:text-slate-200">
                      {b.name}
                    </button>
                    <button onClick={() => { if(confirm('Delete board?')) deleteBoard(b._id); }} className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-auto border-t border-primary-50 dark:border-slate-700">
                <button onClick={() => { setShowCreateBoard(true); setShowBoardPanel(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-surface-100 dark:bg-slate-700 text-surface-700 dark:text-slate-300 rounded font-bold text-sm hover:bg-surface-200 dark:hover:bg-slate-600 transition-colors">
                  <FiPlus className="w-4 h-4" /> Create New Board
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}
