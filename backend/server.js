const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// Create SQLite database
const db = new Database('./school.db');

// Create tables if they don't exist
db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT,
    role TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    admission_no TEXT,
    class_id INTEGER
)`);

db.exec(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    subdomain TEXT UNIQUE,
    logo TEXT,
    plan TEXT DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Insert default admin if not exists
const adminCheck = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@school.com');
if (!adminCheck) {
    db.exec(`INSERT INTO users (email, password_hash, full_name, role) 
             VALUES ('admin@school.com', 'admin123', 'System Admin', 'admin')`);
}

// Insert default subjects if not exists
const subjectCheck = db.prepare('SELECT * FROM subjects WHERE name = ?').get('Mathematics');
if (!subjectCheck) {
    db.exec(`INSERT INTO subjects (name) VALUES 
             ('Mathematics'), ('English'), ('Science'), ('Social Studies')`);
}

// Register School
app.post('/api/register-school', (req, res) => {
    const { schoolName, subdomain, adminEmail, adminPassword } = req.body;
    
    try {
        // Check if subdomain is available
        const existingSchool = db.prepare('SELECT * FROM schools WHERE subdomain = ?').get(subdomain);
        if (existingSchool) {
            return res.status(400).json({ error: 'Subdomain already taken' });
        }
        
        // Create school
        const schoolResult = db.prepare(`INSERT INTO schools (name, email, password_hash, subdomain, plan) 
                                        VALUES (?, ?, ?, ?, ?)`).run(schoolName, adminEmail, adminPassword, subdomain, 'basic');
        const schoolId = schoolResult.lastInsertRowid;
        
        // Create admin user for this school
        db.prepare(`INSERT INTO users (email, password_hash, full_name, role, school_id) 
                    VALUES (?, ?, ?, ?, ?)`).run(adminEmail, adminPassword, 'School Admin', 'admin', schoolId);
        
        res.json({ message: 'School registered successfully!', schoolId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create school' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password, subdomain } = req.body;
    
    try {
        // Get school ID from subdomain
        const school = db.prepare('SELECT id FROM schools WHERE subdomain = ?').get(subdomain);
        if (!school) {
            return res.status(401).json({ error: 'School not found' });
        }
        
        // Check user belongs to this school
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND school_id = ?').get(email, school.id);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (password !== user.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, role: user.role, school_id: school.id }, 'secret', { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});