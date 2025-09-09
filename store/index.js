// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const auth = require('./auth');

const app = express();
app.use(cookieParser());
app.use('/auth', auth);

// Beispiel: Gatekeeping per Cookie
app.get('/admin', (req, res, next) => {
  if (req.cookies.role !== 'admin') return res.redirect('/');
  next();
});

// … deine statischen Dateien / SPA
app.use(express.static('public')); // z. B. public/index.html

app.listen(3000, () => console.log('http://127.0.0.1:3000'));

