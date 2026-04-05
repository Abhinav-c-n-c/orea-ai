// User types
export interface IPermissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManagePermissions: boolean;
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canAssignTask: boolean;
  canCreateNotes: boolean;
  canEditNotes: boolean;
  canDeleteNotes: boolean;
  canAccessChat: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'member';

export interface IBoard {
  _id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: IPermissions;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthResponse {
  user: IUser;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Task types
export type TaskStatus = 'to_discuss' | 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface IComment {
  _id: string;
  user: IUser;
  text: string;
  mentions?: string[];
  createdAt: string;
}

export interface ITask {
  _id: string;
  boardId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: IUser[];
  createdBy: IUser;
  tags: string[];
  images: string[];
  dueDate?: string;
  comments: IComment[];
  links: number;
  activities?: IActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export interface IActivityLog {
  _id: string;
  taskId: string;
  userId: IUser;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

// Note types
export interface IEditHistory {
  content: string;
  editedBy: IUser;
  editedAt: string;
}

export interface INote {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  author: IUser;
  editHistory: any[];
  visibility: 'public' | 'private';
  mentions: (string | IUser)[];
  linkedTasks: (string | ITask)[];
  lastModifiedBy?: IUser;
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface IMessage {
  _id: string;
  sender: IUser;
  receiver: IUser;
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  mediaUrl?: string;
  encrypted?: boolean;
  delivered: boolean;
  read: boolean;
  readAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  conversationId: string;
  otherUser: IUser;
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
    read: boolean;
  };
  unreadCount: number;
}

// Dashboard types
export interface IDashboardStats {
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  notes: { total: number };
  messages: { total: number };
  recentActivity: IActivityLog[];
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: unknown;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
