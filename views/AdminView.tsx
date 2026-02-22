
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Users, QrCode, Copy, Shield, Trophy, Gift, Send, Clock, Trash2, CheckCircle, Edit3, X, ChevronDown, ListChecks, Camera } from 'lucide-react';
import { UserRole, SideQuestStatus, TaskStatus, Task, User } from '../types';
import { Button } from '../components/Button';

export const AdminView: React.FC = () => {
  const { familyUsers, currentFamily, currentUser, updateUserRole, addSideQuest, sideQuests, deleteSideQuest, tasks, editTask, deleteTask } = useGame();

  // Side Quest State
  const [showSideQuestForm, setShowSideQuestForm] = useState(false);
  const [sqUsers, setSqUsers] = useState<string[]>([]);
  const [sqTitle, setSqTitle] = useState('');
  const [sqDesc, setSqDesc] = useState('');
  const [sqDuration, setSqDuration] = useState(4);

  // Task edit state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPoints, setEditPoints] = useState(10);

  // Member detail view
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const handleCopyCode = () => {
    if (currentFamily?.inviteCode) {
      navigator.clipboard.writeText(currentFamily.inviteCode);
      alert('Kod kopierad!');
    }
  };

 const handleCreateSideQuest = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Kolla så vi har valt minst en person OCH skrivit en titel
  if (sqUsers.length > 0 && sqTitle) {
    
    // Här är magin! Vi loopar igenom alla valda användare och skapar en quest till varje
    for (const userId of sqUsers) {
      await addSideQuest(userId, sqTitle, sqDesc, sqDuration);
    }
    
    // Nollställ formuläret när allt är klart
    setSqUsers([]); 
    setSqTitle('');
    setSqDesc('');
    setSqDuration(4);
    setShowSideQuestForm(false);
    alert('Side Quests skickade!');
  } else {
    alert('Du måste välja minst en hjälte och skriva en titel!');
  }
};

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPoints(task.basePoints);
  };

  const handleSaveEdit = async () => {
    if (editingTask && editTitle) {
      await editTask(editingTask.id, {
        title: editTitle,
        description: editDesc,
        basePoints: editPoints,
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Är du säker på att du vill radera detta uppdrag?')) {
      await deleteTask(taskId);
    }
  };

  const getStatusBadge = (status: SideQuestStatus, expiresAt: number) => {
      const isExpired = Date.now() > expiresAt && status === SideQuestStatus.PENDING;
      if (isExpired) return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200">UTGÅNGEN</span>;
      switch(status) {
          case SideQuestStatus.PENDING:
              return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-200">VÄNTAR</span>;
          case SideQuestStatus.ACTIVE:
              return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">ACCEPTERAD</span>;
          case SideQuestStatus.COMPLETED:
              return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200">KLAR</span>;
          case SideQuestStatus.REJECTED:
              return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">AVBÖJD</span>;
          default:
              return null;
      }
  };

  const formatTimeLeft = (expiresAt: number) => {
      if (Date.now() > expiresAt) return "Tiden ute";
      const diff = expiresAt - Date.now();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
  };

  const activeTasks = tasks.filter(t => t.status === TaskStatus.OPEN || t.status === TaskStatus.ASSIGNED);

  const getCompletedTasksForMember = (userId: string) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return tasks.filter(t =>
      t.assigneeId === userId &&
      t.status === TaskStatus.VERIFIED &&
      t.createdAt > sevenDaysAgo
    );
  };

  const getTaskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN: return <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">LEDIG</span>;
      case TaskStatus.ASSIGNED: return <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border border-yellow-200">BOKAD</span>;
      default: return null;
    }
  };

  return (
    <div className="pt-6 px-6 pb-20 lg:pb-8">

      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Min Familj</h2>
        <p className="text-gray-500 text-sm">Hantera medlemmar, uppdrag och bjud in nya.</p>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-bounce-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display font-bold text-lg">Redigera Uppdrag</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Titel</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Beskrivning</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Baspoäng</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={e => setEditPoints(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-gray-200"
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingTask(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50">
                  Avbryt
                </button>
                <Button onClick={handleSaveEdit} fullWidth className="flex-1">
                  Spara
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-bounce-in max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <img src={selectedMember.avatar} alt={selectedMember.name} className="w-10 h-10 rounded-full border border-gray-100" />
                <div>
                  <h3 className="font-display font-bold text-lg">{selectedMember.name}</h3>
                  <p className="text-xs text-gray-500">{selectedMember.score} XP</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-500" />
                Genomförda uppdrag (senaste 7 dagarna)
              </h4>
              {(() => {
                const completedTasks = getCompletedTasksForMember(selectedMember.id);
                if (completedTasks.length === 0) {
                  return <p className="text-sm text-gray-400 italic py-4 text-center">Inga genomförda uppdrag de senaste 7 dagarna.</p>;
                }
                return (
                  <div className="space-y-2">
                    {completedTasks.map(task => {
                      const points = task.userPointsOverride[selectedMember.id] ?? task.basePoints;
                      const daysAgo = Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={task.id} className="bg-green-50 border border-green-100 rounded-xl p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-gray-800 text-sm truncate">{task.title}</h5>
                              {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
                            </div>
                            <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">+{points}p</span>
                          </div>
                          {/* Image comparison display */}
                          {(task.referenceImage || task.completionImage) && (
                            <div className="flex gap-2 mt-2">
                              {task.referenceImage && (
                                <div className="flex-1">
                                  <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Camera size={10} /> Målbild</p>
                                  <img src={task.referenceImage} alt="Målbild" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                                </div>
                              )}
                              {task.completionImage && (
                                <div className="flex-1">
                                  <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Camera size={10} /> Resultat</p>
                                  <img src={task.completionImage} alt="Resultat" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                                </div>
                              )}
                            </div>
                          )}
                          {task.imageMatchScore != null && (
                            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              task.imageMatchScore >= 70 ? 'bg-green-100 text-green-700' : task.imageMatchScore >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              <CheckCircle size={10} /> {task.imageMatchScore}% bildmatch
                            </div>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2">
                            {daysAgo === 0 ? 'Idag' : daysAgo === 1 ? 'Igår' : `${daysAgo} dagar sedan`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">

      <div>{/* Left column */}
      {/* Invite Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <QrCode size={32} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Bjud in familjemedlemmar</h3>
          <p className="text-sm text-gray-500 mb-6">
            Låt andra skanna koden eller ange familjekoden nedan för att gå med.
          </p>

          <div className="bg-white p-2 inline-block rounded-xl border-2 border-dashed border-gray-200 mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentFamily?.inviteCode}`}
                alt="QR Code"
                className="w-32 h-32 rounded-lg opacity-90"
              />
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-200">
              <div className="text-left">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Familjekod</span>
                  <span className="font-mono text-xl font-bold text-gray-800 tracking-widest">{currentFamily?.inviteCode}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Kopiera kod"
              >
                  <Copy size={20} />
              </button>
          </div>
      </div>

      {/* Side Quest Creator */}
      <div className="mb-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold flex items-center gap-2">
                <Gift size={20} /> Skapa Side Quest
            </h3>
            <button
                onClick={() => setShowSideQuestForm(!showSideQuestForm)}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full font-bold transition-colors"
            >
                {showSideQuestForm ? 'Avbryt' : 'Nytt Uppdrag'}
            </button>
        </div>

        {!showSideQuestForm && (
            <p className="text-xs text-purple-100 mb-2">
                Ge ett specialuppdrag till någon. Inga XP, bara ära!
            </p>
        )}

        {showSideQuestForm && (
            <form onSubmit={handleCreateSideQuest} className="bg-white rounded-xl p-4 text-gray-800 animate-slide-up space-y-3">
                <div>
    <label className="block text-xs font-bold text-gray-500 mb-2">Välj Hjältar (du kan välja flera)</label>
    <div className="grid grid-cols-2 gap-2">
        {familyUsers.filter(u => u.id !== currentUser?.id).map(u => (
            <label key={u.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm transition-colors">
                <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    checked={sqUsers.includes(u.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            // Lägg till i listan om den kryssas i
                            setSqUsers([...sqUsers, u.id]); 
                        } else {
                            // Ta bort från listan om den kryssas ur
                            setSqUsers(sqUsers.filter(id => id !== u.id)); 
                        }
                    }}
                />
                <span className="font-bold text-gray-700">{u.name}</span>
            </label>
        ))}
    </div>
</div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">Uppdrag</label>
                     <input
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="T.ex. Lördagsgodis-uppdraget"
                        value={sqTitle}
                        onChange={e => setSqTitle(e.target.value)}
                        required
                     />
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Giltighetstid (timmar)</label>
                        <input
                            type="number"
                            className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                            value={sqDuration}
                            onChange={e => setSqDuration(Number(e.target.value))}
                            min="1"
                            max="72"
                            required
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-xs font-bold text-gray-500 mb-1">Beskrivning</label>
                     <textarea
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="Vad ska göras?"
                        value={sqDesc}
                        onChange={e => setSqDesc(e.target.value)}
                        rows={2}
                     />
                </div>
                <Button type="submit" variant="secondary" size="sm" fullWidth className="gap-2">
                    <Send size={14} /> Skicka Utmaning
                </Button>
            </form>
        )}

        {sideQuests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-100 opacity-80">Skickade Side Quests</h4>
                <div className="space-y-2">
                    {sideQuests.map(sq => {
                        const assignedUser = familyUsers.find(u => u.id === sq.assignedTo);
                        return (
                            <div key={sq.id} className="bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10 flex justify-between items-center">
                                <div className="flex-1 min-w-0 mr-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm truncate">{sq.title}</span>
                                        {getStatusBadge(sq.status, sq.expiresAt || 0)}
                                    </div>
                                    <div className="text-[10px] text-purple-200 flex items-center gap-1">
                                        <Users size={10} /> Till: {assignedUser?.name || 'Okänd'}
                                        <span className="mx-1">&bull;</span>
                                        <Clock size={10} /> {formatTimeLeft(sq.expiresAt || 0)} kvar
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteSideQuest(sq.id)}
                                    className="p-1.5 hover:bg-white/20 rounded text-purple-200 hover:text-white transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      {/* Published Tasks Management */}
      {activeTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="flex items-center gap-2 font-display font-bold text-gray-800 mb-3">
            <ListChecks size={18} className="text-primary" />
            Publicerade Uppdrag ({activeTasks.length})
          </h3>
          <div className="space-y-2">
            {activeTasks.map(task => {
              const assignee = familyUsers.find(u => u.id === task.assigneeId);
              return (
                <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-800 text-sm truncate">{task.title}</h4>
                        {getTaskStatusLabel(task.status)}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                        <span className="font-bold">{task.basePoints}p</span>
                        {assignee && (
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {assignee.name}
                          </span>
                        )}
                        {task.referenceImage && (
                          <span className="flex items-center gap-1 text-indigo-500">
                            <Camera size={10} /> Målbild
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Radera"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      </div>{/* end grid left column */}

      {/* Member List - right column on desktop */}
      <div className="space-y-4 mt-6 lg:mt-0">
        <h3 className="flex items-center gap-2 font-display font-bold text-gray-800">
            <Users size={18} className="text-primary" />
            Medlemmar ({familyUsers.length})
        </h3>

        <div className="space-y-3">
            {familyUsers.map(user => {
                const isAdmin = user.role === UserRole.ADMIN;
                const isMe = user.id === currentUser?.id;
                const completedCount = getCompletedTasksForMember(user.id).length;

                return (
                    <div
                        key={user.id}
                        className={`
                            bg-white p-4 rounded-xl border flex flex-col gap-3 shadow-sm transition-all
                            ${isAdmin ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'}
                        `}
                    >
                        <button
                            className="flex items-center gap-3 w-full text-left"
                            onClick={() => setSelectedMember(user)}
                        >
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border border-gray-100" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-800">{user.name}</h4>
                                    {isAdmin && (
                                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                            <Shield size={8} fill="currentColor" /> ADMIN
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <Trophy size={12} className="text-yellow-500" />
                                    {user.score} XP
                                    {completedCount > 0 && (
                                      <>
                                        <span className="text-gray-300">|</span>
                                        <CheckCircle size={12} className="text-green-500" />
                                        {completedCount} klara (7d)
                                      </>
                                    )}
                                </div>
                            </div>
                            {isMe && <span className="text-xs text-gray-400 font-bold italic pr-2">DU</span>}
                            <ChevronDown size={16} className="text-gray-300" />
                        </button>

                        {!isMe && (
                            <div className="flex gap-2 border-t border-gray-100 pt-3 mt-1">
                                {isAdmin ? (
                                    <button
                                        onClick={() => updateUserRole(user.id, UserRole.MEMBER)}
                                        className="flex-1 bg-white border border-red-200 text-red-500 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                                    >
                                        Ta bort Admin
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => updateUserRole(user.id, UserRole.ADMIN)}
                                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-indigo-200 shadow-sm transition-all active:scale-95"
                                    >
                                        Gör till Admin
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
      </div>{/* end grid */}
    </div>
  );
};
