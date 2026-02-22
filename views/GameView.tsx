import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { MONSTERS, MAX_GAME_SCORE } from '../constants';
import { Trophy, ShieldAlert, X, Maximize2, Minimize2, MapPin } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { TaskStatus } from '../types';

// Logical coordinate system for the SVG
// Width is 0-100 (percentage-like logic but absolute numbers for SVG)
// Height is arbitrary units
const MAP_LOGICAL_WIDTH = 100;
const MAP_LOGICAL_HEIGHT = 1400; 
const PADDING_Y = 100; // Padding top/bottom in logical units

// Math to calculate position (0-100 X, 0-HEIGHT Y)
const getMapCoordinates = (score: number) => {
  const safeScore = Math.max(0, Math.min(score, MAX_GAME_SCORE));
  const progress = safeScore / MAX_GAME_SCORE; // 0 to 1
  
  // Y: Start at bottom, end at top
  // Invert Y because SVG 0 is top
  const drawingHeight = MAP_LOGICAL_HEIGHT - (PADDING_Y * 2);
  const y = MAP_LOGICAL_HEIGHT - PADDING_Y - (progress * drawingHeight);
  
  // X: Sine wave
  // Amplitude 35 keeps it within 15-85 range (safe from edges)
  const frequency = 2.5; 
  const amplitude = 35;
  const x = 50 + (Math.sin(progress * Math.PI * 2 * frequency) * amplitude);
  
  return { x, y };
};

export const GameView: React.FC = () => {
  const { users, currentUser, tasks, completeTask } = useGame();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedMonster, setSelectedMonster] = useState<number | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const sortedUsers = [...users].sort((a, b) => b.score - a.score);
  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id && t.status === TaskStatus.ASSIGNED);

  // Generate path data for the line
  const pathData = useMemo(() => {
    let d = "";
    // Step through scores to create smooth curve
    const step = 2; // Calculate point every 2 score units
    for (let s = 0; s <= MAX_GAME_SCORE; s += step) {
      const pos = getMapCoordinates(s);
      if (s === 0) d += `M ${pos.x} ${pos.y}`;
      else d += ` L ${pos.x} ${pos.y}`;
    }
    return d;
  }, []);

  // Generate dots along the path (steps)
  const steps = useMemo(() => {
    const dots = [];
    for (let s = 0; s <= MAX_GAME_SCORE; s += 10) {
        if (s === 0 || s === MAX_GAME_SCORE) continue; // Skip start/end
        // Skip spots where monsters are
        if (Object.values(MONSTERS).some(m => Math.abs(m.minScore - s) < 5)) continue;
        
        dots.push({ score: s, ...getMapCoordinates(s) });
    }
    return dots;
  }, []);

  const scrollToScore = (score: number) => {
    setTimeout(() => {
        if (mapContainerRef.current) {
            const coords = getMapCoordinates(score);
            // Convert logical Y to pixel Y relative to container
            // Since we use 100% height for SVG, the ratio is 1:1 visually if we scroll correctly
            // We need to find the percentage of the scroll height
            
            const scrollPercent = coords.y / MAP_LOGICAL_HEIGHT;
            const scrollPixel = mapContainerRef.current.scrollHeight * scrollPercent;
            const containerHeight = mapContainerRef.current.clientHeight;
            
            mapContainerRef.current.scrollTo({
                top: scrollPixel - (containerHeight / 2),
                behavior: 'smooth'
            });
        }
    }, 200);
  };

  useEffect(() => {
    if (currentUser) {
      scrollToScore(currentUser.score);
    }
  }, [currentUser, isMapExpanded]);

  const activeMonster = selectedMonster ? MONSTERS[selectedMonster] : null;

  const toggleMapSize = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <div className="pb-10 bg-gray-50 min-h-full flex flex-col lg:flex-row lg:gap-0">

      {/* Monster Popup Modal */}
      {activeMonster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMonster(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-bounce-in text-white" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedMonster(null)} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-red-500 overflow-hidden mb-4 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                        <img src={activeMonster.image} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-display font-bold text-2xl text-white mb-1">{activeMonster.name}</h3>
                    <p className="text-slate-300 text-sm mb-4 italic">"{activeMonster.description}"</p>
                    
                    <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 w-full">
                        <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-1">
                            <ShieldAlert size={18} />
                            <span>Bosskrav</span>
                        </div>
                        <p className="text-sm text-slate-200">
                            För att passera måste du klara ett uppdrag värt minst <strong className="text-red-400">{activeMonster.minTaskValue} poäng</strong> när du närmar dig!
                        </p>
                    </div>
                    <div className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Plats: {activeMonster.minScore} XP
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* GAME BOARD SECTION */}
      <div
        className={`
            relative w-full lg:w-1/2 xl:w-3/5 bg-slate-900 overflow-hidden shadow-2xl border-b-4 lg:border-b-0 lg:border-r-4 border-slate-800 transition-all duration-500 ease-in-out cursor-pointer group
            lg:!h-screen lg:sticky lg:top-0 lg:cursor-default
            ${isMapExpanded ? 'z-40' : ''}
        `}
        style={{ height: isMapExpanded ? '65vh' : '200px' }}
        onClick={() => !isMapExpanded && setIsMapExpanded(true)}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
            {isMapExpanded ? (
                <button 
                    onClick={toggleMapSize}
                    className="bg-slate-800 text-white p-2 rounded-full shadow-lg border border-slate-700 hover:bg-slate-700 transition-all active:scale-95"
                >
                    <X size={20} />
                </button>
            ) : (
                <div className="bg-slate-800/80 text-white p-2 rounded-full shadow-sm border border-slate-700 group-hover:bg-slate-700 transition-colors">
                    <Maximize2 size={18} />
                </div>
            )}
        </div>

        {!isMapExpanded && (
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none flex items-end justify-center pb-2 z-10">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Klicka för att se hela kartan</span>
            </div>
        )}

        <div 
          ref={mapContainerRef}
          className="relative w-full overflow-y-auto no-scrollbar scroll-smooth h-full"
        >
          {/* Container for the SVG and absolute elements */}
          {/* We use a fixed aspect ratio container trick or just map coordinates manually */}
          <div className="relative w-full" style={{ height: '2000px' }}> {/* Fixed large pixel height to allow scrolling */}
            
            {/* THE SVG MAP LINE */}
            <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                viewBox={`0 0 ${MAP_LOGICAL_WIDTH} ${MAP_LOGICAL_HEIGHT}`}
                preserveAspectRatio="none"
            >
              {/* Outer Glow */}
              <path d={pathData} stroke="#22d3ee" strokeWidth="4" strokeOpacity="0.2" fill="none" strokeLinecap="round" />
              {/* Main Line */}
              <path d={pathData} stroke="#0891b2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Dashed Center */}
              <path d={pathData} stroke="#a5f3fc" strokeWidth="0.5" fill="none" strokeLinecap="round" strokeDasharray="2 2" />
              
              {/* Step Dots */}
              {steps.map((step, i) => (
                  <circle key={i} cx={step.x} cy={step.y} r="1" fill="#22d3ee" fillOpacity="0.5" />
              ))}
            </svg>

            {/* MONSTERS */}
            {Object.values(MONSTERS).map((monster) => {
              const coords = getMapCoordinates(monster.minScore);
              const isDefeated = (currentUser?.score || 0) >= monster.minScore;
              
              return (
                <button 
                  key={monster.level}
                  onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMonster(monster.level);
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-transform active:scale-95 group/monster"
                  style={{ 
                      left: `${coords.x}%`, 
                      top: `${(coords.y / MAP_LOGICAL_HEIGHT) * 100}%` 
                  }}
                >
                  <div className={`
                    relative w-14 h-14 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all
                    ${isDefeated ? 'grayscale opacity-50 border-slate-600 scale-90' : 'border-red-500 bg-slate-800 animate-pulse'}
                  `}>
                    <img src={monster.image} alt={monster.name} className="w-full h-full rounded-full object-cover" />
                    {!isDefeated && (
                      <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-sm z-20">
                        <ShieldAlert size={10} />
                      </div>
                    )}
                  </div>
                  <div className="bg-black/60 backdrop-blur px-2 py-0.5 rounded-full mt-1 border border-slate-700">
                    <span className="text-[10px] font-bold text-white">{monster.minScore}p</span>
                  </div>
                </button>
              );
            })}

            {/* USERS / AVATARS */}
            {users.map((user) => {
              const coords = getMapCoordinates(user.score);
              const isMe = user.id === currentUser?.id;
              
              return (
                <div 
                  key={user.id}
                  className={`
                    absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 z-20 pointer-events-none
                    ${isMe ? 'scale-125 z-30' : 'scale-90 opacity-80'}
                  `}
                  style={{ 
                      left: `${coords.x}%`, 
                      top: `${(coords.y / MAP_LOGICAL_HEIGHT) * 100}%` 
                  }}
                >
                  <div className={`
                    w-10 h-10 rounded-full border-2 overflow-hidden shadow-lg
                    ${isMe ? 'border-cyan-400 ring-4 ring-cyan-400/20 box-shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'border-white/50 grayscale-[0.3]'}
                  `}>
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`
                    mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm whitespace-nowrap border
                    ${isMe ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-800 text-gray-300 border-slate-600'}
                  `}>
                    {user.name} ({user.score}p)
                  </div>
                </div>
              );
            })}

            {/* START POINT */}
            <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ 
                    left: `${getMapCoordinates(0).x}%`, 
                    top: `${(getMapCoordinates(0).y / MAP_LOGICAL_HEIGHT) * 100}%` 
                }}
            >
                 <div className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Start</div>
            </div>
            
            {/* GOAL POINT */}
             <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ 
                    left: `${getMapCoordinates(MAX_GAME_SCORE).x}%`, 
                    top: `${(getMapCoordinates(MAX_GAME_SCORE).y / MAP_LOGICAL_HEIGHT) * 100}%` 
                }}
            >
                 <div className="mb-8 flex flex-col items-center animate-bounce">
                    <Trophy className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={32} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Mål</span>
                 </div>
            </div>

          </div>
        </div>
      </div>

      <div className="px-6 mt-6 flex-1 lg:w-1/2 xl:w-2/5 lg:py-6 lg:overflow-y-auto">
        
        {myTasks.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display font-bold text-gray-800 text-lg mb-3">Dina uppdrag</h3>
            <div className="space-y-4">
            {myTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  variant="my-tasks"
                  onComplete={(completionImage, imageMatchScore) => completeTask(task.id, completionImage, imageMatchScore)}
                />
            ))}
            </div>
          </div>
        )}

        <h3 className="font-display font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500 fill-current" size={20} />
            Topplistan
        </h3>
        
        <div className="space-y-3 pb-8">
            {sortedUsers.map((user, index) => (
                <button 
                  key={user.id} 
                  onClick={() => scrollToScore(user.score)}
                  className={`
                    w-full flex text-left items-center gap-4 p-3 rounded-xl border transition-all active:scale-95 group
                    ${user.id === currentUser?.id ? 'bg-white border-primary/50 shadow-md' : 'bg-white border-transparent shadow-sm hover:border-gray-200'}
                `}>
                    <div className={`
                      font-display font-bold text-xl w-8 text-center group-hover:scale-110 transition-transform
                      ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-300'}
                    `}>
                        {index + 1}
                    </div>
                    <div className="relative">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-100" />
                    </div>
                    <div className="flex-1">
                        <h4 className={`font-bold text-sm ${user.id === currentUser?.id ? 'text-primary' : 'text-gray-700'}`}>
                          {user.name} {user.id === currentUser?.id && '(Du)'}
                        </h4>
                        <div className="text-[10px] text-gray-400">Nivå {user.level}</div>
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-gray-800">{user.score}</span>
                        <span className="text-[9px] text-gray-400 uppercase">XP</span>
                    </div>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};