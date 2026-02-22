import React, { useState, useRef } from 'react';
import { Task, TaskStatus } from '../types';
import { useGame } from '../context/GameContext';
import { Button } from './Button';
import { Clock, Trophy, User as UserIcon, AlertCircle, Sparkles, Users, Lock, ChevronDown, ChevronUp, Camera, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import { compressImage, compareImages } from '../utils/imageUtils';

interface TaskCardProps {
  task: Task;
  onClaim?: () => void;
  onComplete?: (completionImage?: string, imageMatchScore?: number) => void;
  variant?: 'market' | 'admin' | 'my-tasks';
  isLocked?: boolean;
  lockReason?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClaim, onComplete, variant = 'market', isLocked = false, lockReason }) => {
  const { currentUser, getPotentialPoints, users } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [completionImage, setCompletionImage] = useState<string | null>(null);
  const [imageMatchScore, setImageMatchScore] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleCompletionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setCompletionImage(compressed);

      // Compare with reference image if one exists
      if (task.referenceImage) {
        setIsComparing(true);
        const score = await compareImages(task.referenceImage, compressed);
        setImageMatchScore(score);
        setIsComparing(false);
      }
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(completionImage || undefined, imageMatchScore ?? undefined);
    }
  };

  const formatTimeLeft = (deadline: number) => {
    const diff = deadline - Date.now();
    if (diff <= 0) return 'Tiden ute';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`
      relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all
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
          {variant === 'my-tasks' ? (
            <button className="text-left w-full" onClick={() => setExpanded(!expanded)}>
              <h3 className="font-display font-bold text-gray-800 text-lg leading-tight flex items-center gap-2">
                {task.title}
                {task.description && (
                  expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                )}
              </h3>
              <p className={`text-sm text-gray-500 mt-1 ${expanded ? '' : 'line-clamp-1'}`}>{task.description}</p>
            </button>
          ) : (
            <>
              <h3 className="font-display font-bold text-gray-800 text-lg leading-tight flex items-center gap-2">
                {isLocked && <Lock size={16} className="text-gray-400" />}
                {task.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            </>
          )}
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

     {/* Reference image preview */}
      {task.referenceImage && (variant === 'market' || (variant === 'my-tasks' && expanded)) && (
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
            <Camera size={12} /> Målbild
          </p>
          <img src={task.referenceImage} alt="Målbild" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
        </div>
      )}

      {variant === 'market' && task.status === TaskStatus.OPEN && !isExpired && !isLocked && (
        <Button onClick={onClaim} fullWidth size="sm">
          Boka Uppdrag
        </Button>
      )}

      {variant === 'my-tasks' && task.status === TaskStatus.ASSIGNED && (
        <div className="space-y-3 mt-2">
          {/* Completion photo upload area */}
          {task.referenceImage && expanded && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                <ImageIcon size={12} /> Ladda upp ditt resultat (valfritt)
              </p>
              {completionImage ? (
                <div className="relative">
                  <img src={completionImage} alt="Resultat" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => { setCompletionImage(null); setImageMatchScore(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                  {isComparing && (
                    <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600 animate-pulse">Jämför bilder...</span>
                    </div>
                  )}
                  {imageMatchScore !== null && !isComparing && (
                    <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-bold shadow-sm ${
                      imageMatchScore >= 70 ? 'bg-green-500 text-white' : imageMatchScore >= 40 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      <CheckCircle2 size={12} className="inline mr-1" />
                      {imageMatchScore}% match
                    </div>
                  )}
                </div>
              ) : (
                <label htmlFor={`upload-${task.id}`} className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-colors">
  <Camera size={20} className="text-gray-400 mb-1" />
  <span className="text-xs text-gray-500 font-bold">Ta foto eller välj bild</span>
  <input
    id={`upload-${task.id}`}
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleCompletionImage}
    className="hidden"
  />
</label>
              )}
            </div>
          )}

          <Button onClick={handleComplete} variant="success" fullWidth size="sm">
            Markera som klar
          </Button>
        </div>
      )}
      
      {variant === 'admin' && task.status === TaskStatus.OPEN && (
          <div className="text-center text-xs text-gray-400 italic bg-gray-50 py-1 rounded">Väntar på att bokas...</div>
      )}
    </div>
  );
};