import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import ExcelJS from "exceljs";

const app = express();
app.use(cors());
app.use(express.json());

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

// ✅ Save Form Data
app.post("/submit", (req, res) => {
  const { firstName, lastName, email, company, product, message } = req.body;

  db.run(
    `INSERT INTO contacts (firstName, lastName, email, company, product, message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, email, company, product, message],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ success: true, message: "✅ Message saved successfully!" });
    }
  );
});

// ✅ Get all contacts for Admin Dashboard
app.get("/contacts", (req, res) => {
  db.all("SELECT * FROM contacts ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Export to Excel (Download Leads)
app.get("/export", (req, res) => {
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

// ✅ Record a website visit
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

// ✅ Get all page visit counts
app.get("/visits", (req, res) => {
  db.all("SELECT * FROM visits", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Backend Running on port ${PORT}`);
});

