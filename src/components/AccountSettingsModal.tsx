import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  MessageSquare, 
  User, 
  Lock, 
  Send, 
  Bot, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface Company {
  id: string;
  name: string;
  slug: string;
  password?: string;
  [key: string]: any;
}

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  options?: string[];
  type?: 'input' | 'choice' | 'text';
}

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCompany: Company;
  styles: any;
  onUpdateCompany: (newCompany: Company) => void;
  setNotification: (notif: {message: string, type: 'success' | 'error' | 'info'} | null) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentCompany, 
  styles,
  onUpdateCompany,
  setNotification
}) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'settings' | 'chat'>('settings');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flowState, setFlowState] = useState<'idle' | 'choosing' | 'changing_name' | 'changing_password_start' | 'check_old_password' | 'security_questions' | 'security_questions_2' | 'new_password'>('idle');
  const [tempData, setTempData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settings Form State
  const [name, setName] = useState(currentCompany.name);
  const [logoUrl, setLogoUrl] = useState(currentCompany.logo_url || '');
  const [passwordForProfileSave, setPasswordForProfileSave] = useState('');
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, view]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      startChat();
    }
    if (isOpen) {
      setName(currentCompany.name);
      setLogoUrl(currentCompany.logo_url || '');
      // Clear password fields on open
      setPasswordForProfileSave('');
      setShowPasswordCheck(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleUpdateAccount = async () => {
    if (!name.trim()) return;
    
    if (!showPasswordCheck) {
      setShowPasswordCheck(true);
      return;
    }

    if (passwordForProfileSave !== currentCompany.password) {
      setNotification({ message: t("Incorrect security password."), type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "companies", currentCompany.id), {
        name,
        logo_url: logoUrl
      });
      onUpdateCompany({ ...currentCompany, name, logo_url: logoUrl });
      setNotification({ message: t("Account updated successfully!"), type: 'success' });
      setShowPasswordCheck(false);
      setPasswordForProfileSave('');
    } catch (err) {
      setNotification({ message: t("Failed to update account."), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordDirect = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setNotification({ message: t("Please fill all password fields."), type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotification({ message: t("New passwords do not match."), type: 'error' });
      return;
    }

    if (oldPassword !== currentCompany.password) {
      setNotification({ message: t("Current password is incorrect."), type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "companies", currentCompany.id), {
        password: newPassword
      });
      onUpdateCompany({ ...currentCompany, password: newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotification({ message: t("Password changed successfully!"), type: 'success' });
    } catch (err) {
      setNotification({ message: t("Failed to change password."), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const addMessage = (text: string, sender: 'bot' | 'user', options?: string[]) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      text,
      sender,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const startChat = () => {
    setIsTyping(true);
    setTimeout(() => {
      addMessage(t(`Hello! I'm Şan-Support, your security assistant. I can help you recover your password if you've forgotten it.`), 'bot');
      addMessage(t(`Would you like to start the recovery process?`), 'bot', [t('Yes, Help Me Recover'), t('No, Go Back')]);
      setFlowState('choosing');
      setIsTyping(false);
    }, 1000);
  };

  const isFuzzyMatch = (input: string, target: string) => {
    const s1 = input.toLowerCase().trim();
    const s2 = target.toLowerCase().trim();
    if (s1 === s2) return true;
    
    // Check if one is a substantial part of the other
    if (s1.length > 3 && (s2.includes(s1) || s1.includes(s2))) return true;
    
    // Very basic distance: if lengths are close and they share same first/last characters
    if (Math.abs(s1.length - s2.length) <= 2 && s1[0] === s2[0] && s1[s1.length-1] === s2[s2.length-1]) return true;

    return false;
  };

  const handleOptionClick = (option: string) => {
    addMessage(option, 'user');
    
    if (option === t('Yes, Help Me Recover')) {
      setFlowState('security_questions');
      setIsTyping(true);
      setTimeout(() => {
        addMessage(t("No problem! Let's verify it's you. What is the full name of your account?"), 'bot');
        setIsTyping(false);
      }, 800);
    } 
    else if (option === t('No, Go Back') || option === t('No, I\'m done')) {
      setView('settings');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const val = inputValue.trim();
    addMessage(val, 'user');
    setInputValue('');

    if (flowState === 'security_questions') {
      setIsTyping(true);
      const isNameCorrect = isFuzzyMatch(val, currentCompany.name);
      setTimeout(() => {
        if (isNameCorrect) {
          addMessage(t("Identity verified! You may now set a NEW password. Please enter it below:"), 'bot');
          setFlowState('new_password');
        } else {
          addMessage(t("I couldn't verify that name. Please try again or contact our support team directly:"), 'bot');
          addMessage("📧 Email: miranluqman60@gmail.com\n📞 Phone: +964 770 000 0000\n🔗 Facebook: fb.com/san_closet", 'bot');
        }
        setIsTyping(false);
      }, 1000);
    }
    else if (flowState === 'new_password') {
      setIsTyping(true);
      try {
        await updateDoc(doc(db, "companies", currentCompany.id), {
          password: val
        });
        onUpdateCompany({ ...currentCompany, password: val });
        setTimeout(() => {
          addMessage(t("Success! Your password has been changed. Don't forget to keep it safe!"), 'bot');
          addMessage(t("Anything else you need help with?"), 'bot', [t('No, I\'m done')]);
          setFlowState('choosing');
          setIsTyping(false);
        }, 1200);
      } catch (err) {
        setTimeout(() => {
          addMessage(t("Failed to update password. Please check your connection."), 'bot');
          setIsTyping(false);
        }, 1000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[95vh] ${styles.modal} border ${styles.border}`}
        >
          {/* Header */}
          <div className={`p-6 border-b flex justify-between items-center ${styles.inverted}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${styles.border} ${styles.secondary}`}>
                {view === 'settings' ? <SettingsIcon size={20} /> : <Bot size={20} />}
              </div>
              <div>
                <h2 className={`text-lg font-black tracking-tighter uppercase italic overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]`}>
                  {view === 'settings' ? t('Account Settings') : t('Support Assistant')}
                </h2>
                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-70`}>
                  {view === 'settings' ? t('Manage your credentials') : t('Password Recovery')}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {view === 'settings' ? (
              <div className="p-8 space-y-10">
                {/* Profile Section */}
                <section className="space-y-4">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] border-l-2 pl-3 ${styles.accent} ${styles.accentBg.replace('bg-', 'border-')}`}>{t('General Information')}</h3>
                  <div className={`space-y-4 p-6 rounded-3xl border shadow-sm ${styles.card}`}>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${styles.muted}`}>{t('Company Name')}</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 transition-all font-medium text-sm ${styles.input}`}
                        placeholder={t('Project or Company Name')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${styles.muted}`}>{t('Logo URL (Image Link)')}</label>
                      <input 
                        type="text" 
                        value={logoUrl} 
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 transition-all font-medium text-sm ${styles.input}`}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <AnimatePresence>
                      {showPasswordCheck && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1.5 pt-2 border-t"
                        >
                          <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 text-rose-500`}>{t('Confirm Identity (Enter Password)')}</label>
                          <input 
                            type="password" 
                            value={passwordForProfileSave} 
                            onChange={(e) => setPasswordForProfileSave(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl outline-none border border-rose-200 focus:ring-2 focus:ring-rose-500 transition-all font-medium text-sm ${styles.input}`}
                            placeholder={t('Enter current password')}
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      onClick={handleUpdateAccount}
                      disabled={isSaving}
                      className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${styles.button}`}
                    >
                      {isSaving ? <RefreshCw className="animate-spin" size={14} /> : (showPasswordCheck ? <ShieldCheck size={14} /> : <CheckCircle2 size={14} />)}
                      {showPasswordCheck ? t('Verify & Save') : t('Save Profile')}
                    </button>
                  </div>
                </section>

                {/* Password Section */}
                <section className="space-y-4">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] border-l-2 pl-3 ${styles.accent} border-rose-500`}>{t('Security')}</h3>
                  <div className={`space-y-4 p-6 rounded-3xl border shadow-sm ${styles.card}`}>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${styles.muted}`}>{t('Old Password')}</label>
                      <input 
                        type="password" 
                        value={oldPassword} 
                        onChange={(e) => setOldPassword(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 transition-all font-medium text-sm ${styles.input}`}
                        placeholder={t('Enter current password')}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${styles.muted}`}>{t('New Password')}</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 transition-all font-medium text-sm ${styles.input}`}
                          placeholder={t('New password')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${styles.muted}`}>{t('Confirm New')}</label>
                        <input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 transition-all font-medium text-sm ${styles.input}`}
                          placeholder={t('Confirm')}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleChangePasswordDirect}
                        disabled={isSaving}
                        className={`w-full py-3 rounded-xl text-white font-black uppercase tracking-widest text-[10px] sm:text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-rose-600`}
                      >
                        {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Lock size={14} />}
                        {t('Update Password')}
                      </button>
                      
                      <button 
                        onClick={() => setView('chat')}
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors text-center mt-2 flex items-center justify-center gap-2 hover:opacity-70 ${styles.accent}`}
                      >
                        <HelpCircle size={12} />
                        {t('Are you forget your password?')}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                        msg.sender === 'bot' ? styles.inverted : `${styles.card} ${styles.accent}`
                      }`}>
                        {msg.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className="space-y-2">
                        <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                          msg.sender === 'bot' 
                            ? `${styles.card} border-zinc-100 rounded-tl-none` 
                            : `${styles.inverted} rounded-tr-none shadow-sm`
                        }`}>
                          {msg.text}
                        </div>
                        {msg.options && (
                          <div className="flex flex-wrap gap-2">
                            {msg.options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => handleOptionClick(opt)}
                                className={`px-4 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95 shadow-sm ${styles.card} ${styles.accent} hover:bg-zinc-100`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${styles.inverted}`}>
                        <Bot size={16} />
                      </div>
                      <div className={`p-4 rounded-2xl rounded-tl-none border flex gap-1 items-center shadow-sm ${styles.card}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${styles.accent} bg-current`} />
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${styles.accent} bg-current`} />
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${styles.accent} bg-current`} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer Area */}
          {view === 'chat' && (
            <div className={`p-4 border-t ${styles.card}`}>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('Type your message...')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className={`w-full pl-6 pr-12 py-4 rounded-2xl outline-none border focus:ring-2 transition-all shadow-inner font-medium text-sm ${styles.input}`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:grayscale ${styles.button}`}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
              <button 
                onClick={() => setView('settings')}
                className={`w-full mt-2 text-[10px] font-black uppercase tracking-widest hover:opacity-70 py-2 ${styles.muted}`}
              >
                {t('Back to Settings')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
