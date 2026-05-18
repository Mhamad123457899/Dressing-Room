import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Facebook, User, Crown, ExternalLink } from 'lucide-react';

const bannerImg = 'https://picsum.photos/seed/premium_banner/800/400';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  facebookUrl: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  name,
  phone,
  facebookUrl
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            {/* Header / Banner */}
            <div className="relative h-40 sm:h-48 overflow-hidden shrink-0">
              <img 
                src={bannerImg} 
                alt="Premium Banner"
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <button 
                onClick={onClose}
                className="absolute top-4 sm:top-6 right-4 sm:right-6 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 z-10"
                id="close-subscription-modal"
              >
                <X size={20} />
              </button>
              
              <div className="absolute bottom-4 sm:bottom-6 left-6 sm:left-8 text-white">
                <div className="w-8 h-8 sm:w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2 sm:mb-3">
                  <Crown className="text-yellow-400" size={18} fill="currentColor" />
                </div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">Premium Production Suite</h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
              <div>
                <p className="text-zinc-600 font-medium leading-relaxed">
                  Elevate your project management with our <span className="font-bold text-black uppercase tracking-wider text-sm italic">Production Panel</span>. Designed for professionals who demand excellence.
                </p>
                <div className="mt-5 p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-start gap-4 shadow-sm">
                  <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  <p className="text-indigo-800 text-xs font-bold leading-relaxed">
                    This advanced module is part of our Premium tier. Upgrade your account today for full access to projects, actors, and scheduling tools.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Get Unlocked Instantly</h3>
                
                <div className="space-y-3">
                  {/* Name Card */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group transition-all hover:bg-white hover:border-indigo-200">
                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-indigo-600 group-hover:border-indigo-100">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Developer</p>
                      <p className="text-sm font-bold text-black">{name}</p>
                    </div>
                  </div>

                  {/* Phone Card */}
                  <a 
                    href={`tel:${phone}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group transition-all hover:bg-white hover:border-indigo-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-green-600 group-hover:border-green-100">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Phone & WhatsApp</p>
                        <p className="text-sm font-bold text-black">{phone}</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-zinc-300 transition-colors group-hover:text-zinc-400" />
                  </a>

                  {/* Facebook Card */}
                  <a 
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group transition-all hover:bg-white hover:border-indigo-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-blue-600 group-hover:border-blue-100">
                        <Facebook size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Facebook Profile</p>
                        <p className="text-sm font-bold text-black">Visit Profile</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-zinc-300 transition-colors group-hover:text-zinc-400" />
                  </a>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-[0.98]"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
