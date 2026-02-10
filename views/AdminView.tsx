
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Users, QrCode, Copy, Shield, Trophy, Gift, Send, Clock, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { UserRole, SideQuestStatus } from '../types';
import { Button } from '../components/Button';

export const AdminView: React.FC = () => {
  const { familyUsers, currentFamily, currentUser, updateUserRole, addSideQuest, sideQuests, deleteSideQuest } = useGame();
  
  // Side Quest State
  const [showSideQuestForm, setShowSideQuestForm] = useState(false);
  const [sqUser, setSqUser] = useState('');
  const [sqTitle, setSqTitle] = useState('');
  const [sqDesc, setSqDesc] = useState('');
  const [sqDuration, setSqDuration] = useState(4); // Default 4 hours

  const handleCopyCode = () => {
    if (currentFamily?.inviteCode) {
      navigator.clipboard.writeText(currentFamily.inviteCode);
      alert('Kod kopierad!');
    }
  };

  const handleCreateSideQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (sqUser && sqTitle) {
      addSideQuest(sqUser, sqTitle, sqDesc, sqDuration);
      setSqUser('');
      setSqTitle('');
      setSqDesc('');
      setSqDuration(4);
      setShowSideQuestForm(false);
      alert('Side Quest skickat!');
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

  return (
    <div className="pt-6 px-6 pb-20">
      
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Min Familj</h2>
        <p className="text-gray-500 text-sm">Hantera medlemmar och bjud in nya.</p>
      </div>

      {/* Invite Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <QrCode size={32} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Bjud in familjemedlemmar</h3>
          <p className="text-sm text-gray-500 mb-6">
            Låt andra skanna koden eller ange familjekoden nedan för att gå med.
          </p>
          
          {/* Simulated QR Code */}
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
                    <label className="block text-xs font-bold text-gray-500 mb-1">Välj Hjälte</label>
                    <select 
                        className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                        value={sqUser}
                        onChange={e => setSqUser(e.target.value)}
                        required
                    >
                        <option value="">-- Välj medlem --</option>
                        {familyUsers.filter(u => u.id !== currentUser?.id).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
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

        {/* List of Sent Side Quests */}
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
                                        <span className="mx-1">•</span>
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

      {/* Member List */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-display font-bold text-gray-800">
            <Users size={18} className="text-primary" /> 
            Medlemmar ({familyUsers.length})
        </h3>
        
        <div className="space-y-3">
            {familyUsers.map(user => {
                const isAdmin = user.role === UserRole.ADMIN;
                const isMe = user.id === currentUser?.id;

                return (
                    <div 
                        key={user.id} 
                        className={`
                            bg-white p-4 rounded-xl border flex flex-col gap-3 shadow-sm transition-all
                            ${isAdmin ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'}
                        `}
                    >
                        <div className="flex items-center gap-3">
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
                                </div>
                            </div>
                            {isMe && <span className="text-xs text-gray-400 font-bold italic pr-2">DU</span>}
                        </div>

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
    </div>
  );
};
