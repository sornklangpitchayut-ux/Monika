const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to handle JSON request bodies
app.use(express.json());

// Basic GET route
app.get('/', (req, res) => {
    res.json({ message: "Welcome to your local server!" });
});

// Basic POST route
app.post('/api/data', (req, res) => {
    const receivedData = req.body;
    res.status(201).json({
        status: "success",
        received: receivedData
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
