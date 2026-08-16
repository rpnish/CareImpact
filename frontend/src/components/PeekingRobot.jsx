import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Zap, X } from 'lucide-react';

export default function PeekingRobot({ onQuickPrompt }) {
  // States: 'entrance' -> 'peeking' <-> 'hovered'
  const [botState, setBotState] = useState('entrance');
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [dialogueText, setDialogueText] = useState("Hi! I'm Byte, your Clinical Copilot! 👋");

  // Initial entrance animation sequence
  useEffect(() => {
    const entranceTimer = setTimeout(() => {
      setDialogueText("I'll be right here if you need me! ✨");
    }, 2000);

    const hideTimer = setTimeout(() => {
      setBotState('peeking');
    }, 3800);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Periodic eye blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setDialogueText("Hi again! Need help with outreach or Star cutpoints? 👋");
    setBotState('hovered');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTimeout(() => {
      setBotState('peeking');
    }, 400);
  };

  const handleBotClick = () => {
    if (onQuickPrompt) {
      onQuickPrompt("Who are the top high-priority members I should call first today, and why?");
    }
  };

  // Determine current display position
  const isPeeking = botState === 'peeking' && !isHovered;

  return (
    <div
      className="fixed bottom-8 right-0 z-50 pointer-events-none select-none"
      style={{ width: '280px', height: '240px' }}
    >
      <div className="relative w-full h-full flex items-end justify-end pointer-events-auto">
        {/* 1. Interactive Speech Bubble */}
        <AnimatePresence>
          {(botState === 'entrance' || isHovered) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10, x: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute -top-12 right-20 sm:right-28 w-60 p-3.5 rounded-2xl bg-navy-900/95 border border-violet-500/50 shadow-2xl backdrop-blur-xl text-slate-100 z-50 space-y-2 font-sans"
            >
              {/* Speech bubble pointer notch */}
              <div className="absolute -bottom-2 right-6 w-4 h-4 bg-navy-900 border-r border-b border-violet-500/50 rotate-45" />

              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-ai-purple-light uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-ai-purple" />
                <span>Byte · AI Copilot</span>
              </div>

              <p className="text-xs font-medium text-white leading-snug">
                {dialogueText}
              </p>

              {isHovered && (
                <div className="pt-1.5 flex flex-col gap-1 border-t border-slate-800/80">
                  <button
                    onClick={() => onQuickPrompt && onQuickPrompt("Who are the top high-priority members I should call first today?")}
                    className="text-left text-[11px] px-2 py-1 rounded-lg bg-violet-950/60 hover:bg-violet-900/80 text-violet-200 hover:text-white border border-violet-700/40 transition-colors flex items-center justify-between group"
                  >
                    <span>📞 Who to call today?</span>
                    <span className="text-[10px] text-ai-purple-light font-mono group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    onClick={() => onQuickPrompt && onQuickPrompt("What is our #1 target measure to reach 4.0 Stars?")}
                    className="text-left text-[11px] px-2 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 hover:text-white border border-cyan-700/40 transition-colors flex items-center justify-between group"
                  >
                    <span>🎯 #1 Star ROI Target</span>
                    <span className="text-[10px] text-ai-cyan-light font-mono group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Animated Robot Character */}
        <motion.div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleBotClick}
          initial={{ y: 160, scale: 0.6, opacity: 0 }}
          animate={
            isPeeking
              ? {
                  x: 75, // Slide halfway off-screen so only face and eyes peek out
                  y: [0, -6, 0], // Gentle hovering float
                  scale: 0.95,
                  opacity: 1,
                }
              : {
                  x: 0, // Fully out on screen
                  y: [0, -4, 0],
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={
            isPeeking
              ? {
                  x: { type: 'spring', damping: 22, stiffness: 220 },
                  y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
                  scale: { duration: 0.3 },
                }
              : {
                  x: { type: 'spring', damping: 18, stiffness: 260 },
                  y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                  scale: { type: 'spring', damping: 15, stiffness: 300 },
                }
          }
          className="relative cursor-pointer group"
          title={isPeeking ? "Hover or click me to chat!" : "Byte, your Quality Copilot"}
        >
          {/* Outer glow ring around character */}
          <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full scale-110 pointer-events-none" />

          {/* SVG Robot Character */}
          <svg
            width="130"
            height="150"
            viewBox="0 0 130 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_10px_20px_rgba(139,92,246,0.35)]"
          >
            <defs>
              {/* Chassis metallic gradient */}
              <linearGradient id="chassisGrad" x1="0" y1="0" x2="130" y2="150" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2E1065" />
                <stop offset="50%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#0B0F24" />
              </linearGradient>

              {/* Visor glass gradient */}
              <linearGradient id="visorGrad" x1="20" y1="35" x2="110" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#060814" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Neon Cyan glow gradient */}
              <linearGradient id="neonCyan" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>

              {/* Neon Violet glow gradient */}
              <linearGradient id="neonViolet" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>

              {/* Antenna Pulse Glow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* --- ANTENNA --- */}
            <line x1="65" y1="18" x2="65" y2="30" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="65" cy="14" r="5" fill="#38BDF8" filter="url(#glow)">
              <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#38BDF8;#C084FC;#38BDF8" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* --- ROBOT EARS / HEADPHONES --- */}
            {/* Left Ear */}
            <rect x="18" y="44" width="8" height="22" rx="4" fill="#6366F1" stroke="#A78BFA" strokeWidth="1.5" />
            {/* Right Ear */}
            <rect x="104" y="44" width="8" height="22" rx="4" fill="#6366F1" stroke="#A78BFA" strokeWidth="1.5" />

            {/* --- HEAD CHASSIS --- */}
            <rect
              x="24"
              y="28"
              width="82"
              height="58"
              rx="22"
              fill="url(#chassisGrad)"
              stroke="url(#neonViolet)"
              strokeWidth="2.5"
            />

            {/* Visor Frame */}
            <rect
              x="32"
              y="38"
              width="66"
              height="38"
              rx="14"
              fill="url(#visorGrad)"
              stroke="#4338CA"
              strokeWidth="1.5"
            />

            {/* --- DIGITAL EYES --- */}
            {isBlinking ? (
              // Blinking line eyes
              <>
                <line x1="44" y1="56" x2="58" y2="56" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
                <line x1="72" y1="56" x2="86" y2="56" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
              </>
            ) : isHovered ? (
              // Happy Arc Eyes (^ ^)
              <>
                <path d="M 44 58 Q 51 48 58 58" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glow)" />
                <path d="M 72 58 Q 79 48 86 58" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glow)" />
                {/* Cute Cheeks Blush */}
                <ellipse cx="40" cy="65" rx="4" ry="2" fill="#F43F5E" opacity="0.6" />
                <ellipse cx="90" cy="65" rx="4" ry="2" fill="#F43F5E" opacity="0.6" />
              </>
            ) : (
              // Normal Oval Glowing LED Eyes
              <>
                <ellipse cx="51" cy="56" rx="6" ry="8" fill="url(#neonCyan)" filter="url(#glow)" />
                <circle cx="53" cy="53" r="2.2" fill="#FFFFFF" />
                <ellipse cx="79" cy="56" rx="6" ry="8" fill="url(#neonCyan)" filter="url(#glow)" />
                <circle cx="81" cy="53" r="2.2" fill="#FFFFFF" />
              </>
            )}

            {/* --- BODY CHASSIS --- */}
            <path
              d="M 40 88 L 90 88 C 96 88 100 93 98 99 L 92 128 C 91 133 86 136 81 136 L 49 136 C 44 136 39 133 38 128 L 32 99 C 30 93 34 88 40 88 Z"
              fill="url(#chassisGrad)"
              stroke="url(#neonViolet)"
              strokeWidth="2"
            />

            {/* Glowing Heart Core / Reactor */}
            <circle cx="65" cy="110" r="8" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="1.5" />
            <polygon
              points="65,105 67,109 71,110 68,113 69,117 65,114 61,117 62,113 59,110 63,109"
              fill="#FBBF24"
              filter="url(#glow)"
            />

            {/* --- LEFT HAND / ARM --- */}
            <motion.g
              animate={
                !isPeeking || isHovered
                  ? {
                      rotate: [0, -18, 12, -18, 12, 0],
                      originX: '26px',
                      originY: '95px',
                    }
                  : { rotate: 0 }
              }
              transition={{
                repeat: isHovered || botState === 'entrance' ? Infinity : 0,
                duration: 1.1,
                ease: 'easeInOut',
              }}
            >
              {/* Shoulder joint */}
              <circle cx="26" cy="96" r="4" fill="#6366F1" />
              {/* Arm */}
              <path d="M 26 96 Q 14 85 10 70" stroke="url(#neonViolet)" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Hand Palm */}
              <circle cx="10" cy="68" r="5.5" fill="#8B5CF6" stroke="#22D3EE" strokeWidth="1.5" filter="url(#glow)" />
              {/* Cute Waving Fingers */}
              <circle cx="7" cy="62" r="2" fill="#22D3EE" />
              <circle cx="11" cy="60" r="2" fill="#22D3EE" />
              <circle cx="15" cy="62" r="2" fill="#22D3EE" />
            </motion.g>

            {/* --- RIGHT ARM (Resting / Attached) --- */}
            <circle cx="104" cy="96" r="4" fill="#6366F1" />
            <path d="M 104 96 Q 112 110 110 120" stroke="url(#neonViolet)" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="110" cy="120" r="5" fill="#8B5CF6" stroke="#A78BFA" strokeWidth="1" />
          </svg>

          {/* Peeking Click / Hover Indicator Chip */}
          {isPeeking && (
            <motion.div
              animate={{ x: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="absolute -top-3 left-1 px-2 py-0.5 rounded-full bg-violet-900/90 text-ai-purple-light border border-violet-500/60 text-[9px] font-mono font-bold shadow-glow-purple whitespace-nowrap"
            >
              👋 Peek!
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
