import React from 'react';
import { Task, TaskStatus } from '../types';
import { useGame } from '../context/GameContext';
import { Button } from './Button';
import { Clock, Trophy, User as UserIcon, AlertCircle, Sparkles, Users, Lock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClaim?: () => void;
  onComplete?: () => void;
  variant?: 'market' | 'admin' | 'my-tasks';
  isLocked?: boolean;
  lockReason?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClaim, onComplete, variant = 'market', isLocked = false, lockReason }) => {
  const { currentUser, getPotentialPoints, users } = useGame();
  
  // Calculate points for the viewer
  const points = currentUser ? getPotentialPoints(task, currentUser.id) : task.basePoints;
  
  // Check if these points are special for this user (override exists and is different from base)
  const hasPersonalOverride = currentUser && 
    task.userPointsOverride[currentUser.id] !== undefined && 
    task.userPointsOverride[currentUser.id] !== task.basePoints;

  // Check if admin has set overrides for anyone (for admin view)
  const hasAnyOverrides = Object.keys(task.userPointsOverride).length > 0;

  const isExpired = Date.now() > task.bookingDeadline && task.status === TaskStatus.OPEN;
  const isOverdue = Date.now() > task.completionDeadline && task.status === TaskStatus.ASSIGNED;
  
  const assignee = users.find(u => u.id === task.assigneeId);

  const formatTimeLeft = (deadline: number) => {
    const diff = deadline - Date.now();
    if (diff <= 0) return 'Tiden ute';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`
      relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 transition-all
      ${task.status === TaskStatus.VERIFIED ? 'opacity-60 grayscale' : ''}
      ${task.isBossTask ? 'border-2 border-yellow-400 bg-yellow-50' : ''}
      ${isLocked ? 'opacity-70 bg-gray-50 border-gray-200' : ''}
    `}>
      {task.isBossTask && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Trophy size={12} /> BOSS BATTLE
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <h3 className="font-display font-bold text-gray-800 text-lg leading-tight flex items-center gap-2">
             {isLocked && <Lock size={16} className="text-gray-400" />}
             {task.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className={`
            font-bold px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-sm
            ${isLocked ? 'bg-gray-200 text-gray-500' : hasPersonalOverride ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-50 text-indigo-700'}
          `}>
            {points}p
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 mb-4">
        <div className="flex items-center gap-3 text-xs text-gray-400">
            {task.status === TaskStatus.OPEN && (
            <div className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`}>
                <Clock size={14} />
                <span>{formatTimeLeft(task.bookingDeadline)}</span>
            </div>
            )}
            {task.status === TaskStatus.ASSIGNED && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <AlertCircle size={14} />
                <span>Klart inom: {formatTimeLeft(task.completionDeadline)}</span>
            </div>
            )}
            
            {variant === 'admin' && hasAnyOverrides && (
                <div className="flex items-center gap-1 text-purple-500" title="Har individuella poäng">
                    <Users size={14} />
                    <span>Individuella poäng</span>
                </div>
            )}
        </div>

        {variant === 'admin' && assignee && (
            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-bold">
                <UserIcon size={12} />
                <span>{assignee.name}</span>
            </div>
        )}
      </div>

      {isLocked && lockReason && (
          <div className="mb-4 bg-red-50 border border-red-100 p-2 rounded-lg flex gap-2 items-start">
              <Lock size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-bold leading-tight">{lockReason}</p>
          </div>
      )}

      {variant === 'market' && task.status === TaskStatus.OPEN && !isExpired && !isLocked && (
        <Button onClick={onClaim} fullWidth size="sm">
          Boka Uppdrag
        </Button>
      )}

      {variant === 'my-tasks' && task.status === TaskStatus.ASSIGNED && (
        <Button onClick={onComplete} variant="success" fullWidth size="sm">
          Markera som klar
        </Button>
      )}
      
      {variant === 'admin' && task.status === TaskStatus.OPEN && (
          <div className="text-center text-xs text-gray-400 italic bg-gray-50 py-1 rounded">Väntar på att bokas...</div>
      )}
    </div>
  );
};