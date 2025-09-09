// auth.js
const express = require('express');
const router = express.Router();

router.get('/set-role', (req, res) => {
  const role = (req.query.role || '').toLowerCase();
  const next = req.query.next || '/';
  const allowed = ['user', 'admin'];
  if (!allowed.includes(role)) return res.status(400).send('invalid role');

  // Cookie setzen – HttpOnly wenn Server lesen soll, sonst clientseitig zugänglich
  res.cookie('role', role, {
    httpOnly: true,     // true: nur Server; false: Client JS kann lesen
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 3600 * 1000
  });

  return res.redirect(next);
});

module.exports = router;

