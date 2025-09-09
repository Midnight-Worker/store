// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');

const app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

const db = mysql.createPool({
  host: '127.0.0.1', user: 'root', password: '***', database: 'b7store',
  waitForConnections: true, connectionLimit: 5
});

// --- Role guard ---
function requireRole(role) {
  return (req, res, next) => {
    const r = (req.cookies.role || 'user').toLowerCase();
    if (r !== role) return res.redirect('/');
    next();
  };
}

// --- Page routes (Shell) ---
app.get('/item/:code', (req, res) => {
  res.render('item', { role: (req.cookies.role || 'user'), code: req.params.code });
});
app.get('/admin/item/:code', requireRole('admin'), (req, res) => {
  res.render('item', { role: 'admin', code: req.params.code });
});

// --- Data lookup ---
const ITEM_SQL = `
SELECT i.item_id, i.code, i.name, i.notes,
       c.category_id, c.name AS category_name, c.description AS category_description
FROM items i
JOIN categories c ON c.category_id = i.category_id
WHERE (i.code = ? OR i.item_id = CAST(? AS UNSIGNED))
LIMIT 1
`;

const STOCK_SQL = `
SELECT s.stock_id, s.quantity, s.unit,
       l.location_id, l.code AS location_code, l.description AS location_description
FROM stock s
JOIN locations l ON l.location_id = s.location_id
WHERE s.item_id = ?
ORDER BY l.code
`;

const SCREW_SQL = `
SELECT diameter, length_mm, head_type, drive
FROM screws WHERE item_id = ?
`;

const ROD_SQL = `
SELECT diameter, length_mm, material, finish
FROM threaded_rods WHERE item_id = ?
`;

// --- JSON: Item details ---
app.get('/api/item/:code', async (req, res) => {
  const code = req.params.code;
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(ITEM_SQL, [code, code]);
    if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
    const item = rows[0];

    const [[screwRows], [rodRows], [stockRows]] = await Promise.all([
      conn.query(SCREW_SQL, [item.item_id]),
      conn.query(ROD_SQL,   [item.item_id]),
      conn.query(STOCK_SQL, [item.item_id]),
    ]);

    item.type = screwRows.length ? 'screw' : (rodRows.length ? 'rod' : 'generic');
    item.screw = screwRows[0] || null;
    item.rod   = rodRows[0]   || null;
    item.stock = stockRows; // Liste der Standorte & Mengen

    return res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  } finally {
    conn.release();
  }
});

// --- Admin: Bestand aktualisieren (ein Beispiel) ---
app.post('/api/item/:code/stock', requireRole('admin'), async (req, res) => {
  const { location_id, quantity } = req.body;
  const code = req.params.code;
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query(ITEM_SQL, [code, code]);
    if (rows.length === 0) return res.status(404).json({ error: 'not_found' });
    const item_id = rows[0].item_id;

    await conn.query(
      `UPDATE stock SET quantity = ? WHERE item_id = ? AND location_id = ?`,
      [quantity, item_id, location_id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  } finally {
    conn.release();
  }
});

// Admin-Startseite
app.get('/admin', requireRole('admin'), async (req, res) => {
  try {
    const [[{ items }]]        = await db.query('SELECT COUNT(*) AS items FROM items');
    const [[{ locations }]]    = await db.query('SELECT COUNT(*) AS locations FROM locations');
    const [[{ stock_positions }]] = await db.query('SELECT COUNT(*) AS stock_positions FROM stock');
    const [[{ out_of_stock }]] = await db.query('SELECT COUNT(*) AS out_of_stock FROM stock WHERE quantity <= 0');

    res.render('admin_home', {
      role: 'admin',
      kpis: { items, locations, stock_positions, out_of_stock }
    });
  } catch (e) {
    console.error(e);
    res.render('admin_home', { role: 'admin', kpis: null });
  }
});

// Beispiel: Item-Page (wie gehabt)
app.get('/admin/item/:code', requireRole('admin'), (req, res) => {
  res.render('item', { role: 'admin', code: req.params.code });
});




app.listen(3000, () => console.log('http://127.0.0.1:3000'));

