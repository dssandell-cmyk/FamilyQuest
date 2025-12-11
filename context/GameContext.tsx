import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task, TaskStatus, UserRole, TaskProposal, Family } from '../types';
import { LEVEL_THRESHOLDS, MONSTERS } from '../constants';

interface GameContextType {
  users: User[]; // All users (filtered by family in UI usually, but accessible)
  familyUsers: User[]; // Users in current family
  tasks: Task[]; // Tasks for current family
  proposals: TaskProposal[]; // Proposals for current family
  currentFamily: Family | null;
  currentUser: User | null;
  
  // Auth & Family
  login: (name: string, password: string) => boolean;
  register: (name: string, password: string) => void;
  createFamily: (familyName: string) => void;
  joinFamily: (code: string) => boolean;
  logout: () => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  resetApp: () => void; // New function to clear data

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'createdBy' | 'familyId'>) => void;
  claimTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  verifyTask: (taskId: string) => void;
  getPotentialPoints: (task: Task, userId: string) => number;
  
  // Proposals
  addProposal: (title: string, description: string, points: number) => void;
  rejectProposal: (id: string) => void;
  approveProposal: (proposal: TaskProposal, overrides: Record<string, number>, finalPoints: number) => void;

  // Boss Logic
  isTaskLockedForUser: (task: Task, userId: string) => { locked: boolean; reason?: string; requiredPoints?: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Helper to generate code
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fq_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [families, setFamilies] = useState<Family[]>(() => {
    const saved = localStorage.getItem('fq_families');
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('fq_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [proposals, setProposals] = useState<TaskProposal[]>(() => {
    const saved = localStorage.getItem('fq_proposals');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fq_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- SYNC & PERSISTENCE ---

  // 1. Listen for cross-tab changes (Storage Events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'fq_users' && e.newValue) setUsers(JSON.parse(e.newValue));
      if (e.key === 'fq_families' && e.newValue) setFamilies(JSON.parse(e.newValue));
      if (e.key === 'fq_tasks' && e.newValue) setTasks(JSON.parse(e.newValue));
      if (e.key === 'fq_proposals' && e.newValue) setProposals(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 2. Persist state to local storage when it changes in THIS tab
  useEffect(() => { localStorage.setItem('fq_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('fq_families', JSON.stringify(families)); }, [families]);
  useEffect(() => { localStorage.setItem('fq_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('fq_proposals', JSON.stringify(proposals)); }, [proposals]);
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('fq_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('fq_current_user');
    }
  }, [currentUser]);

  // 3. CRITICAL: Keep currentUser in sync with the source of truth (users array)
  useEffect(() => {
    if (!currentUser) return;
    
    const freshUser = users.find(u => u.id === currentUser.id);
    if (freshUser) {
        // Update if role, score or other vital info changed
        if (freshUser.role !== currentUser.role || freshUser.score !== currentUser.score) {
            console.log("Syncing current user from DB...", freshUser.role);
            setCurrentUser(freshUser);
        }
    }
  }, [users, currentUser]); // Dependent on users array changing

  // --- DERIVED STATE ---

  const currentFamily = currentUser?.familyId 
    ? families.find(f => f.id === currentUser.familyId) || null
    : null;

  const familyUsers = currentUser?.familyId
    ? users.filter(u => u.familyId === currentUser.familyId)
    : [];

  const familyTasks = currentUser?.familyId
    ? tasks.filter(t => t.familyId === currentUser.familyId)
    : [];
  
  const familyProposals = currentUser?.familyId
    ? proposals.filter(p => p.familyId === currentUser.familyId)
    : [];

  // --- ACTIONS ---

  const login = (name: string, password: string): boolean => {
    // Check state first (fresher), then storage
    const user = users.find((u: User) => u.name.toLowerCase() === name.toLowerCase() && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const register = (name: string, password: string) => {
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        alert("Användarnamnet är upptaget");
        return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      password,
      role: UserRole.MEMBER, 
      score: 0,
      level: 1,
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const createFamily = (familyName: string) => {
    if (!currentUser) return;
    
    const newFamily: Family = {
      id: Date.now().toString(),
      name: familyName,
      inviteCode: generateCode(),
      members: [currentUser.id]
    };

    setFamilies(prev => [...prev, newFamily]);
    
    const updatedUser = { ...currentUser, familyId: newFamily.id, role: UserRole.ADMIN };
    // Update local state immediately
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const joinFamily = (code: string): boolean => {
    if (!currentUser) return false;
    
    const family = families.find(f => f.inviteCode === code);
    if (family) {
      const updatedUser = { ...currentUser, familyId: family.id, role: UserRole.MEMBER };
      
      // First member becomes admin automatically
      if (family.members.length === 0) updatedUser.role = UserRole.ADMIN;

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      
      setFamilies(prev => prev.map(f => 
        f.id === family.id 
          ? { ...f, members: [...f.members, currentUser.id] }
          : f
      ));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const resetApp = () => {
    localStorage.removeItem('fq_users');
    localStorage.removeItem('fq_families');
    localStorage.removeItem('fq_tasks');
    localStorage.removeItem('fq_proposals');
    localStorage.removeItem('fq_current_user');
    setUsers([]);
    setFamilies([]);
    setTasks([]);
    setProposals([]);
    setCurrentUser(null);
    window.location.reload();
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    // Force immediate update
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role } : u);
    setUsers(updatedUsers);
    
    // Explicitly update storage immediately to ensure cross-tab sync works instantly
    localStorage.setItem('fq_users', JSON.stringify(updatedUsers));
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'createdBy' | 'familyId'>) => {
    if (!currentUser || !currentUser.familyId) return;
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      familyId: currentUser.familyId,
      createdAt: Date.now(),
      status: TaskStatus.OPEN,
      createdBy: currentUser.id,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const claimTask = (taskId: string) => {
    if (!currentUser) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: TaskStatus.ASSIGNED, assigneeId: currentUser.id };
      }
      return t;
    }));
  };

  const getPotentialPoints = (task: Task, userId: string): number => {
    return task.userPointsOverride[userId] ?? task.basePoints;
  };

  const isTaskLockedForUser = (task: Task, userId: string): { locked: boolean; reason?: string; requiredPoints?: number } => {
    const user = users.find(u => u.id === userId);
    if (!user) return { locked: false };

    const monsters = Object.values(MONSTERS).sort((a, b) => a.minScore - b.minScore);
    const nextMonster = monsters.find(m => m.minScore > user.score);

    if (nextMonster) {
      const distance = nextMonster.minScore - user.score;
      if (distance <= 10) {
        const potentialPoints = getPotentialPoints(task, userId);
        if (potentialPoints < nextMonster.minTaskValue) {
          return { 
            locked: true, 
            reason: `Du närmar dig ${nextMonster.name}! För att passera måste du göra ett uppdrag värt minst ${nextMonster.minTaskValue} poäng.`,
            requiredPoints: nextMonster.minTaskValue
          };
        }
      }
    }
    return { locked: false };
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: TaskStatus.VERIFIED } : t
    ));

    const task = tasks.find(t => t.id === taskId);
    if (task && task.assigneeId) {
      const points = getPotentialPoints(task, task.assigneeId);
      
      setUsers(prev => prev.map(u => {
        if (u.id === task.assigneeId) {
          const newScore = u.score + points;
          let newLevel = 1;
          for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
             if (newScore >= LEVEL_THRESHOLDS[i]) newLevel = i + 1;
          }
          return { ...u, score: newScore, level: newLevel };
        }
        return u;
      }));
    }
  };

  const verifyTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: TaskStatus.VERIFIED } : t
      ));
  };

  const addProposal = (title: string, description: string, points: number) => {
    if (!currentUser || !currentUser.familyId) return;
    const newProposal: TaskProposal = {
      id: Date.now().toString(),
      familyId: currentUser.familyId,
      title,
      description,
      suggestedPoints: points,
      proposedBy: currentUser.id,
      createdAt: Date.now()
    };
    setProposals(prev => [newProposal, ...prev]);
  };

  const rejectProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const approveProposal = (proposal: TaskProposal, overrides: Record<string, number>, finalPoints: number) => {
    addTask({
      title: proposal.title,
      description: proposal.description,
      basePoints: finalPoints,
      userPointsOverride: overrides,
      bookingDeadline: Date.now() + 86400000, 
      completionDeadline: Date.now() + 172800000
    });
    rejectProposal(proposal.id);
  };

  return (
    <GameContext.Provider value={{ 
      users,
      familyUsers,
      tasks: familyTasks, 
      proposals: familyProposals,
      currentUser,
      currentFamily,
      login, 
      register,
      createFamily,
      joinFamily,
      logout, 
      updateUserRole,
      addTask, 
      claimTask, 
      completeTask,
      verifyTask,
      getPotentialPoints,
      addProposal,
      rejectProposal,
      approveProposal,
      isTaskLockedForUser,
      resetApp
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};