import React from 'react';
import { useGame } from '../context/GameContext';
import { Users, QrCode, Copy, Shield, Trophy } from 'lucide-react';
import { UserRole } from '../types';

export const AdminView: React.FC = () => {
  const { familyUsers, currentFamily, currentUser, updateUserRole } = useGame();

  const handleCopyCode = () => {
    if (currentFamily?.inviteCode) {
      navigator.clipboard.writeText(currentFamily.inviteCode);
      alert('Kod kopierad!');
    }
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