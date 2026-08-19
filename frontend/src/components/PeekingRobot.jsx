import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquareHeart } from 'lucide-react';

export default function PeekingRobot({ companyName = 'Medicare', onInteract }) {
  // State: 'popup' (initial full center-bottom/right) -> 'peeking' (hiding on right edge) -> 'hovered' (peeked out)
  const [robotState, setRobotState] = useState('popup'); // 'popup' | 'peeking' | 'hovered'
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  // Initial greeting sequence
  useEffect(() => {
    // 1. Initially popped up & waving
    setShowSpeechBubble(true);
    setRobotState('popup');

    // 2. After 3.8s, hide to right edge (peeking)
    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
      setRobotState('peeking');
    }, 4000);

    return () => clearTimeout(timer);
  }, [companyName]);

  const handleMouseEnter = () => {
    setRobotState('hovered');
    setShowSpeechBubble(true);
  };

  const handleMouseLeave = () => {
    // Return to peeking after a brief pause
    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
      setRobotState('peeking');
    }, 2500);
  };

  const handleClick = () => {
    setRobotState('hovered');
    setShowSpeechBubble(true);
    if (onInteract) onInteract();
  };

  return (
    <div
      className="fixed bottom-6 right-0 z-40 flex items-end justify-end pointer-events-none select-none"
      style={{ overflow: 'visible' }}
    >
      <div className="relative flex items-end pointer-events-auto">
        {/* Speech Bubble */}
        <AnimatePresence>
          {showSpeechBubble && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10, x: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="absolute right-24 bottom-14 w-60 p-3.5 bg-white border-2 border-blue-500 rounded-2xl shadow-xl z-50 text-slate-800 text-xs font-sans leading-snug"
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-bold text-blue-600 flex items-center gap-1 font-mono text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  <span>Clinical Copilot</span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeechBubble(false);
                  }}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-slate-700 text-xs font-medium">
                👋 <strong>Hello!</strong> I am your AI assistant for <span className="text-blue-700 font-bold">{companyName}</span>. Ask me anything!
              </p>

              {/* Speech bubble pointer arrow */}
              <div className="absolute -right-2 bottom-4 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-blue-500 transform -rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Robot Avatar Container */}
        <motion.div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          animate={{
            x: robotState === 'peeking' ? 44 : 0, // Slide right to peek
            y: robotState === 'peeking' ? [0, -3, 0] : [0, -6, 0], // Subtle floating idle
          }}
          transition={{
            x: { type: 'spring', stiffness: 260, damping: 20 },
            y: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
          }}
          className="cursor-pointer relative p-2 pr-4 transition-transform active:scale-95 group"
        >
          {/* Peeking glow badge when hidden */}
          {robotState === 'peeking' && (
            <span className="absolute left-0 top-3 -translate-x-full px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold shadow-md animate-bounce">
              Peek! 👋
            </span>
          )}

          {/* SVG Robot Illustration */}
          <div className="relative w-20 h-24 filter drop-shadow-lg">
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Antenna */}
              <circle cx="50" cy="12" r="5" fill="#3b82f6" className="animate-pulse" />
              <line x1="50" y1="17" x2="50" y2="28" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />

              {/* Antenna Pulse Ring */}
              <circle cx="50" cy="12" r="8" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" className="animate-ping" />

              {/* Robot Head */}
              <rect x="22" y="28" width="56" height="42" rx="14" fill="#ffffff" stroke="#2563eb" strokeWidth="3.5" />
              
              {/* Ears / Side Screws */}
              <rect x="15" y="42" width="7" height="14" rx="3" fill="#3b82f6" />
              <rect x="78" y="42" width="7" height="14" rx="3" fill="#3b82f6" />

              {/* Visor Screen */}
              <rect x="28" y="36" width="44" height="26" rx="8" fill="#0f172a" />

              {/* Robot Eyes (Glowing Cyan / Sky Blue) */}
              <motion.circle
                cx="40"
                cy="49"
                r="4.5"
                fill="#38bdf8"
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.2 }}
              />
              <motion.circle
                cx="60"
                cy="49"
                r="4.5"
                fill="#38bdf8"
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.2 }}
              />

              {/* Robot Smile (Cyan Glow) */}
              <path d="M 44 56 Q 50 60 56 56" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Neck Joint */}
              <rect x="42" y="70" width="16" height="6" rx="2" fill="#94a3b8" />

              {/* Robot Body */}
              <rect x="20" y="76" width="60" height="38" rx="12" fill="#ffffff" stroke="#2563eb" strokeWidth="3.5" />

              {/* Chest Screen with Pulse Heartbeat */}
              <rect x="32" y="84" width="36" height="20" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
              <path
                d="M 36 94 L 42 94 L 45 88 L 49 100 L 53 91 L 56 94 L 64 94"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Left Arm (Resting) */}
              <rect x="8" y="82" width="12" height="22" rx="6" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />

              {/* Right Arm (WAVING ANIMATION!) */}
              <motion.g
                style={{ originX: '78px', originY: '82px' }}
                animate={
                  robotState === 'popup' || robotState === 'hovered'
                    ? {
                        rotate: [0, -35, 15, -35, 15, -20, 0],
                      }
                    : { rotate: 0 }
                }
                transition={{
                  duration: 1.6,
                  repeat: robotState === 'popup' || robotState === 'hovered' ? 2 : 0,
                  ease: 'easeInOut',
                }}
              >
                {/* Waving Arm */}
                <rect x="80" y="78" width="12" height="24" rx="6" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                {/* Waving Hand with 3 fingers */}
                <circle cx="86" cy="74" r="5" fill="#3b82f6" />
              </motion.g>
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
