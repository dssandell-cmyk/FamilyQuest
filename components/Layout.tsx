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

  const navItems = [
    { id: 'game', label: 'Spelplan', icon: Home },
    { id: 'market', label: 'Uppdrag', icon: ListChecks },
    ...(currentUser?.role === UserRole.ADMIN
      ? [{ id: 'admin', label: 'Admin', icon: PlusCircle }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-30">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
              FQ
            </div>
            <h1 className="font-display font-bold text-gray-800 text-xl">Family Quest</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <img src={currentUser?.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">{currentUser?.score} XP</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 p-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">

        {/* Mobile Header (hidden on desktop) */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-8 relative">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-around items-center z-40 pb-safe">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === item.id ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
