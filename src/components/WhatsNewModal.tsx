import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Smartphone, Layout, CreditCard, ExternalLink, Zap } from 'lucide-react';

interface UpdateItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const UPDATES: UpdateItem[] = [
  {
    title: "Account Admin Panel",
    description: "Manage your brand identity directly. Update your company name and logo URL to personalize your closet experience.",
    icon: <Layout size={24} />,
    color: "bg-indigo-500"
  },
  {
    title: "Security Shield",
    description: "Your data is safer than ever. We've added a password verification step for sensitive identity changes to keep your account protected.",
    icon: <Zap size={24} />,
    color: "bg-rose-500"
  },
  {
    title: "Şan-Support Bot",
    description: "Meet our new AI assistant! If you forget your password, the bot will guide you through a secure recovery process using your identity details.",
    icon: <Sparkles size={24} />,
    color: "bg-emerald-500"
  },
  {
    title: "Multi-Language Support",
    description: "Fluent across Kurdish, Arabic, and English. The entire interface now adapts perfectly to your preferred language.",
    icon: <Smartphone size={24} />,
    color: "bg-amber-500"
  },
  {
    title: "Compacted Up Bar",
    description: "We've optimized the navigation bar to be more flexible and fit perfectly on all screen sizes, even with many buttons.",
    icon: <CreditCard size={24} />,
    color: "bg-blue-500"
  }
];

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
  onStartTour?: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose, version, onStartTour }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-zinc-950 p-8 text-white relative flex justify-between items-end shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10">
                  Release {version}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-tighter border border-indigo-500/20">
                  <Zap size={10} className="fill-current" /> New Features
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">What's <span className="text-zinc-500">New?</span></h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors mb-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
            <div className="grid gap-6">
              {UPDATES.map((update, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex gap-5 items-start"
                >
                  <div className={`w-12 h-12 rounded-2xl ${update.color} text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    {update.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">{update.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                      {update.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 pt-0 shrink-0 flex flex-col sm:flex-row gap-3">
            {onStartTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-500 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Interactive Tour
              </button>
            )}
            <button
              onClick={onClose}
              className={`py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all active:scale-95 shadow-lg ${onStartTour ? 'flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : 'w-full bg-zinc-950 text-white hover:bg-zinc-800'}`}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
