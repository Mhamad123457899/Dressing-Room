import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("dressing_room.db");
db.pragma('foreign_keys = ON');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS clothes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    sizes TEXT NOT NULL, -- JSON array
    colors TEXT NOT NULL, -- JSON array
    age_group TEXT NOT NULL,
    weather TEXT NOT NULL,
    image_url TEXT,
    section TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    event_date TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS collection_items (
    collection_id INTEGER,
    clothing_id INTEGER,
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY(clothing_id) REFERENCES clothes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_image_url TEXT,
    company_name TEXT,
    company_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clothing_id INTEGER,
    client_id INTEGER,
    client_name TEXT, -- Keep for legacy or quick access
    client_phone TEXT, -- Keep for legacy or quick access
    size TEXT,
    color TEXT,
    rental_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME,
    status TEXT DEFAULT 'active', -- 'active' or 'returned'
    FOREIGN KEY(clothing_id) REFERENCES clothes(id) ON DELETE CASCADE,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
  );
`);

// Migration for rentals table (Add columns if they don't exist)
try {
  const rentalsInfo = db.prepare("PRAGMA table_info(rentals)").all() as any[];
  const columns = rentalsInfo.map(c => c.name);
  
  if (!columns.includes('client_id')) {
    db.prepare("ALTER TABLE rentals ADD COLUMN client_id INTEGER").run();
    console.log("Added client_id column to rentals table");
  }
  if (!columns.includes('client_name')) {
    db.prepare("ALTER TABLE rentals ADD COLUMN client_name TEXT").run();
    console.log("Added client_name column to rentals table");
  }
  if (!columns.includes('client_phone')) {
    db.prepare("ALTER TABLE rentals ADD COLUMN client_phone TEXT").run();
    console.log("Added client_phone column to rentals table");
  }
  if (!columns.includes('returned_at')) {
    db.prepare("ALTER TABLE rentals ADD COLUMN returned_at DATETIME").run();
    console.log("Added returned_at column to rentals table");
  }
  
  const collectionsInfo = db.prepare("PRAGMA table_info(collections)").all() as any[];
  const collectionColumns = collectionsInfo.map(c => c.name);
  if (!collectionColumns.includes('image_url')) {
    db.prepare("ALTER TABLE collections ADD COLUMN image_url TEXT").run();
    console.log("Added image_url column to collections table");
  }
} catch (err) {
  console.error("Migration error:", err);
}

// Seed initial data if empty
const clothesCount = db.prepare("SELECT COUNT(*) as count FROM clothes").get() as { count: number };
if (clothesCount.count === 0) {
  const seedClothes = [
    {
      name: "Midnight Blazer",
      type: "Blazer",
      model: "Slim Fit",
      sizes: ["S", "M", "L", "XL"],
      color: "Black",
      age_group: "Adults",
      weather: "Cold",
      image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "Classic White Tee",
      type: "T-shirt",
      model: "Casual",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      color: "White",
      age_group: "All Ages",
      weather: "Hot",
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "Urban Cargo Pants",
      type: "Pants",
      model: "Modern",
      sizes: ["30", "32", "34", "36"],
      color: "Olive",
      age_group: "Teens",
      weather: "All Weather",
      image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "Formal Tuxedo",
      type: "Suit",
      model: "Formal",
      sizes: ["46", "48", "50", "52"],
      color: "Navy",
      age_group: "Adults",
      weather: "Cold",
      image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "Vintage Floral Dress",
      type: "Dress",
      model: "Vintage",
      sizes: ["S", "M", "L"],
      color: "Floral",
      age_group: "Adults",
      weather: "Hot",
      image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800"
    },
    {
      name: "Leather Biker Jacket",
      type: "Jacket",
      model: "Oversized",
      sizes: ["M", "L", "XL"],
      color: "Brown",
      age_group: "Adults",
      weather: "Cold",
      image_url: "https://images.unsplash.com/photo-1551028719-00167b16e7ac?auto=format&fit=crop&q=80&w=800"
    }
  ];

  const insertCloth = db.prepare(`
    INSERT INTO clothes (name, type, model, sizes, colors, age_group, weather, image_url, section)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cloth of seedClothes) {
    insertCloth.run(
      cloth.name, 
      cloth.type, 
      cloth.model, 
      JSON.stringify(cloth.sizes), 
      cloth.color, 
      cloth.age_group, 
      cloth.weather, 
      cloth.image_url,
      "A"
    );
  }

  db.prepare("INSERT INTO collections (name, event_date, description) VALUES (?, ?, ?)")
    .run("Summer Gala 2024", "2024-07-15", "Elegant outfits for the annual summer gala event.");
}

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // Auth Middleware (Simple for this demo)
  const ADMIN_PASSWORD = "Mhamad18";

  // API Routes
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    console.log(`Login attempt with: '${password}' Expected: '${ADMIN_PASSWORD}'`);
    
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const normalizedInput = password.trim();
    const normalizedAdmin = ADMIN_PASSWORD.trim();

    if (normalizedInput === normalizedAdmin) {
      res.json({ success: true, token: "fake-jwt-token" });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.get("/api/clothes", (req, res) => {
    const clothes = db.prepare("SELECT * FROM clothes ORDER BY created_at DESC").all();
    res.json(clothes.map(c => ({
      ...c,
      sizes: JSON.parse(c.sizes as string),
      color: c.colors
    })));
  });

  app.post("/api/clothes", (req, res) => {
    const { name, type, model, sizes, color, age_group, weather, image_url, section } = req.body;
    const stmt = db.prepare(`
      INSERT INTO clothes (name, type, model, sizes, colors, age_group, weather, image_url, section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, type, model, JSON.stringify(sizes), color, age_group, weather, image_url, section || "A");
    res.json({ id: info.lastInsertRowid, success: true });
  });

  app.put("/api/clothes/:id", (req, res) => {
    const { name, type, model, sizes, color, age_group, weather, image_url, section } = req.body;
    const stmt = db.prepare(`
      UPDATE clothes 
      SET name = ?, type = ?, model = ?, sizes = ?, colors = ?, age_group = ?, weather = ?, image_url = ?, section = ?
      WHERE id = ?
    `);
    stmt.run(name, type, model, JSON.stringify(sizes), color, age_group, weather, image_url, section || "A", req.params.id);
    res.json({ success: true });
  });

  app.get("/api/collections", (req, res) => {
    const collections = db.prepare("SELECT * FROM collections").all();
    res.json(collections);
  });

  app.post("/api/collections", (req, res) => {
    const { name, event_date, description, image_url } = req.body;
    const stmt = db.prepare("INSERT INTO collections (name, event_date, description, image_url) VALUES (?, ?, ?, ?)");
    const info = stmt.run(name, event_date, description, image_url);
    res.json({ id: info.lastInsertRowid, success: true });
  });

  app.put("/api/collections/:id", (req, res) => {
    const { name, event_date, description, image_url } = req.body;
    const stmt = db.prepare("UPDATE collections SET name = ?, event_date = ?, description = ?, image_url = ? WHERE id = ?");
    stmt.run(name, event_date, description, image_url, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/collections/:id/items", (req, res) => {
    const items = db.prepare(`
      SELECT c.* FROM clothes c
      JOIN collection_items ci ON c.id = ci.clothing_id
      WHERE ci.collection_id = ?
    `).all(req.params.id);
    res.json(items.map(c => ({
      ...c,
      sizes: JSON.parse(c.sizes as string),
      color: c.colors
    })));
  });

  app.post("/api/collections/:id/items", (req, res) => {
    const { clothing_id } = req.body;
    const existing = db.prepare("SELECT * FROM collection_items WHERE collection_id = ? AND clothing_id = ?").get(req.params.id, clothing_id);
    if (existing) {
      return res.status(400).json({ message: "Item already in collection" });
    }
    const stmt = db.prepare("INSERT INTO collection_items (collection_id, clothing_id) VALUES (?, ?)");
    stmt.run(req.params.id, clothing_id);
    res.json({ success: true });
  });

  app.delete("/api/collections/:id/items/:clothing_id", (req, res) => {
    const stmt = db.prepare("DELETE FROM collection_items WHERE collection_id = ? AND clothing_id = ?");
    stmt.run(req.params.id, req.params.clothing_id);
    res.json({ success: true });
  });

  app.delete("/api/clothes/:id", (req, res) => {
    db.prepare("DELETE FROM rentals WHERE clothing_id = ?").run(req.params.id);
    db.prepare("DELETE FROM collection_items WHERE clothing_id = ?").run(req.params.id);
    db.prepare("DELETE FROM clothes WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/collections/:id", (req, res) => {
    db.prepare("DELETE FROM collection_items WHERE collection_id = ?").run(req.params.id);
    db.prepare("DELETE FROM collections WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Client Routes
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY full_name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { full_name, phone, id_image_url, company_name, company_phone } = req.body;
    const stmt = db.prepare(`
      INSERT INTO clients (full_name, phone, id_image_url, company_name, company_phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(full_name, phone, id_image_url, company_name, company_phone);
    res.json({ id: info.lastInsertRowid, success: true });
  });

  app.put("/api/clients/:id", (req, res) => {
    const { full_name, phone, id_image_url, company_name, company_phone } = req.body;
    const stmt = db.prepare(`
      UPDATE clients 
      SET full_name = ?, phone = ?, id_image_url = ?, company_name = ?, company_phone = ?
      WHERE id = ?
    `);
    stmt.run(full_name, phone, id_image_url, company_name, company_phone, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", (req, res) => {
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/rentals", (req, res) => {
    const rentals = db.prepare(`
      SELECT r.*, c.name as clothing_name, c.image_url, 
             cl.full_name as client_full_name, cl.phone as client_phone_number
      FROM rentals r
      JOIN clothes c ON r.clothing_id = c.id
      LEFT JOIN clients cl ON r.client_id = cl.id
      ORDER BY r.rental_date DESC
    `).all();
    res.json(rentals);
  });

  app.post("/api/rentals", (req, res) => {
    try {
      const { clothing_id, client_id, client_name, client_phone, size, color } = req.body;
      
      if (!clothing_id) {
        return res.status(400).json({ success: false, message: "Missing clothing_id" });
      }

      console.log("Creating rental:", { clothing_id, client_id, client_name, client_phone, size, color });

      const stmt = db.prepare(`
        INSERT INTO rentals (clothing_id, client_id, client_name, client_phone, size, color) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(clothing_id, client_id, client_name, client_phone, size, color);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (err: any) {
      console.error("Error creating rental:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/rentals/:id/return", (req, res) => {
    const stmt = db.prepare("UPDATE rentals SET status = 'returned', returned_at = CURRENT_TIMESTAMP WHERE id = ?");
    const info = stmt.run(req.params.id);
    res.json({ success: info.changes > 0 });
  });

  app.put("/api/rentals/:id", (req, res) => {
    const { client_id, size, color, status } = req.body;
    const stmt = db.prepare(`
      UPDATE rentals 
      SET client_id = ?, size = ?, color = ?, status = ?
      WHERE id = ?
    `);
    const info = stmt.run(client_id, size, color, status || 'active', req.params.id);
    res.json({ success: info.changes > 0 });
  });

  app.delete("/api/rentals/:id", (req, res) => {
    const info = db.prepare("DELETE FROM rentals WHERE id = ?").run(req.params.id);
    res.json({ success: info.changes > 0 });
  });

  // API 404 handler - must be before SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ 
      success: false, 
      message: `API route not found: ${req.method} ${req.url}` 
    });
  });

  // Global Error Handler to ensure JSON responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: process.env.NODE_ENV === 'production' ? {} : err.message 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Cleanup old rentals (older than 30 days)
    setInterval(() => {
      try {
        const info = db.prepare(`
          DELETE FROM rentals 
          WHERE status = 'returned' 
          AND returned_at < datetime('now', '-30 days')
        `).run();
        if (info.changes > 0) {
          console.log(`Cleaned up ${info.changes} old rental records.`);
        }
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }, 1000 * 60 * 60 * 24); // Run once a day
  });
}

startServer();
