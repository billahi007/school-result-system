const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('./school.db');

db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT,
    role TEXT,
    school_id INTEGER
)`);

db.exec(`CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    subdomain TEXT UNIQUE,
    plan TEXT DEFAULT 'basic'
)`);

const adminCheck = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@school.com');
if (!adminCheck) {
    db.exec(`INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ('admin@school.com', 'admin123', 'System Admin', 'admin')`);
}

app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.post('/api/login', (req, res) => {
    const { email, password, subdomain } = req.body;
    try {
        let user;
        if (subdomain) {
            const school = db.prepare('SELECT id FROM schools WHERE subdomain = ?').get(subdomain);
            if (school) {
                user = db.prepare('SELECT * FROM users WHERE email = ? AND school_id = ?').get(email, school.id);
            }
        }
        if (!user) {
            user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        }
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (password !== user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, role: user.role }, 'secret', { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});