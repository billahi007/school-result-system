const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('✅ School Results System API is running!');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Server running on port', PORT);
});