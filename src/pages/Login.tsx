import ScrollToTop from '@components/common/ScrollToTop';
import { LogoIcon } from '@components/icons/SidebarIcons';
import { useAppConfig } from '@contexts/AppConfigContext';
import { useAuth } from '@features/auth/hooks/useAuth';
import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom hook for animated counting
const useCountUp = (end: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startCounting) {
      setCount(0);
      countRef.current = 0;
      startTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOut * end);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, startCounting]);

  return count;
};

// Custom hook for intersection observer
const useInView = (threshold: number = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [threshold, isInView]);

  return { ref, isInView };
};

// Custom hook for mouse position tracking
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      element.addEventListener('mousemove', handleMouseMove);
      return () => element.removeEventListener('mousemove', handleMouseMove);
    }
    return undefined;
  }, [handleMouseMove]);

  return { elementRef, mousePosition };
};

// Smart metrics data - original metrics with animations
const smartMetrics = [
  {
    label: 'Active Students',
    value: 500,
    suffix: '+',
    icon: '🎓',
    description: 'Students using the app',
  },
  {
    label: 'Grades Tracked',
    value: 5000,
    suffix: '+',
    icon: '📈',
    description: 'Academic records managed',
  },
  { label: 'User Rating', value: 4.8, suffix: '★', icon: '⭐', description: 'Average user rating' },
  { label: 'Uptime', value: 99, suffix: '%', icon: '⚡', description: 'System availability' },
];

// Animated metric card component
const AnimatedMetricCard: React.FC<{
  metric: (typeof smartMetrics)[0];
  isInView: boolean;
  index: number;
}> = ({ metric, isInView, index }) => {
  const count = useCountUp(metric.value, 2000 + index * 200, isInView);

  return (
    <div
      className="group flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/20"
      style={{
        animationDelay: `${index * 100}ms`,
        transform: isInView ? 'translateY(0)' : 'translateY(20px)',
        opacity: isInView ? 1 : 0,
        transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 100}ms`,
      }}
    >
      <div className="text-3xl sm:text-4xl mb-1 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
        {metric.icon}
      </div>
      <div className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 group-hover:scale-110 transition-transform duration-300">
        {count}
        {metric.suffix}
      </div>
      <div className="text-white/90 text-xs sm:text-sm md:text-base text-center font-semibold">
        {metric.label}
      </div>
      <div className="text-white/50 text-[10px] sm:text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {metric.description}
      </div>
    </div>
  );
};

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const { config: appConfig } = useAppConfig();
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const navigate = useNavigate();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  // Hooks for interactive elements
  const { ref: metricsRef, isInView: metricsInView } = useInView(0.2);
  const { elementRef: loginCardRef, mousePosition } = useMousePosition();
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Refs for scroll-based reveal animations
  const missionRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // useScroll hooks for each section - triggers animation as section enters viewport
  const { scrollYProgress: missionProgress } = useScroll({
    target: missionRef,
    offset: ['start end', 'end center'],
  });

  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ['start end', 'end center'],
  });

  const { scrollYProgress: socialProgress } = useScroll({
    target: socialRef,
    offset: ['start end', 'end center'],
  });

  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ['start end', 'end center'],
  });

  // Transform values for reveal animations - fade in and slide up as user scrolls
  const missionOpacity = useTransform(missionProgress, [0, 0.4], [0, 1]);
  const missionY = useTransform(missionProgress, [0, 0.4], [80, 0]);

  const featuresOpacity = useTransform(featuresProgress, [0, 0.4], [0, 1]);
  const featuresY = useTransform(featuresProgress, [0, 0.4], [80, 0]);

  const socialOpacity = useTransform(socialProgress, [0, 0.4], [0, 1]);
  const socialY = useTransform(socialProgress, [0, 0.4], [80, 0]);

  const ctaOpacity = useTransform(ctaProgress, [0, 0.4], [0, 1]);
  const ctaY = useTransform(ctaProgress, [0, 0.4], [60, 0]);
  // Set theme-color for notch to match Login page background
  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    // Set to dark indigo to match the hero overlay (slate-900/indigo blend)
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#1e1b4b');
    }

    // Restore original theme-color when leaving Login page
    return () => {
      if (themeColorMeta) {
        // Check current theme and restore appropriate color
        const isDark = document.documentElement.classList.contains('dark');
        themeColorMeta.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
      }
    };
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Redirect to auth-redirect for role-based routing
      navigate('/auth-redirect', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Smooth parallax scroll effect with requestAnimationFrame
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typing animation for hero text
  const heroTexts = [
    'Your Campus Life, Simplified',
    'One Platform. Endless Possibilities.',
    'Track Progress. Build Success.',
    'Smart Campus Living Starts Here',
  ];

  useEffect(() => {
    const fullText = heroTexts[currentTextIndex] || '';
    let currentIndex = 0;

    if (isTyping) {
      setShowCursor(true);
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setShowCursor(false);
          // Wait 2.5 seconds before starting to delete
          setTimeout(() => {
            setIsTyping(false);
            // Start deleting after a brief pause
            setTimeout(() => {
              let deleteIndex = fullText.length;
              setShowCursor(true);
              const deleteInterval = setInterval(() => {
                if (deleteIndex > 0) {
                  setTypedText(fullText.slice(0, deleteIndex));
                  deleteIndex--;
                } else {
                  clearInterval(deleteInterval);
                  setShowCursor(false);
                  // Move to next text after deletion complete
                  setTimeout(() => {
                    setCurrentTextIndex((prev) => (prev + 1) % heroTexts.length);
                    setIsTyping(true);
                    setTypedText('');
                  }, 500);
                }
              }, 80);
            }, 500);
          }, 2500);
        }
      }, 80);
      return () => clearInterval(typingInterval);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTextIndex, isTyping]);

  // Testimonial auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % 6);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Capacitor back button handler

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      // On success, useEffect will navigate
    } catch (err: any) {
      if (err.message && err.message.includes('INVALID_DOMAIN')) {
        // Use database config for validation message
        const abbr = appConfig?.collegeInfo?.name?.abbreviation;
        const domain = appConfig?.collegeInfo?.email?.allowedDomain;
        setError(
          `Only ${abbr} email addresses (${domain}) are allowed. Please use your institutional email.`
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User opened multiple pop-ups, ignore this error
        setError('');
      } else {
        setError('Google sign-in failed. Please try again.');
        console.error('Google Sign-In Error:', err);
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg">
        <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>

      {/* Fixed Logo and Name - Top Left (appears when scrolling past first section) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-50 transition-all duration-700 ease-out cursor-pointer group/logo ${
          scrollY > window.innerHeight * 0.8
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-8 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg group-hover/logo:shadow-xl group-hover/logo:scale-110 transition-all duration-300">
              <LogoIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          <div className="text-left hidden sm:block">
            <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-tight drop-shadow-lg group-hover/logo:text-blue-200 transition-colors duration-300">
              College Central
            </h1>
            <p className="text-[0.625rem] sm:text-xs text-white/80 font-light drop-shadow-md">
              {appConfig?.collegeInfo?.name?.short}
            </p>
          </div>
        </div>
      </button>

      {/* Main Scrolling Content - Full Width */}
      <div className="w-full">
        {/* Section 1: Hero with Background Image */}
        <section className="relative min-h-screen flex items-center justify-center">
          {/* Background Image with Parallax */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              backgroundImage: `url('${appConfig?.collegeInfo?.heroImageUrl || '/iitism_banner_new.gif'}')`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              transform: `translate3d(0, ${scrollY * 0.3}px, 0)`,
              backfaceVisibility: 'hidden',
              width: '100%',
              height: '100%',
            }}
          ></div>

          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-indigo-900/40 to-purple-900/50"></div>

          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[10vh] -left-[10vw] w-[24vw] h-[24vw] min-w-[15rem] min-h-[15rem] max-w-[24rem] max-h-[24rem] bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute -bottom-[10vh] -right-[10vw] w-[24vw] h-[24vw] min-w-[15rem] min-h-[15rem] max-w-[24rem] max-h-[24rem] bg-purple-400/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] min-w-[20rem] min-h-[20rem] max-w-[31.25rem] max-h-[31.25rem] bg-indigo-400/5 rounded-full blur-3xl"></div>
          </div>

          {/* Centered Content */}
          <div className="relative z-10 w-full px-4 flex flex-col items-center justify-center min-h-screen -mt-[8vh] md:-mt-[10vh]">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              {/* Logo */}
              <div className="flex justify-center mb-3 -mt-8">
                <div className="relative group cursor-pointer">
                  {/* Logo container with hover effects */}
                  <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-500/20 group-hover:shadow-purple-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out">
                    <LogoIcon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
              </div>

              {/* App Name */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight mb-0 drop-shadow-lg">
                College Central
              </h1>

              {/* Institute Name */}
              <p className="text-base md:text-lg lg:text-xl text-white/90 font-semibold mb-8 drop-shadow-md">
                {appConfig?.collegeInfo?.name?.short}
              </p>

              {/* Animated typing text - Main Headline */}
              <div className="min-h-[15vh] md:min-h-[18vh] lg:min-h-[20vh] flex items-center justify-center px-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-center">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] transition-all duration-300 drop-shadow-2xl">
                    {typedText}
                  </span>
                  {showCursor && (
                    <span className="text-blue-400 animate-pulse ml-1 inline-block">|</span>
                  )}
                </h2>
              </div>
            </div>

            {/* Scroll Indicator - Positioned below content */}
            <div className="w-full absolute bottom-[2vh] flex justify-center">
              <button
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                className="flex flex-col items-center gap-2 text-blue-300/60 hover:text-purple-300 transition-colors cursor-pointer animate-bounce"
                aria-label="Scroll to next section"
              >
                <span className="text-xs font-medium uppercase tracking-wider">
                  Scroll to explore
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Continuous Content Section */}
        <section className="relative overflow-hidden">
          {/* Gradient Background - More vibrant and student-friendly */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"></div>

          {/* Decorative Elements - More playful and dynamic */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top left blob */}
            <div className="absolute -top-[8vh] -left-[8vw] w-[24vw] h-[24vw] min-w-[15rem] min-h-[15rem] max-w-[24rem] max-h-[24rem] bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            {/* Top right blob */}
            <div
              className="absolute top-[15vh] -right-[8vw] w-[20vw] h-[20vw] min-w-[12rem] min-h-[12rem] max-w-[20rem] max-h-[20rem] bg-cyan-300/15 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
            {/* Middle left blob */}
            <div
              className="absolute top-[60vh] -left-[10vw] w-[24vw] h-[24vw] min-w-[15rem] min-h-[15rem] max-w-[24rem] max-h-[24rem] bg-purple-400/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '2s' }}
            ></div>
            {/* Middle right blob */}
            <div
              className="absolute top-[80vh] -right-[10vw] w-[30vw] h-[30vw] min-w-[20rem] min-h-[20rem] max-w-[31.25rem] max-h-[31.25rem] bg-pink-400/15 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '0.5s' }}
            ></div>
            {/* Bottom left blob */}
            <div
              className="absolute top-[120vh] left-[8vw] w-[18vw] h-[18vw] min-w-[11rem] min-h-[11rem] max-w-[18rem] max-h-[18rem] bg-indigo-400/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1.5s' }}
            ></div>
            {/* Bottom right blob */}
            <div
              className="absolute top-[160vh] -right-[10vw] w-[24vw] h-[24vw] min-w-[15rem] min-h-[15rem] max-w-[24rem] max-h-[24rem] bg-violet-400/15 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '2.5s' }}
            ></div>
            {/* Accent blob */}
            <div
              className="absolute top-[40vh] left-1/2 transform -translate-x-1/2 w-[16vw] h-[16vw] min-w-[10rem] min-h-[10rem] max-w-[16rem] max-h-[16rem] bg-yellow-300/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '3s' }}
            ></div>
          </div>

          {/* Mission Statement */}
          <motion.div
            ref={missionRef}
            className="relative flex flex-col justify-center items-center px-6 py-12 md:py-16"
            style={{ opacity: missionOpacity, y: missionY }}
          >
            <div className="max-w-4xl space-y-6 text-center relative z-10">
              <div className="group/tag inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-full text-base md:text-lg font-semibold text-white border border-purple-400/30 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-br from-indigo-400 to-pink-500"></span>
                </span>
                <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Built by students, for students
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                Your Complete Campus Companion
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white/80 leading-relaxed max-w-3xl mx-auto">
                College Central is the all-in-one platform designed specifically for{' '}
                {appConfig?.collegeInfo?.name?.short} students. From tracking your academic
                performance to navigating campus and staying organized, we bring everything you need
                into one seamless experience.
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-4 max-w-3xl mx-auto">
                <div className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    ⚡
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                    Save Time Daily
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm md:text-base">
                    No more app switching. Access grades, schedules, and campus info instantly.
                  </p>
                </div>
                <div className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    📈
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                    Stay Organized
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm md:text-base">
                    Keep track of assignments, exams, and important dates effortlessly.
                  </p>
                </div>
                <div className="group bg-white/5 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-white/10 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 md:col-span-1">
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    🎯
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                    Focus on What Matters
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm md:text-base">
                    Spend less time managing, more time learning and connecting.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features Grid - Why Students Love College Central */}
          <motion.div
            ref={featuresRef}
            className="relative flex flex-col justify-center items-center px-6 py-10 md:py-14"
            style={{ opacity: featuresOpacity, y: featuresY }}
          >
            <div className="max-w-7xl w-full space-y-8 relative z-10">
              <div className="text-center space-y-3">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white">
                  Why Students{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                    Love
                  </span>{' '}
                  College Central
                </h2>
                <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
                  Everything you need to ace your college life, all in one smart platform
                </p>
              </div>

              {/* Interactive feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[
                  {
                    icon: '📚',
                    title: 'Grade Tracking & CGPA',
                    description:
                      'Track your semester grades and automatically calculate your CGPA in real-time',
                    color: 'from-blue-500 to-cyan-500',
                    features: ['Semester Grades', 'Auto CGPA Calculator', 'Grade Analytics'],
                  },
                  {
                    icon: '📅',
                    title: 'Schedule & Calendar',
                    description:
                      'Manage your class timetable, assignments, and important academic dates',
                    color: 'from-purple-500 to-pink-500',
                    features: ['Class Timetable', 'Custom Tasks', 'Event Reminders'],
                  },
                  {
                    icon: '🗺️',
                    title: 'Campus Map',
                    description: `Navigate the ${appConfig?.collegeInfo?.name?.abbreviation} campus with an interactive map of all buildings and facilities`,
                    color: 'from-indigo-500 to-purple-500',
                    features: ['Building Locations', 'Department Info', 'Campus Navigation'],
                  },
                ].map((feature, index) => (
                  <div key={index} className="group relative">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                    ></div>
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:border-white/20">
                      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-500">
                        {feature.icon}
                      </div>
                      <h3
                        className={`text-xl md:text-2xl font-bold text-white mb-3 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}
                      >
                        {feature.title}
                      </h3>
                      <p className="text-white/60 text-sm md:text-base mb-4">
                        {feature.description}
                      </p>
                      <div className="space-y-2">
                        {feature.features.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Features Highlight */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-white/10 max-w-3xl mx-auto">
                <h4 className="text-white font-bold text-base sm:text-lg md:text-xl text-center mb-3 sm:mb-4">
                  And More...
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base md:text-lg text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>Academic calendar & event tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>College forms & resources access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>Activity history & analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg sm:text-xl">✓</span>
                    <span>Dark mode support</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            ref={socialRef}
            className="relative flex flex-col justify-center items-center px-6 py-10 md:py-14"
            style={{ opacity: socialOpacity, y: socialY }}
          >
            <div className="max-w-4xl w-full space-y-8 relative z-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                  Trusted by the {appConfig?.collegeInfo?.name?.abbreviation} Community
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto">
                  Join hundreds of students who are already using College Central to stay organized,
                  track their progress, and make the most of their college experience.
                </p>
              </div>

              <div
                ref={metricsRef}
                className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-w-3xl mx-auto"
              >
                {smartMetrics.map((metric, index) => (
                  <AnimatedMetricCard
                    key={metric.label}
                    metric={metric}
                    isInView={metricsInView}
                    index={index}
                  />
                ))}
              </div>

              {/* Testimonial Carousel */}
              <div className="relative max-w-3xl mx-auto overflow-hidden pb-4 pt-4">
                <div
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
                >
                  {/* Testimonial 1 */}
                  <div className="w-full flex-shrink-0 px-2">
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                        "College Central has made my life so much easier. I can check my schedule,
                        track my CGPA, and find classrooms all in one app!"
                      </p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                          A
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">
                            CSE Student
                          </p>
                          <p className="text-white/60 text-xs md:text-sm">2nd Year</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 2 */}
                  <div className="w-full flex-shrink-0 px-2">
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                        "The CGPA tracker is amazing! No more manual calculations. It's accurate,
                        fast, and helps me stay on top of my academics."
                      </p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                          R
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">
                            ECE Student
                          </p>
                          <p className="text-white/60 text-xs md:text-sm">3rd Year</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 3 */}
                  <div className="w-full flex-shrink-0 px-2">
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                        "Finally, a campus map that actually works! No more asking random seniors
                        for directions. The interactive map is a lifesaver."
                      </p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                          P
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">
                            Mechanical Student
                          </p>
                          <p className="text-white/60 text-xs md:text-sm">1st Year</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 4 */}
                  <div className="w-full flex-shrink-0 px-2">
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                        "The schedule feature is incredible. I can add custom tasks, track my
                        deadlines, and never forget a submission date again!"
                      </p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                          S
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">
                            Electrical Engineering
                          </p>
                          <p className="text-white/60 text-xs md:text-sm">4th Year</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 5 */}
                  <div className="w-full flex-shrink-0 px-2">
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                        "Love how everything syncs in real-time! The dark mode is perfect for
                        late-night study sessions. Best campus app ever."
                      </p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                          M
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">
                            MnC Student
                          </p>
                          <p className="text-white/60 text-xs md:text-sm">2nd Year</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 6 */}
                  <div className="w-full flex-shrink-0 px-2">
                    <div className="group bg-white/10 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg italic leading-relaxed mb-3 md:mb-4">
                        "The academic calendar integration is a game-changer. I'm always on top of
                        exam dates, holidays, and important events now."
                      </p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform duration-300">
                          K
                        </div>
                        <div className="text-left">
                          <p className="text-white/80 text-xs sm:text-sm md:text-base font-semibold">
                            Civil Engineering
                          </p>
                          <p className="text-white/60 text-xs md:text-sm">3rd Year</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Carousel Navigation Dots */}
                <div className="flex justify-center gap-2 mt-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <button
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        testimonialIndex === index
                          ? 'bg-white scale-125 shadow-lg shadow-white/30'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Why Choose Section */}
              <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-5 sm:p-6 md:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                <h4 className="text-white font-bold text-lg sm:text-xl md:text-2xl text-center mb-4 sm:mb-6">
                  Why Students Love College Central
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Card 1 - Secure & Private */}
                  <div className="group text-center p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      🔒
                    </div>
                    <h5 className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                      Secure & Private
                    </h5>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base group-hover:text-white/70 transition-colors duration-300">
                      Your data is encrypted and only accessible by you
                    </p>
                  </div>

                  {/* Card 2 - Works Everywhere */}
                  <div className="group text-center p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      📱
                    </div>
                    <h5 className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                      Works Everywhere
                    </h5>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base group-hover:text-white/70 transition-colors duration-300">
                      Access from any device, anytime, anywhere
                    </p>
                  </div>

                  {/* Card 3 - Lightning Fast */}
                  <div className="group text-center p-4 sm:p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/10 sm:col-span-2 md:col-span-1">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                      ⚡
                    </div>
                    <h5 className="text-white font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                      Lightning Fast
                    </h5>
                    <p className="text-white/60 text-xs sm:text-sm md:text-base group-hover:text-white/70 transition-colors duration-300">
                      Optimized performance for quick access to all features
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            ref={ctaRef}
            className="relative flex flex-col justify-center items-center px-6 py-8 md:py-10"
            style={{ opacity: ctaOpacity, y: ctaY }}
          >
            <div className="max-w-2xl text-center space-y-4 relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                Ready to Simplify Your College Life?
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-white/70">
                Sign in with your {appConfig?.collegeInfo?.name?.abbreviation} email and get started
                in seconds. No setup required.
              </p>
              <div className="flex items-center justify-center gap-2 text-white/60 text-sm md:text-base">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Only {appConfig?.collegeInfo?.email?.allowedDomain} emails accepted</span>
              </div>
            </div>
          </motion.div>

          {/* Login Form */}
          <div className="relative flex flex-col justify-center items-center px-6 pb-16 md:pb-20">
            <div className="w-full max-w-md relative z-10">
              {/* Login Card with enhanced glassmorphism and mouse-following glow */}
              <div ref={loginCardRef} className="relative group perspective-1000">
                {/* Mouse-following glow effect */}
                <div
                  className="absolute pointer-events-none transition-opacity duration-300 w-64 h-64 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 blur-3xl opacity-0 group-hover:opacity-100"
                  style={{
                    left: mousePosition.x - 128,
                    top: mousePosition.y - 128,
                    transform: 'translate3d(0, 0, 0)',
                  }}
                />

                {/* Animated border gradient */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-all duration-1000 animate-gradient"></div>

                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[80px] sm:blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen filter"></div>
                  <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-[80px] sm:blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen filter"></div>
                  <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-pink-400/30 dark:bg-pink-600/20 rounded-full blur-[80px] sm:blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen filter"></div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 overflow-hidden transform transition-all duration-500 group-hover:shadow-purple-500/30 group-hover:border-white/30 group-hover:bg-white/15">
                  {/* Animated orbs inside card - more dynamic */}
                  <div className="absolute -top-[8vh] -left-[8vw] w-[16vw] h-[16vw] min-w-[10rem] min-h-[10rem] max-w-[16rem] max-h-[16rem] bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse transition-all duration-700 group-hover:scale-110"></div>

                  {/* Animated diagonal lines */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent transform -rotate-45 translate-y-20 group-hover:translate-y-0 transition-transform duration-1000"></div>
                    <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent transform -rotate-45 -translate-y-20 group-hover:translate-y-0 transition-transform duration-1000 delay-300"></div>
                  </div>

                  {/* Multi-layer shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none"></div>
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transition-transform duration-1500 ease-in-out"></div>

                  <div className="relative z-10">
                    {/* Tab Selector with enhanced design */}
                    <div className="mb-8">
                      <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(false);
                            setError('');
                          }}
                          className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all duration-300 ${
                            !isSignUp
                              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg scale-105 animate-pulse-glow'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(true);
                            setError('');
                          }}
                          className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all duration-300 ${
                            isSignUp
                              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg scale-105 animate-pulse-glow'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          Sign Up
                        </button>
                      </div>
                    </div>

                    <div className="mb-8">
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                        {isSignUp ? 'Join the Community' : 'Welcome Back!'}
                      </h2>
                      <p className="text-white/70 text-base md:text-lg flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        {isSignUp
                          ? 'Start your smart campus journey today'
                          : 'Your campus hub awaits you'}
                      </p>
                    </div>

                    {/* Error Message with animation */}
                    {error && (
                      <div className="relative bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 animate-shake overflow-hidden mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 animate-pulse"></div>

                        <div className="relative flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-red-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-red-200 leading-relaxed">
                            {error}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Google Sign-In Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleSubmitting}
                      className="relative w-full group/btn transform hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl blur opacity-60 group-hover/btn:opacity-100 transition duration-300 animate-gradient"></div>
                      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl group-hover/btn:from-indigo-500 group-hover/btn:via-purple-500 group-hover/btn:to-pink-500 transition-all duration-300 overflow-hidden">
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000"></div>

                        <div className="relative flex justify-center items-center gap-3 py-4 px-6 text-white font-bold text-base md:text-lg focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300">
                          {isGoogleSubmitting ? (
                            <>
                              <svg
                                className="animate-spin h-6 w-6 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="animate-pulse">Connecting to Campus...</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-6 w-6" viewBox="0 0 24 24">
                                <path
                                  fill="#FFFFFF"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#FFFFFF"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FFFFFF"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                  fill="#FFFFFF"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                              <span className="flex-grow">
                                {isSignUp ? 'Join with Google' : 'Continue with Google'}
                              </span>
                              <svg
                                className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Trust indicators */}
                    <div className="mt-8 space-y-3">
                      <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-white/50 text-xs">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>256-bit Encryption</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/50 text-xs">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>GDPR Compliant</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-white/40">
                          By signing up, you agree to our Terms of Service and Privacy Policy
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Login;
