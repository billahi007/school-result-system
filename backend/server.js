const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection (using Railway's environment variables)
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'school_result_system',
    port: process.env.MYSQL_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL database');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        if (password !== user.password_hash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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

// Register School
app.post('/api/register-school', (req, res) => {
    const { schoolName, subdomain, adminEmail, adminPassword } = req.body;
    
    db.query('INSERT INTO schools (name, email, password_hash, subdomain, plan) VALUES (?, ?, ?, ?, ?)',
        [schoolName, adminEmail, adminPassword, subdomain, 'basic'],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to create school' });
            }
            const schoolId = result.insertId;
            
            db.query('INSERT INTO users (email, password_hash, full_name, role, school_id) VALUES (?, ?, ?, ?, ?)',
                [adminEmail, adminPassword, 'School Admin', 'admin', schoolId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create admin' });
                    }
                    res.json({ message: 'School registered successfully!', schoolId });
                });
        });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});