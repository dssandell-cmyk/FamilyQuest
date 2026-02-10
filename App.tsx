import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Layout } from './components/Layout';
import { GameView } from './views/GameView';
import { MarketView } from './views/MarketView';
import { AdminView } from './views/AdminView';
import { Button } from './components/Button';
import { SideQuestModal } from './components/SideQuestModal';
import { UserRole } from './types';
import { Home, ScanLine, UserPlus, Users, ArrowRight, Trash2 } from 'lucide-react';

// 1. LOGIN / REGISTER SCREEN
const AuthScreen: React.FC = () => {
  const { login, register, resetApp } = useGame();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && password) {
      if (isRegistering) {
        register(name, password);
      } else {
        const success = login(name, password);
        if (!success) alert('Fel användarnamn eller lösenord');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-primary to-accent flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl text-gray-800 animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-primary mb-2">Family Quest</h1>
            <p className="text-gray-500">{isRegistering ? 'Skapa ditt konto' : 'Välkommen tillbaka'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Användarnamn</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all"
              placeholder="Ditt namn"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Lösenord</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary outline-none transition-all"
              placeholder="******"
              required
            />
          </div>
          <Button type="submit" fullWidth size="lg" className="mt-4 shadow-lg shadow-primary/30">
            {isRegistering ? 'Skapa Konto' : 'Logga In'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
            <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm font-bold text-primary hover:underline block w-full"
            >
                {isRegistering ? 'Har du redan ett konto? Logga in' : 'Inget konto? Skapa användare'}
            </button>

            <div className="border-t border-gray-100 pt-4 mt-4">
                 <button 
                    onClick={() => {
                        if(window.confirm("Detta raderar alla användare, familjer och uppdrag lokalt. Är du säker?")) {
                            resetApp();
                        }
                    }}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 flex items-center justify-center gap-1 mx-auto"
                >
                    <Trash2 size={12} /> Nollställ appen / Rensa data
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// 2. FAMILY ONBOARDING SCREEN
const FamilyOnboardingScreen: React.FC = () => {
    const { createFamily, joinFamily, currentUser, logout } = useGame();
    const [mode, setMode] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
    const [familyName, setFamilyName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if(familyName) createFamily(familyName);
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const success = joinFamily(inviteCode.toUpperCase());
        if(!success) alert("Kunde inte hitta en familj med den koden.");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden relative">
                <div className="p-6 text-center border-b border-gray-100">
                     <h2 className="text-2xl font-display font-bold text-gray-800">Hej {currentUser?.name}!</h2>
                     <p className="text-gray-500 text-sm">Du tillhör inte någon familj än.</p>
                </div>

                <div className="p-6">
                    {mode === 'SELECT' && (
                        <div className="space-y-4">
                            <button 
                                onClick={() => setMode('CREATE')}
                                className="w-full p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 flex items-center gap-4 transition-all"
                            >
                                <div className="bg-primary text-white p-3 rounded-full">
                                    <Home size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-primary">Skapa ny familj</h3>
                                    <p className="text-xs text-gray-500">Du blir administratör</p>
                                </div>
                                <ArrowRight className="ml-auto text-primary" size={20} />
                            </button>

                            <button 
                                onClick={() => setMode('JOIN')}
                                className="w-full p-4 rounded-xl border-2 border-secondary/20 bg-secondary/5 hover:bg-secondary/10 flex items-center gap-4 transition-all"
                            >
                                <div className="bg-secondary text-white p-3 rounded-full">
                                    <Users size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-secondary">Gå med i familj</h3>
                                    <p className="text-xs text-gray-500">Ange kod eller skanna QR</p>
                                </div>
                                <ArrowRight className="ml-auto text-secondary" size={20} />
                            </button>
                        </div>
                    )}

                    {mode === 'CREATE' && (
                         <form onSubmit={handleCreate} className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Vad heter familjen?</label>
                                <input 
                                    className="w-full p-3 rounded-xl border border-gray-200"
                                    placeholder="T.ex. Familjen Svensson"
                                    value={familyName}
                                    onChange={e => setFamilyName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button fullWidth>Skapa Familj</Button>
                            <button type="button" onClick={() => setMode('SELECT')} className="w-full text-center text-gray-400 text-sm mt-2">Avbryt</button>
                         </form>
                    )}

                    {mode === 'JOIN' && (
                        <form onSubmit={handleJoin} className="space-y-4 animate-fade-in">
                           <div className="text-center mb-4">
                               <ScanLine size={48} className="mx-auto text-gray-300 mb-2" />
                               <p className="text-xs text-gray-400">Be din admin visa QR-koden eller ange koden manuellt nedan.</p>
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-700 mb-1">Ange Familjekod</label>
                               <input 
                                   className="w-full p-3 rounded-xl border border-gray-200 font-mono text-center tracking-widest uppercase"
                                   placeholder="XXXXXX"
                                   value={inviteCode}
                                   onChange={e => setInviteCode(e.target.value)}
                                   maxLength={6}
                                   autoFocus
                               />
                           </div>
                           <Button fullWidth variant="secondary">Gå Med</Button>
                           <button type="button" onClick={() => setMode('SELECT')} className="w-full text-center text-gray-400 text-sm mt-2">Avbryt</button>
                        </form>
                   )}
                </div>

                <div className="bg-gray-50 p-4 text-center">
                    <button onClick={logout} className="text-sm font-bold text-red-400">Logga ut</button>
                </div>
            </div>
        </div>
    );
}

// 3. MAIN APP LAYOUT
const MainApp: React.FC = () => {
  const { currentUser } = useGame();
  const [activeTab, setActiveTab] = useState('game');

  // Logic flow
  if (!currentUser) return <AuthScreen />;
  if (!currentUser.familyId) return <FamilyOnboardingScreen />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <SideQuestModal />
      {activeTab === 'game' && <GameView />}
      {activeTab === 'market' && <MarketView onNavigate={setActiveTab} />}
      {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && <AdminView />}
      {activeTab === 'admin' && currentUser.role !== UserRole.ADMIN && (
          <div className="p-8 text-center text-gray-400">Du har inte behörighet att se detta.</div>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
};

export default App;