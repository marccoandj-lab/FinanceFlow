import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Share, Plus, CheckCircle2, X, ChevronDown, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isDark: boolean;
  variant?: 'card' | 'button' | 'sidebar';
}

export default function PWAInstallButton({ isDark, variant = 'card' }: Props) {
  const { state, install, resetDismiss, showBanner, bannerDismissed } = usePWAInstall();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  // suppress unused warning – showBanner is used by parent but we expose it here for convenience
  void showBanner;

  const isIOS = state === 'ios';
  const isInstalled = state === 'installed';
  const isUnsupported = state === 'unsupported';

  /* ── Sidebar compact variant ── */
  if (variant === 'sidebar') {
    if (isInstalled) {
      return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs ${isDark ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50'}`}>
          <CheckCircle2 size={14} />
          <span className="font-medium">App Installed</span>
        </div>
      );
    }
    if (isUnsupported) return null;
    return (
      <button
        onClick={() => {
          if (state === 'available') install();
          else if (bannerDismissed) resetDismiss();
        }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all active:scale-95 ${isDark ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
        style={{ minHeight: 40 }}
      >
        <Download size={14} />
        Install App
      </button>
    );
  }

  /* ── Button-only variant ── */
  if (variant === 'button') {
    if (isInstalled) {
      return (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold ${isDark ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50'}`}>
          <CheckCircle2 size={16} />
          Installed
        </div>
      );
    }
    if (isUnsupported) return null;
    return (
      <button
        onClick={() => {
          if (state === 'available') install();
          else if (bannerDismissed) resetDismiss();
        }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all active:scale-95 hover:shadow-violet-500/40"
        style={{ minHeight: 44 }}
      >
        <Download size={16} />
        Install App
      </button>
    );
  }

  /* ── Full Card variant (Settings page) ── */
  const features = [
    'Instant launch from home screen or taskbar',
    'Works offline — always available',
    'Full screen, no browser chrome',
    'Free — no App Store required',
  ];

  return (
    <div className={`rounded-3xl overflow-hidden border ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white border-gray-200'} shadow-sm`}>
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />

      <div className="p-5">
        {/* App identity */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>FinanceFlow</h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Install as a native app on your device
            </p>
          </div>
        </div>

        {/* Installed */}
        {isInstalled && (
          <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <p className={`font-semibold text-sm ${isDark ? 'text-green-400' : 'text-green-700'}`}>App is installed!</p>
              <p className={`text-xs ${isDark ? 'text-green-500/70' : 'text-green-600'}`}>FinanceFlow is running as an installed app</p>
            </div>
          </div>
        )}

        {/* Unsupported */}
        {isUnsupported && (
          <div className={`flex items-center gap-3 p-3 rounded-2xl ${isDark ? 'bg-gray-700/50 border border-gray-600/50' : 'bg-gray-50 border border-gray-200'}`}>
            <Monitor size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <div>
              <p className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Installation not supported</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Use Chrome, Edge, or Samsung Internet for install support</p>
            </div>
          </div>
        )}

        {/* Chrome / Edge available */}
        {(state === 'available' || (bannerDismissed && !isInstalled && !isUnsupported && !isIOS)) && (
          <div className="space-y-3">
            <div className={`p-3 rounded-2xl space-y-2 ${isDark ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
              {features.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={state === 'available' ? install : resetDismiss}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all active:scale-95 hover:shadow-violet-500/40"
              style={{ minHeight: 44 }}
            >
              <Download size={17} />
              {state === 'available' ? 'Install FinanceFlow' : 'Show Install Banner'}
            </button>
          </div>
        )}

        {/* iOS instructions */}
        {isIOS && (
          <div className="space-y-3">
            <button
              onClick={() => setShowIOSSteps(s => !s)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-700/50 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
              style={{ minHeight: 44 }}
            >
              <span className="flex items-center gap-2">
                <Smartphone size={16} />
                How to install on iPhone / iPad
              </span>
              <motion.div animate={{ rotate: showIOSSteps ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.div>
            </button>

            <AnimatePresence>
              {showIOSSteps && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-gray-700/40 border-gray-600/50' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="p-4 space-y-4">
                      <IOSStepCard
                        step={1}
                        isDark={isDark}
                        icon={<Share size={18} />}
                        title="Tap Share"
                        description="Find the Share button in Safari's bottom toolbar"
                        color="from-blue-500 to-cyan-500"
                      />
                      <div className={`w-px h-4 mx-auto ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                      <IOSStepCard
                        step={2}
                        isDark={isDark}
                        icon={<Plus size={18} />}
                        title="Tap Add to Home Screen"
                        description="Scroll down in the share sheet to find this option"
                        color="from-violet-500 to-purple-500"
                      />
                      <div className={`w-px h-4 mx-auto ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                      <IOSStepCard
                        step={3}
                        isDark={isDark}
                        icon={<CheckCircle2 size={18} />}
                        title="Tap Add"
                        description="Confirm by tapping Add in the top-right corner"
                        color="from-green-500 to-emerald-500"
                      />
                    </div>
                    <div className="px-4 pb-4">
                      <div className={`p-3 rounded-xl text-xs ${isDark ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        <strong>Note:</strong> This only works in <strong>Safari</strong>. If you are using Chrome or Firefox on iOS, open this page in Safari first.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Banner was dismissed */}
        {bannerDismissed && !isInstalled && (
          <div className={`mt-3 flex items-center gap-2 p-2.5 rounded-xl text-xs ${isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <X size={12} />
            <span>Install banner was dismissed.</span>
            <button
              onClick={resetDismiss}
              className={`underline font-medium ${isDark ? 'text-violet-400' : 'text-violet-600'}`}
            >
              Show again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IOSStepCard({
  step, icon, title, description, color, isDark,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
            Step {step}
          </span>
          <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      </div>
    </div>
  );
}
