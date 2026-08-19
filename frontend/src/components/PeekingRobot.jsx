import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

export default function PeekingRobot({ companyName = 'Medicare', onInteract }) {
  // States: 'popup' (initial greeting) -> 'peeking' (tilted & peeking from right screen edge) -> 'hovered' (slid in & waving)
  const [robotState, setRobotState] = useState('popup'); // 'popup' | 'peeking' | 'hovered'
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  // Initial greeting sequence
  useEffect(() => {
    setShowSpeechBubble(true);
    setRobotState('popup');

    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
      setRobotState('peeking');
    }, 4200);

    return () => clearTimeout(timer);
  }, [companyName]);

  const handleMouseEnter = () => {
    setRobotState('hovered');
    setShowSpeechBubble(true);
  };

  const handleMouseLeave = () => {
    const timer = setTimeout(() => {
      setShowSpeechBubble(false);
      setRobotState('peeking');
    }, 2800);
  };

  const handleClick = () => {
    setRobotState('hovered');
    setShowSpeechBubble(true);
    if (onInteract) onInteract();
  };

  const isPeeking = robotState === 'peeking';
  const isWaving = robotState === 'popup' || robotState === 'hovered';

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
              initial={{ opacity: 0, scale: 0.85, y: 12, x: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 12 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="absolute right-28 bottom-16 w-64 p-3.5 bg-white border-2 border-blue-500 rounded-2xl shadow-2xl z-50 text-slate-800 text-xs font-sans leading-snug"
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
                👋 <strong>Hello!</strong> I am your AI assistant for <span className="text-blue-700 font-bold">{companyName}</span>. Ask me about quality gaps or members!
              </p>

              {/* Speech bubble pointer arrow */}
              <div className="absolute -right-2 bottom-4 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-blue-500 transform -rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Robot Avatar Container with Tilt & Peeking Physics */}
        <motion.div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          animate={{
            x: isPeeking ? 48 : 0, // Slide right to peek around border
            rotate: isPeeking ? -16 : 0, // Tilt left to peek naturally from right wall
            y: isPeeking ? [0, -3, 0] : [0, -5, 0], // Gentle hovering idle
          }}
          transition={{
            x: { type: 'spring', stiffness: 280, damping: 22 },
            rotate: { type: 'spring', stiffness: 280, damping: 20 },
            y: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' },
          }}
          style={{ transformOrigin: 'bottom right' }}
          className="cursor-pointer relative p-2 pr-3 transition-transform active:scale-95 group"
        >
          {/* Vector SVG Robot */}
          <div className="relative w-24 h-28 filter drop-shadow-xl">
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="botHeadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <linearGradient id="botVisorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
              </defs>

              {/* Antenna */}
              <circle cx="50" cy="12" r="5" fill="#3b82f6" className="animate-pulse" />
              <line x1="50" y1="17" x2="50" y2="28" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="50" cy="12" r="8" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" className="animate-ping" />

              {/* Left Arm (Resting on Hip) */}
              <path
                d="M 24 74 C 14 74 12 88 16 94 C 18 97 22 95 24 90"
                stroke="#2563eb"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="24" cy="74" r="5" fill="#3b82f6" />

              {/* Robot Body */}
              <rect x="22" y="70" width="56" height="38" rx="14" fill="url(#botHeadGrad)" stroke="#2563eb" strokeWidth="3.5" />

              {/* Chest Screen with Pulse ECG Heartbeat */}
              <rect x="33" y="78" width="34" height="20" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
              <path
                d="M 37 88 L 42 88 L 45 83 L 49 93 L 52 86 L 55 88 L 63 88"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Neck Joint */}
              <rect x="42" y="64" width="16" height="7" rx="3" fill="#64748b" />

              {/* Robot Head */}
              <rect x="20" y="24" width="60" height="42" rx="15" fill="url(#botHeadGrad)" stroke="#2563eb" strokeWidth="3.5" />

              {/* Ear Caps */}
              <rect x="14" y="38" width="7" height="14" rx="3" fill="#3b82f6" />
              <rect x="79" y="38" width="7" height="14" rx="3" fill="#3b82f6" />

              {/* Visor Screen */}
              <rect x="26" y="32" width="48" height="26" rx="9" fill="url(#botVisorGrad)" />

              {/* Robot Eyes (Glowing Sky Blue with Blink Animation) */}
              <motion.circle
                cx={isPeeking ? 37 : 40}
                cy="44"
                r="4.5"
                fill="#38bdf8"
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.2 }}
              />
              <motion.circle
                cx={isPeeking ? 55 : 60}
                cy="44"
                r="4.5"
                fill="#38bdf8"
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.2 }}
              />

              {/* Robot Friendly Smile */}
              <path
                d={isPeeking ? "M 42 51 Q 48 55 54 51" : "M 44 51 Q 50 55 56 51"}
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />

              {/* RIGHT SHOULDER SOCKET & WAVING ARM (PERFECTLY ANCHORED AT (76, 74)) */}
              {/* Fixed Shoulder Base Joint (Never Detaches from Body) */}
              <circle cx="76" cy="74" r="5.5" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5" />

              {/* Rotating Arm Group (Pivot exactly at shoulder center 76px, 74px) */}
              <motion.g
                style={{
                  transformOrigin: '76px 74px',
                }}
                animate={
                  isWaving
                    ? {
                        rotate: [0, -45, 10, -45, 10, -30, 0],
                      }
                    : { rotate: isPeeking ? -15 : 0 }
                }
                transition={{
                  duration: 1.5,
                  repeat: isWaving ? Infinity : 0,
                  repeatDelay: 1.2,
                  ease: 'easeInOut',
                }}
              >
                {/* Upper Arm & Forearm Line */}
                <path
                  d="M 76 74 L 84 56"
                  stroke="#2563eb"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 84 56 L 86 42"
                  stroke="#2563eb"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />

                {/* Elbow Joint */}
                <circle cx="84" cy="56" r="3.5" fill="#3b82f6" />

                {/* Hand Palm with 3 Cute Fingers */}
                <circle cx="86" cy="40" r="5" fill="#3b82f6" />
                <line x1="84" y1="36" x2="83" y2="31" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="87" y1="35" x2="88" y2="30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="90" y1="37" x2="93" y2="33" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              </motion.g>
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
