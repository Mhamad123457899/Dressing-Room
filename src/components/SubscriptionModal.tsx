import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Facebook, User, Crown, ExternalLink } from 'lucide-react';

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
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header / Banner */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative h-40 flex flex-col justify-end">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                id="close-subscription-modal"
              >
                <X size={20} />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                <Crown className="text-yellow-300" size={24} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Premium Service</h2>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <p className="text-zinc-600 font-medium leading-relaxed">
                  The <span className="font-bold text-black uppercase tracking-wider text-sm italic">Production Panel</span> is a professional-grade suite that streamlines your entire workflow. 
                </p>
                <p className="mt-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  This service is currently exclusive to paid accounts.
                </p>
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
