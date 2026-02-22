
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Task, TaskStatus, UserRole, TaskProposal, Family, SideQuest, SideQuestStatus } from '../types';
import { LEVEL_THRESHOLDS, MONSTERS } from '../constants';
import { api, setToken, ApiUser } from '../services/api';

interface GameContextType {
  users: User[];
  familyUsers: User[];
  tasks: Task[];
  proposals: TaskProposal[];
  sideQuests: SideQuest[];
  currentFamily: Family | null;
  currentUser: User | null;
  loading: boolean;

  // Auth & Family
  login: (name: string, password: string) => Promise<boolean>;
  register: (name: string, password: string) => Promise<void>;
  createFamily: (familyName: string) => Promise<void>;
  joinFamily: (code: string) => Promise<boolean>;
  logout: () => void;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  resetApp: () => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'createdBy' | 'familyId'>) => Promise<void>;
  editTask: (taskId: string, data: { title?: string; description?: string; basePoints?: number; userPointsOverride?: Record<string, number>; bookingDeadline?: number; completionDeadline?: number }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  claimTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  verifyTask: (taskId: string) => Promise<void>;
  getPotentialPoints: (task: Task, userId: string) => number;

  // Proposals
  addProposal: (title: string, description: string, points: number) => Promise<void>;
  rejectProposal: (id: string) => Promise<void>;
  approveProposal: (proposal: TaskProposal, overrides: Record<string, number>, finalPoints: number) => Promise<void>;

  // Side Quests
  addSideQuest: (assignedTo: string, title: string, description: string, durationHours: number) => Promise<void>;
  respondToSideQuest: (questId: string, accepted: boolean) => Promise<void>;
  completeSideQuest: (questId: string) => Promise<void>;
  deleteSideQuest: (questId: string) => Promise<void>;

  // Boss Logic
  isTaskLockedForUser: (task: Task, userId: string) => { locked: boolean; reason?: string; requiredPoints?: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

function apiUserToUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    role: u.role as UserRole,
    score: u.score,
    avatar: u.avatar,
    level: u.level,
    familyId: u.familyId || undefined,
  };
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [familyUsers, setFamilyUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proposals, setProposals] = useState<TaskProposal[]>([]);
  const [sideQuests, setSideQuests] = useState<SideQuest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh all data from server
  const refreshData = useCallback(async () => {
    try {
      const [familyData, taskList, proposalList, sideQuestList] = await Promise.all([
        api.families.current(),
        api.tasks.list(),
        api.proposals.list(),
        api.sideQuests.list(),
      ]);

      if (familyData.family) {
        setCurrentFamily({
          id: familyData.family.id,
          name: familyData.family.name,
          inviteCode: familyData.family.inviteCode,
          members: familyData.members.map(m => m.id),
        });
        setFamilyUsers(familyData.members.map(apiUserToUser));
      } else {
        setCurrentFamily(null);
        setFamilyUsers([]);
      }

      setTasks(taskList.map(t => ({
        ...t,
        status: t.status as TaskStatus,
        assigneeId: t.assigneeId || undefined,
        userPointsOverride: t.userPointsOverride || {},
      })));

      setProposals(proposalList as TaskProposal[]);

      setSideQuests(sideQuestList.map(sq => ({
        ...sq,
        status: sq.status as SideQuestStatus,
      })));
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);

  // On mount: check for saved token and restore session
  useEffect(() => {
    const token = localStorage.getItem('fq_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.auth.me()
      .then(async (userData) => {
        setCurrentUser(apiUserToUser(userData));
        await refreshData();
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for updates every 10 seconds when logged in with a family
  useEffect(() => {
    if (!currentUser?.familyId) return;
    const interval = setInterval(async () => {
      try {
        const userData = await api.auth.me();
        setCurrentUser(apiUserToUser(userData));
        await refreshData();
      } catch {
        // silently ignore polling errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser?.familyId, refreshData]);

  // --- ACTIONS ---

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await api.auth.login(name, password);
      setToken(token);
      setCurrentUser(apiUserToUser(user));
      await refreshData();
      return true;
    } catch {
      return false;
    }
  };

  const register = async (name: string, password: string) => {
    try {
      const { token, user } = await api.auth.register(name, password);
      setToken(token);
      setCurrentUser(apiUserToUser(user));
    } catch (err: any) {
      alert(err.message || 'Registrering misslyckades');
    }
  };

  const createFamily = async (familyName: string) => {
    try {
      const { family, user } = await api.families.create(familyName);
      setCurrentUser(apiUserToUser(user));
      setCurrentFamily({
        id: family.id,
        name: family.name,
        inviteCode: family.inviteCode,
        members: [user.id],
      });
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Kunde inte skapa familj');
    }
  };

  const joinFamily = async (code: string): Promise<boolean> => {
    try {
      const { family, user } = await api.families.join(code);
      setCurrentUser(apiUserToUser(user));
      setCurrentFamily({
        id: family.id,
        name: family.name,
        inviteCode: family.inviteCode,
        members: [],
      });
      await refreshData();
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    setCurrentFamily(null);
    setFamilyUsers([]);
    setTasks([]);
    setProposals([]);
    setSideQuests([]);
  };

  const resetApp = () => {
    logout();
    window.location.reload();
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    await api.families.updateUserRole(userId, role);
    await refreshData();
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'createdBy' | 'familyId'>) => {
    await api.tasks.create({
      title: taskData.title,
      description: taskData.description,
      basePoints: taskData.basePoints,
      userPointsOverride: taskData.userPointsOverride,
      bookingDeadline: taskData.bookingDeadline,
      completionDeadline: taskData.completionDeadline,
      isBossTask: taskData.isBossTask,
    });
    await refreshData();
  };

  const editTask = async (taskId: string, data: { title?: string; description?: string; basePoints?: number; userPointsOverride?: Record<string, number>; bookingDeadline?: number; completionDeadline?: number }) => {
    await api.tasks.update(taskId, data);
    await refreshData();
  };

  const deleteTask = async (taskId: string) => {
    await api.tasks.delete(taskId);
    await refreshData();
  };

  const claimTask = async (taskId: string) => {
    await api.tasks.claim(taskId);
    await refreshData();
  };

  const getPotentialPoints = (task: Task, userId: string): number => {
    return task.userPointsOverride[userId] ?? task.basePoints;
  };

  const isTaskLockedForUser = (task: Task, userId: string): { locked: boolean; reason?: string; requiredPoints?: number } => {
    const user = familyUsers.find(u => u.id === userId);
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

  const completeTask = async (taskId: string) => {
    await api.tasks.complete(taskId);
    const userData = await api.auth.me();
    setCurrentUser(apiUserToUser(userData));
    await refreshData();
  };

  const verifyTask = async (taskId: string) => {
    await api.tasks.verify(taskId);
    await refreshData();
  };

  const addProposal = async (title: string, description: string, points: number) => {
    await api.proposals.create({ title, description, suggestedPoints: points });
    await refreshData();
  };

  const rejectProposal = async (id: string) => {
    await api.proposals.reject(id);
    await refreshData();
  };

  const approveProposal = async (proposal: TaskProposal, overrides: Record<string, number>, finalPoints: number) => {
    await api.proposals.approve(proposal.id, finalPoints, overrides);
    await refreshData();
  };

  const addSideQuest = async (assignedTo: string, title: string, description: string, durationHours: number) => {
    await api.sideQuests.create({ assignedTo, title, description, durationHours });
    await refreshData();
  };

  const respondToSideQuest = async (questId: string, accepted: boolean) => {
    await api.sideQuests.respond(questId, accepted);
    await refreshData();
  };

  const completeSideQuest = async (questId: string) => {
    await api.sideQuests.complete(questId);
    await refreshData();
  };

  const deleteSideQuest = async (questId: string) => {
    await api.sideQuests.delete(questId);
    await refreshData();
  };

  return (
    <GameContext.Provider value={{
      users: familyUsers,
      familyUsers,
      tasks,
      proposals,
      sideQuests,
      currentUser,
      currentFamily,
      loading,
      login,
      register,
      createFamily,
      joinFamily,
      logout,
      updateUserRole,
      addTask,
      editTask,
      deleteTask,
      claimTask,
      completeTask,
      verifyTask,
      getPotentialPoints,
      addProposal,
      rejectProposal,
      approveProposal,
      addSideQuest,
      respondToSideQuest,
      completeSideQuest,
      deleteSideQuest,
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
