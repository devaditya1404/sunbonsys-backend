import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import ExcelJS from "exceljs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ Proper CORS for Render + Browser preflight
app.use(express.json());

app.use(cors({
  origin: [
    "https://sunbonsys.in",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Root Check Route
app.get("/", (req, res) => {
  res.send("✅ Sunbonsys Backend API is Running...");
});

// ✅ Connect SQLite Database
const db = new sqlite3.Database("database.sqlite", (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to SQLite Database");
  }
});

// ✅ Create Contacts Table if Not Exists
db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    company TEXT,
    product TEXT,
    message TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ✅ Create Table for Visit Counts
db.run(`
  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page TEXT UNIQUE,
    count INTEGER DEFAULT 0
  )
`);

// ✅ Create Admin Users Table
db.run(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  )
`, (err) => {
  if (err) {
    console.error("❌ Error creating admin_users table:", err);
  } else {
    console.log("✅ Admin users table ready");
  }
});

// ✅ Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// ✅ Rate limiter for login endpoint - max 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Login Endpoint
app.post('/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }

  db.get(
    'SELECT * FROM admin_users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Update last login
      db.run('UPDATE admin_users SET last_login = ? WHERE id = ?', 
        [new Date().toISOString(), user.id]);

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    }
  );
});

// ✅ Save Form Data (Public)
app.post("/submit", (req, res) => {
  const { firstName, lastName, email, company, product, message } = req.body;

  db.run(
    `INSERT INTO contacts (firstName, lastName, email, company, product, message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email, company, product, message],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ success: true });
    }
  );
});

// ✅ PROTECTED: Get all contacts for Admin Dashboard
app.get("/contacts", authenticateToken, (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ PROTECTED: Export to Excel
app.get("/export", authenticateToken, async (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY createdAt DESC", async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Company", key: "company", width: 20 },
      { header: "Product", key: "product", width: 25 },
      { header: "Message", key: "message", width: 40 },
      { header: "Created At", key: "createdAt", width: 25 }
    ];

    rows.forEach((row) => sheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=leads.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  });
});

// ✅ Record a website visit (Public)
app.post("/visit", (req, res) => {
  const { page } = req.body;

  db.get("SELECT count FROM visits WHERE page = ?", [page], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      db.run("UPDATE visits SET count = count + 1 WHERE page = ?", [page]);
    } else {
      db.run("INSERT INTO visits (page, count) VALUES (?, 1)", [page]);
    }

    res.json({ success: true });
  });
});

// ✅ Get all page visit counts (Public)
app.get("/visits", (req, res) => {
  db.all("SELECT * FROM visits", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Start Server (Render compatible)
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Backend Running on port ${PORT}`);
  console.log(`🔐 JWT Authentication: ${process.env.JWT_SECRET ? 'Enabled' : 'DISABLED - SET JWT_SECRET!'}`);
});
