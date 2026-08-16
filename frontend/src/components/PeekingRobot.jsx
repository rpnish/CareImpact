import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function PeekingRobot({ onQuickPrompt }) {
  // States: 'entrance' -> 'peeking' <-> 'hovered'
  const [botState, setBotState] = useState('entrance');
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [dialogueText, setDialogueText] = useState("Hi! I'm Byte, your Clinical Copilot! 👋");

  // Entrance sequence: Pop out center-right -> wave -> slide to right & tilt to peek
  useEffect(() => {
    const speechTimer = setTimeout(() => {
      setDialogueText("I'll be peeking right here if you need me! ✨");
    }, 2200);

    const hideTimer = setTimeout(() => {
      setBotState('peeking');
    }, 4200);

    return () => {
      clearTimeout(speechTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Periodic eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3200);
    return () => clearInterval(blinkInterval);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setDialogueText("Hi! Need help with patient outreach or Star simulation? 👋");
    setBotState('hovered');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTimeout(() => {
      setBotState('peeking');
    }, 350);
  };

  const handleBotClick = () => {
    if (onQuickPrompt) {
      onQuickPrompt("Who are the top high-priority members I should call first today, and why?");
    }
  };

  const isPeeking = botState === 'peeking' && !isHovered;

  return (
    <div
      className="fixed bottom-6 right-0 z-50 pointer-events-none select-none"
      style={{ width: '320px', height: '280px' }}
    >
      <div className="relative w-full h-full flex items-end justify-end pointer-events-auto overflow-visible">
        {/* Holographic Portal Ground Ring during Pop-out */}
        <AnimatePresence>
          {(botState === 'entrance' || isHovered) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: [0, 0.8, 0.4] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute bottom-2 right-6 w-32 h-8 rounded-full bg-gradient-to-r from-ai-cyan/40 via-ai-purple/60 to-ai-violet/40 blur-md pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* 1. Interactive Speech Bubble */}
        <AnimatePresence>
          {(botState === 'entrance' || isHovered) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20, x: -15 }}
              animate={{
                opacity: 1,
                scale: [0.6, 1.08, 1],
                y: 0,
                x: 0,
              }}
              exit={{ opacity: 0, scale: 0.7, y: 15, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', damping: 14, stiffness: 320 }}
              className="absolute -top-14 right-20 sm:right-28 w-64 p-3.5 rounded-2xl bg-navy-900/95 border border-violet-500/60 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl text-slate-100 z-50 space-y-2 font-sans"
            >
              {/* Speech pointer notch */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-navy-900 border-r border-b border-violet-500/60 rotate-45" />

              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-ai-purple-light uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-ai-purple animate-pulse" />
                <span>Byte · AI Copilot</span>
              </div>

              <p className="text-xs font-semibold text-white leading-snug">
                {dialogueText}
              </p>

              {isHovered && (
                <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-800/90">
                  <button
                    onClick={() => onQuickPrompt && onQuickPrompt("Who are the top high-priority members I should call first today, and why?")}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-violet-950/70 hover:bg-violet-900/90 text-violet-200 hover:text-white border border-violet-700/50 transition-all flex items-center justify-between group shadow-sm active:scale-95"
                  >
                    <span className="font-semibold">📞 Who to call today?</span>
                    <span className="text-[10px] text-ai-purple-light font-mono group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                  <button
                    onClick={() => onQuickPrompt && onQuickPrompt("What is our #1 target measure to reach 4.0 Stars with least effort?")}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-200 hover:text-white border border-cyan-700/50 transition-all flex items-center justify-between group shadow-sm active:scale-95"
                  >
                    <span className="font-semibold">🎯 #1 Star Target</span>
                    <span className="text-[10px] text-ai-cyan-light font-mono group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Main Animated Robot Character */}
        <motion.div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleBotClick}
          initial={{
            y: 200,
            x: 0,
            scale: 0.3,
            rotate: 20,
            opacity: 0,
          }}
          animate={
            isPeeking
              ? {
                  // --- TILTED PEEKING AT RIGHT SCREEN EDGE ---
                  x: 92, // Body tucked behind right screen boundary
                  y: [0, -8, 0], // Inquisitive floating bob
                  rotate: [-22, -16, -22], // Tilting head/body inquisitively around the corner
                  scale: 0.96,
                  opacity: 1,
                }
              : {
                  // --- ENERGETIC POPPED OUT STATE ---
                  x: 0,
                  y: [0, -5, 0],
                  rotate: 0, // Upright posture
                  scale: [1.02, 1.08, 1.04],
                  opacity: 1,
                }
          }
          transition={
            isPeeking
              ? {
                  x: { type: 'spring', damping: 20, stiffness: 240 },
                  rotate: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
                  y: { repeat: Infinity, duration: 2.6, ease: 'easeInOut' },
                  scale: { duration: 0.3 },
                }
              : {
                  // High-energy spring overshoot pop-out
                  x: { type: 'spring', damping: 12, stiffness: 320, mass: 0.7 },
                  rotate: { type: 'spring', damping: 14, stiffness: 350 },
                  scale: { type: 'spring', damping: 10, stiffness: 380 },
                  y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                }
          }
          className="relative cursor-pointer group origin-bottom-right"
          title={isPeeking ? "Hover me to pop out!" : "Byte, your Quality Copilot"}
        >
          {/* Glowing Aura */}
          <div className="absolute inset-0 bg-violet-500/25 blur-2xl rounded-full scale-125 pointer-events-none" />

          {/* SVG Robot Character */}
          <svg
            width="145"
            height="165"
            viewBox="0 0 145 165"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_12px_24px_rgba(139,92,246,0.45)] transition-transform duration-200"
          >
            <defs>
              <linearGradient id="robotChassis" x1="10" y1="10" x2="135" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3B0764" />
                <stop offset="45%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#090D1F" />
              </linearGradient>

              <linearGradient id="robotVisor" x1="30" y1="40" x2="115" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#04060F" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              <linearGradient id="neonCyanGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>

              <linearGradient id="neonPurpleGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D8B4FE" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>

              <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* --- ANTENNA WITH PULSING HOLO SIGNAL --- */}
            <line x1="72" y1="16" x2="72" y2="30" stroke="#8B5CF6" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="72" cy="13" r="5.5" fill="#38BDF8" filter="url(#laserGlow)">
              <animate attributeName="r" values="4.5;7;4.5" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#38BDF8;#C084FC;#38BDF8" dur="1.4s" repeatCount="indefinite" />
            </circle>

            {/* Holographic radio wave rings on antenna */}
            <path
              d="M 60 10 Q 72 2 84 10"
              stroke="#22D3EE"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            >
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.6s" repeatCount="indefinite" />
            </path>

            {/* --- ROBOT EARS / SIDE SENSORS --- */}
            {/* Left Ear */}
            <rect x="20" y="46" width="9" height="26" rx="4.5" fill="#4F46E5" stroke="#A78BFA" strokeWidth="1.5" />
            <circle cx="24.5" cy="59" r="2.5" fill="#22D3EE" filter="url(#laserGlow)" />

            {/* Right Ear */}
            <rect x="115" y="46" width="9" height="26" rx="4.5" fill="#4F46E5" stroke="#A78BFA" strokeWidth="1.5" />
            <circle cx="119.5" cy="59" r="2.5" fill="#22D3EE" filter="url(#laserGlow)" />

            {/* --- HEAD CHASSIS --- */}
            <rect
              x="27"
              y="30"
              width="90"
              height="64"
              rx="24"
              fill="url(#robotChassis)"
              stroke="url(#neonPurpleGlow)"
              strokeWidth="2.8"
            />

            {/* Visor Screen Glass */}
            <rect
              x="36"
              y="40"
              width="72"
              height="44"
              rx="16"
              fill="url(#robotVisor)"
              stroke="#4338CA"
              strokeWidth="1.8"
            />

            {/* --- DIGITAL EYES --- */}
            {isBlinking ? (
              // Cute Blinking Narrow Lines
              <>
                <line x1="48" y1="62" x2="63" y2="62" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" filter="url(#laserGlow)" />
                <line x1="81" y1="62" x2="96" y2="62" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" filter="url(#laserGlow)" />
              </>
            ) : isHovered ? (
              // Super Happy Arc Eyes (^ ^)
              <>
                <path d="M 48 64 Q 56 52 64 64" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#laserGlow)" />
                <path d="M 80 64 Q 88 52 96 64" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" fill="none" filter="url(#laserGlow)" />
                {/* Cute Cheeks Blush */}
                <ellipse cx="44" cy="71" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.8" filter="url(#laserGlow)" />
                <ellipse cx="100" cy="71" rx="4.5" ry="2.5" fill="#FB7185" opacity="0.8" filter="url(#laserGlow)" />
              </>
            ) : (
              // Normal Curious Oval LED Eyes (looking slightly left into chat)
              <>
                <ellipse cx="54" cy="61" rx="6.5" ry="9" fill="url(#neonCyanGlow)" filter="url(#laserGlow)" />
                <circle cx="56" cy="58" r="2.5" fill="#FFFFFF" />
                <ellipse cx="86" cy="61" rx="6.5" ry="9" fill="url(#neonCyanGlow)" filter="url(#laserGlow)" />
                <circle cx="88" cy="58" r="2.5" fill="#FFFFFF" />
              </>
            )}

            {/* --- BODY CHASSIS --- */}
            <path
              d="M 44 96 L 100 96 C 107 96 111 101 109 108 L 102 140 C 100 145 95 149 89 149 L 55 149 C 49 149 44 145 42 140 L 35 108 C 33 101 37 96 44 96 Z"
              fill="url(#robotChassis)"
              stroke="url(#neonPurpleGlow)"
              strokeWidth="2.2"
            />

            {/* Glowing Star Arc Core Reactor */}
            <circle cx="72" cy="122" r="9.5" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="2" />
            <polygon
              points="72,116 74,120 79,121 75.5,124.5 76.5,129 72,126 67.5,129 68.5,124.5 65,121 70,120"
              fill="#FBBF24"
              filter="url(#laserGlow)"
            />

            {/* --- LEFT HAND / ARM (WAVING ANIMATION) --- */}
            <motion.g
              animate={
                !isPeeking || isHovered
                  ? {
                      rotate: [0, -25, 15, -25, 15, 0],
                      originX: '30px',
                      originY: '105px',
                    }
                  : {
                      // Hand peeking & holding screen edge
                      rotate: -10,
                    }
              }
              transition={{
                repeat: isHovered || botState === 'entrance' ? Infinity : 0,
                duration: 1.15,
                ease: 'easeInOut',
              }}
            >
              {/* Shoulder Joint */}
              <circle cx="30" cy="105" r="4.5" fill="#6366F1" />
              {/* Arm */}
              <path d="M 30 105 Q 16 90 12 74" stroke="url(#neonPurpleGlow)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* Palm */}
              <circle cx="12" cy="72" r="6.5" fill="#8B5CF6" stroke="#22D3EE" strokeWidth="1.8" filter="url(#laserGlow)" />
              {/* Waving Fingers */}
              <circle cx="8" cy="65" r="2.5" fill="#22D3EE" />
              <circle cx="13" cy="62" r="2.5" fill="#22D3EE" />
              <circle cx="18" cy="65" r="2.5" fill="#22D3EE" />
            </motion.g>

            {/* --- RIGHT ARM (PEEKING WALL-GRIP) --- */}
            <circle cx="114" cy="105" r="4.5" fill="#6366F1" />
            <path d="M 114 105 Q 124 118 122 130" stroke="url(#neonPurpleGlow)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <circle cx="122" cy="130" r="5.5" fill="#8B5CF6" stroke="#A78BFA" strokeWidth="1.5" />
          </svg>

          {/* Peeking Floating Click Badge */}
          {isPeeking && (
            <motion.div
              animate={{
                x: [-3, 3, -3],
                scale: [1, 1.05, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute -top-4 -left-2 px-2.5 py-1 rounded-full bg-violet-900/95 text-ai-cyan-light border border-violet-500/70 text-[10px] font-mono font-extrabold shadow-[0_0_15px_rgba(139,92,246,0.6)] whitespace-nowrap flex items-center gap-1"
            >
              <span>👀 Peek!</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
