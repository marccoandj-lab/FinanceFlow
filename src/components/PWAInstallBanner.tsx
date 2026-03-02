import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, CheckCircle2, ChevronDown } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isDark: boolean;
}

export default function PWAInstallBanner({ isDark }: Props) {
  const { state, install, dismiss, showBanner } = usePWAInstall();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (!showBanner) return null;

  const isIOS = state === 'ios';

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* ── Mobile: Bottom Sheet ── */}
          <motion.div
            key="pwa-banner-mobile"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className={`
              md:hidden fixed bottom-16 left-0 right-0 z-50
              ${isDark
                ? 'bg-gray-900 border-gray-700/80'
                : 'bg-white border-gray-200'
              }
              border-t shadow-2xl
            `}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="p-4">
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                {/* App icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                  <span className="text-white font-bold text-2xl">F</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Install FinanceFlow
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Add to Home Screen for the best experience
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <CheckCircle2 size={11} className="text-green-500" /> Works offline
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <CheckCircle2 size={11} className="text-green-500" /> No app store
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <CheckCircle2 size={11} className="text-green-500" /> Free
                    </span>
                  </div>
                </div>

                <button
                  onClick={dismiss}
                  className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  style={{ minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* iOS Instructions */}
              {isIOS ? (
                <div>
                  <button
                    onClick={() => setShowIOSSteps(s => !s)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm font-medium transition-colors ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                    style={{ minHeight: 44 }}
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone size={16} />
                      How to install on iPhone / iPad
                    </span>
                    <motion.div animate={{ rotate: showIOSSteps ? 180 : 0 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showIOSSteps && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`mt-2 p-3 rounded-2xl space-y-3 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                          <IOSStep
                            step={1}
                            isDark={isDark}
                            icon={<Share size={15} />}
                            text={<>Tap the <strong>Share</strong> button in Safari's toolbar</>}
                          />
                          <IOSStep
                            step={2}
                            isDark={isDark}
                            icon={<Plus size={15} />}
                            text={<>Scroll down and tap <strong>"Add to Home Screen"</strong></>}
                          />
                          <IOSStep
                            step={3}
                            isDark={isDark}
                            icon={<CheckCircle2 size={15} />}
                            text={<>Tap <strong>Add</strong> in the top-right corner</>}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={dismiss}
                    className={`w-full mt-3 py-3 rounded-2xl text-sm font-semibold transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    style={{ minHeight: 44 }}
                  >
                    Maybe later
                  </button>
                </div>
              ) : (
                /* Android / Chrome install buttons */
                <div className="flex gap-2">
                  <button
                    onClick={install}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 transition-all active:scale-95"
                    style={{ minHeight: 44 }}
                  >
                    <Download size={17} />
                    Install App
                  </button>
                  <button
                    onClick={dismiss}
                    className={`px-4 py-3 rounded-2xl font-semibold text-sm transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    style={{ minHeight: 44 }}
                  >
                    Later
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Desktop: Floating Bottom-Right Card ── */}
          <motion.div
            key="pwa-banner-desktop"
            initial={{ x: 80, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 80, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40, delay: 0.5 }}
            className={`
              hidden md:block fixed bottom-6 right-6 z-50 w-80
              ${isDark
                ? 'bg-gray-900/95 border-gray-700/80'
                : 'bg-white/95 border-gray-200'
              }
              backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden
            `}
          >
            {/* Gradient top bar */}
            <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500" />

            <div className="p-5">
              {/* Close */}
              <button
                onClick={dismiss}
                className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
              >
                <X size={16} />
              </button>

              {/* App icon + title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Install FinanceFlow
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Available as a desktop app
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1.5 mb-4">
                {[
                  'Instant access from your taskbar',
                  'Works offline — always available',
                  'Native app feel, no browser UI',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                  </div>
                ))}
              </div>

              {/* iOS instructions on desktop (rare but possible) */}
              {isIOS ? (
                <div className={`p-3 rounded-2xl space-y-2 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    To install on iOS:
                  </p>
                  <IOSStep step={1} isDark={isDark} icon={<Share size={13} />} text={<>Tap the <strong>Share</strong> button</>} />
                  <IOSStep step={2} isDark={isDark} icon={<Plus size={13} />} text={<>Tap <strong>"Add to Home Screen"</strong></>} />
                  <IOSStep step={3} isDark={isDark} icon={<CheckCircle2 size={13} />} text={<>Tap <strong>Add</strong></>} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={install}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 active:scale-95"
                  >
                    <Download size={15} />
                    Install
                  </button>
                  <button
                    onClick={dismiss}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Later
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── iOS Step helper ── */
function IOSStep({
  step,
  icon,
  text,
  isDark,
}: {
  step: number;
  icon: React.ReactNode;
  text: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[9px] font-bold">{step}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        <span className={isDark ? 'text-violet-400' : 'text-violet-600'}>{icon}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
