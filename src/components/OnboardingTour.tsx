import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles, Layout, Shirt, Zap, Settings as SettingsIcon } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Production Costume Studio",
    description: "Your ultimate wardrobe management system. Designed for professionals to organize, plan, and execute costume designs for film and TV projects.",
    icon: <Sparkles className="text-yellow-400" size={32} />,
  },
  {
    title: "Two Main Hubs",
    description: "Switch between the 'Closet' for inventory management and the 'Production' panel for project planning and actor coordination.",
    icon: <Layout className="text-indigo-400" size={32} />,
  },
  {
    title: "The Wardrobe Inventory",
    description: "Browse your entire collection. Use the advanced filtering to find items by color, size, type, or weather conditions in seconds.",
    icon: <Shirt className="text-pink-400" size={32} />,
  },
  {
    title: "Premium Production Suite",
    description: "Create projects, assign costumes to actors, manage shots, and generate professional PDF reports. (Exclusive for paid accounts)",
    icon: <Zap className="text-blue-400" size={32} />,
  },
  {
    title: "Admin Control",
    description: "Access the Admin Panel to add new items, manage your company settings, and oversee all activities in your studio.",
    icon: <SettingsIcon className="text-zinc-400" size={32} />,
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/80 backdrop-blur-md"
           onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              className="h-full bg-indigo-500" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Icon Container */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.5, rotate: -20, y: 10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 20, y: -10 }}
                  className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner"
                >
                  {step.icon}
                </motion.div>
              </AnimatePresence>

              <div className="space-y-4">
                <motion.h2 
                  key={`title-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase italic underline decoration-indigo-500/50 decoration-4 underline-offset-8"
                >
                  {step.title}
                </motion.h2>
                <motion.p 
                  key={`desc-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto"
                >
                  {step.description}
                </motion.p>
              </div>

              {/* Navigation */}
              <div className="w-full flex items-center justify-between pt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${
                    currentStep === 0 
                      ? 'opacity-0 pointer-events-none' 
                      : 'bg-white/5 text-white hover:bg-white/10 active:scale-95'
                  }`}
                >
                  <ChevronLeft size={16} /> Back
                </button>

                <div className="flex gap-1.5">
                  {TOUR_STEPS.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                        i === currentStep ? 'bg-indigo-500 w-4' : 'bg-white/10'
                      }`} 
                    />
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"} 
                  {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
