import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
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
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---

interface ClothingItem {
  id: number;
  name: string;
  type: string;
  model: string;
  sizes: string[];
  color: string;
  age_group: string;
  weather: string;
  image_url: string;
  section: string;
}

interface Collection {
  id: number;
  name: string;
  event_date: string;
  description: string;
  image_url: string;
}

interface Rental {
  id: number;
  clothing_id: number;
  client_id?: number;
  client_name: string;
  client_phone: string;
  client_full_name?: string;
  client_phone_number?: string;
  size: string;
  color: string;
  rental_date: string;
  status: string;
  clothing_name: string;
  image_url: string;
}

interface Client {
  id: number;
  full_name: string;
  phone: string;
  id_image_url: string;
  company_name: string;
  company_phone: string;
  created_at: string;
}

// --- Constants ---

const fetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  
  if (!res.ok) {
    if (isJson) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Server error: ${res.status}`);
    }
    const text = await res.text();
    console.error(`Fetch error for ${url}:`, {
      status: res.status,
      statusText: res.statusText,
      contentType,
      bodySample: text.substring(0, 100)
    });
    throw new Error(`Server error: ${res.status}`);
  }

  if (!isJson) {
    throw new Error(`Expected JSON but got ${contentType || 'nothing'}`);
  }
  
  return await res.json();
};

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

// --- Components ---

const Navbar = ({ isAdmin, onLogin, onLogout }: { isAdmin: boolean, onLogin: () => void, onLogout: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex justify-between items-center">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">AD</div>
      <h1 className="text-xl font-bold tracking-tight text-zinc-900">Media Dressing Room</h1>
    </div>
    <div className="flex items-center gap-4">
      {isAdmin ? (
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      ) : (
        <button 
          onClick={onLogin}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black hover:bg-zinc-800 text-white transition-colors font-medium"
        >
          <Settings size={18} />
          <span>Admin Panel</span>
        </button>
      )}
    </div>
  </nav>
);

const ClothingCard = ({ item, onAddToCollection, onRent, isRented, activeRentals = [] }: { 
  item: ClothingItem, 
  onAddToCollection?: (id: number) => void, 
  onRent?: (id: number) => void,
  isRented?: boolean,
  activeRentals?: Rental[],
  key?: React.Key 
}) => {
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
      className={`group bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${isCurrentlyRented ? 'opacity-75 grayscale-[0.5]' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
        <img 
          src={item.image_url || `https://picsum.photos/seed/${item.id}/400/600`} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-800 shadow-sm">
            {item.type}
          </span>
          <span className="px-3 py-1 bg-black/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            {item.model}
          </span>
          <span className="px-3 py-1 bg-blue-500 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Section {item.section || 'A'}
          </span>
          {isCurrentlyRented && (
            <span className="px-3 py-1 bg-red-500 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Currently Rented
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-1">{item.name}</h3>
            <div className="flex items-center gap-3 text-zinc-500 text-xs">
              <span className="flex items-center gap-1"><User size={12} /> {item.age_group}</span>
              <span className="flex items-center gap-1"><Cloud size={12} /> {item.weather}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Available Sizes</p>
            <div className="flex flex-wrap gap-2">
              {availableSizes.length > 0 ? availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={isCurrentlyRented}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    selectedSize === size 
                      ? "bg-black text-white shadow-lg scale-110" 
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
                  }`}
                >
                  {size}
                </button>
              )) : (
                <span className="text-xs text-zinc-400 font-medium">No sizes available</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Color</p>
            <div className="w-6 h-6 rounded-full border border-zinc-200" style={{ backgroundColor: (item.color || "").toLowerCase() }} />
            <span className="text-xs text-zinc-600 font-medium capitalize">{item.color}</span>
          </div>

          <div className="flex flex-col gap-2">
            {onRent && (
              <button 
                onClick={() => onRent(item.id)}
                disabled={isCurrentlyRented}
                className="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:bg-zinc-300 disabled:cursor-not-allowed"
              >
                <Tag size={16} />
                {isCurrentlyRented ? 'Rented' : 'Rent Now'}
              </button>
            )}
            {onAddToCollection && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onAddToCollection(item.id);
                }}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add to Collection
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminPanel = ({ onClose, rentals, clothes, collections, clients, onReturn, onDeleteRental, onRefresh, setNotification, setConfirmModal, setAddToCollectionModal }: { 
  onClose: () => void, 
  rentals: Rental[], 
  clothes: ClothingItem[], 
  collections: Collection[],
  clients: Client[],
  onReturn: (id: number) => void,
  onDeleteRental: (id: number) => void,
  onRefresh: () => void,
  setNotification: (n: {message: string, type: 'success' | 'error'}) => void,
  setConfirmModal: (c: {show: boolean, title: string, message: string, onConfirm: () => void} | null) => void,
  setAddToCollectionModal: (m: {show: boolean, clothingId: number | null}) => void
}) => {
  const [activeTab, setActiveTab] = useState<"clothes" | "collections" | "rentals" | "clients">("clothes");
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

  const [editingCloth, setEditingCloth] = useState<number | null>(null);
  const [editingCollection, setEditingCollection] = useState<number | null>(null);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [editingRental, setEditingRental] = useState<number | null>(null);
  const [viewingClientRentals, setViewingClientRentals] = useState<Rental[] | null>(null);
  const [rentalMonthFilter, setRentalMonthFilter] = useState<number>(0); // 0 means all

  const [editRentalForm, setEditRentalForm] = useState({
    client_id: 0,
    size: "",
    color: "",
    status: "active"
  });

  useEffect(() => {
    onRefresh();
  }, []);

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
        await fetchJson(`/api/clothes/${editingCloth}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCloth)
        });
        setEditingCloth(null);
      } else {
        await fetchJson("/api/clothes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCloth)
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
      onRefresh();
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
        await fetchJson(`/api/collections/${editingCollection}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCollection)
        });
        setEditingCollection(null);
      } else {
        await fetchJson("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCollection)
        });
      }
      setNotification({ message: editingCollection ? "Collection updated!" : "Collection added!", type: "success" });
      setNewCollection({ name: "", event_date: "", description: "", image_url: "" });
      onRefresh();
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
    try {
      if (editingClient) {
        await fetchJson(`/api/clients/${editingClient}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient)
        });
        setEditingClient(null);
      } else {
        await fetchJson("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClient)
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
      onRefresh();
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
      client_id: rental.client_id || 0,
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
      const data = await fetchJson(`/api/rentals/${editingRental}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRentalForm)
      });
      if (data.success) {
        setNotification({ message: "Rental record updated!", type: "success" });
        setEditingRental(null);
        onRefresh();
      } else {
        setNotification({ message: "Failed to update rental.", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Failed to update rental.", type: "error" });
    }
  };

  const handleDeleteCloth = async (id: number) => {
    setConfirmModal({
      show: true,
      title: "Delete Item",
      message: "Are you sure you want to delete this item?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await fetchJson(`/api/clothes/${id}`, { method: "DELETE" });
          setNotification({ message: "Item deleted successfully!", type: "success" });
          onRefresh();
        } catch (err) {
          setNotification({ message: "Failed to delete item.", type: "error" });
        }
      }
    });
  };

  const handleDeleteCollection = async (id: number) => {
    setConfirmModal({
      show: true,
      title: "Delete Collection",
      message: "Are you sure you want to delete this collection?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await fetchJson(`/api/collections/${id}`, { method: "DELETE" });
          setNotification({ message: "Collection deleted successfully!", type: "success" });
          onRefresh();
        } catch (err) {
          setNotification({ message: "Failed to delete collection.", type: "error" });
        }
      }
    });
  };

  const handleDeleteClient = async (id: number) => {
    setConfirmModal({
      show: true,
      title: "Delete Client",
      message: "Are you sure you want to delete this client account?",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await fetchJson(`/api/clients/${id}`, { method: "DELETE" });
          setNotification({ message: "Client deleted successfully!", type: "success" });
          onRefresh();
        } catch (err) {
          setNotification({ message: "Failed to delete client account.", type: "error" });
        }
      }
    });
  };

  return (
    <div ref={panelRef} className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-zinc-900">Admin Dashboard</h2>
            <p className="text-zinc-500 mt-2">Manage your dressing room inventory, collections, and clients.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-12 border-b border-zinc-100 pb-4">
          <button 
            onClick={() => { setActiveTab("clothes"); setInventorySearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "clothes" ? "bg-black text-white" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Inventory
          </button>
          <button 
            onClick={() => { setActiveTab("collections"); setCollectionSearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "collections" ? "bg-black text-white" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Collections
          </button>
          <button 
            onClick={() => { setActiveTab("clients"); setClientSearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "clients" ? "bg-black text-white" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Client Accounts
          </button>
          <button 
            onClick={() => { setActiveTab("rentals"); setRentalSearch(""); }}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              activeTab === "rentals" ? "bg-black text-white" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Active Rentals
          </button>
        </div>

        {activeTab === "clothes" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 sticky top-12">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-emerald-500" /> {editingCloth ? 'Edit Item' : 'Add New Item'}
                </h3>
                <form onSubmit={handleAddCloth} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Item Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCloth.name}
                      onChange={e => setNewCloth({...newCloth, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                      placeholder="e.g. Summer Linen Shirt"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Type</label>
                      <select 
                        value={newCloth.type}
                        onChange={e => setNewCloth({...newCloth, type: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      >
                        {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Model</label>
                      <select 
                        value={newCloth.model}
                        onChange={e => setNewCloth({...newCloth, model: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      >
                        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Sizes (Press Enter)</label>
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
                        className="flex-1 px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                        placeholder="S, M, L..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newCloth.sizes.map(s => (
                        <span key={s} className="px-3 py-1 bg-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1">
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
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="Red"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Age Group</label>
                      <select 
                        value={newCloth.age_group}
                        onChange={e => setNewCloth({...newCloth, age_group: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      >
                        {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Weather</label>
                      <select 
                        value={newCloth.weather}
                        onChange={e => setNewCloth({...newCloth, weather: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      >
                        {WEATHER_TYPES.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Store Section</label>
                      <select 
                        value={newCloth.section}
                        onChange={e => setNewCloth({...newCloth, section: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      >
                        {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Image URL</label>
                    <input 
                      type="url" 
                      value={newCloth.image_url}
                      onChange={e => setNewCloth({...newCloth, image_url: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="https://images.unsplash.com/..."
                    />
                    {newCloth.image_url && (
                      <div className="mt-4 w-full h-48 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                        <img src={newCloth.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                  >
                    {editingCloth ? 'Update Item' : 'Add to Inventory'}
                  </button>
                  {editingCloth && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCloth(null);
                        setNewCloth({
                          name: "", type: CLOTHING_TYPES[0], model: MODELS[0], sizes: [], colors: [],
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
                    className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black"
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
                      onAddToCollection={(id) => setAddToCollectionModal({show: true, clothingId: id})}
                      activeRentals={rentals.filter(r => r.clothing_id === item.id && r.status === 'active')}
                    />
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <button 
                        onClick={() => handleEditCloth(item)}
                        className="p-2 bg-white text-zinc-900 rounded-full hover:bg-black hover:text-white transition-all shadow-lg"
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
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 sticky top-12">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="text-blue-500" /> {editingCollection ? 'Edit Collection' : 'New Collection'}
                </h3>
                <form onSubmit={handleAddCollection} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Collection Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCollection.name}
                      onChange={e => setNewCollection({...newCollection, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="e.g. Wedding Event 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Event Date</label>
                    <input 
                      type="date" 
                      value={newCollection.event_date}
                      onChange={e => setNewCollection({...newCollection, event_date: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Collection Image URL</label>
                    <input 
                      type="url" 
                      value={newCollection.image_url}
                      onChange={e => setNewCollection({...newCollection, image_url: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Description</label>
                    <textarea 
                      value={newCollection.description}
                      onChange={e => setNewCollection({...newCollection, description: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none h-32 resize-none"
                      placeholder="What is this collection for?"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                  >
                    {editingCollection ? 'Update Collection' : 'Create Collection'}
                  </button>
                  {editingCollection && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCollection(null);
                        setNewCollection({ name: "", event_date: "", description: "" });
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
                <h3 className="text-xl font-bold">Active Collections ({collections.length})</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search collections..."
                    value={collectionSearch}
                    onChange={e => setCollectionSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black"
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
                  <div key={col.id} className="bg-white p-6 rounded-3xl border border-zinc-200 flex justify-between items-center group hover:border-black transition-all">
                    <div className="flex items-center gap-4">
                      {col.image_url && (
                        <img src={col.image_url} alt={col.name} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900">{col.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-zinc-500 text-sm">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {col.event_date || "No date"}</span>
                          <span>{col.description}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditCollection(col)}
                        className="p-3 bg-zinc-100 hover:bg-black hover:text-white text-zinc-600 rounded-full transition-all"
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
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 sticky top-12">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-indigo-500" /> {editingClient ? 'Edit Client Account' : 'New Client Account'}
                </h3>
                <form onSubmit={handleAddClient} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={newClient.full_name}
                      onChange={e => setNewClient({...newClient, full_name: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      value={newClient.phone}
                      onChange={e => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">ID / Proof Image URL</label>
                    <input 
                      type="url" 
                      value={newClient.id_image_url}
                      onChange={e => setNewClient({...newClient, id_image_url: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Company Name</label>
                      <input 
                        type="text" 
                        value={newClient.company_name}
                        onChange={e => setNewClient({...newClient, company_name: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Company Phone</label>
                      <input 
                        type="tel" 
                        value={newClient.company_phone}
                        onChange={e => setNewClient({...newClient, company_phone: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
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
                    className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clients
                  .filter(client => {
                    const s = clientSearch.toLowerCase();
                    return client.full_name.toLowerCase().includes(s) || 
                           client.phone.toLowerCase().includes(s) ||
                           (client.company_name && client.company_name.toLowerCase().includes(s));
                  })
                  .map(client => (
                  <div key={client.id} className="bg-white p-6 rounded-3xl border border-zinc-200 group hover:border-black transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden">
                        {client.id_image_url ? (
                          <img src={client.id_image_url} alt={client.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400"><User size={20} /></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">{client.full_name}</h4>
                        <p className="text-zinc-500 text-sm">{client.phone}</p>
                      </div>
                    </div>
                    {client.company_name && (
                      <div className="bg-zinc-50 p-3 rounded-xl mb-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Company</p>
                        <p className="text-sm font-medium">{client.company_name}</p>
                        {client.company_phone && <p className="text-xs text-zinc-500">{client.company_phone}</p>}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={() => handleEditClient(client)}
                        className="flex-1 py-2 bg-zinc-100 text-zinc-900 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all"
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
        ) : (
          <div className="space-y-8">
            {editingRental && (
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 mb-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Settings className="text-zinc-900" /> Edit Rental Record
                </h3>
                <form onSubmit={handleUpdateRental} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Client</label>
                    <select 
                      value={editRentalForm.client_id}
                      onChange={e => setEditRentalForm({...editRentalForm, client_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                    >
                      <option value={0}>Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Size</label>
                    <input 
                      type="text"
                      value={editRentalForm.size}
                      onChange={e => setEditRentalForm({...editRentalForm, size: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Color</label>
                    <input 
                      type="text"
                      value={editRentalForm.color}
                      onChange={e => setEditRentalForm({...editRentalForm, color: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Status</label>
                    <select 
                      value={editRentalForm.status}
                      onChange={e => setEditRentalForm({...editRentalForm, status: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex gap-4">
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl"
                    >
                      Update Rental
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingRental(null)}
                      className="px-8 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
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
                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
                  <button 
                    onClick={() => setRentalFilter("active")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${rentalFilter === "active" ? "bg-white shadow-sm text-black" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    Active ({rentals.filter(r => r.status === 'active').length})
                  </button>
                  <button 
                    onClick={() => setRentalFilter("all")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${rentalFilter === "all" ? "bg-white shadow-sm text-black" : "text-zinc-500 hover:text-zinc-700"}`}
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
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
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
                <div key={rental.id} className={`bg-white p-6 rounded-3xl border border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all ${rental.status === 'returned' ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100">
                      <img src={rental.image_url} alt={rental.clothing_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{rental.client_full_name || rental.client_name}</h4>
                        {rental.status === 'returned' && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-md">Returned</span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-sm">{rental.client_phone_number || rental.client_phone}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1 px-0 md:px-8">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Item</p>
                      <p className="text-sm font-medium">{rental.clothing_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Size</p>
                      <p className="text-sm font-medium">{rental.size}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Color</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-zinc-200" style={{backgroundColor: (rental.color || "").toLowerCase()}} />
                        <p className="text-sm font-medium">{rental.color}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="text-sm font-medium">{new Date(rental.rental_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {rental.status === 'active' && (
                      <button 
                        onClick={() => onReturn(rental.id)}
                        className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        Return
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditRental(rental)}
                      className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
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
                <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 text-zinc-400 font-medium">
                  No {rentalFilter === 'active' ? 'active' : ''} rentals found.
                </div>
              )}
            </div>
          </div>
        )}
        {viewingClientRentals && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">Rented Clothes</h3>
                  <p className="text-sm text-zinc-500">Total items: {
                    viewingClientRentals.filter(r => {
                      if (rentalMonthFilter === 0) return true;
                      const rentalDate = new Date(r.rental_date);
                      const now = new Date();
                      const diffMonths = (now.getFullYear() - rentalDate.getFullYear()) * 12 + (now.getMonth() - rentalDate.getMonth());
                      return diffMonths < rentalMonthFilter;
                    }).length
                  }</p>
                </div>
                <button onClick={() => setViewingClientRentals(null)} className="p-2 hover:bg-zinc-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <button 
                  onClick={() => setRentalMonthFilter(0)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${rentalMonthFilter === 0 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}
                >
                  All Time
                </button>
                {[1, 2, 3, 6].map(m => (
                  <button 
                    key={m}
                    onClick={() => setRentalMonthFilter(m)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${rentalMonthFilter === m ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}
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
                    <div key={rental.id} className="flex items-center gap-4 p-4 border border-zinc-200 rounded-2xl">
                      <img src={rental.image_url} alt={rental.clothing_name} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold">{rental.clothing_name}</h4>
                        <p className="text-sm text-zinc-500">Size: {rental.size} | Color: {rental.color}</p>
                        <p className="text-xs text-zinc-400">Rented: {new Date(rental.rental_date).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rental.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
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

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [showAllRentals, setShowAllRentals] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [collectionItems, setCollectionItems] = useState<ClothingItem[]>([]);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [addToCollectionModal, setAddToCollectionModal] = useState<{show: boolean, clothingId: number | null}>({show: false, clothingId: null});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "rented">("all");

  // Rental Modal State
  const [rentalModal, setRentalModal] = useState<{
    show: boolean;
    clothingId: number | null;
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
    client_id: null as number | null,
    client_name: "", // Fallback for legacy
    client_phone: "", // Fallback for legacy
    size: "",
    color: ""
  });

  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{show: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      const [clothes, collections, rentals, clients] = await Promise.all([
        fetchJson("/api/clothes"),
        fetchJson("/api/collections"),
        fetchJson("/api/rentals"),
        fetchJson("/api/clients")
      ]);
      setClothes(clothes);
      setCollections(collections);
      setRentals(rentals);
      setClients(clients);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const getAvailableSizes = (clothingId: number, color: string) => {
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

  const handleCollectionClick = async (collection: Collection) => {
    try {
      const items = await fetchJson(`/api/collections/${collection.id}/items`);
      setCollectionItems(items);
      setSelectedCollection(collection.id);
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
      const data = await fetchJson("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clothing_id: rentalModal.clothingId, 
          ...rentalForm 
        })
      });
      if (data.success) {
        setNotification({ message: "Item rented successfully!", type: "success" });
        setRentalModal({ ...rentalModal, show: false });
        fetchData();
      } else {
        setNotification({ message: data.message || "Failed to rent item.", type: "error" });
      }
    } catch (err: any) {
      setNotification({ message: err.message || "Failed to rent item. Check console for details.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async (rental_id: number) => {
    setConfirmModal({
      show: true,
      title: "Return Item",
      message: "Are you sure you want to return this item?",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsSubmitting(true);
        try {
          const data = await fetchJson(`/api/rentals/${rental_id}/return`, {
            method: "POST"
          });
          if (data.success) {
            setNotification({ message: "Item returned successfully!", type: "success" });
            fetchData();
          } else {
            setNotification({ message: "Failed to return item.", type: "error" });
          }
        } catch (err) {
          setNotification({ message: "Failed to return item.", type: "error" });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleDeleteRental = async (rental_id: number) => {
    setConfirmModal({
      show: true,
      title: "Delete Record",
      message: "Are you sure you want to delete this rental record? This cannot be undone.",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsSubmitting(true);
        try {
          const data = await fetchJson(`/api/rentals/${rental_id}`, {
            method: "DELETE"
          });
          if (data.success) {
            setNotification({ message: "Rental record deleted successfully!", type: "success" });
            fetchData();
          } else {
            setNotification({ message: "Failed to delete rental record.", type: "error" });
          }
        } catch (err) {
          setNotification({ message: "Failed to delete rental record.", type: "error" });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await fetchJson("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (data.success) {
        setIsAdmin(true);
        setShowLogin(false);
        setPassword("");
        setNotification({ message: "Login successful!", type: "success" });
      } else {
        setNotification({ message: "Wrong password!", type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Login failed.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-zinc-900 font-sans selection:bg-black selection:text-white">
      <Navbar 
        isAdmin={isAdmin} 
        onLogin={() => setShowLogin(true)} 
        onLogout={() => setIsAdmin(false)} 
      />

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6"
          >
            DRESS TO <span className="text-zinc-400">IMPRESS.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-500 max-w-2xl mx-auto"
          >
            AD Media Dressing Room: Your ultimate wardrobe management system. 
            Organize your clothes, create collections for events, and always look your best.
          </motion.p>
        </section>

        {/* Collections Horizontal Scroll */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Featured Collections</h3>
              <p className="text-zinc-500">Curated sets for your upcoming events.</p>
            </div>
            <button className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">
              View All
            </button>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
            {collections.length === 0 ? (
              <div className="w-full py-12 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-center justify-center text-zinc-400 font-medium">
                No collections created yet.
              </div>
            ) : (
              collections.map(col => (
                <motion.div 
                  key={col.id}
                  whileHover={{ y: -5 }}
                  onClick={() => handleCollectionClick(col)}
                  className="min-w-[300px] md:min-w-[400px] bg-white p-8 rounded-[2rem] border border-zinc-200 snap-start cursor-pointer hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
                    <Calendar className="text-zinc-900" size={24} />
                  </div>
                  <h4 className="text-2xl font-bold mb-2">{col.name}</h4>
                  <p className="text-zinc-500 mb-6 line-clamp-2">{col.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      {col.event_date || "Upcoming"}
                    </span>
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-100 overflow-hidden">
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
                <h3 className="text-2xl font-bold tracking-tight">My Active Rentals</h3>
                <p className="text-zinc-500">Items you currently have rented.</p>
              </div>
              {rentals.filter(r => r.status === 'active').length > 3 && (
                <button 
                  onClick={() => setShowAllRentals(!showAllRentals)}
                  className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                >
                  {showAllRentals ? 'Show Less' : 'See More'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(showAllRentals ? rentals.filter(r => r.status === 'active') : rentals.filter(r => r.status === 'active').slice(0, 3)).map(rental => (
                <motion.div 
                  key={rental.id}
                  layout
                  className="bg-white p-4 rounded-3xl border border-zinc-200 flex items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 flex-shrink-0">
                    <img src={rental.image_url} alt={rental.clothing_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-900 truncate">{rental.clothing_name}</h4>
                    <p className="text-xs text-zinc-500">Rented on {new Date(rental.rental_date).toLocaleDateString()}</p>
                    <button 
                      onClick={() => handleReturn(rental.id)}
                      className="mt-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Return Item
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Inventory Section */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Wardrobe Inventory</h3>
              <p className="text-zinc-500">Browse and filter your entire clothing collection.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name, type, size, or color..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white border border-zinc-200 rounded-2xl">
                <Filter size={18} className="text-zinc-400" />
                <select 
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-transparent outline-none font-medium text-sm"
                >
                  <option value="All">All Types</option>
                  {CLOTHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white border border-zinc-200 rounded-2xl">
                <Check size={18} className="text-zinc-400" />
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
            <div className="text-center py-24 bg-white rounded-[3rem] border border-zinc-200">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-zinc-300" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900">No items found</h4>
              <p className="text-zinc-500 mt-2">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredClothes.map(item => (
                  <ClothingCard 
                    key={item.id} 
                    item={item} 
                    onRent={() => handleRentClick(item)}
                    onAddToCollection={isAdmin ? (id) => setAddToCollectionModal({show: true, clothingId: id}) : undefined}
                    activeRentals={rentals.filter(r => r.clothing_id === item.id && r.status === 'active')}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
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
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Rent Item</h2>
                  <p className="text-zinc-500 mt-2">Renting: <span className="font-bold text-black">{rentalModal.clothingName}</span></p>
                </div>
                <button onClick={() => setRentalModal({ ...rentalModal, show: false })} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRentSubmit} className="space-y-6">
                <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Select Client Account</label>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search saved clients..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {clients
                      .filter(c => c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch))
                      .map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setRentalForm({ ...rentalForm, client_id: client.id, client_name: client.full_name, client_phone: client.phone })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          rentalForm.client_id === client.id 
                            ? "border-black bg-black text-white" 
                            : "border-zinc-100 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${rentalForm.client_id === client.id ? "bg-white/20" : "bg-zinc-100 text-zinc-400"}`}>
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{client.full_name}</p>
                          <p className={`text-xs ${rentalForm.client_id === client.id ? "text-white/60" : "text-zinc-500"}`}>{client.phone}</p>
                        </div>
                        {rentalForm.client_id === client.id && <Check size={16} className="ml-auto" />}
                      </button>
                    ))}
                    {clients.length === 0 && (
                      <div className="text-center py-4 text-zinc-400 text-sm">
                        No clients found. Add them in Admin Panel.
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
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none"
                    >
                      {getAvailableSizes(rentalModal.clothingId!, rentalForm.color).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter">Add to Collection</h2>
                  <p className="text-zinc-500 mt-2">Select a collection to add this item to.</p>
                </div>
                <button onClick={() => setAddToCollectionModal({ show: false, clothingId: null })} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-all">
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
                          await fetchJson(`/api/collections/${col.id}/items`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ clothing_id: addToCollectionModal.clothingId })
                          });
                          setNotification({ message: "Added to collection!", type: "success" });
                          setAddToCollectionModal({ show: false, clothingId: null });
                        } catch (err: any) {
                          setNotification({ message: err.message || "Failed to add to collection.", type: "error" });
                        }
                      }}
                      className="w-full text-left p-4 rounded-2xl border border-zinc-200 hover:border-black hover:shadow-md transition-all group"
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
              className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter">
                    {collections.find(c => c.id === selectedCollection)?.name}
                  </h2>
                  <p className="text-zinc-500 mt-2 text-lg">
                    {collections.find(c => c.id === selectedCollection)?.description}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCollectionModal(false)}
                  className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {collectionItems.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-3xl">
                  <p className="text-zinc-500 text-lg">This collection is currently empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collectionItems.map(item => (
                    <motion.div 
                      key={item.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden group hover:shadow-xl transition-all"
                    >
                      <div className="aspect-[4/5] bg-zinc-100 relative overflow-hidden">
                        <img 
                          src={item.image_url || `https://picsum.photos/seed/${item.id}/400/500`} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                          {item.category}
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold">{item.name}</h3>
                        </div>
                        <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {item.sizes.map(size => (
                            <span key={size} className="px-2 py-1 bg-zinc-100 rounded-md text-xs font-medium text-zinc-600">
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
                            className="w-full py-3 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-zinc-800 transition-colors"
                          >
                            Rent Now
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={async () => {
                                try {
                                  await fetchJson(`/api/collections/${selectedCollection}/items/${item.id}`, {
                                    method: "DELETE"
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
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">AD</div>
                <h2 className="text-3xl font-black tracking-tighter">Admin Access</h2>
                <p className="text-zinc-500 mt-2">Enter the secret password to manage the dressing room.</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
                  <input 
                    type="password" 
                    required
                    autoFocus
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all text-center text-xl tracking-[0.5em]"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-[2] py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : null}
                    Login
                  </button>
                </div>
              </form>
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
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-100"
            >
              <h3 className="text-2xl font-black tracking-tight mb-2">{confirmModal.title}</h3>
              <p className="text-zinc-500 mb-8">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-4 bg-black hover:bg-zinc-800 text-white rounded-2xl font-bold transition-all"
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
        {isAdmin && (
          <AdminPanel 
            onClose={() => setIsAdmin(false)} 
            rentals={rentals}
            clothes={clothes}
            collections={collections}
            clients={clients}
            onReturn={handleReturn}
            onDeleteRental={handleDeleteRental}
            onRefresh={fetchData}
            setNotification={setNotification}
            setConfirmModal={setConfirmModal}
            setAddToCollectionModal={setAddToCollectionModal}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">AD</div>
            <span className="font-bold tracking-tight">AD Media Dressing Room</span>
          </div>
          <p className="text-zinc-400 text-sm">© 2024 AD Media. All rights reserved.</p>
          <div className="flex gap-6 text-zinc-400 text-sm font-medium">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
