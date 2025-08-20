const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'db', 'database.sqlite'));

// -------------------- Health --------------------
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// -------------------- Ateliers --------------------
// GET tous les ateliers
app.get('/api/ateliers', (req, res) => {
  db.all('SELECT * FROM Atelier ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST ajouter atelier
app.post('/api/ateliers', (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ error: 'nom requis' });

  db.run('INSERT INTO Atelier (nom) VALUES (?)', [nom], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nom });
  });
});

// PUT modifier atelier
app.put('/api/ateliers/:id', (req, res) => {
  const { nom } = req.body;
  const { id } = req.params;
  if (!nom) return res.status(400).json({ error: 'nom requis' });

  db.run('UPDATE Atelier SET nom = ? WHERE id = ?', [nom, id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Atelier non trouvé' });
    res.json({ updated: this.changes });
  });
});

// DELETE supprimer atelier
app.delete('/api/ateliers/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM Atelier WHERE id = ?', [id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Atelier non trouvé' });
    res.json({ deleted: this.changes });
  });
});

// -------------------- Machines --------------------
// GET machines avec filtres: atelierId et scope
app.get('/api/machines', (req, res) => {
  const { atelierId, scope = 'all' } = req.query;
  const where = [];
  const params = [];

  if (atelierId) {
    where.push('atelier_id = ?');
    params.push(atelierId);
  }

  if (scope === 'sidebar') {
    where.push('x = 0 AND y = 0');
  } else if (scope === 'canvas') {
    where.push('NOT (x = 0 AND y = 0)');
  }

  const sql = `SELECT * FROM Machine ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET machine par id
app.get('/api/machines/:id', (req, res) => {
  db.get('SELECT * FROM Machine WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Machine non trouvée' });
    res.json(row);
  });
});

// POST ajouter machine
app.post('/api/machines', (req, res) => {
  const { code, nom, status = 'stopped', program = null, x = 0, y = 0, atelier_id } = req.body;
  if (!code || !nom || !atelier_id) {
    return res.status(400).json({ error: 'code, nom, atelier_id requis' });
  }

  const sql = `INSERT INTO Machine (code, nom, status, program, x, y, atelier_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [code, nom, status, program, x, y, atelier_id];

  db.run(sql, params, function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, code, nom, status, program, x, y, atelier_id });
  });
});

// PUT modifier machine
app.put('/api/machines/:id', (req, res) => {
  const { code, nom, status, program, x, y, atelier_id } = req.body;
  const sets = [];
  const params = [];

  if(code !== undefined){ sets.push('code = ?'); params.push(code); }
  if(nom !== undefined){ sets.push('nom = ?'); params.push(nom); }
  if(status !== undefined){ sets.push('status = ?'); params.push(status); }
  if(program !== undefined){ sets.push('program = ?'); params.push(program); }
  if(x !== undefined){ sets.push('x = ?'); params.push(x); }
  if(y !== undefined){ sets.push('y = ?'); params.push(y); }
  if(atelier_id !== undefined){ sets.push('atelier_id = ?'); params.push(atelier_id); }

  if(sets.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

  params.push(req.params.id);
  const sql = `UPDATE Machine SET ${sets.join(', ')} WHERE id = ?`;

  db.run(sql, params, function(err){
    if(err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// DELETE machine
app.delete('/api/machines/:id', (req, res) => {
  db.run('DELETE FROM Machine WHERE id = ?', [req.params.id], function(err){
    if(err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// -------------------- Serveur --------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`API dispo sur http://localhost:${PORT}`));
