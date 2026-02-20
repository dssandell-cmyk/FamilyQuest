import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { TaskStatus, UserRole, TaskProposal, SideQuestStatus } from '../types';
import { TaskCard } from '../components/TaskCard';
import { ShoppingBag, Plus, Lightbulb, ChevronUp, ChevronDown, X, Wand2, Coins, Clock, Users, Check, Trash2, Gift, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { generateEpicTaskDescription } from '../services/geminiService';

interface MarketViewProps {
  onNavigate: (view: string) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({ onNavigate }) => {
  const { tasks, claimTask, currentUser, isTaskLockedForUser, addProposal, addTask, familyUsers, proposals, rejectProposal, sideQuests, completeSideQuest } = useGame();
  
  // Create Task State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [convertingProposalId, setConvertingProposalId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBasePoints, setNewBasePoints] = useState(10);
  const [newDuration, setNewDuration] = useState(24);
  const [userOverrides, setUserOverrides] = useState<Record<string, number>>({});
  const [loadingAi, setLoadingAi] = useState(false);

  // Proposal State (For Members)
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propPoints, setPropPoints] = useState(10);

  const openTasks = tasks.filter(t => t.status === TaskStatus.OPEN);
  const assignedTasks = tasks.filter(t => t.status === TaskStatus.ASSIGNED);
  
  // Active Side Quests for current user
  const mySideQuests = sideQuests.filter(sq => 
    sq.assignedTo === currentUser?.id && sq.status === SideQuestStatus.ACTIVE
  );

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProposal(propTitle, propDesc, propPoints);
    setPropTitle('');
    setPropDesc('');
    setPropPoints(10);
    setShowProposalForm(false);
    alert('Ditt förslag har skickats till admin!');
  };

  const handleGenerateDesc = async () => {
    if (!newTitle) return;
    setLoadingAi(true);
    const desc = await generateEpicTaskDescription(newTitle);
    setNewDesc(desc);
    setLoadingAi(false);
  };

  // Pre-fill creation form from proposal
  const handleApproveProposal = (proposal: TaskProposal) => {
    setNewTitle(proposal.title);
    setNewDesc(proposal.description);
    setNewBasePoints(proposal.suggestedPoints);
    setConvertingProposalId(proposal.id);
    setShowCreateModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTask({
      title: newTitle,
      description: newDesc,
      basePoints: newBasePoints,
      userPointsOverride: userOverrides,
      bookingDeadline: Date.now() + (newDuration * 60 * 60 * 1000),
      completionDeadline: Date.now() + (newDuration * 2 * 60 * 60 * 1000),
    });

    // If this was a proposal, delete it now
    if (convertingProposalId) {
        await rejectProposal(convertingProposalId);
        setConvertingProposalId(null);
    }

    setNewTitle('');
    setNewDesc('');
    setNewBasePoints(10);
    setUserOverrides({});
    setNewDuration(24);
    setShowCreateModal(false);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setConvertingProposalId(null);
    setNewTitle('');
    setNewDesc('');
    setNewBasePoints(10);
  };

  const handleOverrideChange = (userId: string, value: string) => {
    const numValue = parseInt(value);
    setUserOverrides(prev => {
        const next = { ...prev };
        if (isNaN(numValue)) {
            delete next[userId];
        } else {
            next[userId] = numValue;
        }
        return next;
    });
  };

  const getProposerName = (id: string) => {
      return familyUsers.find(u => u.id === id)?.name || "Okänd";
  };

  return (
    <div className="pt-6 px-6 pb-20 relative min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Uppdragsbanken</h2>
            <p className="text-gray-500 text-sm">Boka sysslor för att tjäna XP!</p>
        </div>
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <ShoppingBag size={20} />
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-bounce-in shadow-2xl">
                <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-display font-bold text-lg">
                        {convertingProposalId ? 'Godkänn Förslag' : 'Skapa Nytt Uppdrag'}
                    </h3>
                    <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleCreateTask} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Titel</label>
                        <input 
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200"
                            placeholder="T.ex. Gå ut med soporna"
                            required
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-bold text-gray-700">Beskrivning</label>
                            <button 
                                type="button" 
                                onClick={handleGenerateDesc}
                                disabled={!newTitle || loadingAi}
                                className="text-xs flex items-center gap-1 text-secondary font-bold bg-pink-50 px-2 py-1 rounded-full"
                            >
                                <Wand2 size={12} /> {loadingAi ? 'Tänker...' : 'AI-hjälp'}
                            </button>
                        </div>
                        <textarea 
                            value={newDesc}
                            onChange={e => setNewDesc(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                            rows={2}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-1 text-sm font-bold text-gray-700 mb-1">
                                <Coins size={14} className="text-yellow-500" /> Baspoäng
                            </label>
                            <input 
                                type="number" 
                                value={newBasePoints}
                                onChange={e => setNewBasePoints(Number(e.target.value))}
                                className="w-full p-2 rounded-xl border border-gray-200"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-sm font-bold text-gray-700 mb-1">
                                <Clock size={14} className="text-blue-500" /> Tid (timmar)
                            </label>
                            <input 
                                type="number" 
                                value={newDuration}
                                onChange={e => setNewDuration(Number(e.target.value))}
                                className="w-full p-2 rounded-xl border border-gray-200"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <h4 className="flex items-center gap-2 font-bold text-sm text-gray-700 mb-2">
                            <Users size={14} /> Individuella Poäng
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                            {familyUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between text-sm">
                                    <span>{u.name}</span>
                                    <input 
                                        type="number"
                                        placeholder={newBasePoints.toString()}
                                        value={userOverrides[u.id] ?? ''}
                                        onChange={e => handleOverrideChange(u.id, e.target.value)}
                                        className="w-16 p-1 text-right rounded border border-gray-200 text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" fullWidth>
                        {convertingProposalId ? 'Skapa Uppdraget' : 'Publicera Uppdrag'}
                    </Button>
                </form>
            </div>
        </div>
      )}

      {/* ACTIVE SIDE QUESTS (For User) */}
      {mySideQuests.length > 0 && (
          <div className="mb-6">
              <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Gift size={16} /> Aktiva Side Quests
              </h3>
              <div className="space-y-3">
                  {mySideQuests.map(sq => (
                      <div key={sq.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-10">
                              <Sparkles size={40} className="text-purple-600" />
                          </div>
                          <div className="relative z-10">
                            <h4 className="font-bold text-purple-900 text-lg mb-1">{sq.title}</h4>
                            <p className="text-sm text-purple-700 mb-4">{sq.description}</p>
                            <Button 
                                onClick={() => completeSideQuest(sq.id)} 
                                variant="success" 
                                size="sm" 
                                fullWidth
                                className="shadow-none border border-green-200"
                            >
                                Markera som klar
                            </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ADMIN SECTION: INCOMING PROPOSALS */}
      {currentUser?.role === UserRole.ADMIN && proposals.length > 0 && (
          <div className="mb-8">
              <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Lightbulb size={16} /> Inkomna Förslag ({proposals.length})
              </h3>
              <div className="space-y-3">
                  {proposals.map(prop => (
                      <div key={prop.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h4 className="font-bold text-gray-800">{prop.title}</h4>
                                  <p className="text-xs text-orange-600 font-bold mt-0.5">Från: {getProposerName(prop.proposedBy)}</p>
                              </div>
                              <div className="bg-white px-2 py-1 rounded-lg text-sm font-bold text-orange-500 border border-orange-100 shadow-sm">
                                  {prop.suggestedPoints}p
                              </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{prop.description}</p>
                          <div className="flex gap-2">
                              <button 
                                  onClick={() => handleApproveProposal(prop)}
                                  className="flex-1 bg-white text-green-600 border border-green-200 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-green-50"
                              >
                                  <Check size={14} /> Granska & Godkänn
                              </button>
                              <button 
                                  onClick={() => rejectProposal(prop.id)}
                                  className="px-3 bg-white text-red-500 border border-red-200 py-2 rounded-lg font-bold text-xs hover:bg-red-50"
                              >
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="h-1 bg-gray-100 w-full mt-6 rounded-full"></div>
          </div>
      )}

      {/* MEMBER SECTION: PROPOSAL FORM */}
      {currentUser?.role !== UserRole.ADMIN && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-6">
            <button 
              onClick={() => setShowProposalForm(!showProposalForm)}
              className="w-full flex items-center justify-between p-4 bg-orange-50 text-orange-600 font-bold"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb size={20} />
                    <span>Har du en bra idé?</span>
                </div>
                {showProposalForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {showProposalForm && (
                <form onSubmit={handleProposalSubmit} className="p-4 space-y-3">
                    <input 
                      className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Vad är ditt förslag?"
                      value={propTitle}
                      onChange={e => setPropTitle(e.target.value)}
                      required
                    />
                    <textarea 
                      className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                      placeholder="Beskriv vad som ska göras..."
                      value={propDesc}
                      onChange={e => setPropDesc(e.target.value)}
                      rows={2}
                      required
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 font-bold">Poäng:</label>
                        <input 
                          type="number" 
                          className="w-20 p-2 rounded-lg border border-gray-200 text-sm"
                          value={propPoints}
                          onChange={e => setPropPoints(Number(e.target.value))}
                          min="1"
                          max="200"
                          required
                        />
                        <Button type="submit" size="sm" variant="secondary" className="ml-auto">
                          Skicka Förslag
                        </Button>
                    </div>
                </form>
            )}
        </div>
      )}

      <div className="space-y-6">
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Tillgängliga</h3>
            {openTasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Inga lediga uppdrag just nu. Be admin lägga upp fler!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {openTasks.map(task => {
                    const lockStatus = currentUser ? isTaskLockedForUser(task, currentUser.id) : { locked: false };
                    
                    return (
                        <TaskCard
                            key={task.id}
                            task={task}
                            variant="market"
                            isLocked={lockStatus.locked}
                            lockReason={lockStatus.reason}
                            onClaim={() => {
                                if (!lockStatus.locked) {
                                    claimTask(task.id);
                                }
                            }}
                        />
                    );
                })}
                </div>
            )}
        </section>

        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Bokade av andra</h3>
             {assignedTasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Allt är lugnt...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {assignedTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        variant="admin"
                    />
                ))}
                </div>
            )}
        </section>
      </div>

      {currentUser?.role === UserRole.ADMIN && (
        <button
            onClick={() => {
                setConvertingProposalId(null);
                setNewTitle('');
                setNewDesc('');
                setNewBasePoints(10);
                setShowCreateModal(true);
            }}
            className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
            title="Skapa nytt uppdrag"
        >
            <Plus size={28} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};