
import React from 'react';
import { useGame } from '../context/GameContext';
import { SideQuestStatus } from '../types';
import { Gift, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from './Button';

export const SideQuestModal: React.FC = () => {
  const { sideQuests, currentUser, respondToSideQuest } = useGame();

  if (!currentUser) return null;

  // Find the first pending side quest for the current user that hasn't expired
  const pendingQuest = sideQuests.find(
    sq => sq.assignedTo === currentUser.id 
          && sq.status === SideQuestStatus.PENDING
          && (!sq.expiresAt || sq.expiresAt > Date.now())
  );

  if (!pendingQuest) return null;

  const formatTimeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours < 1 ? "< 1h" : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-bounce-in relative">
        
        {/* Header Background */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            
            <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse">
                    <Gift size={40} className="text-white drop-shadow-md" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-1 uppercase tracking-wider text-shadow">Side Quest!</h2>
                <p className="text-purple-200 text-sm font-bold">Ett speciellt uppdrag till dig</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
            <h3 className="font-bold text-xl text-gray-800 mb-2">{pendingQuest.title}</h3>
            <div className="flex items-center justify-center gap-1 text-xs text-orange-500 font-bold mb-4 bg-orange-50 inline-flex px-2 py-1 rounded-md">
                <Clock size={12} /> Går ut om {formatTimeLeft(pendingQuest.expiresAt || 0)}
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed bg-purple-50 p-4 rounded-xl border border-purple-100">
                {pendingQuest.description || "Inget beskrivning angiven."}
            </p>

            <div className="flex gap-3">
                <button 
                    onClick={() => respondToSideQuest(pendingQuest.id, false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    <XCircle size={18} /> Avböj
                </button>
                <Button 
                    onClick={() => respondToSideQuest(pendingQuest.id, true)}
                    fullWidth
                    className="flex-1 shadow-purple-300"
                    style={{ background: 'linear-gradient(to right, #9333ea, #6366f1)' }}
                >
                    <CheckCircle size={18} /> Acceptera
                </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 italic">Detta uppdrag ger inga XP, men kanske en annan belöning!</p>
        </div>
      </div>
    </div>
  );
};
