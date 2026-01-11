import { X, Download, Smartphone, Share } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect if user is on iOS/Safari
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Detect browser type
    setIsSafariBrowser(isSafari());
    setIsIOSDevice(isIOS());

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (daysSinceDismissal < 7) {
        return;
      }
    }

    // For Safari/iOS, show manual installation prompt
    if (isSafari() || isIOS()) {
      // Only show on iOS Safari, not when already in standalone mode
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  // Safari/iOS Installation Instructions
  if (isSafariBrowser || isIOSDevice) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fadeIn">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white relative">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install College Central</h3>
                <p className="text-sm text-white/90">For iOS/Safari</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
              Install College Central on your device for quick access and an app-like experience.
            </p>

            {/* Installation Steps */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  1
                </div>
                <div>
                  <span className="font-medium">Tap the Share button</span>
                  <div className="flex items-center gap-1 mt-1 text-slate-500 dark:text-slate-400">
                    <Share size={16} />
                    <span className="text-xs">in Safari's toolbar</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  2
                </div>
                <div>
                  <span className="font-medium">Select "Add to Home Screen"</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Scroll down if you don't see it
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  3
                </div>
                <div>
                  <span className="font-medium">Tap "Add"</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    The app icon will appear on your home screen
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2 mb-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Benefits
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Faster loading</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span>Home screen access</span>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chrome/Edge/Brave Installation (standard beforeinstallprompt)
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Install College Central</h3>
              <p className="text-sm text-white/90">Get the app experience</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
            Install College Central for quick access, offline support, and a native app experience
            on your device.
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Works offline</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Faster loading</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>Home screen shortcut</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
            >
              <Download size={16} />
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
