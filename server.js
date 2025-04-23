// server.js
const fs      = require('fs');
const path    = require('path');
const express = require('express');
const http    = require('http');

const app    = express();
const server = http.createServer(app);
const io     = require('socket.io')(server);

const PORT      = 8080;
const DATA_FILE = path.join(__dirname, 'submissions.json');

// ─── middleware ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '200kb' }));          // <— JSON
app.use(express.urlencoded({ extended: true }));    // <— Form-URL-encoded

// ─── REST + WebSocket ─────────────────────────────────────────────────────────
app.post('/api/signup', (req, res) => {
  console.log('📨  Payload:', req.body);            // DEBUG

  const record = { ...req.body, createdAt: new Date().toISOString() };

  // сохраняем
  const list = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE))
    : [];
  list.push(record);
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));

  io.emit('new-submission', record);
  res.status(201).json({ ok: true });
});

io.on('connection', socket => {
  if (fs.existsSync(DATA_FILE)) {
    socket.emit('init', JSON.parse(fs.readFileSync(DATA_FILE)));
  }
});

server.listen(PORT, () =>
  console.log(`✅  Server running on http://localhost:${PORT}`)
);