// index.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Statische Dateien (CSS, JS, Bilder …) aus "public" bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Index-Seite ausliefern
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

