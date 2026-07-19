const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Login (NO DATABASE - just hardcoded for now)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Hardcoded users for testing
    const users = {
        'admin@school.com': { password: 'admin123', name: 'System Admin', role: 'admin' },
        'teacher@school.com': { password: 'teacher123', name: 'Mr. John Doe', role: 'teacher' },
        'classteacher@school.com': { password: 'teacher123', name: 'Mrs. Jane Smith', role: 'class_teacher' },
        'parent@school.com': { password: 'parent123', name: 'Mr. Adeola', role: 'parent' },
        'student@school.com': { password: 'student123', name: 'Adeola Kunle', role: 'student' }
    };
    
    const user = users[email];
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
        token: 'dummy-token-12345',
        user: { id: 1, name: user.name, email: email, role: user.role }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});