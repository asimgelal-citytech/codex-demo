const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment. Did you create a .env file?');
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set, using a default value.');
}

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  store: new pgSession({
    pool,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
app.get("/", (req, res) => res.redirect("/login"));

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.post('/signup', upload.single('picture'), async (req, res) => {
  const { name, username, email, contact, password, confirmPassword, address } = req.body;
  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }
  try {
    await pool.query(
      'INSERT INTO users (name, username, email, contact, password, picture, address, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [name, username, email, contact, password, req.file ? req.file.filename : null, address, null]
    );
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user');
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username=$1 AND password=$2', [username, password]);
  const user = result.rows[0];
  if (user) {
    req.session.userId = user.id;
    res.redirect('/admin');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/admin', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/api/users', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const result = await pool.query('SELECT id, name, username, email, description FROM users');
  res.json(result.rows);
});

app.put('/api/users/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { description } = req.body;
  try {
    await pool.query('UPDATE users SET description=$1 WHERE id=$2', [description, req.params.id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating description');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
