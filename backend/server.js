const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running!' });
});

app.get('/', (req, res) => {
    res.send('School Results System API');
});

app.listen(port, '0.0.0.0', () => {
    console.log('Server running on port', port);
});