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
      setDialogueText("I'm right here whenever you need me! ✨");
    }, 2000);

    const hideTimer = setTimeout(() => {
      setBotState('peeking');
    }, 3800);

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
    }, 3000);
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
    }, 300);
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
              animate={{ scale: [0, 1.2, 1], opacity: [0, 0.7, 0.35] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute bottom-2 right-4 w-32 h-8 rounded-full bg-gradient-to-r from-ai-cyan/40 via-ai-purple/60 to-ai-violet/40 blur-md pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* 1. Interactive Speech Bubble */}
        <AnimatePresence>
          {(botState === 'entrance' || isHovered) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 15, x: -10 }}
              animate={{
                opacity: 1,
                scale: [0.6, 1.06, 1],
                y: 0,
                x: 0,
              }}
              exit={{ opacity: 0, scale: 0.7, y: 10, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 15, stiffness: 350 }}
              className="absolute -top-12 right-20 sm:right-28 w-64 p-3.5 rounded-2xl bg-navy-900/95 border border-violet-500/60 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl text-slate-100 z-50 space-y-2 font-sans"
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

        {/* 2. Main Animated Robot Character (Seamless One-Piece Chassis) */}
        <motion.div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleBotClick}
          initial={{
            y: 180,
            x: 0,
            scale: 0.3,
            rotate: 15,
            opacity: 0,
          }}
          animate={
            isPeeking
              ? {
                  // --- TILTED HIDING POSITION AT RIGHT WALL ---
                  x: 96, // Body hidden behind right edge
                  y: [0, -6, 0], // Gentle breathing float
                  rotate: [-20, -15, -20], // Smooth natural tilt leaning head in
                  scale: 0.95,
                  opacity: 1,
                }
              : {
                  // --- POPPED OUT STANDING UPRIGHT ---
                  x: 0,
                  y: [0, -4, 0],
                  rotate: 0,
                  scale: 1,
                  opacity: 1,
                }
          }
          transition={
            isPeeking
              ? {
                  x: { type: 'spring', damping: 22, stiffness: 260 },
                  rotate: { repeat: Infinity, duration: 3.0, ease: 'easeInOut' },
                  y: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' },
                  scale: { duration: 0.25 },
                }
              : {
                  // High-energy spring overshoot pop-out
                  x: { type: 'spring', damping: 14, stiffness: 340, mass: 0.75 },
                  rotate: { type: 'spring', damping: 15, stiffness: 360 },
                  scale: { type: 'spring', damping: 12, stiffness: 380 },
                  y: { repeat: Infinity, duration: 2.0, ease: 'easeInOut' },
                }
          }
          style={{ transformOrigin: 'bottom right' }}
          className="relative cursor-pointer group"
          title="Byte, your Quality Copilot"
        >
          {/* Glowing Aura */}
          <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full scale-110 pointer-events-none" />

          {/* Solid Unified SVG Robot */}
          <svg
            width="140"
            height="155"
            viewBox="0 0 140 155"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_10px_20px_rgba(139,92,246,0.4)]"
          >
            <defs>
              <linearGradient id="bodyGrad" x1="10" y1="10" x2="130" y2="150" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3B0764" />
                <stop offset="50%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#090D1F" />
              </linearGradient>

              <linearGradient id="visorGrad" x1="30" y1="35" x2="110" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#04060F" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              <linearGradient id="cyanNeon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>

              <linearGradient id="purpleNeon" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D8B4FE" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>

              <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* --- 1. ANTENNA --- */}
            <line x1="70" y1="14" x2="70" y2="28" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="70" cy="11" r="5" fill="#38BDF8" filter="url(#glowFilter)">
              <animate attributeName="r" values="4;6.5;4" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#38BDF8;#C084FC;#38BDF8" dur="1.4s" repeatCount="indefinite" />
            </circle>

            {/* --- 2. ROBOT EARS / SIDE SENSORS --- */}
            <rect x="18" y="44" width="9" height="24" rx="4" fill="#4F46E5" stroke="#A78BFA" strokeWidth="1.5" />
            <circle cx="22.5" cy="56" r="2.2" fill="#22D3EE" filter="url(#glowFilter)" />

            <rect x="113" y="44" width="9" height="24" rx="4" fill="#4F46E5" stroke="#A78BFA" strokeWidth="1.5" />
            <circle cx="117.5" cy="56" r="2.2" fill="#22D3EE" filter="url(#glowFilter)" />

            {/* --- 3. SEAMLESS CONNECTED TORSO & NECK --- */}
            {/* Neck Joint Collar */}
            <rect x="54" y="78" width="32" height="14" rx="4" fill="#312E81" stroke="#6366F1" strokeWidth="1.5" />

            {/* Torso Body Chassis */}
            <path
              d="M 40 88 L 100 88 C 108 88 112 94 110 102 L 102 134 C 100 140 94 144 88 144 L 52 144 C 46 144 40 140 38 134 L 30 102 C 28 94 32 88 40 88 Z"
              fill="url(#bodyGrad)"
              stroke="url(#purpleNeon)"
              strokeWidth="2.2"
            />

            {/* Heart Core Arc Reactor */}
            <circle cx="70" cy="116" r="9" fill="#1E1B4B" stroke="#8B5CF6" strokeWidth="1.8" />
            <polygon
              points="70,110 72,114 77,115 73.5,118.5 74.5,123 70,120 65.5,123 66.5,118.5 63,115 68,114"
              fill="#FBBF24"
              filter="url(#glowFilter)"
            />

            {/* --- 4. HEAD CHASSIS (Overlaps Neck for Seamless Solid Silhouette) --- */}
            <rect
              x="25"
              y="28"
              width="90"
              height="58"
              rx="22"
              fill="url(#bodyGrad)"
              stroke="url(#purpleNeon)"
              strokeWidth="2.5"
            />

            {/* Visor Screen Glass */}
            <rect
              x="34"
              y="38"
              width="72"
              height="38"
              rx="14"
              fill="url(#visorGrad)"
              stroke="#4338CA"
              strokeWidth="1.6"
            />

            {/* --- 5. DIGITAL EXPRESSIVE EYES --- */}
            {isBlinking ? (
              // Blinking Horizontal Light Lines
              <>
                <line x1="46" y1="57" x2="60" y2="57" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" filter="url(#glowFilter)" />
                <line x1="80" y1="57" x2="94" y2="57" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" filter="url(#glowFilter)" />
              </>
            ) : isHovered ? (
              // Super Happy Curved Arc Eyes (^ ^)
              <>
                <path d="M 46 59 Q 53 49 60 59" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glowFilter)" />
                <path d="M 80 59 Q 87 49 94 59" stroke="#22D3EE" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glowFilter)" />
                {/* Cute Cheeks Blush */}
                <ellipse cx="42" cy="65" rx="4" ry="2" fill="#FB7185" opacity="0.75" filter="url(#glowFilter)" />
                <ellipse cx="98" cy="65" rx="4" ry="2" fill="#FB7185" opacity="0.75" filter="url(#glowFilter)" />
              </>
            ) : (
              // Normal Oval LED Eyes
              <>
                <ellipse cx="53" cy="56" rx="6" ry="8" fill="url(#cyanNeon)" filter="url(#glowFilter)" />
                <circle cx="55" cy="53" r="2.2" fill="#FFFFFF" />
                <ellipse cx="87" cy="56" rx="6" ry="8" fill="url(#cyanNeon)" filter="url(#glowFilter)" />
                <circle cx="89" cy="53" r="2.2" fill="#FFFFFF" />
              </>
            )}

            {/* --- 6. ARMS (Permanently Anchored at Shoulder Ball-Joints) --- */}
            {/* Left Waving Arm */}
            <g>
              {/* Permanent Shoulder Socket Ball */}
              <circle cx="30" cy="98" r="5" fill="#4F46E5" stroke="#8B5CF6" strokeWidth="1.5" />

              {/* Animated Arm & Hand */}
              <motion.g
                animate={
                  !isPeeking || isHovered
                    ? {
                        rotate: [0, -22, 12, -22, 12, 0],
                      }
                    : {
                        rotate: -8,
                      }
                }
                transition={{
                  repeat: isHovered || botState === 'entrance' ? Infinity : 0,
                  duration: 1.1,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: '30px 98px' }}
              >
                <path d="M 30 98 Q 18 84 14 70" stroke="url(#purpleNeon)" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Palm */}
                <circle cx="14" cy="68" r="6" fill="#8B5CF6" stroke="#22D3EE" strokeWidth="1.5" filter="url(#glowFilter)" />
                {/* Fingers */}
                <circle cx="10" cy="62" r="2.2" fill="#22D3EE" />
                <circle cx="14" cy="59" r="2.2" fill="#22D3EE" />
                <circle cx="18" cy="62" r="2.2" fill="#22D3EE" />
              </motion.g>
            </g>

            {/* Right Arm (Resting Wall Grip) */}
            <g>
              <circle cx="110" cy="98" r="5" fill="#4F46E5" stroke="#8B5CF6" strokeWidth="1.5" />
              <path d="M 110 98 Q 120 112 118 124" stroke="url(#purpleNeon)" strokeWidth="4" strokeLinecap="round" fill="none" />
              <circle cx="118" cy="124" r="5" fill="#8B5CF6" stroke="#A78BFA" strokeWidth="1.5" />
            </g>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
