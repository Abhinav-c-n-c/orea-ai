'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Trash2, Edit3, Save, Tag, Calendar, 
  CheckCircle2, ChevronRight, Hash, AtSign, 
  List, Bold, Italic, Link as LinkIcon, 
  Clock, Lock, Zap, Image as ImageIcon, Table, Link2
} from 'lucide-react';
import Header from '../../../components/Header';
import { useNoteStore } from '../../../store/noteStore';
import { useUserStore } from '../../../store/userStore';
import { useTaskStore } from '../../../store/taskStore';
import { INote, IUser, ITask } from '../../../types';
import { formatDate, getInitials, timeAgo } from '../../../utils/formatters';

export default function NotesPage() {
  const { 
    notes, selectedNote, isLoading, fetchNotes, 
    createNote, updateNote, deleteNote, setSelectedNote, fetchNoteById 
  } = useNoteStore();
  const { users, fetchUsers } = useUserStore();
  const { tasks, fetchTasks } = useTaskStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [showTagPopover, setShowTagPopover] = useState<'user' | 'task' | null>(null);
  const [tagFilter, setTagFilter] = useState('');
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ r: 0, c: 0 });
  const [inputRows, setInputRows] = useState(3);
  const [inputCols, setInputCols] = useState(3);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchNotes(searchTerm ? { search: searchTerm } : {});
    fetchUsers();
    fetchTasks();
  }, [searchTerm]);

  const handleSelectNote = async (note: INote) => {
    await fetchNoteById(note._id);
    setIsEditing(false);
  };

  const handleCreateNote = async () => {
    await createNote({ 
      title: 'Untitled Note', 
      content: '', 
      tags: [],
      visibility: 'public'
    });
  };

  const handleStartEdit = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setEditTags(selectedNote.tags.join(', '));
    setMentionedUserIds(selectedNote.mentions?.map(m => typeof m === 'string' ? m : (m as IUser)._id) || []);
    setLinkedTaskIds(selectedNote.linkedTasks?.map(t => typeof t === 'string' ? t : (t as ITask)._id) || []);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    await updateNote(selectedNote._id, {
      title: editTitle,
      content: editContent,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      mentions: mentionedUserIds,
      linkedTasks: linkedTaskIds
    });
    setIsEditing(false);
    await fetchNoteById(selectedNote._id);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setEditContent(value);
    
    // Mention detection
    const cursor = e.target.selectionStart;
    const textBefore = value.slice(0, cursor);
    const lastWord = textBefore.split(/\s/).pop() || '';
    
    if (lastWord.startsWith('@')) {
      setShowTagPopover('user');
      setTagFilter(lastWord.slice(1));
    } else if (lastWord.startsWith('#')) {
      setShowTagPopover('task');
      setTagFilter(lastWord.slice(1));
    } else {
      setShowTagPopover(null);
    }
  };

  const insertTag = (type: 'user' | 'task', item: IUser | ITask) => {
    const cursor = contentRef.current?.selectionStart || 0;
    const textBefore = editContent.slice(0, cursor);
    const textAfter = editContent.slice(cursor);
    const words = textBefore.split(/\s/);
    words.pop(); // Remove the @ or # trigger word
    
    const tagName = type === 'user' ? (item as IUser).name : (item as ITask).title;
    const newTextBefore = [...words, `${type === 'user' ? '@' : '#'}${tagName} `].join(' ');
    
    setEditContent(newTextBefore + textAfter);
    if (type === 'user') {
      setMentionedUserIds(prev => [...new Set([...prev, item._id])]);
    } else {
      setLinkedTaskIds(prev => [...new Set([...prev, item._id])]);
    }
    setShowTagPopover(null);
  };

  const insertToolText = (tool: string) => {
    const cursor = contentRef.current?.selectionStart || 0;
    const textBefore = editContent.slice(0, cursor);
    const textAfter = editContent.slice(cursor);
    let toolText = '';

    switch (tool) {
      case 'bold': toolText = '**bold text**'; break;
      case 'italic': toolText = '_italic text_'; break;
      case 'list': toolText = '\n- list item'; break;
      case 'image': toolText = '![alt text](image_url)'; break;
      case 'link': toolText = '[link text](url)'; break;
      case 'table': toolText = '\n| Title | Header |\n|-------|--------|\n| Content | Data |'; break;
      default: break;
    }

    setEditContent(textBefore + toolText + textAfter);
  };

  const insertTable = (rows: number, cols: number) => {
    const cursor = contentRef.current?.selectionStart || 0;
    const textBefore = editContent.slice(0, cursor);
    const textAfter = editContent.slice(cursor);
    
    let table = '\n|' + Array(cols).fill(' ').join('|') + '|\n';
    table += '|' + Array(cols).fill('--------').join('|') + '|\n';
    for (let i = 0; i < rows - 1; i++) {
      table += '|' + Array(cols).fill(' ').join('|') + '|\n';
    }
    
    setEditContent(textBefore + table + textAfter);
    setShowTableSelector(false);
  };

  const renderRichText = (text: string) => {
    if (!text) return <p className="text-surface-400 italic">Start writing...</p>;
    
    let processed = text;
    
    // Process Tables first
    const tableRegex = /(\|.*\|(?:\r?\n\|.*\|)*)/g;
    processed = processed.replace(tableRegex, (match) => {
      const rowsArray = match.trim().split('\n');
      if (rowsArray.length < 3) return match;
      
      let html = '<table class="w-full border-collapse my-4 border bg-white dark:bg-slate-900">';
      rowsArray.forEach((row, idx) => {
        const actualCells = row.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
        
        if (row.includes('---')) return; // Skip separator row
        
        html += '<tr>';
        actualCells.forEach(cell => {
          const tag = idx === 0 ? 'th' : 'td';
          html += `<${tag} class="border p-2">${cell}</${tag}>`;
        });
        html += '</tr>';
      });
      html += '</table>';
      return html;
    });

    // Simple regex for @users and #tasks
    processed = processed.replace(/(@\w+(?:\s\w+)*)/g, '<span class="font-bold text-primary-600 dark:text-primary-400">$1</span>');
    processed = processed.replace(/(#\w+(?:\s\w+)*)/g, '<span class="font-bold text-emerald-600 dark:text-emerald-400">$1</span>');
    
    // Final newline processing
    const finalHtml = processed.split('</table>').map((part, i, arr) => {
      if (i === arr.length - 1 && !part) return '';
      return part.replace(/\n/g, '<br/>');
    }).join('</table>');

    return <div dangerouslySetInnerHTML={{ __html: finalHtml }} className="rich-text-content" />;
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6">
      <Header 
        title="Notes" 
        subtitle="Organize your thoughts and sync with tasks." 
        icon={<Edit3 className="w-5 h-5" />}
      />
      
      <div className="flex-1 flex min-h-0 gap-6">
        {/* Left Sidebar - Notes List */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 flex flex-col bg-white dark:bg-slate-900 rounded-[4px] border border-primary-100 dark:border-slate-800 shadow-xl overflow-hidden"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-tighter">Library</h2>
              <button 
                onClick={handleCreateNote}
                className="p-2 bg-primary-600 text-white rounded-[4px] hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search wisdom..."
                className="w-full pl-10 pr-4 py-3 rounded-[4px] bg-surface-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-100 focus:bg-white dark:focus:bg-slate-800 text-sm outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {notes.map(note => (
                <motion.div
                  key={note._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => handleSelectNote(note)}
                  className={`p-4 rounded-[4px] cursor-pointer transition-all border-2 ${
                    selectedNote?._id === note._id 
                      ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500 shadow-md' 
                      : 'bg-transparent border-transparent hover:bg-surface-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold text-surface-400 dark:text-slate-500 uppercase tracking-widest">{timeAgo(note.updatedAt)}</span>
                    <div className="flex gap-1">
                      {note.visibility === 'private' && <Lock className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                  <h4 className={`font-bold text-sm mb-1 line-clamp-1 transition-colors ${selectedNote?._id === note._id ? 'text-primary-700 dark:text-primary-400' : 'text-surface-900 dark:text-slate-200'}`}>
                    {note.title}
                  </h4>
                  <p className="text-xs text-surface-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 80) : 'Pure emptiness...'}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            {!isLoading && notes.length === 0 && (
              <div className="text-center py-12 px-6">
                <Zap className="w-10 h-10 text-primary-200 mx-auto mb-4" />
                <p className="text-xs text-surface-400 italic">No notes found. Create your first masterpiece.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Content - Editor */}
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 bg-white dark:bg-slate-900 rounded-[4px] border border-primary-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col relative"
        >
          {selectedNote ? (
            <>
              {/* Toolbar Top */}
              <div className="px-8 py-4 border-b border-primary-50 dark:border-slate-800 flex items-center justify-between bg-surface-50/30 dark:bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-primary-50 dark:border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-[10px] font-bold text-surface-500 dark:text-slate-400">SAVED {timeAgo(selectedNote.updatedAt).toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button 
                      onClick={handleStartEdit} 
                      className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-[4px] text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-surface-500 text-sm font-bold hover:text-surface-900 dark:hover:text-white transition-colors">
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave} 
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-[4px] text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                    </div>
                  )}
                  <div className="h-6 w-px bg-surface-100 dark:bg-slate-800 mx-2" />
                  <button 
                    onClick={async () => {
                      if (confirm('Burn this note to the ground?')) {
                        await deleteNote(selectedNote._id);
                        setSelectedNote(null);
                      }
                    }}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-surface-400 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-12 py-10 custom-scrollbar scroll-smooth">
                {isEditing ? (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      placeholder="Title"
                      className="text-2xl font-bold text-surface-900 dark:text-white w-full border-none outline-none bg-transparent placeholder:text-surface-200 dark:placeholder:text-slate-800 tracking-tight" 
                    />
                    
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-surface-50 dark:border-slate-800">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">Tags</label>
                        <div className="relative group">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                          <input 
                            type="text" 
                            value={editTags} 
                            onChange={(e) => setEditTags(e.target.value)} 
                            placeholder="ideas, work, future..."
                            className="w-full pl-12 pr-4 py-3 rounded-[4px] bg-surface-50 dark:bg-slate-800 border border-primary-50 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      {/* Floating Toolbar */}
                      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-[4px] shadow-md border border-primary-100 dark:border-slate-700 mb-4 inline-flex">
                        <button onClick={() => insertToolText('bold')} className="p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg text-surface-500 transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
                        <button onClick={() => insertToolText('italic')} className="p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg text-surface-500 transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
                        <button onClick={() => insertToolText('list')} className="p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg text-surface-500 transition-colors" title="List"><List className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-surface-100 mx-1" />
                        <button onClick={() => insertToolText('image')} className="p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg text-surface-500 transition-colors" title="Embed Image"><ImageIcon className="w-4 h-4" /></button>
                        <button onClick={() => insertToolText('link')} className="p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg text-surface-500 transition-colors" title="Add Link"><Link2 className="w-4 h-4" /></button>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setShowTableSelector(!showTableSelector)} 
                            className={`p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg transition-colors ${showTableSelector ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-surface-500'}`} 
                            title="Insert Table"
                          >
                            <Table className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {showTableSelector && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute left-0 bottom-full mb-2 bg-white dark:bg-slate-800 border border-primary-100 dark:border-slate-700 p-3 rounded-[4px] shadow-2xl z-[60]"
                              >
                                <div className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-2">Select Grid {hoveredGrid.r > 0 ? `${hoveredGrid.r}x${hoveredGrid.c}` : ''}</div>
                                <div className="grid grid-cols-5 gap-1">
                                  {Array.from({ length: 5 }).map((_, r) => (
                                    Array.from({ length: 5 }).map((_, c) => (
                                      <div 
                                        key={`${r}-${c}`}
                                        onMouseEnter={() => setHoveredGrid({ r: r+1, c: c+1 })}
                                        onClick={() => insertTable(r+1, c+1)}
                                        className={`w-4 h-4 rounded-[1px] border cursor-pointer transition-colors ${
                                          r + 1 <= hoveredGrid.r && c + 1 <= hoveredGrid.c 
                                            ? 'bg-primary-500 border-primary-600' 
                                            : 'bg-surface-50 dark:bg-slate-700 border-primary-100 dark:border-slate-600'
                                        }`}
                                      />
                                    ))
                                  ))}
                                </div>
                                
                                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-primary-50 dark:border-slate-700">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Rows</p>
                                      <input 
                                        type="number" 
                                        value={inputRows} 
                                        onChange={(e) => setInputRows(parseInt(e.target.value) || 1)}
                                        className="w-full px-2 py-1.5 bg-surface-50 dark:bg-slate-900 border border-primary-100 dark:border-slate-700 rounded-[4px] text-xs outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Cols</p>
                                      <input 
                                        type="number" 
                                        value={inputCols} 
                                        onChange={(e) => setInputCols(parseInt(e.target.value) || 1)}
                                        className="w-full px-2 py-1.5 bg-surface-50 dark:bg-slate-900 border border-primary-100 dark:border-slate-700 rounded-[4px] text-xs outline-none focus:ring-1 focus:ring-primary-500 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => insertTable(inputRows, inputCols)}
                                    className="w-full py-2 bg-primary-600 text-white rounded-[4px] text-[10px] font-black uppercase tracking-wider hover:bg-primary-700 transition-colors"
                                  >
                                    Insert Custom Table
                                  </button>
                                </div>
                              </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                        <div className="w-px h-4 bg-surface-100 mx-1" />
                        <button className="p-2 hover:bg-surface-50 dark:hover:bg-slate-700 rounded-lg text-surface-500 flex items-center gap-1.5 px-3 transition-colors" title="Link Task">
                          <LinkIcon className="w-4 h-4" /> <span className="text-[10px] font-bold">TASK</span>
                        </button>
                      </div>

                      <textarea 
                        ref={contentRef}
                        value={editContent} 
                        onChange={handleContentChange} 
                        className="w-full min-h-[500px] text-lg text-surface-700 dark:text-slate-300 bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-surface-200 dark:placeholder:text-slate-800" 
                        placeholder="Start your journey here. Use @ for users and # for tasks..." 
                      />

                      {/* Tagging Popover */}
                      <AnimatePresence>
                        {showTagPopover && (
                          <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="absolute z-50 bottom-full left-0 mb-4 w-72 bg-white dark:bg-slate-800 rounded-[4px] shadow-2xl border border-primary-100 dark:border-slate-700 overflow-hidden"
                          >
                            <div className="p-4 bg-surface-50 dark:bg-slate-900 border-b border-primary-50 dark:border-slate-800">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">{showTagPopover === 'user' ? 'Mention User' : 'Link Task'}</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-2">
                              {showTagPopover === 'user' ? (
                                users.filter(u => u.name.toLowerCase().includes(tagFilter.toLowerCase())).map(u => (
                                  <button 
                                    key={u._id}
                                    onClick={() => insertTag('user', u)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all group text-left"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-slate-800 shadow-sm">
                                      {getInitials(u.name)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-primary-600">{u.name}</span>
                                      <span className="text-[10px] text-surface-400">{u.email}</span>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                tasks.filter(t => t.title.toLowerCase().includes(tagFilter.toLowerCase())).map(t => (
                                  <button 
                                    key={t._id}
                                    onClick={() => insertTag('task', t)}
                                    className="w-full p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all group text-left border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                      <span className="text-xs font-bold text-surface-900 dark:text-white group-hover:text-emerald-600 truncate">{t.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-50 px-5">
                                      <span className="text-[9px] font-black uppercase tracking-tighter">{t.status.replace('_', ' ')}</span>
                                      <span className="text-[9px] font-black">•</span>
                                      <span className="text-[9px] font-black uppercase tracking-tighter">{t.priority}</span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
                      {selectedNote.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-4 items-center border-y border-surface-50 dark:border-slate-800 py-6">
                      <div className="flex items-center gap-3 pr-6 border-r border-surface-50 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-[10px]">
                          {getInitials(selectedNote.author?.name || 'U')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Author</span>
                          <span className="text-xs font-bold text-surface-900 dark:text-white">{selectedNote.author?.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pr-6 border-r border-surface-50 dark:border-slate-800">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Updated</span>
                          <span className="text-xs font-bold text-surface-900 dark:text-white">{formatDate(selectedNote.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap ml-auto">
                        {selectedNote.tags?.map(t => (
                          <span key={t} className="px-3 py-1 bg-surface-50 dark:bg-slate-800 text-surface-500 dark:text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary-50 dark:border-slate-700">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-lg text-surface-700 dark:text-slate-300 leading-relaxed max-w-full overflow-hidden">
                      {renderRichText(selectedNote.content)}
                    </div>

                    {/* Metadata Display Concept (Mentions/Tasks linked) */}
                    {(selectedNote.mentions?.length > 0 || selectedNote.linkedTasks?.length > 0) && (
                      <div className="pt-12 space-y-6">
                        <h5 className="text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-50 dark:border-slate-800 pb-2">Connections</h5>
                        <div className="grid md:grid-cols-2 gap-4">
                          {selectedNote.mentions?.map((m) => {
                            const userObj = m as IUser;
                            return (
                              <div key={userObj._id} className="flex items-center gap-3 p-4 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20">
                                <AtSign className="w-4 h-4 text-primary-500" />
                                <span className="text-sm font-bold text-primary-700 dark:text-primary-400">{userObj.name}</span>
                              </div>
                            );
                          })}
                          {selectedNote.linkedTasks?.map((t) => {
                            const taskObj = t as ITask;
                            return (
                              <div key={taskObj._id} className="flex items-center gap-3 p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                                <Hash className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">{taskObj.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 bg-primary-50 dark:bg-slate-800 rounded-[4rem] flex items-center justify-center mb-10 shadow-inner"
              >
                <Edit3 className="w-12 h-12 text-primary-500" />
              </motion.div>
              <h3 className="text-2xl font-black text-surface-900 dark:text-white mb-2 uppercase tracking-tighter">Your Mind's Canvas</h3>
              <p className="text-surface-500 dark:text-slate-400 max-w-sm mb-10 leading-relaxed">
                Select a note from your library or start a fresh one to capture your genius today.
              </p>
              <button 
                onClick={handleCreateNote}
                className="group flex items-center gap-3 px-10 py-4 bg-primary-600 text-white rounded-[4px] font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all shadow-2xl shadow-primary-500/40"
              >
                Start New Note <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
