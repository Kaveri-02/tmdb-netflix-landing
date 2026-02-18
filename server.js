const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// SQLite database setup
const dbPath = path.join(__dirname, "users.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL
    )`
  );
});

app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Register endpoint
app.post("/api/register", (req, res) => {
  const { userId, username, email, phone, password } = req.body || {};

  if (!userId || !username || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long." });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  db.get(
    "SELECT 1 FROM users WHERE userId = ? OR username = ? OR email = ?",
    [userId, username, normalizedEmail],
    (err, row) => {
      if (err) {
        console.error("DB error checking existing user:", err);
        return res.status(500).json({ error: "Internal server error." });
      }

      if (row) {
        return res
          .status(409)
          .json({ error: "User ID, username, or email already exists." });
      }

      bcrypt.hash(password, 10, (hashErr, hash) => {
        if (hashErr) {
          console.error("Error hashing password:", hashErr);
          return res.status(500).json({ error: "Internal server error." });
        }

        db.run(
          `INSERT INTO users (userId, username, email, phone, password_hash)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, username, normalizedEmail, phone, hash],
          (insertErr) => {
            if (insertErr) {
              console.error("DB error inserting user:", insertErr);
              return res.status(500).json({ error: "Internal server error." });
            }

            return res
              .status(201)
              .json({ message: "Registration successful." });
          }
        );
      });
    }
  );
});

// Login endpoint (username + password)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, userRow) => {
      if (err) {
        console.error("DB error in login:", err);
        return res.status(500).json({ error: "Internal server error." });
      }

      if (!userRow) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      bcrypt.compare(password, userRow.password_hash, (cmpErr, isMatch) => {
        if (cmpErr) {
          console.error("Error comparing password:", cmpErr);
          return res.status(500).json({ error: "Internal server error." });
        }

        if (!isMatch) {
          return res.status(401).json({ error: "Invalid credentials." });
        }

        return res.json({ message: "Login successful." });
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

