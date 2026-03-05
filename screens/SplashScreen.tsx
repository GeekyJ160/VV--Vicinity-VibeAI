
import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'tagline' | 'details' | 'fade'>('logo');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 600);
    const t2 = setTimeout(() => setPhase('details'), 1300);
    const t3 = setTimeout(() => setPhase('fade'), 2800);
    const t4 = setTimeout(() => onComplete(), 3300);

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2;
      });
    }, 50);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearInterval(interval);
    };
  }, [onComplete]);

  const featureItems = [
    { emoji: '⚡', text: 'Real-time vicinity matching' },
    { emoji: '🎯', text: 'AI-powered vibe sync' },
    { emoji: '🗺️', text: 'Live event discovery' },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#0d0a1e',
        opacity: phase === 'fade' ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 500, height: 500,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(232,121,249,0.15) 40%, transparent 70%)',
            animation: 'vv-pulse-glow 3s ease-in-out infinite'
          }}
        />
        <div
          className="absolute rounded-full blur-2xl opacity-30"
          style={{
            width: 200, height: 200,
            top: '20%', right: '10%',
            background: 'radial-gradient(circle, #e879f9, transparent)',
            animation: 'vv-float 4s ease-in-out infinite'
          }}
        />
        <div
          className="absolute rounded-full blur-2xl opacity-20"
          style={{
            width: 150, height: 150,
            bottom: '25%', left: '5%',
            background: 'radial-gradient(circle, #7c3aed, transparent)',
            animation: 'vv-float 5s ease-in-out infinite reverse'
          }}
        />
      </div>

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232,121,249,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,121,249,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: i % 2 === 0 ? '#e879f9' : '#a855f7',
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            opacity: 0.4 + Math.random() * 0.4,
            animation: `vv-stars ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">

        {/* Logo mark */}
        <div
          className="relative mb-8"
          style={{
            opacity: phase !== 'logo' ? 1 : 0,
            transform: phase !== 'logo' ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              margin: -12,
              borderRadius: 36,
              border: '1px solid rgba(232,121,249,0.2)',
              animation: 'vv-pulse-ring 2s ease-out infinite'
            }}
          />
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              margin: -6,
              borderRadius: 30,
              border: '1px solid rgba(232,121,249,0.3)',
              animation: 'vv-pulse-ring 2s ease-out infinite',
              animationDelay: '0.3s'
            }}
          />

          {/* Main logo */}
          <div
            className="w-28 h-28 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #e879f9, #a855f7, #7c3aed)',
              boxShadow: '0 0 60px rgba(232,121,249,0.6), 0 0 120px rgba(168,85,247,0.3)',
            }}
          >
            {/* Shine */}
            <div
              className="absolute inset-0 rounded-3xl opacity-20"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)' }}
            />

            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 42,
                fontWeight: 800,
                letterSpacing: '-0.05em',
                color: 'white',
                lineHeight: 1,
              }}
            >
              VV
            </span>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.7)',
                marginTop: 4,
                textTransform: 'uppercase'
              }}
            >
              vicinity vibe
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            opacity: phase === 'tagline' || phase === 'details' || phase === 'fade' ? 1 : 0,
            transform: phase === 'tagline' || phase === 'details' || phase === 'fade' ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.5s ease 0.1s',
          }}
        >
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            Find Your Vibe
          </h1>
          <p className="text-white/50 text-sm font-medium leading-relaxed max-w-[240px]">
            Connect with people in your vicinity. Real-time. Authentic. Now.
          </p>
        </div>

        {/* Feature list */}
        <div
          className="mt-10 flex flex-col gap-3 w-full max-w-[260px]"
          style={{
            opacity: phase === 'details' || phase === 'fade' ? 1 : 0,
            transform: phase === 'details' || phase === 'fade' ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.5s ease 0.1s',
          }}
        >
          {featureItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                opacity: phase === 'details' || phase === 'fade' ? 1 : 0,
                transform: phase === 'details' || phase === 'fade' ? 'translateX(0)' : 'translateX(-10px)',
                transition: `all 0.4s ease ${0.1 + i * 0.12}s`,
              }}
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-white/70 text-xs font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div
          className="mt-12 w-full max-w-[200px]"
          style={{
            opacity: phase === 'details' || phase === 'fade' ? 1 : 0,
            transition: 'opacity 0.4s ease'
          }}
        >
          <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #e879f9, #a855f7)',
              }}
            />
          </div>
          <p className="text-white/25 text-[10px] font-medium text-center mt-3 uppercase tracking-widest">
            Loading experience
          </p>
        </div>
      </div>

      {/* Bottom branding */}
      <div
        className="absolute bottom-8 text-center"
        style={{
          opacity: phase === 'details' || phase === 'fade' ? 0.3 : 0,
          transition: 'opacity 0.5s ease 0.5s',
        }}
      >
        <p className="text-white/50 text-[10px] uppercase tracking-[0.25em] font-semibold">
          Powered by AI · Real-time · Private
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
