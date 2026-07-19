const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Create SQLite database
const db = new sqlite3.Database('./school.db');

// Create tables
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT,
    role TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    admission_no TEXT,
    class_id INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
)`);

// Insert default admin
db.run(`INSERT OR IGNORE INTO users (email, password_hash, full_name, role) 
        VALUES ('admin@school.com', 'admin123', 'System Admin', 'admin')`);

// Insert default subjects
db.run(`INSERT OR IGNORE INTO subjects (name) VALUES 
        ('Mathematics'), ('English'), ('Science'), ('Social Studies')`);

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (password !== user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, 'secret', { expiresIn: '24h' });
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.full_name, 
                email: user.email, 
                role: user.role 
            } 
        });
    });
});
// ============ REGISTER SCHOOL ============
app.post('/api/register-school', (req, res) => {
    const { schoolName, subdomain, adminEmail, adminPassword } = req.body;
    
    db.get('SELECT * FROM schools WHERE subdomain = ?', [subdomain], (err, school) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (school) {
            return res.status(400).json({ error: 'Subdomain already taken. Please choose another.' });
        }
        
        db.run('INSERT INTO schools (name, email, password_hash, subdomain, plan) VALUES (?, ?, ?, ?, ?)',
            [schoolName, adminEmail, adminPassword, subdomain, 'basic'],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create school' });
                }
                const schoolId = this.lastID;
                
                db.run('INSERT INTO users (email, password_hash, full_name, role, school_id) VALUES (?, ?, ?, ?, ?)',
                    [adminEmail, adminPassword, 'School Admin', 'admin', schoolId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to create admin user' });
                        }
                        res.json({ 
                            message: 'School registered successfully!', 
                            schoolId: schoolId 
                        });
                    });
            });
    });
});

// ============ UPDATED LOGIN WITH SCHOOL ============
app.post('/api/login', (req, res) => {
    const { email, password, subdomain } = req.body;
    
    db.get('SELECT id FROM schools WHERE subdomain = ?', [subdomain], (err, school) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!school) {
            return res.status(401).json({ error: 'School not found' });
        }
        
        db.get('SELECT * FROM users WHERE email = ? AND school_id = ?', [email, school.id], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            if (password !== user.password_hash) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const token = jwt.sign({ 
                id: user.id, 
                role: user.role, 
                school_id: school.id 
            }, 'secret', { expiresIn: '24h' });
            
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.full_name, 
                    email: user.email, 
                    role: user.role 
                } 
            });
        });
    });
});
// ============ REGISTER SCHOOL ============
app.post('/api/register-school', (req, res) => {
    const { schoolName, subdomain, adminEmail, adminPassword } = req.body;
    
    db.get('SELECT * FROM schools WHERE subdomain = ?', [subdomain], (err, school) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (school) {
            return res.status(400).json({ error: 'Subdomain already taken. Please choose another.' });
        }
        
        db.run('INSERT INTO schools (name, email, password_hash, subdomain, plan) VALUES (?, ?, ?, ?, ?)',
            [schoolName, adminEmail, adminPassword, subdomain, 'basic'],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create school' });
                }
                const schoolId = this.lastID;
                
                db.run('INSERT INTO users (email, password_hash, full_name, role, school_id) VALUES (?, ?, ?, ?, ?)',
                    [adminEmail, adminPassword, 'School Admin', 'admin', schoolId],
                    function(err) {
                        if (err) {
                            return res.status(500).json({ error: 'Failed to create admin user' });
                        }
                        res.json({ 
                            message: 'School registered successfully!', 
                            schoolId: schoolId 
                        });
                    });
            });
    });
});

// ============ UPDATED LOGIN WITH SCHOOL ============
app.post('/api/login', (req, res) => {
    const { email, password, subdomain } = req.body;
    
    db.get('SELECT id FROM schools WHERE subdomain = ?', [subdomain], (err, school) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!school) {
            return res.status(401).json({ error: 'School not found' });
        }
        
        db.get('SELECT * FROM users WHERE email = ? AND school_id = ?', [email, school.id], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            if (password !== user.password_hash) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const token = jwt.sign({ 
                id: user.id, 
                role: user.role, 
                school_id: school.id 
            }, 'secret', { expiresIn: '24h' });
            
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    name: user.full_name, 
                    email: user.email, 
                    role: user.role 
                } 
            });
        });
    });
});
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
    console.log('Database: school.db created');
});