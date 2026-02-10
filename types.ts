
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  members: string[]; // User IDs
}

export interface User {
  id: string;
  name: string;
  password?: string; // Simple password for demo
  familyId?: string;
  role: UserRole;
  score: number;
  avatar: string;
  level: number;
}

export enum TaskStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED'
}

export enum SideQuestStatus {
  PENDING = 'PENDING', // Waiting for user to see popup
  ACTIVE = 'ACTIVE',   // User accepted
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface SideQuest {
  id: string;
  familyId: string;
  assignedTo: string; // User ID
  title: string;
  description: string;
  status: SideQuestStatus;
  createdAt: number;
  expiresAt: number;
}

export interface Task {
  id: string;
  familyId: string;
  title: string;
  description: string;
  basePoints: number;
  // Specific points per user ID
  userPointsOverride: Record<string, number>;
  status: TaskStatus;
  assigneeId?: string;
  createdBy: string;
  createdAt: number;
  // Unix timestamp for when the task is no longer bookable
  bookingDeadline: number;
  // Unix timestamp for when the task must be completed
  completionDeadline: number;
  isBossTask?: boolean; // Required to pass a boss level
}

export interface TaskProposal {
  id: string;
  familyId: string;
  title: string;
  description: string;
  suggestedPoints: number;
  proposedBy: string; // User ID
  createdAt: number;
}

export interface Monster {
  level: number;
  name: string;
  image: string;
  minScore: number;
  minTaskValue: number; // Minimum points a task must be worth to break through this monster
  description: string;
}

export interface GameState {
  users: User[];
  tasks: Task[];
  currentUser: User | null;
}
