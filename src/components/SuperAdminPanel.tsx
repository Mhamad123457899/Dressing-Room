import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  Activity, 
  ExternalLink, 
  Search, 
  Filter, 
  MoreVertical,
  Trash2,
  Eye,
  Clock,
  MapPin,
  Phone,
  User as UserIcon,
  ShoppingBag,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  X,
  Calendar,
  Cloud,
  FileText,
  Maximize2,
  ChevronRight,
  Layers,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { doc, deleteDoc, addDoc, collection, Timestamp, arrayUnion, updateDoc } from 'firebase/firestore';

interface SuperAdminPanelProps {
  companies: any[];
  projects: any[];
  clothes: any[];
  rentals: any[];
  actors?: any[];
  shots?: any[];
  visits: any[];
  onDeleteProject: (id: string) => void;
  onDeleteCompany: (id: string) => void;
  t: any;
  styles: any;
  renderProductionBoard?: () => React.ReactNode;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ 
  companies, 
  projects, 
  clothes, 
  rentals,
  actors = [],
  shots = [],
  visits,
  onDeleteProject,
  onDeleteCompany,
  t,
  styles,
  renderProductionBoard
}) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'production_board' | 'clothes' | 'rentals'>('companies');
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedActorName, setSelectedActorName] = useState<string | null>(null);
  const [fullscreenClothingId, setFullscreenClothingId] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddActor, setShowAddActor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    user_name: '',
    user_phone: '',
    company_id: ''
  });
  const [newActor, setNewActor] = useState({
    name: '',
    phone: '',
    height: '',
    chest: '',
    waist: ''
  });

  const formatSessionTime = (startTime: any) => {
    if (!startTime) return 'N/A';
    try {
      const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
      const diffMs = Date.now() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    } catch (e) {
      return 'N/A';
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const companyClothes = clothes.filter(c => c.company_id === selectedCompanyId);
  const companyProjects = projects.filter(p => p.company_id === selectedCompanyId);
  const companyVisits = visits.filter(v => v.company_id === selectedCompanyId);
  const companyRentals = rentals.filter(r => r.company_id === selectedCompanyId);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectClothes = selectedProject ? clothes.filter(c => selectedProject.clothes_ids?.includes(c.id)) : [];
  const projectRentals = rentals.filter(r => r.project_id === selectedProjectId);
  const projectCompany = companies.find(c => c.id === selectedProject?.company_id);
  const projectActorsData = selectedProjectId ? actors.filter(a => a.project_id === selectedProjectId) : [];
  const projectShotsData = selectedProjectId ? shots.filter(s => s.project_id === selectedProjectId) : [];

  // Group project rentals by actor (user_name) - Fallback if actors collection is empty
  const derivedActorsFromRentals = projectRentals.reduce((acc: any, rental: any) => {
    const actorName = rental.user_name || 'Generic Actor';
    if (!acc[actorName]) {
      acc[actorName] = {
        name: actorName,
        rentals: [],
        clothesCount: 0
      };
    }
    acc[actorName].rentals.push(rental);
    acc[actorName].clothesCount++;
    return acc;
  }, {});

  const actorsList = projectActorsData.length > 0 
    ? projectActorsData.map(a => ({ 
        id: a.id, 
        name: a.name, 
        clothesCount: projectRentals.filter(r => r.actor_id === a.id).length || 0 
      }))
    : Object.values(derivedActorsFromRentals).map((a: any) => ({ ...a, id: a.name }));
    
  const selectedActor = selectedActorName ? (projectActorsData.find(a => a.name === selectedActorName) || { name: selectedActorName }) : null;
  const selectedActorRentals = selectedActorName 
    ? projectRentals.filter(r => (r.user_name || r.actor_name || 'Generic Actor') === selectedActorName || r.actor_id === selectedActor?.id) 
    : [];
  const selectedActorShots = selectedActor?.id ? projectShotsData.filter(s => s.actor_id === selectedActor.id) : [];

  useEffect(() => {
    if (selectedCompanyId || selectedProjectId || selectedActorName || fullscreenClothingId) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [selectedCompanyId, selectedProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.company_id) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        created_at: Timestamp.now(),
        clothes_ids: []
      });
      setShowAddProject(false);
      setNewProject({ name: '', description: '', user_name: '', user_phone: '', company_id: '' });
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateActor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActor.name || !selectedProjectId) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "actors"), {
        ...newActor,
        project_id: selectedProjectId,
        company_id: selectedProject?.company_id,
        created_at: Timestamp.now()
      });
      setShowAddActor(false);
      setNewActor({ name: '', phone: '', height: '', chest: '', waist: '' });
    } catch (err) {
      console.error("Failed to create actor:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGlobalDeleteClothing = async (clothingId: string) => {
    if (!confirm("Are you sure you want to delete this clothing item globally?")) return;
    try {
      await deleteDoc(doc(db, "clothes", clothingId));
    } catch (err) {
      console.error("Failed to delete clothing:", err);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClothes = clothes.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-32">
      {/* Dynamic Header with Live Stats */}
      <div className="relative overflow-hidden rounded-[3rem] p-10 bg-black text-white">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/10">
                Central Intelligence
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-tighter border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live System
              </span>
            </div>
            <h2 className="text-6xl font-black tracking-tighter leading-none mb-4 uppercase italic">
              Super <span className="text-zinc-500">Admin</span>
            </h2>
            <p className="text-zinc-400 font-medium max-w-md">Global control interface for the Dressing Room ecosystem. Monitor performance, manage accounts, and oversee productions.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
            {[
              { label: 'Growth', value: '+12%', icon: TrendingUp },
              { label: 'Uptime', value: '99.9%', icon: Activity },
              { label: 'Reach', value: 'Global', icon: Globe },
              { label: 'Nodes', value: companies.length, icon: Users },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-0 md:min-w-[120px]">
                <stat.icon size={16} className="text-zinc-500 mb-2" />
                <p className="text-xl font-black truncate">{stat.value}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase truncate">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent blur-3xl -z-0" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all hover:scale-[1.02] ${styles.card}`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${styles.secondary}`}>
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black py-1 px-3 bg-black/5 rounded-full">TRANSIT</span>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tighter mb-1 truncate">{companies.length}</p>
          <p className={`text-xs font-bold uppercase tracking-widest truncate ${styles.muted}`}>Total Partners</p>
        </div>
        <div className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all hover:scale-[1.02] ${styles.card}`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${styles.secondary}`}>
              <Activity size={24} />
            </div>
            <span className="text-[10px] font-black py-1 px-3 bg-green-500/10 text-green-500 rounded-full">ACTIVE</span>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tighter mb-1 truncate">{projects.length}</p>
          <p className={`text-xs font-bold uppercase tracking-widest truncate ${styles.muted}`}>Productions</p>
        </div>
        <div className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all hover:scale-[1.02] ${styles.card}`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${styles.secondary}`}>
              <Globe size={24} />
            </div>
            <span className="text-[10px] font-black py-1 px-3 bg-blue-500/10 text-blue-500 rounded-full">TRAFFIC</span>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tighter mb-1 truncate">{visits.length}</p>
          <p className={`text-xs font-bold uppercase tracking-widest truncate ${styles.muted}`}>System Visits</p>
        </div>
        <div className={`group p-6 sm:p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all hover:scale-[1.02] ${styles.card}`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${styles.secondary}`}>
              <ShoppingBag size={24} />
            </div>
            <span className="text-[10px] font-black py-1 px-3 bg-zinc-100 rounded-full">ASSETS</span>
          </div>
          <p className="text-3xl sm:text-4xl font-black tracking-tighter mb-1 truncate">{clothes.length}</p>
          <p className={`text-xs font-bold uppercase tracking-widest truncate ${styles.muted}`}>Total Items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className={`p-6 sm:p-8 rounded-[3rem] border-2 shadow-2xl backdrop-blur-xl ${styles.card} bg-opacity-80`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
              <Monitor size={14} /> Usage Distribution
            </h3>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-black/20" />
              <span className="w-2 h-2 rounded-full bg-black/10" />
            </div>
          </div>
          <div className="flex items-end gap-4 sm:gap-6 h-32 sm:h-40">
            {[
              { label: 'Desktop', icon: Monitor },
              { label: 'Mobile', icon: Smartphone }
            ].map(device => {
              const count = companies.filter(c => c.last_device === device.label).length;
              const height = companies.length > 0 ? (count / companies.length) * 100 : 0;
              return (
                <div key={device.label} className="flex-1 flex flex-col items-center gap-4 h-full">
                  <div className="w-full bg-black/5 rounded-2xl relative overflow-hidden h-full group border border-black/5">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="absolute bottom-0 w-full bg-black transition-colors" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className={`text-[10px] font-black ${height > 50 ? 'text-white' : 'text-black opacity-20'}`}>
                        {Math.round(height)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <device.icon size={12} className="sm:w-4 sm:h-4 opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{device.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`p-6 sm:p-8 rounded-[3rem] border-2 shadow-2xl backdrop-blur-xl ${styles.card} bg-opacity-80`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-widest opacity-50 flex items-center gap-2">
              <Activity size={14} /> Critical Logs
            </h3>
            <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">Clear All</button>
          </div>
          <div className="space-y-2 sm:space-y-3">
             {visits.slice(-3).reverse().map((v, i) => (
               <div key={i} className={`p-3 sm:p-4 rounded-2xl border transition-all hover:bg-black/5 flex justify-between items-center ${styles.border} min-w-0`}>
                 <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                   <div className={`p-2 rounded-xl bg-black/5 flex-shrink-0`}>
                     {v.device === 'Mobile' ? <Smartphone size={12} className="sm:w-3.5 sm:h-3.5" /> : <Monitor size={12} className="sm:w-3.5 sm:h-3.5" />}
                   </div>
                   <div className="min-w-0">
                     <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight truncate">{v.device} Engagement</p>
                     <p className="text-[8px] sm:text-[9px] font-medium opacity-50 truncate">{v.browser}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold py-1 px-2 sm:px-3 rounded-lg bg-black/5 flex-shrink-0 ml-2">
                   {v.company_id === 'anonymous' ? 'Anon' : 'Terminal'}
                 </div>
               </div>
             ))}
             {visits.length === 0 && (
               <div className="py-12 text-center opacity-30 italic text-xs">No active nodes detected...</div>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-12 border-t-2">
        <div className="w-full max-w-xl">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic mb-4">Command <span className={styles.accent}>Center</span></h2>
          <div className="flex flex-wrap gap-2">
            {['companies', 'production_board', 'clothes', 'rentals'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 sm:px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 border-2 ${activeTab === tab ? 'bg-black text-white border-black shadow-2xl scale-105' : 'bg-transparent border-black/10 hover:border-black/30 opacity-60 hover:opacity-100'}`}
              >
                {tab === 'companies' && <Users size={14} />}
                {tab === 'production_board' && <Activity size={14} />}
                {tab === 'clothes' && <ShoppingBag size={14} />}
                {tab === 'rentals' && <Package size={14} />}
                <span className="hidden sm:inline">{tab === 'production_board' ? 'Production Board' : tab}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full md:w-80 relative">
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 opacity-30`} size={20} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Global search..."
            className={`w-full py-4 sm:py-5 pl-14 pr-7 rounded-3xl border-2 transition-all outline-none focus:border-black shadow-xl font-bold bg-white text-sm sm:text-base`}
          />
        </div>
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-6"
      >
        {activeTab === 'companies' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map(company => (
              <div key={company.id} className={`p-6 sm:p-8 rounded-[2.5rem] border shadow-lg ${styles.card}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden flex-shrink-0 ${styles.secondary}`}>
                    {company.logo_url ? <img src={company.logo_url} className="w-full h-full object-cover" /> : <Users size={32} />}
                  </div>
                  <div className="flex flex-col items-end gap-2 overflow-hidden">
                    {company.is_online ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-tighter truncate max-w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" /> Online
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-black uppercase tracking-tighter">
                        Offline
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-1 truncate">{company.name}</h3>
                <p className={`text-xs mb-6 truncate ${styles.accent}`}>slug: {company.slug}</p>
                
                <div className="space-y-3 pt-6 border-t">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={styles.muted}>Items</span>
                    <span className="truncate ml-2">{clothes.filter(c => c.company_id === company.id).length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={styles.muted}>Projects</span>
                    <span className="truncate ml-2">{projects.filter(p => p.company_id === company.id).length}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={styles.muted}>Session</span>
                    <span className="truncate ml-2">{company.is_online ? formatSessionTime(company.session_start) : 'Offline'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={styles.muted}>Device</span>
                    <span className="flex items-center gap-1 truncate ml-2">
                      {company.last_device === 'Mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                      {company.last_device || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${styles.secondary} flex items-center justify-center gap-2 border-2 border-transparent active:border-black`}
                  >
                    <Eye size={14} /> View
                  </button>
                  <button 
                    onClick={() => onDeleteCompany(company.id)}
                    className={`p-3 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'production_board' && (
          renderProductionBoard ? renderProductionBoard() : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <button 
              onClick={() => setShowAddProject(true)}
              className="p-10 rounded-[3rem] border-4 border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-black transition-all group flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]"
            >
              <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all scale-110">
                <Plus size={40} />
              </div>
              <div>
                <p className="text-xl font-black tracking-tighter uppercase italic text-black">New Board</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">Initialize production</p>
              </div>
            </button>

            {filteredProjects.map(project => {
              const company = companies.find(c => c.id === project.company_id);
              return (
                <div key={project.id} className={`p-6 sm:p-8 rounded-[2.5rem] border shadow-lg ${styles.card}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden flex-shrink-0 ${styles.secondary}`}>
                      <Activity size={32} />
                    </div>
                    <div className="flex flex-col items-end gap-2 overflow-hidden">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-tighter truncate max-w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" /> {company?.name || 'Production'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 truncate">{project.name}</h3>
                  <p className={`text-xs mb-6 truncate ${styles.accent}`}>{project.user_name || 'No Client'}</p>
                  
                  <div className="space-y-3 pt-6 border-t font-bold">
                    <div className="flex justify-between text-xs">
                      <span className={styles.muted}>Assets</span>
                      <span className="truncate ml-2">{project.clothes_ids?.length || 0} Items</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={styles.muted}>Contact</span>
                      <span className="truncate ml-2">{project.user_phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={styles.muted}>Created</span>
                      <span className="truncate ml-2">{project.created_at ? new Date(project.created_at.toDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${styles.secondary} flex items-center justify-center gap-2 border-2 border-transparent active:border-black`}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button 
                      onClick={() => onDeleteProject(project.id)}
                      className={`p-3 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}

        {activeTab === 'clothes' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredClothes.map(item => {
              const company = companies.find(c => c.id === item.company_id);
              return (
                <div key={item.id} className={`group rounded-3xl overflow-hidden border shadow-sm ${styles.card}`}>
                  <div className="aspect-[3/4] relative overflow-hidden bg-zinc-100">
                    <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-lg bg-black/60 text-white text-[8px] font-bold uppercase truncate max-w-[80px]">
                        {company?.name}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleGlobalDeleteClothing(item.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="p-3">
                    <h5 className="text-[11px] font-bold truncate">{item.name}</h5>
                    <p className={`text-[9px] ${styles.muted}`}>{item.type} • {item.model}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'rentals' && (
          <div className="space-y-4">
            <div className={`p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center text-center ${styles.border} ${styles.muted}`}>
              <Package size={48} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">Rental Management</h3>
              <p className="max-w-md">Overview of all active rentals across the platform. (Coming Soon - Integration with Company Rental system)</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               {rentals.map(rental => {
                 const company = companies.find(c => c.id === rental.company_id);
                 return (
                   <div key={rental.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${styles.card}`}>
                     <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                       <img src={rental.image_url} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1">
                       <h5 className="text-sm font-bold">{rental.clothing_name}</h5>
                       <p className="text-[10px] opacity-60">Company: {company?.name}</p>
                     </div>
                     <div className="text-right">
                       <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${rental.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                         {rental.status}
                       </span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedCompany && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[500] bg-zinc-50 overflow-y-auto"
          >
            {/* Minimalist Top Nav */}
            <div className="sticky top-0 z-50 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-8 py-4 shadow-sm">
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <button 
                  onClick={() => setSelectedCompanyId(null)}
                  className="p-2 sm:p-3 hover:bg-zinc-100 rounded-2xl transition-colors border-2 border-transparent active:border-black flex-shrink-0"
                >
                  <X size={20} className="text-black sm:w-6 sm:h-6" />
                </button>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                    {selectedCompany.logo_url ? (
                      <img src={selectedCompany.logo_url} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={16} className="text-white sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-black truncate">{selectedCompany.name}</h2>
                    <p className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Internal Control ID: {selectedCompany.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full border-2 ${selectedCompany.is_online ? 'bg-green-50 border-green-200 text-green-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${selectedCompany.is_online ? 'bg-green-500 animate-pulse' : 'bg-zinc-400'}`} />
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{selectedCompany.is_online ? 'Live Hub' : 'Offline Node'}</span>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16">
                
                {/* Information Sidebar */}
                <div className="lg:col-span-4 space-y-8 sm:space-y-12">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 text-zinc-400 border-b pb-4">Telemetrics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {[
                        { label: 'Inventory Assets', value: companyClothes.length, icon: ShoppingBag, color: 'text-blue-600' },
                        { label: 'Active Sessions', value: companyProjects.length, icon: Activity, color: 'text-purple-600' },
                        { label: 'Cloud Visits', value: companyVisits.length, icon: Eye, color: 'text-orange-600' },
                        { label: 'Uptime Duration', value: selectedCompany.is_online ? formatSessionTime(selectedCompany.session_start) : '00:00', icon: Clock, color: 'text-zinc-900' },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-5 p-5 sm:p-6 rounded-[2.5rem] bg-white border-2 border-zinc-100 shadow-sm">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                            <stat.icon size={18} className="sm:w-5 sm:h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 truncate">{stat.label}</p>
                            <p className="text-lg sm:text-2xl font-black tracking-tight text-black truncate">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-zinc-400 border-b pb-4">Hardware Signature</h3>
                    <div className="p-10 rounded-[3rem] bg-black text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10 space-y-8">
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Environment</p>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/10">
                              {selectedCompany.last_device === 'Mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                            </div>
                            <p className="text-lg font-bold">{selectedCompany.last_device || 'System Cloud'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Protocol</p>
                          <p className="text-sm font-medium text-zinc-300">{selectedCompany.last_browser || 'Default Proxy'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Last Auth Ping</p>
                          <p className="text-sm font-bold text-zinc-100">{selectedCompany.last_seen ? new Date(selectedCompany.last_seen.toDate()).toLocaleString() : 'Never'}</p>
                        </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                    </div>
                  </section>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-12 sm:space-y-20">
                  <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4">
                      <div>
                        <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-black">Asset Cache</h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">Dressing Room Inventory Distribution</p>
                      </div>
                      <div className="px-5 sm:px-6 py-2 bg-black text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest self-start sm:self-center">
                        {companyClothes.length} TOTAL
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8">
                      {companyClothes.map(item => (
                        <div 
                          key={item.id} 
                          className="group flex flex-col gap-4 sm:gap-6 min-w-0 cursor-pointer"
                          onClick={() => setFullscreenClothingId(item.id)}
                        >
                          <div className="aspect-[3/4] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-zinc-200 border-2 sm:border-4 border-white shadow-lg transition-all group-hover:border-black group-hover:shadow-2xl hover:scale-[1.02]">
                            <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          </div>
                          <div className="px-2 min-w-0">
                            <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-black mb-1 truncate">{item.name}</p>
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase truncate">
                                {item.type}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-tighter truncate">
                                REF: {item.model}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {companyClothes.length === 0 && (
                        <div className="col-span-full py-32 rounded-[3.5rem] border-4 border-dashed border-zinc-200 bg-zinc-100/50 flex flex-col items-center justify-center text-center">
                          <ShoppingBag size={48} className="text-zinc-200 mb-6" />
                          <p className="text-sm font-bold text-zinc-400 italic">No assets registered in this node's cache</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 border-t pt-12 sm:pt-20 gap-4">
                      <div>
                        <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-black">Event Flow</h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">Historical Production Protocols</p>
                      </div>
                    </div>
                    
                      <div className="space-y-4 sm:space-y-6">
                        {companyProjects.map(project => (
                          <div 
                            key={project.id} 
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setSelectedCompanyId(null);
                            }}
                            className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-zinc-100 bg-white hover:border-black transition-all group shadow-sm hover:shadow-xl cursor-pointer min-w-0"
                          >
                            <div className="flex items-center gap-5 sm:gap-8 mb-6 md:mb-0 min-w-0">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6 flex-shrink-0">
                              <FileText size={24} className="sm:w-7 sm:h-7" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-lg sm:text-xl font-black tracking-tighter uppercase text-black mb-1 sm:mb-2 truncate">{project.name}</h4>
                              <div className="flex flex-wrap gap-2 sm:gap-4 min-w-0">
                                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-500 truncate"><UserIcon size={12} className="sm:w-3.5 sm:h-3.5" /> {project.user_name}</span>
                                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-500 truncate"><Phone size={12} className="sm:w-3.5 sm:h-3.5" /> {project.user_phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-left md:text-right flex md:flex-col gap-3 md:gap-2 w-full md:w-auto">
                            <p className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] text-zinc-300 group-hover:text-black transition-colors uppercase truncate">
                              {project.created_at ? new Date(project.created_at.toDate()).toLocaleTimeString() : 'N/A'}
                            </p>
                            <p className="px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-100 text-[9px] sm:text-[10px] font-black uppercase rounded-xl text-zinc-600 truncate">
                              {project.created_at ? new Date(project.created_at.toDate()).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {companyProjects.length === 0 && (
                        <div className="py-32 rounded-[3.5rem] border-4 border-dashed border-zinc-200 flex flex-col items-center justify-center text-center">
                          <Activity size={48} className="text-zinc-200 mb-6" />
                          <p className="text-sm font-bold text-zinc-400 italic">No project history detected for this terminal</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
              
              <div className="mt-40 pt-16 border-t flex justify-center">
                <button 
                  onClick={() => setSelectedCompanyId(null)}
                  className="group relative px-16 py-8 rounded-full bg-black text-white font-black uppercase tracking-[0.4em] text-[10px] hover:scale-105 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] active:scale-95"
                >
                  <span className="relative z-10">Deactivate Session</span>
                  <div className="absolute inset-0 bg-zinc-800 rounded-full scale-0 group-hover:scale-100 transition-transform origin-center -z-0" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProject && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[500] bg-zinc-50 overflow-y-auto"
          >
            {/* Minimalist Top Nav */}
            <div className="sticky top-0 z-50 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-8 py-4 shadow-sm">
              <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="p-2 sm:p-3 hover:bg-zinc-100 rounded-2xl transition-colors border-2 border-transparent active:border-black flex-shrink-0"
                >
                  <X size={20} className="text-black sm:w-6 sm:h-6" />
                </button>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <FileText size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-lg font-black uppercase tracking-tight text-black truncate">{selectedProject.name}</h2>
                    <p className="text-[8px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">Internal Control ID: {selectedProject.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full border-2 bg-blue-50 border-blue-200 text-blue-700`}>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{projectCompany?.name || 'Live Project'}</p>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
              {/* Project Status Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                {[
                  { label: 'Cast Size', value: actorsList.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Total Assets', value: projectClothes.length, icon: ShoppingBag, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Active Rentals', value: projectRentals.length, icon: Package, color: 'bg-zinc-100 text-zinc-900' },
                  { label: 'Waitlist', value: '0', icon: Clock, color: 'bg-zinc-100 text-zinc-400' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-[2.5rem] bg-white border-2 border-zinc-100 shadow-sm">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black tracking-tighter text-black">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16">
                
                {/* Information Sidebar */}
                <div className="lg:col-span-4 space-y-8 sm:space-y-12">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 sm:mb-8 text-zinc-400 border-b pb-4">Production Intel</h3>
                    <div className="space-y-4">
                      <div className="p-8 rounded-[3rem] bg-white border-2 border-zinc-100 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 text-center">Assigned Client</p>
                          <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-zinc-50 border-4 border-white shadow-xl flex items-center justify-center mb-4 text-black italic font-black text-3xl">
                              {selectedProject.user_name?.charAt(0) || 'P'}
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{selectedProject.user_name}</h4>
                            <p className="text-xs font-bold text-zinc-500 mb-6">{selectedProject.user_phone}</p>
                            
                            <div className="w-full flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Contact Active</span>
                            </div>
                          </div>
                        </div>
                        <UserIcon className="absolute -bottom-4 -left-4 text-zinc-50 w-24 h-24 -rotate-12" />
                      </div>

                      <div className="p-8 rounded-[3rem] border-2 border-dashed border-zinc-200 text-center space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 italic">Timeline Protocols</p>
                        <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-bold text-zinc-400">REGISTERED</span>
                          <span className="text-[10px] font-black text-black">{selectedProject.created_at ? new Date(selectedProject.created_at.toDate()).toLocaleDateString() : 'N/A'}</span>
                        </div>
                         <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-bold text-zinc-400">LAST SYNC</span>
                          <span className="text-[10px] font-black text-black">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-12 sm:space-y-20">
                  <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4">
                      <div>
                        <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-black">Cast Hub</h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">Verified actors and character mapping</p>
                      </div>
                      <button 
                        onClick={() => setShowAddActor(true)}
                        className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                      >
                        <Plus size={14} /> Add Actor
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(actorsList as any[]).map((actor: any) => (
                        <button 
                          key={actor.name}
                          onClick={() => setSelectedActorName(actor.name)}
                          className="flex items-center gap-6 p-8 rounded-[2.5rem] border-2 border-zinc-100 bg-white hover:border-black transition-all group shadow-sm hover:shadow-xl text-left"
                        >
                          <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6 flex-shrink-0">
                            <UserIcon size={32} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xl font-black tracking-tighter uppercase text-black mb-1 truncate">{actor.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-black uppercase text-zinc-500">{actor.clothesCount} COSTUMES</span>
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">ACTIVE</span>
                            </div>
                          </div>
                          <ChevronRight size={24} className="ml-auto text-zinc-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                      {actorsList.length === 0 && (
                        <div className="col-span-full py-32 rounded-[3.5rem] border-4 border-dashed border-zinc-200 bg-zinc-100/50 flex flex-col items-center justify-center text-center">
                          <Users size={48} className="text-zinc-200 mb-6" />
                          <p className="text-sm font-bold text-zinc-400 italic">No actors found in this production's roster</p>
                        </div>
                      )}
                    </div>
                  </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 border-t pt-12 sm:pt-20 gap-4">
              <div>
                <h3 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-black">Global Assets</h3>
                <p className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2">All inventory items available for this project</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8">
              {projectClothes.map(item => (
                <div key={item.id} className="group flex flex-col gap-4 sm:gap-6 min-w-0 cursor-pointer" onClick={() => setFullscreenClothingId(item.id)}>
                  <div className="aspect-[3/4] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-zinc-200 border-2 sm:border-4 border-white shadow-lg transition-all group-hover:border-black group-hover:shadow-2xl hover:scale-[1.02]">
                    <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="px-2 min-w-0">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-black mb-1 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase truncate">{item.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      
      <div className="mt-40 pt-16 border-t flex justify-center">
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="group relative px-16 py-8 rounded-full bg-black text-white font-black uppercase tracking-[0.4em] text-[10px] hover:scale-105 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] active:scale-95"
                >
                  <span className="relative z-10">Deactivate Production Detail</span>
                  <div className="absolute inset-0 bg-zinc-800 rounded-full scale-0 group-hover:scale-100 transition-transform origin-center -z-0" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedActorName && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed inset-0 z-[600] bg-zinc-50 overflow-y-auto"
          >
             <div className="sticky top-0 z-50 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-8 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedActorName(null)} className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors border-2 border-transparent active:border-black">
                  <X size={20} />
                </button>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-black">{selectedActorName}</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Character Costume Mapping</p>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
              {/* Profile Header Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                <div className="p-6 rounded-[2.5rem] bg-white border-2 border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Items</p>
                  <p className="text-2xl font-black tracking-tighter text-black">{selectedActorRentals.length}</p>
                </div>
                <div className="p-6 rounded-[2.5rem] bg-white border-2 border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Production Shots</p>
                  <p className="text-2xl font-black tracking-tighter text-black">{selectedActorShots.length}</p>
                </div>
                <div className="p-6 rounded-[2.5rem] bg-white border-2 border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Measurements</p>
                  <p className="text-2xl font-black tracking-tighter text-black">{selectedActor?.height || 'N/A'}</p>
                </div>
                <div className="p-6 rounded-[2.5rem] bg-white border-2 border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Role Type</p>
                  <p className="text-2xl font-black tracking-tighter text-black">Talent</p>
                </div>
              </div>

              {/* Shots Section */}
              {selectedActorShots.length > 0 && (
                <div className="mb-20">
                  <div className="flex items-center gap-4 mb-10">
                    <Layers className="text-black" size={24} />
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">Allocated Shots</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedActorShots.map(shot => (
                      <div key={shot.id} className="p-8 rounded-[3rem] bg-white border-2 border-zinc-100 shadow-sm">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <span className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase rounded-lg mb-2 inline-block">
                              SCENE: {shot.scene_number || '01'}
                            </span>
                            <h4 className="text-xl font-black uppercase tracking-tighter">{shot.name}</h4>
                          </div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">{shot.day || 'Day 1'}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {shot.clothing_item_ids?.map((id: string) => {
                            const item = clothes.find(c => c.id === id);
                            return item ? (
                              <div key={id} className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-100 border-2 border-white shadow-sm ring-1 ring-zinc-100 cursor-pointer" onClick={() => setFullscreenClothingId(id)}>
                                <img src={item.image_url} className="w-full h-full object-cover" />
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-10">
                <ShoppingBag className="text-black" size={24} />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-black">Individual Assets</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {selectedActorRentals.map(rental => {
                  const item = clothes.find(c => c.id === rental.clothing_id);
                  return (
                    <div key={rental.id} className="group bg-white rounded-[3rem] border-2 border-zinc-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all">
                      <div className="aspect-[4/5] relative cursor-pointer" onClick={() => setFullscreenClothingId(item?.id)}>
                        {item && <img src={item.image_url} className="w-full h-full object-cover" />}
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <span className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase rounded-full shadow-lg">
                            SHOT: {rental.shot || 'NA'}
                          </span>
                          <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-black text-[10px] font-black uppercase rounded-full border border-black/10 shadow-lg">
                            {rental.status}
                          </span>
                        </div>
                        <div 
                          className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Maximize2 size={20} />
                        </div>
                      </div>
                      <div className="p-8">
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-4">{item?.name || 'Unknown Item'}</h4>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t font-bold text-[10px] uppercase tracking-widest text-zinc-400">
                          <div>
                            <p className="mb-1">Size</p>
                            <p className="text-black">{rental.size}</p>
                          </div>
                          <div>
                            <p className="mb-1">Type</p>
                            <p className="text-black">{item?.type || 'Clothing'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="mb-1">Allocated On</p>
                            <p className="text-black">
                              {rental.rental_date ? (typeof rental.rental_date === 'string' ? rental.rental_date : new Date(rental.rental_date.toDate()).toLocaleDateString()) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Initialize <span className="text-zinc-400">Board</span></h3>
                <button onClick={() => setShowAddProject(false)} className="p-4 rounded-2xl hover:bg-zinc-100 transition-all border-2 border-transparent active:border-black">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateProject} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Project Identity</label>
                    <input 
                      required
                      value={newProject.name}
                      onChange={e => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Production Name"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Assign Company</label>
                    <select 
                      required
                      value={newProject.company_id}
                      onChange={e => setNewProject({...newProject, company_id: e.target.value})}
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg appearance-none"
                    >
                      <option value="">Select Producer</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Internal Client</label>
                    <input 
                      required
                      value={newProject.user_name}
                      onChange={e => setNewProject({...newProject, user_name: e.target.value})}
                      placeholder="Client Name"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Secure Contact</label>
                    <input 
                      required
                      value={newProject.user_phone}
                      onChange={e => setNewProject({...newProject, user_phone: e.target.value})}
                      placeholder="Phone String"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Scope Intel</label>
                  <textarea 
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Brief description of the production scope..."
                    className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2.5rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg h-32 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-8 bg-black text-white rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {isSubmitting ? 'Decrypting Protocols...' : 'Confirm Production Board'}
                  <Activity size={18} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddActor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-xl bg-white rounded-[3.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Add <span className="text-zinc-400">Actor</span></h3>
                <button onClick={() => setShowAddActor(false)} className="p-4 rounded-2xl hover:bg-zinc-100 transition-all border-2 border-transparent active:border-black">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateActor} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Full Identity</label>
                  <input 
                    required
                    value={newActor.name}
                    onChange={e => setNewActor({...newActor, name: e.target.value})}
                    placeholder="Talent Name"
                    className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Contact Logic</label>
                    <input 
                      value={newActor.phone}
                      onChange={e => setNewActor({...newActor, phone: e.target.value})}
                      placeholder="Phone"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Height Intel</label>
                    <input 
                      value={newActor.height}
                      onChange={e => setNewActor({...newActor, height: e.target.value})}
                      placeholder="e.g. 180cm"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Chest Scale</label>
                    <input 
                      value={newActor.chest}
                      onChange={e => setNewActor({...newActor, chest: e.target.value})}
                      placeholder="Chest"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Waist Scale</label>
                    <input 
                      value={newActor.waist}
                      onChange={e => setNewActor({...newActor, waist: e.target.value})}
                      placeholder="Waist"
                      className="w-full px-8 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-8 bg-black text-white rounded-full font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {isSubmitting ? 'Syncing Talbot...' : 'Deploy Actor to Hub'}
                  <UserIcon size={18} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullscreenClothingId && (() => {
          const item = clothes.find(c => c.id === fullscreenClothingId);
          if (!item) return null;
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-[1000] bg-black overflow-hidden flex flex-col"
            >
              <div className="absolute top-8 right-8 z-50">
                <button onClick={() => setFullscreenClothingId(null)} className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl transition-all border-2 border-transparent active:border-white">
                  <X size={28} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="min-h-full flex flex-col lg:flex-row">
                  <div className="lg:w-1/2 h-[70vh] lg:h-screen sticky top-0 bg-zinc-900 flex items-center justify-center p-8">
                    <img src={item.image_url} className="max-w-full max-h-full object-contain shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]" />
                  </div>
                  
                  <div className="lg:w-1/2 bg-black text-white p-12 lg:p-24 flex flex-col justify-center">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-4 mb-8">
                        <span className="px-4 py-1.5 bg-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-md">{item.type}</span>
                        <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Model: {item.model}</span>
                      </div>
                      <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter mb-10 leading-[0.9]">{item.name}</h2>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-16">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Inventory Specs</p>
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-white/10 pb-4">
                              <span className="text-zinc-400 font-bold">Standard Size</span>
                              <span className="font-black">
                                {selectedActorName ? (selectedActorRentals.find(r => r.clothing_id === item.id)?.size || 'Universal') : 'Universal'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-4">
                              <span className="text-zinc-400 font-bold">Allocated Section</span>
                              <span className="font-black uppercase">{item.type}</span>
                            </div>
                            {selectedActorName && (
                              <div className="flex justify-between border-b border-white/10 pb-4">
                                <span className="text-zinc-400 font-bold">Production Shot</span>
                                <span className="font-black uppercase">
                                  {selectedActorRentals.find(r => r.clothing_id === item.id)?.shot || 'Not Set'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Internal Reference</p>
                          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden">
                            <Layers size={48} className="absolute -bottom-4 -right-4 opacity-10" />
                            <p className="text-xs font-mono break-all opacity-60 uppercase">{item.id}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                          <p className="text-[13px] leading-relaxed text-zinc-400 font-medium italic">
                            This asset is part of the global Dressing Room repository. Distribution is limited to authenticated production shells within the {projectCompany?.name || 'current'} network.
                          </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
