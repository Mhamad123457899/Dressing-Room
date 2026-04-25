import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Plus, 
  Trash2, 
  Edit2,
  Settings, 
  LogOut, 
  Calendar, 
  Tag, 
  Layers, 
  User, 
  Cloud, 
  Palette, 
  Maximize2,
  ChevronRight,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Share2,
  Download,
  Activity,
  Dna,
  History,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  db, 
  auth, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from "./firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  getDocs,
  getDoc,
  writeBatch,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

// --- Types ---

interface ClothingItem {
  id: string;
  name: string;
  type: string;
  model: string;
  sizes: string[];
  color: string;
  age_group: string;
  weather: string;
  image_url: string;
  section: string;
  company_id: string;
  created_at?: any;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  slug: string;
  password?: string;
  created_at?: any;
  last_seen?: any;
  session_start?: any;
  is_online?: boolean;
}

interface Collection {
  id: string;
  name: string;
  event_date: string;
  description: string;
  image_url: string;
  company_id: string;
  itemIds?: string[];
}

interface Rental {
  id: string;
  clothing_id: string;
  company_id: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  client_full_name?: string;
  client_phone_number?: string;
  size: string;
  color: string;
  rental_date: any;
  status: string;
  clothing_name: string;
  image_url: string;
}

interface Client {
  id: string;
  company_id: string;
  full_name: string;
  phone: string;
  id_image_url: string;
  company_name: string;
  company_phone: string;
  created_at: any;
}

interface Project {
  id: string;
  company_id: string;
  name: string;
  user_name?: string;
  user_phone?: string;
  description: string;
  created_at: any;
}

interface Actor {
  id: string;
  company_id: string;
  project_id: string;
  name: string;
  weight: string;
  height: string;
  shoulder_size: string;
  waist_size: string;
  created_at: any;
}

interface Shot {
  id: string;
  company_id: string;
  project_id: string;
  actor_id: string;
  scene_number: number;
  shot_number: number;
  clothing_item_ids: string[];
  created_at: any;
}

// --- Constants ---

const CLOTHING_TYPES = [
  "T-shirt", "Blazer", "Shirt", "Pants", "Jeans", "Jacket", 
  "Sweater", "Dress", "Skirt", "Suit", "Hoodie", "Coat", "Shorts"
];

const MODELS = [
  "Classic", "Normal", "Casual", "Formal", "Sport", "Slim Fit", "Oversized", "Vintage"
];

const WEATHER_TYPES = ["Sunny", "Rainy", "Cold", "Hot", "Windy", "Snowy", "All Weather"];
const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const AGE_GROUPS = ["Kids", "Teens", "Adults", "Seniors", "All Ages"];

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Error Boundary ---

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong. Please try refreshing the page.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes("permission-denied")) {
            message = "You don't have permission to view this data. Please make sure you're logged in with the correct account.";
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl text-center border border-zinc-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tighter mb-4">Application Error</h2>
            <p className="text-zinc-500 mb-8 leading-relaxed">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg ${styles.button}`}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Theme Context ---

type Theme = 'light' | 'dark' | 'comfort' | 'rose';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType>({ theme: 'light', setTheme: () => {} });

const useTheme = () => React.useContext(ThemeContext);

const THEMES = {
  light: {
    bg: "bg-[#F8F8F8]",
    text: "text-zinc-900",
    navbar: "bg-white/80 border-zinc-200",
    card: "bg-white border-zinc-200",
    button: "bg-black text-white hover:bg-zinc-800",
    secondary: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
    accent: "text-zinc-500",
    muted: "text-zinc-400",
    border: "border-zinc-200",
    input: "bg-white border-zinc-200 focus:border-black text-zinc-900 placeholder:text-zinc-400",
    modal: "bg-white text-zinc-900",
    badge: "bg-black text-white",
    inverted: "bg-black text-white"
  },
  dark: {
    bg: "bg-zinc-950",
    text: "text-zinc-100",
    navbar: "bg-zinc-900/80 border-zinc-800",
    card: "bg-zinc-900 border-zinc-800",
    button: "bg-white text-black hover:bg-zinc-200",
    secondary: "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
    accent: "text-zinc-400",
    muted: "text-zinc-500",
    border: "border-zinc-800",
    input: "bg-zinc-900 border-zinc-800 focus:border-white text-zinc-100 placeholder:text-zinc-500",
    modal: "bg-zinc-900 text-zinc-100",
    badge: "bg-white text-black",
    inverted: "bg-white text-black"
  },
  comfort: {
    bg: "bg-[#fdf6e3]",
    text: "text-[#586e75]",
    navbar: "bg-[#eee8d5]/90 border-[#d3cbb7]",
    card: "bg-[#eee8d5] border-[#d3cbb7]",
    button: "bg-[#b58900] text-white hover:bg-[#a57800]",
    secondary: "bg-[#d3cbb7] text-[#586e75] hover:bg-[#c2bcdd]",
    accent: "text-[#93a1a1]",
    muted: "text-[#93a1a1]",
    border: "border-[#d3cbb7]",
    input: "bg-[#eee8d5] border-[#d3cbb7] focus:border-[#b58900] text-[#586e75] placeholder:text-[#93a1a1]",
    modal: "bg-[#fdf6e3] text-[#586e75]",
    badge: "bg-[#b58900] text-white",
    inverted: "bg-[#b58900] text-white"
  },
  rose: {
    bg: "bg-[#fff1f2]",
    text: "text-[#9f1239]",
    navbar: "bg-[#ffe4e6]/90 border-[#fecdd3]",
    card: "bg-white border-[#fecdd3]",
    button: "bg-[#e11d48] text-white hover:bg-[#be123c]",
    secondary: "bg-[#ffe4e6] text-[#9f1239] hover:bg-[#fecdd3]",
    accent: "text-[#be123c]",
    muted: "text-[#fda4af]",
    border: "border-[#fecdd3]",
    input: "bg-white border-[#fecdd3] focus:border-[#e11d48] text-[#9f1239] placeholder:text-[#fda4af]",
    modal: "bg-[#fff1f2] text-[#9f1239]",
    badge: "bg-[#e11d48] text-white",
    inverted: "bg-[#e11d48] text-white"
  }
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as Theme;
    if (saved && THEMES[saved]) {
      setTheme(saved);
    }
  }, []);

  const handleSetTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('app-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Components ---

import { LanguageSwitcher } from './components/LanguageSwitcher';
import { SuperAdminPanel } from './components/SuperAdminPanel';
// ... (rest of imports)
const Navbar = ({ isAdmin, onOpenAdmin, t, currentCompany, isViewOnly, onLogout, activeView, setActiveView, isSuperAdmin = false }: { 
  isAdmin: boolean, 
  onOpenAdmin: () => void, 
  t: any, 
  currentCompany: Company | null, 
  isViewOnly: boolean,
  onLogout: () => void,
  activeView: 'closet' | 'production',
  setActiveView: (view: 'closet' | 'production') => void,
  isSuperAdmin?: boolean
}) => {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const styles = THEMES[theme];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ku', name: 'Kurdî' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'uk', name: 'Українська' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b px-2 min-[400px]:px-6 py-4 flex justify-between items-center transition-colors duration-300 ${styles.navbar}`}>
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <Logo size={48} src={currentCompany?.logo_url} />
          <h1 className={`text-xl font-bold tracking-tight ${styles.text} hidden xl:inline-block`}>
            {currentCompany?.name || 'Admin Panel'}
          </h1>
        </div>
        
        {!isSuperAdmin && (
          <div className={`flex items-center gap-1 p-1 rounded-xl ${styles.secondary}`}>
            <button 
              onClick={() => setActiveView('closet')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2 ${activeView === 'closet' ? styles.button : 'hover:bg-black/5'}`}
            >
              <History size={14} /> <span className="hidden min-[450px]:inline">{t('Closet')}</span>
            </button>
            <button 
              onClick={() => setActiveView('production')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2 ${activeView === 'production' ? styles.button : 'hover:bg-black/5'}`}
            >
              <Activity size={14} /> <span className="hidden min-[450px]:inline">{t('Production')}</span>
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative">
          <button 
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowThemeMenu(false);
            }}
            className={`p-2 rounded-full transition-colors flex items-center gap-2 ${styles.secondary}`}
            title="Change Language"
          >
            <span className="text-xs font-bold uppercase">{i18n.language.split('-')[0]}</span>
          </button>
          
          {showLangMenu && (
            <div className={`absolute top-full right-0 mt-2 p-2 rounded-xl shadow-xl border min-w-[150px] ${styles.card} z-50`}>
              <div className="flex flex-col gap-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors flex items-center justify-between ${i18n.language === lang.code ? styles.button : styles.secondary}`}
                  >
                    {lang.name}
                    {i18n.language === lang.code && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowLangMenu(false);
            }}
            className={`p-2 rounded-full transition-colors ${styles.secondary}`}
            title="Change Theme"
          >
            <Palette size={20} />
          </button>
          
          {showThemeMenu && (
            <div className={`absolute top-full right-0 mt-2 p-2 rounded-xl shadow-xl border min-w-[150px] ${styles.card} z-50`}>
              <div className="flex flex-col gap-1">
                {(['light', 'dark', 'comfort', 'rose'] as Theme[]).map((tOption) => (
                  <button
                    key={tOption}
                    onClick={() => {
                      setTheme(tOption);
                      setShowThemeMenu(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors capitalize flex items-center justify-between ${theme === tOption ? styles.button : styles.secondary}`}
                  >
                    {tOption === 'comfort' ? 'Eyes Comfort' : tOption}
                    {theme === tOption && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {!isViewOnly && !isSuperAdmin && (
          <button 
            onClick={onOpenAdmin}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors font-medium whitespace-nowrap ${styles.button}`}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">{t('Admin Panel')}</span>
          </button>
        )}

        {currentCompany && !isViewOnly && (
          <button 
            onClick={onLogout}
            className={`p-2 rounded-full transition-colors ${styles.secondary}`}
            title="Switch Company"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </nav>
  );
};

const ClothingCard = ({ item, onAddToCollection, onRent, isRented, activeRentals = [], isViewOnly = false, companySlug, setNotification }: { 
  item: ClothingItem, 
  onAddToCollection?: (id: string) => void, 
  onRent?: (id: string) => void,
  isRented?: boolean,
  activeRentals?: Rental[],
  isViewOnly?: boolean,
  companySlug?: string,
  setNotification?: (notif: {message: string, type: 'success' | 'error'} | null) => void,
  key?: React.Key 
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]);
  const selectedColor = item.color;

  const availableSizes = item.sizes.filter(size => 
    !activeRentals.some(r => r.size === size && r.color === selectedColor)
  );

  useEffect(() => {
    if (availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  const totalCombinations = item.sizes.length;
  const isFullyRented = activeRentals.length >= totalCombinations;
  const isCurrentlyRented = isRented || isFullyRented;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 ${styles.card} ${isCurrentlyRented ? 'opacity-75 grayscale-[0.5]' : ''}`}
    >
      <div className={`relative aspect-[3/4] overflow-hidden ${styles.secondary}`}>
        <img 
          src={item.image_url || `https://picsum.photos/seed/${item.id}/400/600`} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${theme === 'dark' ? 'bg-white/90 text-zinc-800' : 'bg-black/80 text-white'}`}>
            {item.type}
          </span>
          <span className={`px-3 py-1 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${theme === 'dark' ? 'bg-black/80 text-white' : 'bg-white/90 text-zinc-800'}`}>
            {item.model}
          </span>
          <span className="px-3 py-1 bg-blue-500 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Section {item.section || 'A'}
          </span>
          {isCurrentlyRented && (
            <span className="px-3 py-1 bg-red-500 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              {t('Rented')}
            </span>
          )}
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const slug = companySlug || 'default';
            const shareUrl = `${window.location.origin}${window.location.pathname}?view=${slug}&search=${encodeURIComponent(item.name)}`;
            navigator.clipboard.writeText(shareUrl);
            if (setNotification) {
              setNotification({ message: "Item link copied to clipboard!", type: "success" });
            } else {
              alert('Item link copied to clipboard!');
            }
          }}
          className={`absolute top-4 right-4 p-2 backdrop-blur-md rounded-full shadow-lg transition-all hover:scale-110 border ${theme === 'dark' ? 'bg-white/40 text-white hover:bg-white/60 border-white/20' : 'bg-black/40 text-white hover:bg-black/60 border-black/20'}`}
          title="Share Item"
        >
          <Share2 size={16} />
        </button>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-lg font-bold mb-1 ${styles.text}`}>{item.name}</h3>
            <div className={`flex items-center gap-3 text-xs ${styles.accent}`}>
              <span className="flex items-center gap-1"><User size={12} /> {item.age_group}</span>
              <span className="flex items-center gap-1"><Cloud size={12} /> {t(item.weather)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.accent}`}>{t('Available Sizes')}</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.length > 0 ? availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={isCurrentlyRented}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    selectedSize === size 
                      ? styles.button + " shadow-lg scale-110" 
                      : styles.secondary + " disabled:opacity-50"
                  }`}
                >
                  {size}
                </button>
              )) : (
                <span className={`text-xs font-medium ${styles.accent}`}>No sizes available</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${styles.accent}`}>{t('Color')}</p>
            <div className="w-6 h-6 rounded-full border border-zinc-200" style={{ backgroundColor: (item.color || "").toLowerCase() }} />
            <span className={`text-xs font-medium capitalize ${styles.accent}`}>{t(item.color)}</span>
          </div>

          {!isViewOnly && (
            <div className="flex flex-col gap-2">
              {onRent && (
                <button 
                  onClick={() => onRent(item.id)}
                  disabled={isCurrentlyRented}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
                >
                  <Tag size={16} />
                  {isCurrentlyRented ? t('Rented') : t('Rent Now')}
                </button>
              )}
              {onAddToCollection && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onAddToCollection(item.id);
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${styles.secondary}`}
                >
                  <Plus size={16} />
                  {t('Add to Collection')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ProductionBoard = ({ 
  projects, 
  actors, 
  shots, 
  clothes,
  currentCompany,
  companies,
  isAdmin,
  isViewOnly,
  setNotification
}: { 
  projects: Project[], 
  actors: Actor[], 
  shots: Shot[], 
  clothes: ClothingItem[],
  currentCompany: Company | null,
  companies?: Company[],
  isAdmin: boolean,
  isViewOnly: boolean,
  setNotification: (n: {message: string, type: 'success' | 'error' | 'info'}) => void
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddActor, setShowAddActor] = useState(false);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    title: string;
    message: string;
    onSelect: () => void;
  } | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  const [newProject, setNewProject] = useState({ name: "", description: "", user_name: "", user_phone: "", company_id: "" });
  const [newActor, setNewActor] = useState({ 
    name: "", weight: "", height: "", shoulder_size: "", waist_size: "" 
  });
  const [activeActorId, setActiveActorId] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({});
  const [selectedShotClothingIds, setSelectedShotClothingIds] = useState<string[]>([]);
  const [shotClothingSearch, setShotClothingSearch] = useState("");
  const [shotNumber, setShotNumber] = useState(1);
  const [sceneNumber, setSceneNumber] = useState(1);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCompanyId = currentCompany ? currentCompany.id : newProject.company_id;
    if (!finalCompanyId) {
      setNotification({ message: "Please select a company.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingProject) {
        await updateDoc(doc(db, "projects", editingProject.id), {
          name: newProject.name,
          description: newProject.description,
          user_name: newProject.user_name,
          user_phone: newProject.user_phone,
          company_id: finalCompanyId,
          updated_at: Timestamp.now()
        });
        setNotification({ message: "Project updated successfully!", type: "success" });
      } else {
        await addDoc(collection(db, "projects"), {
          name: newProject.name,
          description: newProject.description,
          user_name: newProject.user_name,
          user_phone: newProject.user_phone,
          company_id: finalCompanyId,
          created_at: Timestamp.now()
        });
        setNotification({ message: "Project created successfully!", type: "success" });
      }
      setNewProject({ name: "", description: "", user_name: "", user_phone: "", company_id: "" });
      setShowAddProject(false);
      setEditingProject(null);
    } catch (err) {
      setNotification({ message: "Failed to save project.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRecentlyCreated = (createdAt: any) => {
    if (!createdAt) return false;
    try {
      let date: Date;
      if (typeof createdAt.toDate === 'function') {
        date = createdAt.toDate();
      } else if (createdAt instanceof Date) {
        date = createdAt;
      } else if (typeof createdAt === 'number') {
        date = new Date(createdAt);
      } else if (createdAt.seconds) {
        date = new Date(createdAt.seconds * 1000);
      } else {
        date = new Date(createdAt);
      }
      
      if (isNaN(date.getTime())) return false;
      
      const diffMinutes = (Date.now() - date.getTime()) / (1000 * 60);
      return diffMinutes < 10;
    } catch (e) {
      return false;
    }
  };

  const handleDeleteProject = async (projectId: string, projectCreatedAt: any) => {
    if (!isAdmin && !isRecentlyCreated(projectCreatedAt)) {
      setNotification({ message: t("This project can no longer be edited or deleted."), type: "error" });
      return;
    }

    setDeleteConfirm({
      show: true,
      title: t("Delete Project"),
      message: t("Are you sure you want to delete this project? This will NOT delete actors and shots associated with it, but they will be orphaned."),
      onSelect: async () => {
        try {
          if (!auth.currentUser) await signInAnonymously(auth);
          await deleteDoc(doc(db, "projects", projectId));
          setNotification({ message: t("Project deleted successfully!"), type: "success" });
          if (selectedProject?.id === projectId) setSelectedProject(null);
        } catch (err) {
          console.error("Delete project error:", err);
          setNotification({ message: t("Failed to delete project."), type: "error" });
        }
        setDeleteConfirm(null);
      }
    });
  };

  const handleEditProject = (project: Project) => {
    if (!isAdmin && !isRecentlyCreated(project.created_at)) {
      setNotification({ message: t("This project can no longer be edited or deleted."), type: "error" });
      return;
    }
    setNewProject({
      name: project.name,
      description: project.description,
      user_name: project.user_name || "",
      user_phone: project.user_phone || "",
      company_id: project.company_id || ""
    });
    setEditingProject(project);
    setShowAddProject(true);
  };

  const handleDeleteActor = async (actorId: string) => {
    if (isViewOnly) return;
    
    setDeleteConfirm({
      show: true,
      title: t("Delete Actor"),
      message: t("Are you sure you want to delete this actor?"),
      onSelect: async () => {
        try {
          if (!auth.currentUser) await signInAnonymously(auth);
          await deleteDoc(doc(db, "actors", actorId));
          setNotification({ message: t("Actor deleted successfully!"), type: "success" });
          if (selectedActor?.id === actorId) setSelectedActor(null);
        } catch (err) {
          console.error("Delete actor error:", err);
          setNotification({ message: t("Failed to delete actor."), type: "error" });
        }
        setDeleteConfirm(null);
      }
    });
  };

  const handleAddActor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const finalCompanyId = currentCompany ? currentCompany.id : selectedProject.company_id;
    if (!finalCompanyId) return;
    setIsSubmitting(true);
    try {
      if (editingActor) {
        await updateDoc(doc(db, "actors", editingActor.id), {
          ...newActor,
          updated_at: Timestamp.now()
        });
        setNotification({ message: "Actor updated successfully!", type: "success" });
        if (selectedActor && selectedActor.id === editingActor.id) {
          setSelectedActor({ ...editingActor, ...newActor });
        }
      } else {
        await addDoc(collection(db, "actors"), {
          ...newActor,
          company_id: finalCompanyId,
          project_id: selectedProject.id,
          created_at: Timestamp.now()
        });
        setNotification({ message: "Actor added successfully!", type: "success" });
      }
      setNewActor({ name: "", weight: "", height: "", shoulder_size: "", waist_size: "" });
      setShowAddActor(false);
      setEditingActor(null);
    } catch (err) {
      setNotification({ message: "Failed to save actor.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditActor = (actor: Actor) => {
    setNewActor({
      name: actor.name,
      weight: actor.weight,
      height: actor.height,
      shoulder_size: actor.shoulder_size,
      waist_size: actor.waist_size
    });
    setEditingActor(actor);
    setShowAddActor(true);
  };

  const handleAddShot = async (actorId: string, sceneNumber: number, shotNumber: number, itemIds: string[]) => {
    if (!selectedProject) return;
    const finalCompanyId = currentCompany ? currentCompany.id : selectedProject.company_id;
    if (!finalCompanyId) return;
    try {
      if (editingShot) {
        await updateDoc(doc(db, "shots", editingShot.id), {
          scene_number: sceneNumber,
          shot_number: shotNumber,
          clothing_item_ids: itemIds,
          updated_at: Timestamp.now()
        });
        setNotification({ message: `Shot ${shotNumber} updated!`, type: "success" });
      } else {
        await addDoc(collection(db, "shots"), {
          company_id: finalCompanyId,
          project_id: selectedProject.id,
          actor_id: actorId,
          scene_number: sceneNumber,
          shot_number: shotNumber,
          clothing_item_ids: itemIds,
          created_at: Timestamp.now()
        });
        setNotification({ message: `Shot ${shotNumber} added!`, type: "success" });
      }
      setEditingShot(null);
    } catch (err) {
      setNotification({ message: "Failed to save shot.", type: "error" });
    }
  };

  const handleEditShot = (shot: Shot) => {
    setEditingShot(shot);
    setShotNumber(shot.shot_number);
    setSceneNumber(shot.scene_number || 1);
    setSelectedShotClothingIds(shot.clothing_item_ids);
    setActiveActorId(shot.actor_id);
  };

  const handleDeleteShot = async (shotId: string) => {
    if (isViewOnly) return;
    
    setDeleteConfirm({
      show: true,
      title: t("Delete Shot"),
      message: t("Are you sure you want to delete this shot?"),
      onSelect: async () => {
        try {
          if (!auth.currentUser) await signInAnonymously(auth);
          await deleteDoc(doc(db, "shots", shotId));
          setNotification({ message: t("Shot deleted successfully!"), type: "success" });
        } catch (err) {
          console.error("Delete shot error:", err);
          setNotification({ message: t("Failed to delete shot."), type: "error" });
        }
        setDeleteConfirm(null);
      }
    });
  };

  const exportPDF = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    setNotification({ message: t("Generating PDF report..."), type: "info" });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const projectActors = actors.filter(a => a.project_id === selectedProject.id);
      
      for (let i = 0; i < projectActors.length; i++) {
        const actor = projectActors[i];
        const element = document.getElementById(`pdf-actor-${actor.id}`);
        if (!element) continue;

        const canvas = await html2canvas(element, { 
          scale: 3, 
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`${selectedProject.name}_Production_Report.pdf`);
      setNotification({ message: t("PDF exported successfully!"), type: "success" });
    } catch (err) {
      console.error(err);
      setNotification({ message: t("Failed to export PDF."), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedProject && selectedActor) {
    const actorShots = shots.filter(s => s.actor_id === selectedActor.id).sort((a,b) => (a.scene_number || 1) - (b.scene_number || 1) || a.shot_number - b.shot_number);
    
    // Group shots by scene
    const shotsByScene = actorShots.reduce((acc, shot) => {
      const scene = shot.scene_number || 1;
      if (!acc[scene]) acc[scene] = [];
      acc[scene].push(shot);
      return acc;
    }, {} as Record<number, Shot[]>);
    
    // Dedicated Full-Screen "Add Shot" Selection Page
    if (activeActorId) {
      return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-40">
          <div className={`sticky top-[80px] z-30 flex flex-col xl:flex-row items-center justify-between gap-6 py-6 -mx-6 px-6 border-b transition-all ${styles.bg} backdrop-blur-md`}>
            <div className="flex items-center gap-6 w-full xl:w-auto">
              <button 
                onClick={() => {
                  setActiveActorId(null);
                  setSelectedShotClothingIds([]);
                  setEditingShot(null);
                }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm transition-all active:scale-95 ${styles.secondary}`}
              >
                <X size={24} />
              </button>
              <div className="flex flex-col gap-2 min-w-0">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tighter truncate">{t('Select Items')}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] sm:text-sm font-black uppercase tracking-widest ${styles.accent}`}>{t('Scene')}:</span>
                    <input 
                      type="number" 
                      min="1"
                      className={`w-16 px-2 py-1 text-sm font-black rounded-lg border focus:outline-none focus:border-blue-500 bg-transparent ${styles.input}`}
                      value={sceneNumber}
                      onChange={e => setSceneNumber(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] sm:text-sm font-black uppercase tracking-widest ${styles.accent}`}>{t('Shot')}:</span>
                    <input 
                      type="number" 
                      min="1"
                      className={`w-16 px-2 py-1 text-sm font-black rounded-lg border focus:outline-none focus:border-blue-500 bg-transparent ${styles.input}`}
                      value={shotNumber}
                      onChange={e => setShotNumber(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <span className={`text-[10px] sm:text-sm truncate ${styles.accent} ml-2`}>{t('for')} {selectedActor.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full xl:w-auto justify-between xl:justify-end">
              <div className="flex px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border shadow-sm items-center gap-3 sm:gap-4 flex-1 xl:flex-none justify-center">
                <div className="text-right">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-50">{t('Picked')}</p>
                  <p className="text-lg sm:text-xl font-black text-blue-500">{selectedShotClothingIds.length}</p>
                </div>
                <div className="h-8 sm:h-10 w-px bg-zinc-200" />
                <div className="text-right">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-50">{t('Actor')}</p>
                  <p className="text-sm sm:text-xl font-black truncate max-w-[100px] sm:max-w-[150px]">{selectedActor.name}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  handleAddShot(selectedActor.id, sceneNumber, shotNumber, selectedShotClothingIds);
                  setActiveActorId(null);
                  setSelectedShotClothingIds([]);
                }}
                disabled={selectedShotClothingIds.length === 0}
                className={`flex-1 xl:flex-none px-6 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-widest text-[10px] sm:text-sm shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${styles.button} ${selectedShotClothingIds.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 shadow-blue-500/30'}`}
              >
                <span className="hidden sm:inline">{t('Confirm Selection')}</span>
                <span className="sm:hidden">{t('Confirm')}</span>
              </button>
            </div>
          </div>



          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {(clothes || []).map(item => {
              const isSelected = (selectedShotClothingIds || []).includes(item.id);
              const canSelect = true;
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedShotClothingIds(prev => prev.filter(id => id !== item.id));
                    } else if (canSelect) {
                      setSelectedShotClothingIds(prev => [...prev, item.id]);
                    } else {
                      setNotification({ message: "You can only select up to 2 items per shot", type: "error" });
                    }
                  }}
                  className={`relative rounded-[2.5rem] overflow-hidden cursor-pointer group transition-all border-4 ${isSelected ? 'border-blue-500 shadow-2xl scale-[0.98]' : 'border-transparent shadow-lg hover:shadow-xl'}`}
                >
                  <div className="aspect-[3/4] overflow-hidden bg-zinc-100">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <div className="flex justify-between items-end gap-2 text-white">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t(item.type || 'Piece')}</p>
                        <p className="text-xl font-bold truncate tracking-tight">{item.name || 'Untitled'}</p>
                        <div className="flex gap-1 mt-2">
                          {(item.sizes || []).map(sz => (
                            <span key={sz} className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-black">{sz}</span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 scale-110' : 'bg-white/20 group-hover:bg-white/40'}`}>
                        {isSelected ? <Check size={20} /> : <Plus size={20} />}
                      </div>
                    </div>
                  </div>
                  {!canSelect && !isSelected && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-bold text-black uppercase tracking-widest">Limit Reached</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>


        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-8 -mx-6 px-6 border-b transition-all ${styles.bg}`}>
          <button 
            onClick={() => setSelectedActor(null)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border shadow-sm transition-all active:scale-95 ${styles.secondary} hover:shadow-md`}
          >
            <ChevronRight className="rotate-180" size={18} /> {t('Back to Project List')}
          </button>
          
          <div className="flex items-center gap-4">
            {!isViewOnly && (
              <button 
                onClick={() => handleEditActor(selectedActor)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs border ${styles.secondary}`}
              >
                <Settings size={14} /> {t('Edit Actor Info')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Actor Profile Info */}
          <div className="lg:col-span-1">
            <div className={`p-8 rounded-[2.5rem] border sticky top-24 ${styles.card}`}>
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${styles.secondary}`}>
                <User size={40} className="text-blue-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter mb-6">{selectedActor.name}</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b group">
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{t('Weight')}</span>
                  <span className="font-bold">{selectedActor.weight} kg</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{t('Height')}</span>
                  <span className="font-bold">{selectedActor.height} cm</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{t('Shoulder')}</span>
                  <span className="font-bold">{selectedActor.shoulder_size} cm</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{t('Waist')}</span>
                  <span className="font-bold">{selectedActor.waist_size} cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actor Shots */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tighter">{t('Production Scene')}</h3>
              {!isViewOnly && (
                <button 
                  onClick={() => {
                    setEditingShot(null);
                    setActiveActorId(selectedActor.id);
                    setShotNumber(1);
                    if (actorShots.length > 0) {
                      const maxScene = Math.max(...actorShots.map(s => s.scene_number || 1));
                      setSceneNumber(maxScene + 1);
                    } else {
                      setSceneNumber(1);
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs ${styles.button}`}
                >
                  <Plus size={16} /> {t('Add New Scene')}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {Object.entries(shotsByScene).map(([sceneNum, sceneShots]) => {
                const isExpanded = expandedScenes[sceneNum];
                return (
                <div key={sceneNum} className={`rounded-[2rem] border overflow-hidden ${styles.card}`}>
                  <div 
                    onClick={() => setExpandedScenes(prev => ({...prev, [sceneNum]: !prev[sceneNum]}))}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer transition-colors gap-4 ${isExpanded ? styles.bg : 'hover:opacity-80'}`}
                  >
                    <div className="flex items-center gap-4">
                      <h4 className="text-xl font-black uppercase tracking-widest text-zinc-400">Scene {sceneNum}</h4>
                      <span className="text-xs font-bold px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">{sceneShots.length} Shots</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {!isViewOnly && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingShot(null);
                            setActiveActorId(selectedActor.id);
                            setSceneNumber(parseInt(sceneNum));
                            const maxShot = sceneShots.length > 0 ? Math.max(...sceneShots.map(s => s.shot_number)) : 0;
                            setShotNumber(maxShot + 1);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles.secondary}`}
                        >
                          <Plus size={12} /> {t('Add New Shot')}
                        </button>
                      )}
                      <div className={`p-2 rounded-full border ${styles.secondary}`}>
                         {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-6 pt-0 border-t border-zinc-100/10 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                    {sceneShots.map(shot => (
                      <motion.div 
                        key={shot.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-[2rem] border overflow-hidden relative ${styles.card}`}
                      >
                          <div className="flex items-center justify-between gap-2 mb-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${styles.inverted}`}>Shot {shot.shot_number}</span>
                            {!isViewOnly && (
                              <div className="flex gap-2">
                                <button onClick={() => handleEditShot(shot)} className={`p-1.5 rounded-lg border ${styles.secondary} hover:text-blue-500 transition-colors`}>
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteShot(shot.id)} className={`p-1.5 rounded-lg border ${styles.secondary} hover:text-red-500 transition-colors`}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        
                        <div className={`grid gap-3 ${(shot.clothing_item_ids || []).length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                          {(shot.clothing_item_ids || []).map(itemId => {
                            const item = (clothes || []).find(c => String(c.id) === String(itemId));
                            if (!item) return (
                              <div key={itemId} className="p-4 rounded-xl bg-zinc-100 border border-dashed flex flex-col items-center justify-center text-center">
                                <AlertCircle size={16} className="text-zinc-300 mb-1" />
                                <p className="text-[8px] font-bold opacity-30">Item sync error</p>
                              </div>
                            );
                            return (
                              <div key={itemId} className="group relative">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden border shadow-sm group-hover:shadow-md transition-all">
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                                </div>
                                <div className="p-3">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{item.type || 'Piece'}</p>
                                  <p className="text-xs font-bold truncate">{item.name || 'Untitled'}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {(!shot.clothing_item_ids || shot.clothing_item_ids.length === 0) && (
                          <div className={`py-6 text-center border border-dashed rounded-2xl ${styles.muted}`}>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">No items selected</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              {actorShots.length === 0 && (
                <div className={`col-span-full py-20 text-center border-2 border-dashed rounded-[2rem] ${styles.muted}`}>
                  No shots added to this profile yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Actor Modal for Actor detail view */}
        {showAddActor && createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border ${styles.modal} ${styles.border}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter">{editingActor ? t('Edit Actor') : t('New Actor')}</h3>
                <button onClick={() => {
                  setShowAddActor(false);
                  setEditingActor(null);
                  setNewActor({ name: "", weight: "", height: "", shoulder_size: "", waist_size: "" });
                }} className={`p-2 rounded-full ${styles.secondary}`}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddActor} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Full Name')}</label>
                  <input required value={newActor.name} onChange={e => setNewActor({...newActor, name: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} placeholder={t('Actor Name')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Weight (kg)')}</label><input value={newActor.weight} onChange={e => setNewActor({...newActor, weight: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Height (cm)')}</label><input value={newActor.height} onChange={e => setNewActor({...newActor, height: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Shoulder Size')}</label><input value={newActor.shoulder_size} onChange={e => setNewActor({...newActor, shoulder_size: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Waist Size')}</label><input value={newActor.waist_size} onChange={e => setNewActor({...newActor, waist_size: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                </div>
                <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 ${styles.button} hover:shadow-blue-500/20`}>
                  {t('Confirm Actor')}
                </button>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  if (selectedProject) {
    const projectActors = actors.filter(a => a.project_id === selectedProject.id);
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-8 -mx-6 px-6 border-b transition-all ${styles.bg}`}>
          <button 
            onClick={() => setSelectedProject(null)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border shadow-sm transition-all active:scale-95 ${styles.secondary} hover:shadow-md`}
          >
            <ChevronRight className="rotate-180" size={18} /> {t('Back to Projects')}
          </button>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {!isViewOnly && (
              <button 
                onClick={() => setShowAddActor(true)}
                className={`flex items-center justify-center gap-3 px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${styles.button} hover:shadow-blue-500/20`}
              >
                <Plus size={20} /> {t('Add Actor')}
              </button>
            )}
            <button 
              onClick={exportPDF}
              disabled={isSubmitting}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 ${styles.button} ${isSubmitting ? 'opacity-50' : ''}`}
            >
              <Download size={20} /> {isSubmitting ? t('Generating...') : t('Export PDF')}
            </button>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedProject.name}</h2>
          <p className={styles.accent}>{selectedProject.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {projectActors.map(actor => (
            <motion.div 
              key={actor.id}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedActor(actor)}
              className={`p-8 rounded-[2.5rem] border group cursor-pointer transition-all ${styles.card} hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10`}
            >
              <div className="flex items-center justify-between gap-4 mb-6 transition-all group-hover:scale-105">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${styles.secondary}`}>
                  <User size={32} className="text-blue-500" />
                </div>
                {!isViewOnly && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditActor(actor); }}
                      className={`p-3 rounded-2xl border ${styles.secondary} hover:text-blue-500 transition-all`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteActor(actor.id); }}
                      className={`p-3 rounded-2xl border ${styles.secondary} hover:text-red-500 transition-all`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-2 truncate">{actor.name}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{shots.filter(s => s.actor_id === actor.id).length} Costumes Shots</p>
              
              <div className="mt-8 flex items-center justify-between pt-6 border-t font-black uppercase tracking-widest text-[10px] text-blue-500 group-hover:gap-3 transition-all">
                Open Profile <ChevronRight size={14} />
              </div>
            </motion.div>
          ))}
          {!isViewOnly && projectActors.length === 0 && (
            <div 
              onClick={() => setShowAddActor(true)}
              className="p-8 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 transition-all group"
            >
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${styles.secondary}`}>
                <Plus size={32} className="opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-bold opacity-30">{t('No actors yet')}</p>
              <p className="text-[10px] opacity-20 uppercase font-black tracking-widest mt-2">{t('Tap to add your first actor')}</p>
            </div>
          )}
        </div>

        {/* Hidden PDF content for export - Absolute positioned instead of hidden to allow capture */}
        <div className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0 overflow-hidden h-0">
          {projectActors.map(actor => {
            const actorShots = shots.filter(s => s.actor_id === actor.id).sort((a,b) => (a.scene_number || 1) - (b.scene_number || 1) || a.shot_number - b.shot_number);
            const shotsByScene = actorShots.reduce((acc, shot) => {
              const scene = shot.scene_number || 1;
              if (!acc[scene]) acc[scene] = [];
              acc[scene].push(shot);
              return acc;
            }, {} as Record<number, Shot[]>);
            return (
              <div 
                key={actor.id} 
                id={`pdf-actor-${actor.id}`}
                className="bg-white text-zinc-900 p-12 w-[210mm] min-h-[297mm] flex flex-col"
              >
                {/* PDF Header - Project Info */}
                <div className="border-b-[3px] border-zinc-900 pb-8 mb-10 flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">{selectedProject.name}</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-2">{t('Production Costume Report')}</p>
                    {selectedProject.description && (
                      <p className="text-[10px] text-zinc-500 mt-2 italic max-w-[500px]">{selectedProject.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30">{new Date().toLocaleDateString()}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">{t('Page for')} {actor.name}</p>
                  </div>
                </div>

                {/* Actor Profile Section */}
                <div className="flex gap-10 mb-12 items-start">
                  <div className="flex-1">
                    <h2 className="text-3xl font-black tracking-tighter mb-4">{actor.name}</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                       <div className="flex justify-between border-b py-1">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('Weight')}</span>
                         <span className="text-sm font-bold">{actor.weight} kg</span>
                       </div>
                       <div className="flex justify-between border-b py-1">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('Height')}</span>
                         <span className="text-sm font-bold">{actor.height} cm</span>
                       </div>
                       <div className="flex justify-between border-b py-1">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('Shoulder Size')}</span>
                         <span className="text-sm font-bold">{actor.shoulder_size} cm</span>
                       </div>
                       <div className="flex justify-between border-b py-1">
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('Waist Size')}</span>
                         <span className="text-sm font-bold">{actor.waist_size} cm</span>
                       </div>
                    </div>
                  </div>
                  <div className="w-40 aspect-square bg-zinc-100 rounded-2xl flex items-center justify-center border-2 border-zinc-200">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-20">{t('Actor Photo')}</p>
                  </div>
                </div>

                {/* Shots Grid */}
                <div className="flex-1">
                   <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">{t('Selected Shots & Wardrobe')}</h3>
                   <div className="space-y-8">
                     {Object.entries(shotsByScene).map(([sceneNum, sceneShots]) => (
                       <div key={sceneNum}>
                         <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4 bg-zinc-100 px-4 py-2 rounded-lg inline-block">Scene {sceneNum}</h4>
                         <div className="grid grid-cols-2 gap-8">
                           {sceneShots.map(shot => (
                             <div key={shot.id} className="p-6 rounded-3xl bg-zinc-50 border-2 border-zinc-100">
                               <div className="flex justify-between items-center mb-4">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${styles.inverted}`}>{t('Shot')} {shot.shot_number}</span>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  {shot.clothing_item_ids.map(itemId => {
                                    const item = clothes.find(c => c.id === itemId);
                                    return item && (
                                      <div key={itemId} className="space-y-2">
                                        <div className="aspect-[3/4] rounded-xl overflow-hidden border shadow-sm">
                                          <img src={item.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                        <div className="px-1">
                                          <p className="text-[8px] font-black uppercase tracking-widest opacity-40 truncate">{t(item.type)}</p>
                                          <p className="text-[10px] font-black truncate">{item.name}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                     {actorShots.length === 0 && (
                       <div className="col-span-2 py-10 text-center border-2 border-dashed rounded-3xl opacity-30">
                         <p className="text-xs font-bold font-black uppercase tracking-widest">{t('No shots assigned')}</p>
                       </div>
                     )}
                   </div>
                </div>
                
                {/* Footer */}
                <div className="mt-auto pt-10 border-t border-zinc-100 text-[8px] font-black uppercase tracking-widest opacity-20 flex justify-between">
                  <span>{t('Generated via Production Costume Studio')}</span>
                  <span>© {new Date().getFullYear()} {selectedProject.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Actor Modal for Project list view */}
        {showAddActor && createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border ${styles.modal} ${styles.border}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter">{editingActor ? t('Edit Actor') : t('New Actor')}</h3>
                <button onClick={() => {
                  setShowAddActor(false);
                  setEditingActor(null);
                  setNewActor({ name: "", weight: "", height: "", shoulder_size: "", waist_size: "" });
                }} className={`p-2 rounded-full ${styles.secondary}`}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddActor} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Full Name')}</label>
                  <input required value={newActor.name} onChange={e => setNewActor({...newActor, name: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} placeholder={t('Actor Name')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Weight (kg)')}</label><input value={newActor.weight} onChange={e => setNewActor({...newActor, weight: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Height (cm)')}</label><input value={newActor.height} onChange={e => setNewActor({...newActor, height: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Shoulder Size')}</label><input value={newActor.shoulder_size} onChange={e => setNewActor({...newActor, shoulder_size: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                  <div><label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">{t('Waist Size')}</label><input value={newActor.waist_size} onChange={e => setNewActor({...newActor, waist_size: e.target.value})} className={`w-full p-4 rounded-2xl border ${styles.input}`} /></div>
                </div>
                <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 ${styles.button} hover:shadow-blue-500/20`}>
                  {t('Confirm Actor')}
                </button>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 py-6 -mx-6 px-6 border-b transition-all ${styles.bg}`}>
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">{t('Production Board')}</h2>
          <p className={styles.accent}>{t('Manage costume planning for film and TV projects.')}</p>
        </div>
        {!isViewOnly && (
          <button 
            onClick={() => setShowAddProject(true)}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 ${styles.button} hover:shadow-blue-500/20`}
          >
            <Plus size={24} /> {t('New Production')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <motion.div 
            key={project.id}
            whileHover={{ y: -10 }}
            onClick={() => setSelectedProject(project)}
            className={`p-10 rounded-[3rem] border border-transparent shadow-xl cursor-pointer hover:border-black transition-all group ${styles.card}`}
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${styles.secondary}`}>
                <Dna size={32} />
              </div>
              {(isAdmin || isRecentlyCreated(project.created_at)) && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                    className={`p-3 rounded-2xl border ${styles.secondary} hover:text-blue-500 hover:border-blue-500/50 transition-all shadow-sm active:scale-95`}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id, project.created_at); }}
                    className={`p-3 rounded-2xl border ${styles.secondary} hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm active:scale-95`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-500 transition-colors">{project.name}</h3>
            <p className={`mb-8 line-clamp-2 ${styles.accent}`}>{project.description}</p>
            <div className="flex justify-between items-center pt-8 border-t">
              <span className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{new Date(project.created_at?.toDate()).toLocaleDateString()}</span>
              <div className="flex items-center gap-1 font-bold text-sm">
                <User size={14} /> {actors.filter(a => a.project_id === project.id).length} {t('Actors')}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {showAddProject && createPortal(
        <div className={`fixed inset-0 z-[300] overflow-y-auto ${styles.bg} ${styles.text}`}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen w-full"
          >
            <div className={`sticky top-0 z-10 border-b flex justify-between items-center p-6 mb-8 ${styles.bg} backdrop-blur-md`}>
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{t('Create New Project')}</h3>
                <p className={`text-sm ${styles.accent}`}>{t('Set up a new production sequence')}</p>
              </div>
              <button 
                onClick={() => {
                  setShowAddProject(false);
                  setEditingProject(null);
                  setNewProject({ name: "", description: "", user_name: "", user_phone: "", company_id: "" });
                }} 
                className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm transition-all active:scale-95 ${styles.secondary}`}
              >
                <X size={24} />
              </button>
            </div>

            <div className="max-w-3xl mx-auto p-6 pb-32">
              <form onSubmit={handleCreateProject} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">{t('Your Name')}</label>
                    <input 
                      required 
                      value={newProject.user_name} 
                      onChange={e => setNewProject({...newProject, user_name: e.target.value})} 
                      className={`w-full p-5 rounded-3xl border-2 transition-all focus:border-blue-500 outline-none text-lg ${styles.input}`} 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">{t('Phone Number')}</label>
                    <input 
                      required 
                      value={newProject.user_phone} 
                      onChange={e => setNewProject({...newProject, user_phone: e.target.value})} 
                      className={`w-full p-5 rounded-3xl border-2 transition-all focus:border-blue-500 outline-none text-lg ${styles.input}`} 
                      placeholder="+123..." 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">{t('Production Name')}</label>
                  <input 
                    required 
                    value={newProject.name} 
                    onChange={e => setNewProject({...newProject, name: e.target.value})} 
                    className={`w-full p-5 rounded-3xl border-2 transition-all focus:border-blue-500 outline-none text-xl font-bold ${styles.input}`} 
                    placeholder="e.g. Summer Collection Shoot" 
                  />
                </div>

                {!currentCompany && companies && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">{t('Assign to Company')}</label>
                    <select
                      required
                      value={newProject.company_id}
                      onChange={e => setNewProject({...newProject, company_id: e.target.value})}
                      className={`w-full p-5 rounded-3xl border-2 transition-all focus:border-blue-500 outline-none text-lg font-bold appearance-none ${styles.input}`}
                    >
                      <option value="">{t('Select Company')}</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">{t('Production Description')}</label>
                  <textarea 
                    value={newProject.description} 
                    onChange={e => setNewProject({...newProject, description: e.target.value})} 
                    className={`w-full p-5 rounded-3xl border-2 transition-all focus:border-blue-500 outline-none h-48 text-lg resize-none ${styles.input}`} 
                    placeholder="Details about the shoot, location, etc..." 
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${styles.button}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('Creating...')}
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        {t('Confirm Production')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border ${styles.modal} ${styles.border}`}
          >
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tighter">{deleteConfirm.title}</h3>
            </div>
            <p className={`mb-8 leading-relaxed ${styles.accent}`}>
              {deleteConfirm.message}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border ${styles.secondary}`}
              >
                {t('Cancel')}
              </button>
              <button 
                onClick={deleteConfirm.onSelect}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                {t('Delete')}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

const AdminPanel = ({ 
  onClose, rentals, clothes, collections, clients, 
  onReturn, onDeleteRental, setNotification, setConfirmModal, 
  setAddToCollectionModal, seedSampleData, isSubmitting, 
  currentCompany, isViewOnly,
  projects, actors, shots
}: { 
  onClose: () => void, 
  rentals: Rental[], 
  clothes: ClothingItem[], 
  collections: Collection[],
  clients: Client[],
  onReturn: (id: string) => void,
  onDeleteRental: (id: string) => void,
  setNotification: (n: {message: string, type: 'success' | 'error'}) => void,
  setConfirmModal: (c: {show: boolean, title: string, message: string, onConfirm: () => void} | null) => void,
  setAddToCollectionModal: (m: {show: boolean, clothingId: string | null}) => void,
  seedSampleData: () => Promise<void>,
  isSubmitting: boolean,
  currentCompany: Company | null,
  isViewOnly: boolean,
  projects: Project[],
  actors: Actor[],
  shots: Shot[]
}) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [activeTab, setActiveTab] = useState<"clothes" | "collections" | "rentals" | "clients" | "production">("clothes");
  const [rentalFilter, setRentalFilter] = useState<"active" | "all">("active");
  const [rentalSearch, setRentalSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Form States
  const [newCloth, setNewCloth] = useState({
    name: "",
    type: CLOTHING_TYPES[0],
    model: MODELS[0],
    sizes: [] as string[],
    color: "",
    age_group: AGE_GROUPS[0],
    weather: WEATHER_TYPES[0],
    image_url: "",
    section: "A"
  });

  const [newCollection, setNewCollection] = useState({
    name: "",
    event_date: "",
    description: "",
    image_url: ""
  });

  const [newClient, setNewClient] = useState({
    full_name: "",
    phone: "",
    id_image_url: "",
    company_name: "",
    company_phone: ""
  });

  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

  const [editingCloth, setEditingCloth] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editingRental, setEditingRental] = useState<string | null>(null);
  const [viewingClientRentals, setViewingClientRentals] = useState<Rental[] | null>(null);
  const [rentalMonthFilter, setRentalMonthFilter] = useState<number>(0); // 0 means all

  const [editRentalForm, setEditRentalForm] = useState({
    client_id: "",
    size: "",
    color: "",
    status: "active"
  });

  const scrollToTop = () => {
    if (panelRef.current) {
      panelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddCloth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCloth.sizes.length === 0 || !newCloth.color) {
      setNotification({ message: "Please add at least one size and one color", type: "error" });
      return;
    }
    try {
      if (editingCloth) {
        await updateDoc(doc(db, "clothes", editingCloth), {
          ...newCloth
        });
        setEditingCloth(null);
      } else {
        await addDoc(collection(db, "clothes"), {
          ...newCloth,
          company_id: currentCompany?.id,
          created_at: Timestamp.now()
        });
      }
      setNotification({ message: editingCloth ? "Item updated successfully!" : "Item added successfully!", type: "success" });
      setNewCloth({
        name: "",
        type: CLOTHING_TYPES[0],
        model: MODELS[0],
        sizes: [],
        color: "",
        age_group: AGE_GROUPS[0],
        weather: WEATHER_TYPES[0],
        image_url: "",
        section: "A"
      });
    } catch (err) {
      setNotification({ message: "Failed to save item.", type: "error" });
    }
  };

  const handleEditCloth = (item: ClothingItem) => {
    setEditingCloth(item.id);
    setNewCloth({
      name: item.name,
      type: item.type,
      model: item.model,
      sizes: item.sizes,
      color: item.color,
      age_group: item.age_group,
      weather: item.weather,
      image_url: item.image_url,
      section: item.section || "A"
    });
    scrollToTop();
  };

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await updateDoc(doc(db, "collections", editingCollection), {
          ...newCollection
        });
        setEditingCollection(null);
      } else {
        await addDoc(collection(db, "collections"), {
          ...newCollection,
          company_id: currentCompany?.id,
          itemIds: []
        });
      }
      setNotification({ message: editingCollection ? "Collection updated!" : "Collection added!", type: "success" });
      setNewCollection({ name: "", event_date: "", description: "", image_url: "" });
    } catch (err) {
      setNotification({ message: "Failed to save collection.", type: "error" });
    }
  };

  const handleEditCollection = (col: Collection) => {
    setEditingCollection(col.id);
    setNewCollection({
      name: col.name,
      event_date: col.event_date,
      description: col.description,
      image_url: col.image_url
    });
    scrollToTop();
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany?.id) {
      setNotification({ message: "No company selected. Please login again.", type: "error" });
      return;
    }
    try {
      if (editingClient) {
        await updateDoc(doc(db, "clients", editingClient), {
          ...newClient
        });
        setEditingClient(null);
      } else {
        await addDoc(collection(db, "clients"), {
          ...newClient,
          company_id: currentCompany?.id,
          created_at: Timestamp.now()
        });
      }
      setNotification({ message: editingClient ? "Client updated!" : "Client added!", type: "success" });
      setNewClient({
        full_name: "",
        phone: "",
        id_image_url: "",
        company_name: "",
        company_phone: ""
      });
    } catch (err) {
      setNotification({ message: "Failed to save client account.", type: "error" });
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client.id);
    setNewClient({
      full_name: client.full_name,
      phone: client.phone,
      id_image_url: client.id_image_url,
      company_name: client.company_name,
      company_phone: client.company_phone
    });
    scrollToTop();
  };

  const handleEditRental = (rental: Rental) => {
    setEditingRental(rental.id);
    setEditRentalForm({
      client_id: rental.client_id || "",
      size: rental.size,
      color: rental.color,
      status: rental.status
    });
    scrollToTop();
  };

  const handleUpdateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    try {
      const client = clients.find(c => c.id === editRentalForm.client_id);
      await updateDoc(doc(db, "rentals", editingRental), {
        ...editRentalForm,
        client_name: client?.full_name || "",
        client_phone: client?.phone || ""
      });
      setNotification({ message: "Rental record updated!", type: "success" });
      setEditingRental(null);
    } catch (err) {
      setNotification({ message: "Failed to update rental.", type: "error" });
    }
  };

  const handleDeleteCloth = async (id: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Item",
      message: "Are you sure you want to delete this item?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteDoc(doc(db, "clothes", id));
          // Also clean up rentals and collections
          const rentalSnap = await getDocs(query(collection(db, "rentals"), where("clothing_id", "==", id)));
          const batch = writeBatch(db);
          rentalSnap.forEach(d => batch.delete(d.ref));
          await batch.commit();
          
          setNotification({ message: "Item deleted successfully!", type: "success" });
        } catch (err) {
          setNotification({ message: "Failed to delete item.", type: "error" });
        }
      }
    });
  };

  const handleDeleteCollection = async (id: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Collection",
      message: "Are you sure you want to delete this collection?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteDoc(doc(db, "collections", id));
          setNotification({ message: "Collection deleted successfully!", type: "success" });
        } catch (err) {
          setNotification({ message: "Failed to delete collection.", type: "error" });
        }
      }
    });
  };

  const handleDeleteClient = async (id: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Client",
      message: "Are you sure you want to delete this client account?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteDoc(doc(db, "clients", id));
          setNotification({ message: "Client deleted successfully!", type: "success" });
        } catch (err) {
          setNotification({ message: "Failed to delete client account.", type: "error" });
        }
      }
    });
  };

  return (
    <div ref={panelRef} className={`fixed inset-0 z-[100] overflow-y-auto ${styles.bg} ${styles.text}`}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className={`text-4xl font-black tracking-tighter ${styles.text}`}>Admin Dashboard</h2>
            <p className={`mt-2 ${styles.accent}`}>Manage your dressing room inventory, collections, and clients.</p>
          </div>
          <button 
            onClick={onClose}
            className={`p-3 rounded-full transition-all ${styles.secondary}`}
          >
            <X size={24} />
          </button>
        </div>

        <div className={`flex flex-wrap gap-4 mb-12 border-b pb-4 ${styles.border}`}>
          <button 
            onClick={() => { setActiveTab("clothes"); setInventorySearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "clothes" ? styles.button : `${styles.accent} hover:opacity-80`
            }`}
          >
            Inventory
          </button>
          <button 
            onClick={() => { setActiveTab("collections"); setCollectionSearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "collections" ? styles.button : `${styles.accent} hover:opacity-80`
            }`}
          >
            TVC Wardrobe
          </button>
          <button 
            onClick={() => { setActiveTab("clients"); setClientSearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "clients" ? styles.button : `${styles.accent} hover:opacity-80`
            }`}
          >
            Client Accounts
          </button>
          <button 
            onClick={() => { setActiveTab("rentals"); setRentalSearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "rentals" ? styles.button : `${styles.accent} hover:opacity-80`
            }`}
          >
            Active Rentals
          </button>
          <button 
            onClick={() => setActiveTab("production")}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "production" ? styles.button : `${styles.accent} hover:opacity-80`
            }`}
          >
            Production Projects
          </button>
        </div>

        {activeTab === "clothes" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className={`p-8 rounded-3xl border sticky top-12 ${styles.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-emerald-500" /> {editingCloth ? 'Edit Item' : 'Add New Item'}
                </h3>
                <div className="mb-6">
                  <button 
                    onClick={seedSampleData}
                    disabled={isSubmitting}
                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${styles.secondary}`}
                  >
                    {isSubmitting ? 'Seeding...' : 'Seed Sample Data'}
                  </button>
                </div>
                <form onSubmit={handleAddCloth} className="space-y-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Item Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCloth.name}
                      onChange={e => setNewCloth({...newCloth, name: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all border ${styles.input}`}
                      placeholder="e.g. Summer Linen Shirt"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Type</label>
                      <select 
                        value={newCloth.type}
                        onChange={e => setNewCloth({...newCloth, type: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      >
                        {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Model</label>
                      <select 
                        value={newCloth.model}
                        onChange={e => setNewCloth({...newCloth, model: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      >
                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Sizes (Press Enter)</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={sizeInput}
                        onChange={e => setSizeInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (sizeInput && !newCloth.sizes.includes(sizeInput)) {
                              setNewCloth({...newCloth, sizes: [...newCloth.sizes, sizeInput]});
                              setSizeInput("");
                            }
                          }
                        }}
                        className={`flex-1 px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                        placeholder="S, M, L..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newCloth.sizes.map(s => (
                        <span key={s} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${styles.secondary}`}>
                          {s} <X size={12} className="cursor-pointer" onClick={() => setNewCloth({...newCloth, sizes: newCloth.sizes.filter(x => x !== s)})} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Color</label>
                    <input 
                      type="text" 
                      value={newCloth.color}
                      onChange={e => setNewCloth({...newCloth, color: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      placeholder="Red"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Age Group</label>
                      <select 
                        value={newCloth.age_group}
                        onChange={e => setNewCloth({...newCloth, age_group: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      >
                        {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Weather</label>
                      <select 
                        value={newCloth.weather}
                        onChange={e => setNewCloth({...newCloth, weather: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      >
                        {WEATHER_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Store Section</label>
                      <select 
                        value={newCloth.section}
                        onChange={e => setNewCloth({...newCloth, section: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      >
                        {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Image URL</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newCloth.image_url}
                        onChange={e => setNewCloth({...newCloth, image_url: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none pr-10 border ${styles.input}`}
                        placeholder="https://images.unsplash.com/..."
                      />
                      {newCloth.image_url && (
                        <button 
                          type="button"
                          onClick={() => setNewCloth({...newCloth, image_url: ""})}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    {newCloth.image_url && (
                      <div className={`mt-4 w-full h-48 rounded-xl overflow-hidden border ${styles.card} ${styles.secondary}`}>
                        <img src={newCloth.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${styles.button}`}
                  >
                    {editingCloth ? 'Update Item' : 'Add to Inventory'}
                  </button>
                  {editingCloth && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCloth(null);
                        setNewCloth({
                          name: "", type: CLOTHING_TYPES[0], model: MODELS[0], sizes: [], color: "",
                          age_group: AGE_GROUPS[0], weather: WEATHER_TYPES[0], image_url: "",
                          section: "A"
                        });
                      }}
                      className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all mt-2"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold">Current Inventory ({clothes.length})</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search inventory..."
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black border ${styles.input}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clothes
                  .filter(item => {
                    const s = inventorySearch.toLowerCase();
                    return item.name.toLowerCase().includes(s) || 
                           item.type.toLowerCase().includes(s) ||
                           item.sizes.some(sz => sz.toLowerCase().includes(s)) ||
                           item.color.toLowerCase().includes(s);
                  })
                  .map(item => (
                  <div key={item.id} className="relative">
                    <ClothingCard 
                      item={item} 
                      isViewOnly={isViewOnly}
                      companySlug={currentCompany?.slug}
                      setNotification={setNotification}
                      onAddToCollection={(id) => setAddToCollectionModal({show: true, clothingId: id})}
                      activeRentals={rentals.filter(r => r.clothing_id === item.id && r.status === 'active')}
                    />
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <button 
                        onClick={() => handleEditCloth(item)}
                        className={`p-2 rounded-full transition-all shadow-lg ${styles.button}`}
                        title="Edit Item"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCloth(item.id)}
                        className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "collections" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className={`p-8 rounded-3xl border sticky top-12 ${styles.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="text-blue-500" /> {editingCollection ? 'Edit Collection' : 'New Collection'}
                </h3>
                <form onSubmit={handleAddCollection} className="space-y-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Collection Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCollection.name}
                      onChange={e => setNewCollection({...newCollection, name: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      placeholder="e.g. Wedding Event 2024"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Event Date</label>
                    <input 
                      type="date" 
                      value={newCollection.event_date}
                      onChange={e => setNewCollection({...newCollection, event_date: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Collection Image URL</label>
                    <input 
                      type="url" 
                      value={newCollection.image_url}
                      onChange={e => setNewCollection({...newCollection, image_url: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Description</label>
                    <textarea 
                      value={newCollection.description}
                      onChange={e => setNewCollection({...newCollection, description: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none h-32 resize-none border ${styles.input}`}
                      placeholder="What is this collection for?"
                    />
                  </div>
                  <button 
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${styles.button}`}
                  >
                    {editingCollection ? 'Update Collection' : 'Create Collection'}
                  </button>
                  {editingCollection && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCollection(null);
                        setNewCollection({ name: "", event_date: "", description: "", image_url: "" });
                      }}
                      className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all mt-2"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold">Active TVC Wardrobe ({collections.length})</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search collections..."
                    value={collectionSearch}
                    onChange={e => setCollectionSearch(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black border ${styles.input}`}
                  />
                </div>
              </div>
              <div className="space-y-6">
                {collections
                  .filter(col => {
                    const s = collectionSearch.toLowerCase();
                    return col.name.toLowerCase().includes(s) || col.description.toLowerCase().includes(s);
                  })
                  .map(col => (
                  <div key={col.id} className={`p-6 rounded-3xl border flex justify-between items-center group hover:border-black transition-all ${styles.card}`}>
                    <div className="flex items-center gap-4">
                      {col.image_url && (
                        <img src={col.image_url} alt={col.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      )}
                      <div>
                        <h4 className={`text-lg font-bold ${styles.text}`}>{col.name}</h4>
                        <div className={`flex items-center gap-4 mt-1 text-sm ${styles.accent}`}>
                          <span className="flex items-center gap-1"><Calendar size={14} /> {col.event_date || "No date"}</span>
                          <span>{col.description}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditCollection(col)}
                        className={`p-3 rounded-full transition-all ${styles.secondary} hover:bg-black hover:text-white`}
                        title="Edit Collection"
                      >
                        <Settings size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCollection(col.id)}
                        className="p-3 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-full transition-all"
                        title="Delete Collection"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "clients" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className={`p-8 rounded-3xl border sticky top-12 ${styles.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-indigo-500" /> {editingClient ? 'Edit Client Account' : 'New Client Account'}
                </h3>
                <form onSubmit={handleAddClient} className="space-y-6">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={newClient.full_name}
                      onChange={e => setNewClient({...newClient, full_name: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>ID / Proof Image URL</label>
                    <input 
                      type="url" 
                      value={newClient.id_image_url}
                      onChange={e => setNewClient({...newClient, id_image_url: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Company Name</label>
                      <input 
                        type="text" 
                        value={newClient.company_name}
                        onChange={e => setNewClient({...newClient, company_name: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Company Phone</label>
                      <input 
                        type="tel" 
                        value={newClient.company_phone}
                        onChange={e => setNewClient({...newClient, company_phone: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${styles.button}`}
                  >
                    {editingClient ? 'Update Client Account' : 'Save Client Account'}
                  </button>
                  {editingClient && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingClient(null);
                        setNewClient({
                          full_name: "", phone: "", id_image_url: "", company_name: "", company_phone: ""
                        });
                      }}
                      className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all mt-2"
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold">Saved Clients ({clients.length})</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black border ${styles.input}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clients
                      .filter(client => {
                        const s = (clientSearch || "").toLowerCase();
                        const fullName = (client.full_name || "").toLowerCase();
                        const phone = (client.phone || "").toLowerCase();
                        const companyName = (client.company_name || "").toLowerCase();
                        
                        return fullName.includes(s) || 
                               phone.includes(s) ||
                               companyName.includes(s);
                      })
                  .map(client => (
                  <div key={client.id} className={`p-6 rounded-3xl border group hover:border-black transition-all ${styles.card}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full overflow-hidden ${styles.secondary}`}>
                        {client.id_image_url ? (
                          <img src={client.id_image_url} alt={client.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400"><User size={20} /></div>
                        )}
                      </div>
                      <div>
                        <h4 className={`font-bold ${styles.text}`}>{client.full_name}</h4>
                        <p className={`text-sm ${styles.accent}`}>{client.phone}</p>
                      </div>
                    </div>
                    {client.company_name && (
                      <div className={`p-3 rounded-xl mb-4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${styles.muted}`}>Company</p>
                        <p className={`text-sm font-medium ${styles.text}`}>{client.company_name}</p>
                        {client.company_phone && <p className={`text-xs ${styles.accent}`}>{client.company_phone}</p>}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={() => handleEditClient(client)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${styles.secondary} hover:bg-black hover:text-white`}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClient(client.id)}
                        className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => {
                          const clientRentals = rentals.filter(r => r.client_id === client.id || r.client_name === client.full_name);
                          setViewingClientRentals(clientRentals);
                          setRentalMonthFilter(0);
                        }}
                        className="w-full py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all"
                      >
                        Show Rented Clothes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === "production" ? (
          <ProductionBoard 
            projects={projects}
            actors={actors}
            shots={shots}
            clothes={clothes}
            currentCompany={currentCompany}
            isAdmin={true}
            isViewOnly={false}
            setNotification={setNotification}
          />
        ) : (
          <div className="space-y-8">
            {editingRental && (
              <div className={`p-8 rounded-3xl border mb-8 ${styles.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Settings className={styles.text} /> Edit Rental Record
                </h3>
                <form onSubmit={handleUpdateRental} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Client</label>
                    <select 
                      value={editRentalForm.client_id || ""}
                      onChange={e => setEditRentalForm({...editRentalForm, client_id: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                    >
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Size</label>
                    <input 
                      type="text"
                      value={editRentalForm.size}
                      onChange={e => setEditRentalForm({...editRentalForm, size: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Color</label>
                    <input 
                      type="text"
                      value={editRentalForm.color}
                      onChange={e => setEditRentalForm({...editRentalForm, color: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.muted}`}>Status</label>
                    <select 
                      value={editRentalForm.status}
                      onChange={e => setEditRentalForm({...editRentalForm, status: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                    >
                      <option value="active">Active</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex gap-4">
                    <button 
                      type="submit"
                      className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${styles.button}`}
                    >
                      Update Rental
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingRental(null)}
                      className={`px-8 py-4 rounded-2xl font-bold transition-all ${styles.secondary}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold">Store Rentals</h3>
                <div className={`flex gap-2 p-1 rounded-xl w-fit ${styles.secondary}`}>
                  <button 
                    onClick={() => setRentalFilter("active")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${rentalFilter === "active" ? styles.button : `${styles.secondary} border-transparent`}`}
                  >
                    Active ({rentals.filter(r => r.status === 'active').length})
                  </button>
                  <button 
                    onClick={() => setRentalFilter("all")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${rentalFilter === "all" ? styles.button : `${styles.secondary} border-transparent`}`}
                  >
                    All History ({rentals.length})
                  </button>
                </div>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search client name/phone..."
                  value={rentalSearch}
                  onChange={e => setRentalSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl outline-none border ${styles.input}`}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {rentals
                .filter(r => rentalFilter === "all" || r.status === "active")
                .filter(r => {
                  const s = rentalSearch.toLowerCase();
                  return (r.client_full_name || r.client_name || "").toLowerCase().includes(s) || 
                         (r.client_phone_number || r.client_phone || "").includes(s) ||
                         r.clothing_name.toLowerCase().includes(s) ||
                         r.size.toLowerCase().includes(s) ||
                         r.color.toLowerCase().includes(s);
                })
                .map(rental => (
                <div key={rental.id} className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${styles.card} ${rental.status === 'returned' ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl overflow-hidden ${styles.secondary}`}>
                      <img src={rental.image_url} alt={rental.clothing_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{rental.client_full_name || rental.client_name}</h4>
                        {rental.status === 'returned' && (
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${styles.secondary}`}>Returned</span>
                        )}
                      </div>
                      <p className={`text-sm ${styles.accent}`}>{rental.client_phone_number || rental.client_phone}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 px-0 md:px-8">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${styles.muted}`}>Item</p>
                      <p className="text-sm font-medium">{rental.clothing_name}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${styles.muted}`}>Size</p>
                      <p className="text-sm font-medium">{rental.size}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${styles.muted}`}>Color</p>
                      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full border ${styles.border}`} style={{backgroundColor: (rental.color || "").toLowerCase()}} />
                        <p className="text-sm font-medium">{rental.color}</p>
                      </div>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${styles.muted}`}>Date</p>
                      <p className="text-sm font-medium">{new Date(rental.rental_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {rental.status === 'active' && (
                      <button 
                        onClick={() => onReturn(rental.id)}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${styles.button}`}
                      >
                        <Check size={16} />
                        Return
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditRental(rental)}
                      className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${styles.secondary}`}
                      title="Edit Record"
                    >
                      <Settings size={16} />
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteRental(rental.id)}
                      className="flex-1 px-6 py-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {rentals.filter(r => rentalFilter === "all" || r.status === "active").length === 0 && (
                <div className={`text-center py-12 rounded-3xl border border-dashed font-medium ${styles.card} ${styles.accent}`}>
                  No {rentalFilter === 'active' ? 'active' : ''} rentals found.
                </div>
              )}
            </div>
          </div>
        )}
        {viewingClientRentals && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] flex flex-col ${styles.modal}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${styles.text}`}>Rented Clothes</h3>
                  <p className={`text-sm ${styles.accent}`}>Total items: {
                    viewingClientRentals.filter(r => {
                      if (rentalMonthFilter === 0) return true;
                      const rentalDate = new Date(r.rental_date);
                      const now = new Date();
                      const diffMonths = (now.getFullYear() - rentalDate.getFullYear()) * 12 + (now.getMonth() - rentalDate.getMonth());
                      return diffMonths < rentalMonthFilter;
                    }).length
                  }</p>
                </div>
                <button onClick={() => setViewingClientRentals(null)} className={`p-2 rounded-full ${styles.secondary}`}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button 
                  onClick={() => setRentalMonthFilter(0)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${rentalMonthFilter === 0 ? styles.button : `${styles.secondary} border-transparent`}`}
                >
                  All Time
                </button>
                {[1, 2, 3, 6].map(m => (
                  <button 
                    key={m}
                    onClick={() => setRentalMonthFilter(m)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${rentalMonthFilter === m ? styles.button : `${styles.secondary} border-transparent`}`}
                  >
                    Last {m} {m === 1 ? 'Month' : 'Months'}
                  </button>
                ))}
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {viewingClientRentals
                  .filter(r => {
                    if (rentalMonthFilter === 0) return true;
                    const rentalDate = new Date(r.rental_date);
                    const now = new Date();
                    const diffMonths = (now.getFullYear() - rentalDate.getFullYear()) * 12 + (now.getMonth() - rentalDate.getMonth());
                    return diffMonths < rentalMonthFilter;
                  })
                  .map(rental => (
                    <div key={rental.id} className={`flex items-center gap-4 p-4 border rounded-2xl ${styles.border}`}>
                      <img src={rental.image_url} alt={rental.clothing_name} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold">{rental.clothing_name}</h4>
                        <p className="text-sm text-zinc-500">Size: {rental.size} | Color: {rental.color}</p>
                        <p className={`text-xs ${styles.muted}`}>Rented: {new Date(rental.rental_date).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rental.status === 'active' ? 'bg-emerald-100 text-emerald-600' : styles.secondary}`}>
                        {rental.status}
                      </div>
                    </div>
                  ))}
                {viewingClientRentals.filter(r => {
                  if (rentalMonthFilter === 0) return true;
                  const rentalDate = new Date(r.rental_date);
                  const now = new Date();
                  const diffMonths = (now.getFullYear() - rentalDate.getFullYear()) * 12 + (now.getMonth() - rentalDate.getMonth());
                  return diffMonths < rentalMonthFilter;
                }).length === 0 && (
                  <p className="text-center text-zinc-500 py-8">No rented clothes found for this period.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const Logo = ({ size = 80, withBackground = false, src }: { size?: number, withBackground?: boolean, src?: string }) => {
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const logoSrc = src || "https://i.ibb.co/Wp2BQvjv/Elegant-gold-monogram-with-rose-emblem.png";

  if (withBackground) {
    return (
      <div 
        className={`backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-2xl border ${styles.secondary} ${styles.border}`}
        style={{ width: size, height: size, padding: size * 0.1 }}
      >
        <img 
          src={logoSrc} 
          alt="Şan Closet Studio Logo" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  
  return (
    <img 
      src={logoSrc} 
      alt="Şan Closet Studio Logo" 
      width={size} 
      height={size} 
      className="object-contain"
      referrerPolicy="no-referrer"
    />
  );
};

const CompanyPortal = ({ onLogin }: { onLogin: (company: Company) => void }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Super Admin login check
    if (name === "Admin" && password === "Mhamad@18") {
      onLogin({ id: "super-admin", name: "Super Admin", slug: "super-admin", isSuperAdmin: true } as any);
      setIsSubmitting(false);
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Ensure the user is signed into Firebase Auth for security rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr: any) {
          console.error("Anonymous auth failed:", authErr);
        }
      }

      if (mode === 'login') {
        const q = query(collection(db, "companies"), where("name", "==", name));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setError('Company not found.');
        } else {
          const company = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Company;
          if (company.password === password) {
            onLogin(company);
          } else {
            setError('Incorrect password.');
          }
        }
      } else {
        // Setup new company
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const q = query(collection(db, "companies"), where("slug", "==", slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setError('Company name already taken.');
        } else {
          const newCompany = {
            name,
            slug,
            password,
            created_at: Timestamp.now()
          };
          const docRef = await addDoc(collection(db, "companies"), newCompany);
          onLogin({ id: docRef.id, ...newCompany });
        }
      }
    } catch (err: any) {
      console.error("Company Portal Error:", err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 ${styles.bg}`}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-full max-w-md p-10 rounded-[3rem] shadow-2xl border ${styles.modal} ${styles.border}`}
      >
        <div className="text-center mb-10">
          <Logo size={100} withBackground />
          <h2 className={`text-3xl font-black tracking-tighter mt-6 ${styles.text}`}>
            {mode === 'login' ? 'Company Login' : 'Setup Your Closet'}
          </h2>
          <p className={`mt-2 ${styles.accent}`}>
            {mode === 'login' ? 'Access your private wardrobe management.' : 'Create a new account for your company.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.text} opacity-70`}>Company Name</label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full py-4 px-6 rounded-2xl font-bold focus:outline-none focus:ring-2 transition-all border ${styles.input} ${theme === 'dark' ? 'focus:ring-white' : 'focus:ring-black'}`}
              placeholder="e.g. Şan Studio"
            />
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.text} opacity-70`}>Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full py-4 px-6 rounded-2xl font-bold focus:outline-none focus:ring-2 transition-all border ${styles.input} ${theme === 'dark' ? 'focus:ring-white' : 'focus:ring-black'}`}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 text-sm font-bold bg-rose-500/10 p-4 rounded-2xl">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${styles.button} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === 'login' ? 'Enter Closet' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'setup' : 'login')}
            className={`text-sm font-bold ${styles.accent} hover:underline`}
          >
            {mode === 'login' ? "Don't have an account? Setup now" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = THEMES[theme];
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allClothes, setAllClothes] = useState<ClothingItem[]>([]);
  const [allRentals, setAllRentals] = useState<Rental[]>([]);
  const [allActors, setAllActors] = useState<Actor[]>([]);
  const [allShots, setAllShots] = useState<Shot[]>([]);
  const [allVisits, setAllVisits] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [activeView, setActiveView] = useState<'closet' | 'production'>('production');
  const [projects, setProjects] = useState<Project[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [showAllRentals, setShowAllRentals] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionItems, setCollectionItems] = useState<ClothingItem[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [addToCollectionModal, setAddToCollectionModal] = useState<{show: boolean, clothingId: string | null}>({show: false, clothingId: null});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "rented">("all");

  // Rental Modal State
  const [rentalModal, setRentalModal] = useState<{
    show: boolean;
    clothingId: string | null;
    clothingName: string;
    sizes: string[];
    color: string;
  }>({
    show: false,
    clothingId: null,
    clothingName: "",
    sizes: [],
    color: ""
  });

  const [rentalForm, setRentalForm] = useState({
    client_id: null as string | null,
    client_name: "", // Fallback for legacy
    client_phone: "", // Fallback for legacy
    size: "",
    color: ""
  });

  const [clientSearch, setClientSearch] = useState("");
  
  useEffect(() => {
    const savedSuper = localStorage.getItem('isSuperAdmin');
    if (savedSuper === 'true') {
      setIsSuperAdmin(true);
    }
    const lastLogin = localStorage.getItem('adminLoginTime');
    // Extend session to 2 hours
    if (lastLogin && Date.now() - parseInt(lastLogin) < 120 * 60 * 1000) {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === "miranluqman60@gmail.com") {
        setIsAdmin(true);
      }
      // Don't set isAdmin(false) here, as it might have been set by password login
    });
    return () => unsubAuth();
  }, []);

  const [isViewOnly, setIsViewOnly] = useState(false);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const companySlug = params.get('company') || params.get('view');
    
    const checkCompany = async () => {
      setIsCompanyLoading(true);
      try {
        // Ensure anonymous sign-in for security rules
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (authErr: any) {
            console.error("Anonymous auth failed:", authErr);
          }
        }

        if (companySlug) {
          // Try slug first
          const q = query(collection(db, "companies"), where("slug", "==", companySlug));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const companyData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Company;
            setCurrentCompany(companyData);
            setIsViewOnly(true);
            
            const searchParam = params.get('search');
            if (searchParam) {
              setSearchQuery(searchParam);
            }
          } else {
            // Try ID as fallback
            try {
              const docRef = doc(db, "companies", companySlug);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const companyData = { id: docSnap.id, ...docSnap.data() } as Company;
                setCurrentCompany(companyData);
                setIsViewOnly(true);
                
                const searchParam = params.get('search');
                if (searchParam) {
                  setSearchQuery(searchParam);
                }
              }
            } catch (e) {
              // Not a valid ID
            }
          }
        } else {
          const savedCompanyId = localStorage.getItem('companyId');
          if (savedCompanyId) {
            const docRef = doc(db, "companies", savedCompanyId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setCurrentCompany({ id: docSnap.id, ...docSnap.data() } as Company);
            }
          }
        }
      } catch (err) {
        console.error("Error checking company:", err);
      } finally {
        setIsCompanyLoading(false);
      }
    };

    checkCompany();
  }, []);

  useEffect(() => {
    const trackVisit = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        
        const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
        const browser = navigator.userAgent.split(') ').pop()?.split(' ')[0] || 'Unknown';
        
        await addDoc(collection(db, "visits"), {
          timestamp: Timestamp.now(),
          device: deviceType,
          browser: browser,
          company_id: currentCompany?.id || 'anonymous',
          path: window.location.pathname
        });
      } catch (err) {
        console.error("Failed to track visit:", err);
      }
    };
    trackVisit();
  }, [currentCompany?.id]);

  useEffect(() => {
    if (!currentCompany || currentCompany.id === 'super-admin') return;

    const updateLastSeen = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        await updateDoc(doc(db, "companies", currentCompany.id), {
          last_seen: Timestamp.now(),
          is_online: true
        });
      } catch (err) {
        console.error("Failed to update last seen:", err);
      }
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000); // Every minute

    return () => {
      clearInterval(interval);
      updateDoc(doc(db, "companies", currentCompany.id), {
        is_online: false
      }).catch(console.error);
    };
  }, [currentCompany]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const unsubAllCompanies = onSnapshot(collection(db, "companies"), (snapshot) => {
      setAllCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    });

    const unsubAllProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      setAllProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    const unsubAllClothes = onSnapshot(collection(db, "clothes"), (snapshot) => {
      setAllClothes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem)));
    });

    const unsubAllRentals = onSnapshot(collection(db, "rentals"), (snapshot) => {
      setAllRentals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental)));
    });

    const unsubAllActors = onSnapshot(collection(db, "actors"), (snapshot) => {
      setAllActors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Actor)));
    });

    const unsubAllShots = onSnapshot(collection(db, "shots"), (snapshot) => {
      setAllShots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shot)));
    });

    const unsubAllVisits = onSnapshot(collection(db, "visits"), (snapshot) => {
      setAllVisits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAllCompanies();
      unsubAllProjects();
      unsubAllClothes();
      unsubAllRentals();
      unsubAllActors();
      unsubAllShots();
      unsubAllVisits();
    };
  }, [isSuperAdmin]);

  const handleCompanyLogin = async (company: Company) => {
    if (company.id === 'super-admin') {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        // Bootstrap admin status in Firestore
        await setDoc(doc(db, "admins", auth.currentUser!.uid), {
          pass: "Mhamad@18",
          created_at: Timestamp.now()
        });
        
        setIsSuperAdmin(true);
        localStorage.setItem('isSuperAdmin', 'true');
        setCurrentCompany(company);
      } catch (err) {
        console.error("Super Admin bootstrap failed:", err);
        setNotification({ message: "Failed to verify admin status", type: "error" });
      }
      return;
    }
    
    // Track session start and device
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
      
      await updateDoc(doc(db, "companies", company.id), {
        session_start: Timestamp.now(),
        is_online: true,
        last_device: isMobile ? 'Mobile' : 'Desktop',
        last_browser: navigator.userAgent.split(') ').pop()?.split(' ')[0] || 'Unknown'
      });
    } catch (err) {
      console.error("Failed to set session start:", err);
    }

    setCurrentCompany(company);
    localStorage.setItem('companyId', company.id);
  };

  const handleLogout = () => {
    setCurrentCompany(null);
    setIsSuperAdmin(false);
    localStorage.removeItem('companyId');
    localStorage.removeItem('isSuperAdmin');
  };

  useEffect(() => {
    if (isCompanyLoading || !currentCompany || isSuperAdmin) return;

    let clothesQuery = query(
      collection(db, "clothes"), 
      where("company_id", "==", currentCompany.id)
    );

    const unsubClothes = onSnapshot(
      clothesQuery, 
      (snapshot) => {
        const fetchedClothes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem));
        // Sort locally to ensure items without created_at still appear
        fetchedClothes.sort((a, b) => {
          const dateA = a.created_at?.toMillis?.() || a.created_at || 0;
          const dateB = b.created_at?.toMillis?.() || b.created_at || 0;
          return dateB - dateA;
        });
        setClothes(fetchedClothes);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.GET, "clothes");
      }
    );

    let collectionsQuery = query(
      collection(db, "collections"),
      where("company_id", "==", currentCompany.id)
    );

    const unsubCollections = onSnapshot(
      collectionsQuery, 
      (snapshot) => {
        setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection)));
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.GET, "collections");
      }
    );

    const unsubProjects = onSnapshot(
      query(collection(db, "projects"), where("company_id", "==", currentCompany.id)),
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        fetched.sort((a,b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
        setProjects(fetched);
      },
      (error) => console.error("Error projects:", error)
    );

    // For actors and shots, we might want to fetch them on demand or if we're in production view
    // For now let's fetch all actors for simplicity if the list is small
    const unsubActors = onSnapshot(
      query(collection(db, "actors"), where("company_id", "==", currentCompany.id)),
      (snapshot) => setActors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Actor))),
      (error) => console.error("Error actors:", error)
    );

    const unsubShots = onSnapshot(
      query(collection(db, "shots"), where("company_id", "==", currentCompany.id)),
      (snapshot) => setShots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shot))),
      (error) => console.error("Error shots:", error)
    );

    let unsubRentals = () => {};
    let unsubClients = () => {};

    if (isAdmin && !isViewOnly) {
      unsubRentals = onSnapshot(
        query(
          collection(db, "rentals"), 
          where("company_id", "==", currentCompany.id)
        ), 
        (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental));
          fetched.sort((a,b) => (b.rental_date?.toMillis?.() || 0) - (a.rental_date?.toMillis?.() || 0));
          setRentals(fetched);
        }, 
        (error) => {
          handleFirestoreError(error, OperationType.GET, "rentals");
        }
      );

      unsubClients = onSnapshot(
        query(
          collection(db, "clients"), 
          where("company_id", "==", currentCompany.id),
          orderBy("full_name", "asc")
        ), 
        (snapshot) => {
          setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        }, 
        (error) => {
          handleFirestoreError(error, OperationType.GET, "clients");
        }
      );
    } else {
      setRentals([]);
      setClients([]);
    }

    return () => {
      unsubClothes();
      unsubCollections();
      unsubRentals();
      unsubClients();
      unsubProjects();
      unsubActors();
      unsubShots();
    };
  }, [currentCompany, isAdmin, isViewOnly, isCompanyLoading, currentUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [activeFooterModal, setActiveFooterModal] = useState<'privacy' | 'terms' | 'support' | 'about' | null>(null);

  const seedSampleData = async () => {
    setIsSubmitting(true);
    try {
      const samples = [
        {
          name: "Midnight Silk Gown",
          type: "Dress",
          model: "Evening",
          sizes: ["S", "M", "L"],
          color: "Black",
          age_group: "Adults",
          weather: "All Weather",
          section: "A",
          image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800",
          created_at: Timestamp.now()
        },
        {
          name: "Floral Garden Dress",
          type: "Dress",
          model: "Casual",
          sizes: ["XS", "S", "M"],
          color: "Floral",
          age_group: "Teens",
          weather: "Summer",
          section: "B",
          image_url: "https://images.unsplash.com/photo-1572804013307-a9a111d72f8b?auto=format&fit=crop&q=80&w=800",
          created_at: Timestamp.now()
        },
        {
          name: "Classic White Wedding",
          type: "Dress",
          model: "Bridal",
          sizes: ["M", "L"],
          color: "White",
          age_group: "Adults",
          weather: "All Weather",
          section: "C",
          image_url: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=800",
          created_at: Timestamp.now()
        },
        {
          name: "Scarlet Cocktail Dress",
          type: "Dress",
          model: "Party",
          sizes: ["S", "M"],
          color: "Red",
          age_group: "Adults",
          weather: "All Weather",
          section: "A",
          image_url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800",
          created_at: Timestamp.now()
        }
      ];

      for (const item of samples) {
        await addDoc(collection(db, "clothes"), { ...item, company_id: currentCompany?.id });
      }
      setNotification({ message: "Sample data added successfully!", type: "success" });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "clothes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState<{show: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const getAvailableSizes = (clothingId: string, color: string) => {
    const item = clothes.find(c => c.id === clothingId);
    if (!item) return [];
    return item.sizes.filter(size => {
      const isRented = rentals.some(r => r.clothing_id === clothingId && r.status === 'active' && r.color === color && r.size === size);
      return !isRented;
    });
  };

  const handleRentClick = (item: ClothingItem) => {
    // Find first available size
    let initialColor = item.color;
    let initialSize = item.sizes[0];
    let found = false;

    for (const s of item.sizes) {
      const isRented = rentals.some(r => r.clothing_id === item.id && r.status === 'active' && r.color === initialColor && r.size === s);
      if (!isRented) {
        initialSize = s;
        found = true;
        break;
      }
    }

    setRentalModal({
      show: true,
      clothingId: item.id,
      clothingName: item.name,
      sizes: item.sizes,
      color: item.color
    });
    setRentalForm({
      client_id: null,
      client_name: "",
      client_phone: "",
      size: initialSize,
      color: initialColor
    });
    setClientSearch("");
  };

  const handleCollectionClick = async (col: Collection) => {
    try {
      if (!col.itemIds || col.itemIds.length === 0) {
        setCollectionItems([]);
      } else {
        const items = clothes.filter(c => col.itemIds?.includes(c.id));
        setCollectionItems(items);
      }
      setSelectedCollection(col.id);
      setShowCollectionModal(true);
    } catch (err) {
      setNotification({ message: "Failed to load collection items.", type: "error" });
    }
  };

  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalForm.client_id) {
      setNotification({ message: "Please select a client account first", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const client = clients.find(c => c.id === rentalForm.client_id);
      await addDoc(collection(db, "rentals"), {
        company_id: currentCompany?.id,
        clothing_id: rentalModal.clothingId,
        clothing_name: rentalModal.clothingName,
        client_id: rentalForm.client_id,
        client_name: client?.full_name || "",
        client_phone: client?.phone || "",
        size: rentalForm.size,
        color: rentalForm.color,
        rental_date: Timestamp.now(),
        status: "active",
        image_url: clothes.find(c => c.id === rentalModal.clothingId)?.image_url || ""
      });
      setNotification({ message: "Item rented successfully!", type: "success" });
      setRentalModal({ ...rentalModal, show: false });
    } catch (err: any) {
      setNotification({ message: err.message || "Failed to rent item.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (rental_id: string) => {
    setConfirmModal({
      show: true,
      title: "Return Item",
      message: "Are you sure you want to return this item?",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsSubmitting(true);
        try {
          await updateDoc(doc(db, "rentals", rental_id), {
            status: "returned",
            returned_at: Timestamp.now()
          });
          setNotification({ message: "Item returned successfully!", type: "success" });
        } catch (err) {
          setNotification({ message: "Failed to return item.", type: "error" });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleDeleteRental = async (rental_id: string) => {
    setConfirmModal({
      show: true,
      title: "Delete Record",
      message: "Are you sure you want to delete this rental record? This cannot be undone.",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsSubmitting(true);
        try {
          await deleteDoc(doc(db, "rentals", rental_id));
          setNotification({ message: "Rental record deleted successfully!", type: "success" });
        } catch (err) {
          setNotification({ message: "Failed to delete rental record.", type: "error" });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      const trimmedPassword = password.trim();
      
      if (currentCompany && currentCompany.password === trimmedPassword) {
        setIsAdmin(true);
        setShowAdminPanel(true);
        localStorage.setItem('adminLoginTime', Date.now().toString());
        setNotification({ message: t("Login successful!"), type: "success" });
        setShowLogin(false);
        setPassword("");
      } else if (!currentCompany) {
        // Fallback for super admin if needed
        const targetId = 'default_admin';
        const docRef = doc(db, "company_secrets", targetId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().password === trimmedPassword) {
          setIsAdmin(true);
          setShowAdminPanel(true);
          localStorage.setItem('adminLoginTime', Date.now().toString());
          setNotification({ message: t("Login successful!"), type: "success" });
          setShowLogin(false);
          setPassword("");
        } else {
          setNotification({ message: t("Invalid password."), type: "error" });
        }
      } else {
        setNotification({ message: t("Invalid password."), type: "error" });
      }
    } catch (err) {
      console.error("Login error:", err);
      setNotification({ message: t("Login failed."), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      setIsAdmin(false);
      localStorage.removeItem('adminLoginTime');
      setShowAdminPanel(false);
      setNotification({ message: "Logged out successfully!", type: "success" });
    } catch (err) {
      setNotification({ message: "Logout failed.", type: "error" });
    }
  };

  const handleCompanyLogout = () => {
    localStorage.removeItem('companyId');
    setCurrentCompany(null);
    setIsAdmin(false);
  };

  const filteredClothes = clothes.filter(item => {
    const activeRentals = rentals.filter(r => r.clothing_id === item.id && r.status === 'active');
    const totalCombinations = item.sizes.length;
    const isFullyRented = activeRentals.length >= totalCombinations;

    // Availability filter
    if (availabilityFilter === "available" && isFullyRented) return false;
    if (availabilityFilter === "rented" && !isFullyRented) return false;

    if (!isAdmin && isFullyRented) {
      return false; // Hide fully rented items from non-admins
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchLower) || 
                          item.type.toLowerCase().includes(searchLower) ||
                          item.sizes.some(s => s.toLowerCase().includes(searchLower)) ||
                          item.color.toLowerCase().includes(searchLower);
    const matchesFilter = filterType === "All" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleGlobalDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project globally?")) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      setNotification({ message: "Project deleted globally", type: "success" });
    } catch (err) {
      setNotification({ message: "Failed to delete project", type: "error" });
    }
  };

  const handleGlobalDeleteCompany = async (companyId: string) => {
    if (companyId === 'super-admin') return;
    if (!confirm("Are you sure you want to delete this company and all its data? This is IRREVERSIBLE.")) return;
    try {
      await deleteDoc(doc(db, "companies", companyId));
      setNotification({ message: "Company deleted successfully", type: "success" });
    } catch (err) {
      setNotification({ message: "Failed to delete company", type: "error" });
    }
  };

  if (isCompanyLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${styles.bg}`}>
        <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentCompany) {
    return <CompanyPortal onLogin={handleCompanyLogin} />;
  }

  if (isSuperAdmin) {
    return (
      <div dir="auto" className={`min-h-screen font-sans selection:bg-black selection:text-white transition-colors duration-300 ${styles.bg} ${styles.text}`}>
        <Navbar 
          isAdmin={true} 
          isSuperAdmin={true}
          currentCompany={currentCompany}
          isViewOnly={false}
          onLogout={handleLogout}
          onOpenAdmin={() => {}}
          t={t}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
          <SuperAdminPanel 
            companies={allCompanies} 
            projects={allProjects} 
            clothes={allClothes} 
            rentals={allRentals}
            actors={allActors}
            shots={allShots}
            visits={allVisits}
            onDeleteProject={handleGlobalDeleteProject}
            onDeleteCompany={handleGlobalDeleteCompany}
            t={t}
            styles={styles}
            renderProductionBoard={() => (
              <ProductionBoard 
                projects={allProjects}
                actors={allActors}
                shots={allShots}
                clothes={allClothes}
                currentCompany={null}
                companies={allCompanies}
                isAdmin={true}
                isViewOnly={false}
                setNotification={setNotification}
              />
            )}
          />
        </main>
      </div>
    );
  }

  return (
    <div dir="auto" className={`min-h-screen font-sans selection:bg-black selection:text-white transition-colors duration-300 ${styles.bg} ${styles.text}`}>
      <Navbar 
        isAdmin={isAdmin} 
        currentCompany={currentCompany}
        isViewOnly={isViewOnly}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          setIsAdmin(false);
          setShowLogin(true);
        }}
        t={t}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {activeView === 'production' ? (
          <ProductionBoard 
            projects={projects}
            actors={actors}
            shots={shots}
            clothes={clothes}
            currentCompany={currentCompany}
            isAdmin={isAdmin}
            isViewOnly={isViewOnly}
            setNotification={setNotification}
          />
        ) : (
          <>
            {/* Hero Section */}
        <section className="mb-20 text-center">
          <div className="flex justify-center mb-6">
            <Logo size={280} withBackground src={currentCompany?.logo_url} />
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter mb-6"
          >
            {(currentCompany?.name || 'Şan Closet Studio').split(' ').slice(0, 2).join(' ')} <span className={styles.accent}>{(currentCompany?.name || 'Şan Closet Studio').split(' ').slice(2).join(' ') || t('Closet')}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-xl max-w-2xl mx-auto ${styles.accent}`}
          >
            {currentCompany?.name || 'Şan Closet Studio'}: {t('Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.')}
          </motion.p>
          
          {isAdmin && !isViewOnly && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => {
                  const shareUrl = `${window.location.origin}${window.location.pathname}?view=${currentCompany?.slug || 'default'}`;
                  navigator.clipboard.writeText(shareUrl);
                  setNotification({ message: "Share link copied to clipboard!", type: "success" });
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${styles.secondary}`}
              >
                <Plus size={18} />
                Share View-Only Link
              </button>
            </div>
          )}
        </section>

        {/* Collections Horizontal Scroll */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">TVC Wardrobe History</h3>
              <p className={styles.accent}>Clothing sets used in completed TV commercial projects.</p>
            </div>
            <button className={`text-sm font-bold uppercase tracking-widest transition-colors ${styles.muted} hover:opacity-80`}>
              View All
            </button>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
            {collections.length === 0 ? (
              <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-center justify-center font-medium ${styles.border} ${styles.muted}`}>
                No collections created yet.
              </div>
            ) : (
              collections.map(col => (
                <motion.div 
                  key={col.id}
                  whileHover={{ y: -5 }}
                  onClick={() => handleCollectionClick(col)}
                  className={`min-w-[300px] md:min-w-[400px] p-8 rounded-[2rem] border snap-start cursor-pointer hover:shadow-xl transition-all ${styles.card}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.secondary}`}>
                      <Calendar className="text-zinc-900" size={24} />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const shareUrl = `${window.location.origin}${window.location.pathname}?view=${currentCompany?.slug}&search=${encodeURIComponent(col.name)}`;
                        navigator.clipboard.writeText(shareUrl);
                        setNotification({ message: "Collection link copied!", type: "success" });
                      }}
                      className={`p-2 rounded-full transition-all bg-zinc-200 text-zinc-900 hover:scale-110`}
                      title="Share Collection"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                  <h4 className="text-2xl font-bold mb-2">{col.name}</h4>
                  <p className={`mb-6 line-clamp-2 ${styles.accent}`}>{col.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black uppercase tracking-widest ${styles.muted}`}>
                      {col.event_date || "Upcoming"}
                    </span>
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className={`w-10 h-10 rounded-full border-2 border-white overflow-hidden ${styles.secondary}`}>
                          <img src={`https://picsum.photos/seed/${col.id + i}/100/100`} alt="preview" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* My Rentals Section */}
        {rentals.filter(r => r.status === 'active').length > 0 && (
          <section className="mb-20">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{t('My Active Rentals')}</h3>
                <p className={styles.accent}>{t('Items you currently have rented.')}</p>
              </div>
              {rentals.filter(r => r.status === 'active').length > 3 && (
                <button 
                  onClick={() => setShowAllRentals(!showAllRentals)}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors ${styles.muted} hover:opacity-80`}
                >
                  {showAllRentals ? t('Show Less') : t('See More')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(showAllRentals ? rentals.filter(r => r.status === 'active') : rentals.filter(r => r.status === 'active').slice(0, 3)).map(rental => (
                <motion.div 
                  key={rental.id}
                  layout
                  className={`p-4 rounded-3xl border flex items-center gap-4 ${styles.card}`}
                >
                  <div className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 ${styles.secondary}`}>
                    <img src={rental.image_url} alt={rental.clothing_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-900 truncate">{rental.clothing_name}</h4>
                    <p className="text-xs text-zinc-500">{t('Rented on ')}{new Date(rental.rental_date).toLocaleDateString()}</p>
                    <button 
                      onClick={() => handleReturn(rental.id)}
                      className="mt-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> {t('Return Item')}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Inventory Section */}
        <section>
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 py-6 transition-all ${styles.bg} border-b -mx-6 px-6`}>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">{t('Wardrobe Inventory')}</h3>
              <p className={styles.accent}>{t('Browse and filter your entire clothing collection.')}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${styles.muted}`} size={18} />
                <input 
                  type="text" 
                  placeholder={t('Search by name, type, size, or color...')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all border ${styles.input}`}
                />
              </div>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${styles.input}`}>
                <Filter size={18} className={styles.muted} />
                <select 
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-transparent outline-none font-medium text-sm"
                >
                  <option value="All">All Types</option>
                  {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${styles.input}`}>
                <Check size={18} className={styles.muted} />
                <select 
                  value={availabilityFilter}
                  onChange={e => setAvailabilityFilter(e.target.value as any)}
                  className="bg-transparent outline-none font-medium text-sm"
                >
                  <option value="all">Any Status</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
            </div>
          </div>

          {filteredClothes.length === 0 ? (
            <div className={`text-center py-24 rounded-[3rem] border ${styles.card}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${styles.secondary}`}>
                <Search size={32} className={styles.muted} />
              </div>
              <h4 className={`text-xl font-bold ${styles.text}`}>No items found</h4>
              <p className={`mt-2 ${styles.accent}`}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredClothes.map(item => (
                  <ClothingCard 
                    key={item.id} 
                    item={item} 
                    isViewOnly={isViewOnly}
                    companySlug={currentCompany?.slug}
                    setNotification={setNotification}
                    onRent={() => handleRentClick(item)}
                    activeRentals={rentals.filter(r => r.clothing_id === item.id && r.status === 'active')}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
          </>
        )}
      </main>

      {/* Rental Modal */}
      <AnimatePresence>
        {rentalModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl ${styles.modal}`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Rent Item</h2>
                  <p className={`mt-2 ${styles.accent}`}>Renting: <span className={`font-bold ${styles.text}`}>{rentalModal.clothingName}</span></p>
                </div>
                <button onClick={() => setRentalModal({ ...rentalModal, show: false })} className={`p-2 rounded-full transition-all ${styles.secondary}`}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRentSubmit} className="space-y-6">
                <div className={`p-6 rounded-3xl border ${styles.card}`}>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-4 ${styles.muted}`}>Select Client Account</label>
                  
                  <div className="relative mb-4">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${styles.muted}`} size={16} />
                    <input 
                      type="text" 
                      placeholder="Search saved clients..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all border ${styles.input}`}
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {clients
                      .filter(c => 
                        (c.full_name || "").toLowerCase().includes((clientSearch || "").toLowerCase()) || 
                        (c.phone || "").includes(clientSearch || "")
                      )
                      .map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setRentalForm({ ...rentalForm, client_id: client.id, client_name: client.full_name, client_phone: client.phone })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          rentalForm.client_id === client.id 
                            ? styles.button 
                            : `${styles.secondary} border-transparent`
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rentalForm.client_id === client.id ? "bg-white/20" : "bg-zinc-100 text-zinc-400"}`}>
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{client.full_name}</p>
                          <p className={`text-xs ${rentalForm.client_id === client.id ? "text-white/60" : styles.accent}`}>{client.phone}</p>
                        </div>
                        {rentalForm.client_id === client.id && <Check size={16} className="ml-auto" />}
                      </button>
                    ))}
                    {clients
                      .filter(c => 
                        (c.full_name || "").toLowerCase().includes((clientSearch || "").toLowerCase()) || 
                        (c.phone || "").includes(clientSearch || "")
                      ).length === 0 && (
                      <div className={`text-center py-8 rounded-2xl border-2 border-dashed ${styles.muted} border-zinc-200/50`}>
                        <User className="mx-auto mb-2 opacity-20" size={24} />
                        <p className="text-xs font-medium">No clients found matching your search.</p>
                        <p className="text-[10px] mt-1 opacity-60">Add clients in the Admin Panel if they are missing.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Select Size</label>
                    <select 
                      value={rentalForm.size}
                      onChange={e => {
                        setRentalForm({ ...rentalForm, size: e.target.value });
                      }}
                      className={`w-full px-4 py-3 rounded-xl outline-none border ${styles.input}`}
                    >
                      {getAvailableSizes(rentalModal.clothingId!, rentalForm.color).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${styles.button} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Confirm Rental
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Collection Modal */}
      <AnimatePresence>
        {addToCollectionModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl ${styles.modal}`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Add to Collection</h2>
                  <p className={`mt-2 ${styles.accent}`}>Select a collection to add this item to.</p>
                </div>
                <button onClick={() => setAddToCollectionModal({ show: false, clothingId: null })} className={`p-2 rounded-full transition-all ${styles.secondary}`}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {collections.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    No collections available. Create one in the admin panel first.
                  </div>
                ) : (
                  collections.map(col => (
                    <button
                      key={col.id}
                      onClick={async () => {
                        try {
                          const currentIds = col.itemIds || [];
                          if (currentIds.includes(addToCollectionModal.clothingId!)) {
                            setNotification({ message: "Item already in this collection", type: "error" });
                            return;
                          }
                          await updateDoc(doc(db, "collections", col.id), {
                            itemIds: arrayUnion(addToCollectionModal.clothingId)
                          });
                          setNotification({ message: "Added to collection!", type: "success" });
                          setAddToCollectionModal({ show: false, clothingId: null });
                        } catch (err: any) {
                          setNotification({ message: err.message || "Failed to add to collection.", type: "error" });
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all group ${styles.card} hover:border-black hover:shadow-md`}
                    >
                      <h4 className="font-bold text-lg group-hover:text-black">{col.name}</h4>
                      <p className="text-zinc-500 text-sm line-clamp-1">{col.description}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collection Modal */}
      <AnimatePresence>
        {showCollectionModal && selectedCollection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowCollectionModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-10 shadow-2xl ${styles.modal}`}
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className={`text-4xl font-black tracking-tighter ${styles.text}`}>
                    {collections.find(c => c.id === selectedCollection)?.name}
                  </h2>
                  <p className={`mt-2 text-lg ${styles.accent}`}>
                    {collections.find(c => c.id === selectedCollection)?.description}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCollectionModal(false)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${styles.secondary}`}
                >
                  <X size={24} />
                </button>
              </div>

              {collectionItems.length === 0 ? (
                <div className={`py-20 text-center border-2 border-dashed rounded-3xl ${styles.border}`}>
                  <p className={`text-lg ${styles.accent}`}>This collection is currently empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collectionItems.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ y: -5 }}
                      className={`rounded-[2rem] border overflow-hidden group hover:shadow-xl transition-all ${styles.card}`}
                    >
                      <div className={`aspect-[4/5] relative overflow-hidden ${styles.secondary}`}>
                        <img 
                          src={item.image_url || `https://picsum.photos/seed/${item.id}/400/500`} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute top-4 right-4 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${styles.secondary}`}>
                          {item.type}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold">{item.name}</h3>
                        </div>
                        <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{item.model}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {item.sizes.map(size => (
                            <span key={size} className={`px-2 py-1 rounded-md text-xs font-medium ${styles.secondary}`}>
                              {size}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => {
                              setShowCollectionModal(false);
                              handleRentClick(item);
                            }}
                            className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors ${styles.button}`}
                          >
                            Rent Now
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "collections", selectedCollection), {
                                    itemIds: arrayRemove(item.id)
                                  });
                                  setCollectionItems(collectionItems.filter(i => i.id !== item.id));
                                  setNotification({ message: "Item removed from collection.", type: "success" });
                                } catch (err) {
                                  setNotification({ message: "Failed to remove item.", type: "error" });
                                }
                              }}
                              className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-red-100 transition-colors"
                            >
                              Remove from Collection
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl ${styles.modal} ${styles.text}`}
            >
              <div className="text-center mb-8">
                <div className="mb-6 flex justify-center">
                  <Logo size={64} />
                </div>
                <h2 className={`text-3xl font-black tracking-tighter ${styles.text}`}>{t('Admin Access')}</h2>
                <p className={`mt-2 ${styles.accent}`}>{t('Enter admin password to manage the dressing room.')}</p>
              </div>
              
              <div className="space-y-6">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`w-full py-4 px-6 rounded-2xl font-bold focus:outline-none focus:ring-2 transition-all border ${styles.input} ${theme === 'dark' ? 'focus:ring-white' : 'focus:ring-black'}`}
                />
                <button 
                  onClick={handleLogin}
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${styles.button} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Login"
                  )}
                </button>
                <button 
                  onClick={() => setShowLogin(false)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${styles.secondary}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'
            }`}
          >
            {notification.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <p className="font-bold text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal?.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border ${styles.modal} ${styles.border}`}
            >
              <h3 className={`text-2xl font-black tracking-tight mb-2 ${styles.text}`}>{confirmModal.title}</h3>
              <p className={`mb-8 ${styles.accent}`}>{confirmModal.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${styles.secondary}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${styles.button}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Overlay */}
      <AnimatePresence>
        {showAdminPanel && isAdmin && (
          <AdminPanel 
            onClose={() => {
              setShowAdminPanel(false);
              setIsAdmin(false);
            }} 
            rentals={rentals}
            clothes={clothes}
            collections={collections}
            clients={clients}
            projects={projects}
            actors={actors}
            shots={shots}
            onReturn={handleReturn}
            onDeleteRental={handleDeleteRental}
            setNotification={setNotification}
            setConfirmModal={setConfirmModal}
            setAddToCollectionModal={setAddToCollectionModal}
            seedSampleData={seedSampleData}
            isSubmitting={isSubmitting}
            currentCompany={currentCompany}
            isViewOnly={isViewOnly}
          />
        )}
      </AnimatePresence>

      {/* Footer Modals */}
      <AnimatePresence>
        {activeFooterModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6`}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] p-10 shadow-2xl ${styles.modal}`}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                  {activeFooterModal === 'privacy' && 'Privacy Policy'}
                  {activeFooterModal === 'terms' && 'Terms of Service'}
                  {(activeFooterModal === 'support' || activeFooterModal === 'about') && 'About & Support'}
                </h3>
                <button 
                  onClick={() => setActiveFooterModal(null)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all hover:bg-black hover:text-white ${styles.secondary}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 text-sm md:text-base leading-relaxed">
                {activeFooterModal === 'privacy' && (
                  <>
                    <p className="font-bold text-lg mb-2">User Privacy Data Protection</p>
                    <p>At Şan Closet Studio, securing your privacy is our priority. We collect data necessary to provide you with the functionality of the app, including authentication details, wardrobe and rental records, and project schedules.</p>
                    <p>All data is strongly protected via industry-standard authentication encryption and strict security rules, ensuring your data is isolated strictly to your company. We do not sell your personal data to third parties.</p>
                    <p>By using our services, you consent to our practices of maintaining secure cloud records to facilitate your film and TV wardrobe management needs seamlessly.</p>
                  </>
                )}

                {activeFooterModal === 'terms' && (
                  <>
                    <p className="font-bold text-lg mb-2">Terms of Use</p>
                    <p>By accessing Şan Closet Studio, you agree to bound by these terms. Our software is provided "as is" to facilitate wardrobe planning.</p>
                    <p>You agree not to misuse the platform or attempt to bypass security measures. We reserve the right to suspend accounts conducting fraudulent rentals or malicious activities.</p>
                  </>
                )}

                {(activeFooterModal === 'support' || activeFooterModal === 'about') && (
                  <>
                    <div className="p-6 rounded-2xl border bg-black/5 dark:bg-white/5 space-y-4">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                          ML
                        </div>
                        <div>
                          <p className="text-xl font-bold">Miran Luqman Ibrahim</p>
                          <p className="opacity-60 text-sm font-medium uppercase tracking-widest">Founder & Lead Developer</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 font-medium">
                        <p><span className="opacity-50">Owner of:</span> Şan Closet Studio</p>
                        <p><span className="opacity-50">Creation Date:</span> 16/01/2026</p>
                        <p><span className="opacity-50">Facebook:</span> <a href="https://www.facebook.com/share/1YsTVZ6VHV/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">Miran Luqman Facebook</a></p>
                      </div>

                      <div className="mt-6 pt-6 border-t opacity-80 italic">
                        "I created this website by my own hand, and I own the Şan Closet Studio. I am a Developer with a passion to create websites and mobile applications."
                      </div>
                    </div>

                    <p className="text-center pt-4 opacity-50 font-medium">For further support, please reach out via the provided social links.</p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`border-t py-12 px-6 ${styles.border}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className={`font-bold tracking-tight ${styles.text}`}>Şan Closet Studio</span>
          </div>
          <LanguageSwitcher />
          <p className={`text-sm ${styles.muted}`}>© 2026 Şan Closet Studio. All rights reserved.</p>
          <div className={`flex gap-6 text-sm font-medium ${styles.muted}`}>
            <button onClick={() => setActiveFooterModal('privacy')} className={`transition-colors hover:opacity-80`}>Privacy</button>
            <button onClick={() => setActiveFooterModal('terms')} className={`transition-colors hover:opacity-80`}>Terms</button>
            <button onClick={() => setActiveFooterModal('support')} className={`transition-colors hover:opacity-80`}>Support & Company</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
