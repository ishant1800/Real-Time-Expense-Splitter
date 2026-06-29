import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, useMotionValue, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { Engine } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import '../styles/Landing.css';

// Particle options
const particlesOptions = {
  fpsLimit: 60,
  particles: {
    number: {
      value: 60,
      density: {
        enable: true,
        area: 800,
      },
    },
    color: {
      value: '#10b981',
    },
    shape: {
      type: 'circle',
    },
    opacity: {
      value: 0.35,
    },
    size: {
      value: { min: 1, max: 2.5 },
    },
    links: {
      enable: true,
      distance: 140,
      color: '#10b981',
      opacity: 0.12,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.8,
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: 'out' as const,
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: 'repel',
      },
    },
    modes: {
      repel: {
        distance: 100,
        duration: 0.4,
      },
    },
  },
};

export default function Landing() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  // tsParticles engine init handler
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // Custom Cursor positioning states
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const ringX = useMotionValue(-100);
  const ringY = useMotionValue(-100);

  const ringSpringX = useSpring(ringX, { stiffness: 200, damping: 20 });
  const ringSpringY = useSpring(ringY, { stiffness: 200, damping: 20 });

  const [cursorHovered, setCursorHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    setIsDesktop(isFinePointer);

    if (!isFinePointer) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]')
      ) {
        setCursorHovered(true);
      } else {
        setCursorHovered(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  // Navbar Scroll & Scroll Progress Settings
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 0.95)']);
  const navBorder = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.06)']);
  const scrollProgress = useScroll().scrollYProgress;
  const scaleXSpring = useSpring(scrollProgress, { stiffness: 100, damping: 30 });

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setScrolledPast(latest > 80);
    });
  }, [scrollY]);

  // Parallax Orbs Coordinates
  const orbY1 = useTransform(scrollY, [0, 1000], [0, 300]);
  const orbY2 = useTransform(scrollY, [0, 1000], [0, -300]);

  // 3D Card Tilt Variables
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const cardSpringX = useSpring(cardX, { stiffness: 150, damping: 20 });
  const cardSpringY = useSpring(cardY, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(cardSpringY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(cardSpringX, [-0.5, 0.5], [-12, 12]);
  const shineX = useTransform(cardSpringX, [-0.5, 0.5], ['100%', '0%']);
  const shineY = useTransform(cardSpringY, [-0.5, 0.5], ['100%', '0%']);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const xVal = e.clientX - rect.left - width / 2;
    const yVal = e.clientY - rect.top - height / 2;

    cardX.set(xVal / width);
    cardY.set(yVal / height);
  };

  const handleCardMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  // Live Card dynamic balance values and slide-in activity logs
  const [balances, setBalances] = useState({ arjun: 5000, priya: 5000, rahul: 10000 });
  const [updatedMember, setUpdatedMember] = useState<string | null>(null);

  const activityList = useMemo(() => [
    { id: 1, text: 'Rahul G. paid Arjun S. ₹5,000' },
    { id: 2, text: 'Priya N. added "Beach dinner" ₹1,600' },
    { id: 3, text: 'Ishant A. created group "Goa Trip"' },
    { id: 4, text: 'Arjun S. added "Hotel booking" ₹4,800' },
    { id: 5, text: 'Rahul G. joined the group via code' },
  ], []);
  const [activities, setActivities] = useState([activityList[0], activityList[1]]);

  useEffect(() => {
    const balanceInterval = setInterval(() => {
      const members = ['arjun', 'priya', 'rahul'] as const;
      const randomMember = members[Math.floor(Math.random() * members.length)];
      setBalances((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 800);
        const nextBalances = { ...prev };
        nextBalances[randomMember] = Math.max(1000, prev[randomMember] + delta);
        return nextBalances;
      });
      setUpdatedMember(randomMember);
      setTimeout(() => setUpdatedMember(null), 1000);
    }, 3000);

    let index = 2;
    const activityInterval = setInterval(() => {
      setActivities((prev) => {
        const nextActivity = activityList[index];
        index = (index + 1) % activityList.length;
        return [nextActivity, prev[0]];
      });
    }, 5000);

    return () => {
      clearInterval(balanceInterval);
      clearInterval(activityInterval);
    };
  }, [activityList]);

  // Intersection Observers for counts & reveals
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [howRef, howInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  // Testimonials Array
  const testimonials = [
    {
      quote: 'Used this for our Manali trip with 8 people. Zero confusion about who owes what. The debt simplification alone saved us 30 minutes of arguments.',
      name: 'Arjun Sharma',
      role: 'Software Engineer, Pune',
      avatar: 'AS',
    },
    {
      quote: 'Finally an app that updates in real time. Added an expense and everyone saw it immediately. No refresh needed at all.',
      name: 'Priya Nair',
      role: 'Product Designer, Bangalore',
      avatar: 'PN',
    },
    {
      quote: 'The split types are a game changer. Unequal rent for different rooms handled perfectly with the shares option.',
      name: 'Rahul Gupta',
      role: 'Startup Founder, Mumbai',
      avatar: 'RG',
    },
    {
      quote: 'Clean UI and Google login made onboarding the whole group super easy. Our flat uses this every month.',
      name: 'Neha Verma',
      role: 'Data Analyst, Delhi',
      avatar: 'NV',
    },
    {
      quote: 'The activity feed shows exactly who added what and when. Makes accountability so much easier in large groups.',
      name: 'Karan Mehta',
      role: 'Backend Engineer, Hyderabad',
      avatar: 'KM',
    },
    {
      quote: 'Settled a 6-person Europe trip worth ₹4 lakhs in 3 transactions instead of 15. Algorithm is impressive.',
      name: 'Divya Rao',
      role: 'Travel Blogger, Chennai',
      avatar: 'DR',
    },
  ];

  return (
    <div className="landing-container min-h-screen bg-[#0a0a0a] selection:bg-[#10b981]/30 selection:text-white bg-dot-grid relative font-body">
      
      {/* 0. Custom Cursor */}
      {isDesktop && (
        <>
          <motion.div
            className="fixed top-0 left-0 w-2 h-2 bg-[#10b981] rounded-full pointer-events-none z-[999] -translate-x-1/2 -translate-y-1/2"
            style={{ x: cursorX, y: cursorY }}
          />
          <motion.div
            className={`fixed top-0 left-0 rounded-full border border-[#10b981] pointer-events-none z-[998] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 ${
              cursorHovered
                ? 'w-12 h-12 bg-[#10b981]/15 border-transparent'
                : 'w-8 h-8 bg-transparent'
            }`}
            style={{ x: ringSpringX, y: ringSpringY }}
          />
        </>
      )}

      {/* Parallax Blurred Background Orbs */}
      <motion.div
        style={{ y: orbY1 }}
        className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[100px] blur-orb-emerald-1 pointer-events-none z-0"
      />
      <motion.div
        style={{ y: orbY2 }}
        className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] rounded-full blur-[100px] blur-orb-emerald-2 pointer-events-none z-0"
      />

      {/* Top Scroll Progress Line */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#10b981] origin-left z-[200]"
        style={{ scaleX: scaleXSpring }}
      />

      {/* SECTION 1 — NAVBAR */}
      <motion.nav
        style={{ backgroundColor: navBg, borderColor: navBorder }}
        className={`fixed top-0 left-0 right-0 py-4 z-50 border-b transition-all duration-200 ${
          scrolledPast ? 'shadow-md shadow-black/20' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2.5"
            >
              <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981]" />
              <span className="font-heading text-lg tracking-tight text-white select-none">
                SplitWise
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs text-gray-400 font-semibold relative">
            {['Features', 'How it works', 'Reviews'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                onMouseEnter={() => setActiveTab(link)}
                onMouseLeave={() => setActiveTab(null)}
                className="hover:text-white transition py-1 relative"
              >
                {link}
                {activeTab === link && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#10b981]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs font-bold text-gray-400 hover:text-white transition px-4 py-2"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/register"
                className="text-xs font-bold bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] px-4.5 py-2.5 rounded shadow-lg shadow-[#10b981]/15 transition"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* SECTION 2 — HERO */}
      <section className="relative min-h-screen flex items-center pt-28 overflow-hidden z-10">
        
        {/* tsParticles Background */}
        <ParticlesProvider init={particlesInit}>
          <Particles
            id="tsparticles"
            options={particlesOptions}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          />
        </ParticlesProvider>

        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12 relative z-10">
          {/* Left panel text */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            {/* Small Badge */}
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#111] border border-[#10b981]/25 text-[10px] font-bold uppercase text-[#10b981] tracking-widest mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              ⚡ Real-time · Socket.io powered
            </motion.span>

            {/* H1 Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[72px] leading-[1.0] tracking-tight text-white mb-6 select-none">
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="block"
              >
                Split Expenses.
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="block"
              >
                Track Balances.
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="block text-[#10b981]"
              >
                Settle Instantly.
              </motion.span>
            </h1>

            {/* Subtext */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="text-gray-400 text-sm leading-relaxed mb-8 max-w-[480px]"
            >
              Manage group expenses with real-time updates, smart debt simplification, Google Sign-In, and instant balance sync across your entire group.
            </motion.p>

            {/* Actions */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="flex flex-wrap items-center gap-4 mb-14"
            >
              <Link
                to="/register"
                className="px-6 py-3.5 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-sm rounded shadow-lg shadow-[#10b981]/20 transition animate-pulse-emerald"
              >
                Start Splitting →
              </Link>
              <a
                href="https://github.com/ishant1800"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-transparent border border-white/10 hover:border-white/20 text-white font-semibold text-sm rounded transition"
              >
                View on GitHub
              </a>
            </motion.div>

            {/* Stats Row */}
            <div
              ref={statsRef}
              className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8 w-full max-w-lg"
            >
              <div>
                <div className="font-heading text-xl text-white">
                  {statsInView ? <CountUp start={0} end={10000} duration={2.5} suffix="+" /> : '0+'}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Active groups</div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={statsInView ? { width: '100%' } : { width: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-[1.5px] bg-[#10b981] mt-2"
                />
              </div>

              <div>
                <div className="font-heading text-xl text-white">
                  ₹{statsInView ? <CountUp start={0} end={2} duration={2} /> : '0'}Cr+
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Settled monthly</div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={statsInView ? { width: '100%' } : { width: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-[1.5px] bg-[#10b981] mt-2"
                />
              </div>

              <div>
                <div className="font-heading text-xl text-white">
                  {statsInView ? <CountUp start={0} end={4.9} decimals={1} duration={2.5} suffix="★" /> : '0★'}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">User rating</div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={statsInView ? { width: '100%' } : { width: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-[1.5px] bg-[#10b981] mt-2"
                />
              </div>
            </div>
          </motion.div>

          {/* Right panel illustration */}
          <div className="lg:col-span-5 flex justify-center relative min-h-[480px] lg:min-h-0 select-none">
            {/* 1. Main Card */}
            <motion.div
              ref={cardRef}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
              animate={{ y: [0, -16, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="relative w-[330px] bg-[#111]/95 border border-white/6 rounded-xl p-5 shadow-2xl z-15 backdrop-blur-sm cursor-grab active:cursor-grabbing transform-gpu"
            >
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none opacity-40"
                style={{ backgroundPositionX: shineX, backgroundPositionY: shineY }}
              />

              {/* Card Header */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">🏖️ Goa Trip</h3>
                  <p className="text-[9px] text-gray-500">4 members</p>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-900/60 text-[9px] text-[#10b981] flex items-center justify-center font-bold">I</div>
                  <div className="w-5 h-5 rounded-full bg-emerald-800/60 text-[9px] text-[#10b981] flex items-center justify-center font-bold">P</div>
                  <div className="w-5 h-5 rounded-full bg-emerald-700/60 text-[9px] text-[#10b981] flex items-center justify-center font-bold">R</div>
                  <div className="w-5 h-5 rounded-full bg-emerald-600/60 text-[9px] text-[#10b981] flex items-center justify-center font-bold">N</div>
                </div>
              </div>

              {/* Expense items */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs text-gray-400 py-1 border-b border-white/[0.02]">
                  <span>Hotel booking</span>
                  <span className="font-semibold text-white">₹4,800</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 py-1 border-b border-white/[0.02]">
                  <span>Beach dinner</span>
                  <span className="font-semibold text-white">₹1,600</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 py-1 border-b border-white/[0.02]">
                  <span>Scooter rental</span>
                  <span className="font-semibold text-white">₹900</span>
                </div>
              </div>

              {/* Settlement indicator */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center text-[10px] text-gray-500">
                  <span>Group Settled</span>
                  <span className="font-bold text-[#10b981]">68%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: '68%' }} />
                </div>
              </div>

              {/* Live balance updates */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                <div className="bg-white/[0.02] border border-white/5 rounded p-2 text-left">
                  <p className="text-[9px] text-gray-500 font-semibold">Arjun</p>
                  <motion.p
                    animate={updatedMember === 'arjun' ? { color: ['#10b981', '#ffffff'] } : { color: '#ffffff' }}
                    transition={{ duration: 1 }}
                    className="text-xs font-bold"
                  >
                    +₹{balances.arjun}
                  </motion.p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded p-2 text-left">
                  <p className="text-[9px] text-gray-500 font-semibold">Priya</p>
                  <motion.p
                    animate={updatedMember === 'priya' ? { color: ['#10b981', '#ffffff'] } : { color: '#ffffff' }}
                    transition={{ duration: 1 }}
                    className="text-xs font-bold text-gray-400"
                  >
                    -₹{balances.priya}
                  </motion.p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded p-2 text-left">
                  <p className="text-[9px] text-gray-500 font-semibold">Rahul</p>
                  <motion.p
                    animate={updatedMember === 'rahul' ? { color: ['#10b981', '#ffffff'] } : { color: '#ffffff' }}
                    transition={{ duration: 1 }}
                    className="text-xs font-bold text-gray-400"
                  >
                    -₹{balances.rahul}
                  </motion.p>
                </div>
              </div>

              {/* Activity feeds */}
              <div className="space-y-2 mt-4 pt-4 border-t border-white/5 overflow-hidden h-14 relative">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-wider font-bold text-[#10b981] mb-1">
                  <span>Activity stream</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#10b981] animate-ping" />
                    Socket
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {activities.slice(0, 1).map((act) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="text-[10px] text-gray-400 truncate flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                      <span>{act.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* 2. Left Settlement card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              className="absolute top-[20%] left-[-8%] w-[150px] bg-[#111] border border-white/6 rounded-lg p-3 shadow-xl z-20 backdrop-blur-sm pointer-events-auto flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#10b981] font-bold">Settlement Complete</span>
                <span className="w-4 h-4 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-[9px] font-bold">✓</span>
              </div>
              <p className="text-[11px] text-white font-semibold">Rahul → Ishant</p>
              <p className="text-xs font-bold text-gray-300">₹1,600</p>
            </motion.div>

            {/* 3. Right Stats card */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 1.5 }}
              className="absolute bottom-[15%] right-[-8%] w-[145px] bg-[#111] border border-[#10b981]/15 rounded-lg p-3.5 shadow-xl z-20 backdrop-blur-sm pointer-events-none flex flex-col gap-1"
            >
              <p className="text-[9px] uppercase tracking-wider font-semibold text-gray-500">Total Spent</p>
              <p className="font-heading text-lg text-white">₹7,300</p>
              <span className="text-[9px] text-gray-400">This month</span>

              <div className="w-full h-8 mt-2">
                <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                  <motion.path
                    d="M0,25 L20,20 L40,28 L60,10 L80,18 L100,5"
                    stroke="#10b981"
                    strokeWidth="2"
                    fill="none"
                    className="sparkline-path"
                  />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURES */}
      <section
        id="features"
        ref={featuresRef}
        className="py-24 bg-[#111111] border-y border-white/5 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-xl mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              — Everything you need
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl text-white mt-3 mb-4">
              Built for how groups actually work
            </h2>
            <p className="text-gray-400 text-xs">
              We took out the spreadsheets, the manual splits, and the math so you can split balances easily.
            </p>
          </div>

          <motion.div
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Feature Cards */}
            {[
              { icon: '⚡', title: 'Real-Time Updates', desc: 'WebSocket live balance sync across all group members. No refresh, no delay. Added expenses and settlements sync instantly.' },
              { icon: '🧠', title: 'Smart Insights', desc: 'Spending by category, per-person breakdown, group activity feed, and full export to CSV format for financial tracing.' },
              { icon: '🔐', title: 'Google Sign-In', desc: 'OAuth 2.0 with JWT refresh token rotation. Secure, fast, passwordless setup with automatic recovery profiles.' },
              { icon: '👥', title: 'Group Management', desc: 'Invite links, role-based permissions, member management, and shareable group codes to distribute group entry.' },
              { icon: '📊', title: 'Analytics', desc: 'Spending trends, balance history, category breakdown, and full summaries to check where your funds go.' },
              { icon: '💸', title: 'Debt Simplification', desc: 'Greedy O(n log n) algorithm computes minimum possible transactional dues needed to settle the group.' },
            ].map((f, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -6 }}
                className="premium-card bg-[#111] border border-white/5 rounded-xl p-8 text-left relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#10b981] origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                <div className="text-xl text-[#10b981] mb-6">{f.icon}</div>
                <h3 className="text-white font-heading text-base mb-2">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section
        id="how-it-works"
        ref={howRef}
        className="py-24 max-w-7xl mx-auto px-6 relative z-10"
      >
        <div className="text-center mb-20">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            — Simple as 1-2-3
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-white mt-3">
            Up and running in under a minute
          </h2>
        </div>

        <div className="relative">
          {/* Connector Line SVG */}
          <div className="absolute top-[28px] left-[15%] right-[15%] h-[2px] pointer-events-none hidden lg:block">
            <svg className="w-full h-8" viewBox="0 0 100 10" fill="none" preserveAspectRatio="none">
              <motion.path
                d="M 0 5 Q 50 0 100 5"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={howInView ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </svg>
          </div>

          <motion.div
            initial="hidden"
            animate={howInView ? 'visible' : 'hidden'}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10 text-center lg:text-left"
          >
            {[
              { num: '01', title: 'Create a group', desc: 'Invite friends via shareable link. Name it Goa Trip, Flat Expenses, whatever.' },
              { num: '02', title: 'Log expenses', desc: 'Add who paid, split type, and amount. Everyone\'s balance updates instantly.' },
              { num: '03', title: 'Settle up', desc: 'Algorithm calculates minimum transactions. Mark as done. No more awkward reminders.' },
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="flex flex-col items-center lg:items-start"
              >
                <div className="font-heading text-5xl text-[#10b981] mb-4">{step.num}</div>
                <h3 className="font-heading text-lg text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-xs max-w-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — TESTIMONIALS */}
      <section
        id="reviews"
        className="py-24 bg-[#111111] overflow-hidden border-y border-white/5 relative z-10"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            — Trusted by groups across India
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl text-white mt-3">
            What people are saying
          </h2>
        </div>

        <div className="w-full relative flex overflow-x-hidden">
          <div className="scroll-track gap-6 px-3">
            {testimonials.map((t, idx) => (
              <div
                key={`testimonial-s1-${idx}`}
                className="w-[300px] bg-[#161616] border border-white/6 rounded-xl p-6 flex flex-col justify-between shrink-0 hover:border-[#10b981]/25 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div>
                  <div className="text-emerald-500 text-xs mb-3">★★★★★</div>
                  <p className="text-gray-400 text-xs italic leading-relaxed mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-8 h-8 rounded bg-emerald-950/40 text-emerald-300 font-bold text-xs flex items-center justify-center border border-[#10b981]/20">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">{t.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Duplicated for loop */}
            {testimonials.map((t, idx) => (
              <div
                key={`testimonial-s2-${idx}`}
                className="w-[300px] bg-[#161616] border border-white/6 rounded-xl p-6 flex flex-col justify-between shrink-0 hover:border-[#10b981]/25 hover:-translate-y-1.5 transition-all duration-300"
              >
                <div>
                  <div className="text-emerald-500 text-xs mb-3">★★★★★</div>
                  <p className="text-gray-400 text-xs italic leading-relaxed mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-8 h-8 rounded bg-emerald-950/40 text-emerald-300 font-bold text-xs flex items-center justify-center border border-[#10b981]/20">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">{t.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA CARD */}
      <section
        ref={ctaRef}
        className="py-28 px-6 relative z-10 flex justify-center"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#10b981]/5 blur-[90px] pointer-events-none z-0" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-4xl bg-[#111] border border-white/5 border-b-[2px] border-b-[#10b981] rounded-2xl p-12 sm:p-20 text-center relative z-10 overflow-hidden"
        >
          <h2 className="font-heading text-3xl sm:text-5xl text-white mb-4 tracking-tight">
            Ready to split smarter?
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-10 max-w-md mx-auto leading-relaxed">
            Join thousands of groups already splitting without the drama. Free forever, no card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#10b981] hover:bg-[#0ea572] text-[#0a0a0a] font-bold text-sm rounded shadow-lg shadow-[#10b981]/10 transition animate-pulse-emerald"
            >
              Get Started Free →
            </Link>
            <a
              href="https://github.com/ishant1800"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/10 hover:border-white/20 text-white font-semibold text-sm rounded transition"
            >
              View on GitHub
            </a>
          </div>
        </motion.div>
      </section>

      {/* SECTION 7 — FOOTER */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="font-heading text-lg tracking-tight text-white select-none">
                SplitWise
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Real-time expense splitting for groups. Track balances, simplify debts, and settle dues instantly.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-5">Product</h4>
            <ul className="space-y-3.5 text-xs text-gray-500 font-semibold">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How it works</a></li>
              <li><a href="#reviews" className="hover:text-white transition">Reviews</a></li>
              <li><Link to="/register" className="hover:text-white transition">Pricing (Free)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-5">Developer</h4>
            <ul className="space-y-3.5 text-xs text-gray-500 font-semibold">
              <li>
                <a
                  href="https://github.com/ishant1800"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/ishant-aryan-39494233a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/ishant1800/Real-Time-Expense-Splitter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  Source Code
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-5">Stack</h4>
            <ul className="space-y-3.5 text-xs text-gray-500 font-semibold">
              <li>MongoDB & Express</li>
              <li>React & Vite</li>
              <li>Socket.io Client</li>
              <li>TypeScript</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-600">
          <p>Built by Ishant Aryan · Bengaluru · 2025</p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-white/5 border border-white/5 rounded text-gray-400">MERN</span>
            <span className="px-2 py-1 bg-white/5 border border-white/5 rounded text-gray-400">TypeScript</span>
            <span className="px-2 py-1 bg-white/5 border border-white/5 rounded text-gray-400">Socket.io</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
