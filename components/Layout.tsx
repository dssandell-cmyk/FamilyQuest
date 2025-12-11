import React from 'react';
import { useGame } from '../context/GameContext';
import { UserRole } from '../types';
import { Home, ListChecks, PlusCircle, User as UserIcon, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout } = useGame();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                FQ
            </div>
            <h1 className="font-display font-bold text-gray-800 text-lg">Family Quest</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-gray-800">{currentUser?.name}</p>
                <p className="text-[10px] text-gray-500">{currentUser?.score} XP</p>
            </div>
            <img src={currentUser?.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-200" />
            <button onClick={logout} className="text-gray-400 hover:text-red-500 ml-2">
                <LogOut size={18} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-40 pb-safe">
        <button 
          onClick={() => setActiveTab('game')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'game' ? 'text-primary' : 'text-gray-400'}`}
        >
          <Home size={24} strokeWidth={activeTab === 'game' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Spelplan</span>
        </button>

        <button 
          onClick={() => setActiveTab('market')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'market' ? 'text-primary' : 'text-gray-400'}`}
        >
          <ListChecks size={24} strokeWidth={activeTab === 'market' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">Uppdrag</span>
        </button>

        {currentUser?.role === UserRole.ADMIN && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === 'admin' ? 'text-primary' : 'text-gray-400'}`}
          >
            <PlusCircle size={24} strokeWidth={activeTab === 'admin' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
};