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
    title: "Onboarding Tour",
    description: "New to the platform? Our interactive tour will guide you through every button and feature to get you started quickly.",
    icon: <Layout size={24} />,
    color: "bg-indigo-500"
  },
  {
    title: "Mobile-First Design",
    description: "The interface is now fully flexible and scrollable on any screen size. Experience the same power on your phone as you do on desktop.",
    icon: <Smartphone size={24} />,
    color: "bg-emerald-500"
  },
  {
    title: "Perfect Image Fitting",
    description: "Wardrobe inventory images now adapt perfectly to their containers, removing awkward spaces and ensuring a clean look.",
    icon: <Sparkles size={24} />,
    color: "bg-amber-500"
  },
  {
    title: "Enhanced Premium Suite",
    description: "Our subscription system now provides clearer details about the benefits of our Production Suite and professional tools.",
    icon: <CreditCard size={24} />,
    color: "bg-rose-500"
  },
  {
    title: "Direct Support",
    description: "Need help? We've updated our contact information and added a direct link to our official Facebook profile.",
    icon: <ExternalLink size={24} />,
    color: "bg-blue-500"
  }
];

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose, version }) => {
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
          <div className="p-8 pt-0 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-zinc-950 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-zinc-800 transition-all active:scale-95 shadow-xl"
            >
              Understand & Continue
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
