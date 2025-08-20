PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Atelier (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  nom  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Machine (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL,
  nom         TEXT NOT NULL,
  status      TEXT DEFAULT 'stopped',  -- running | stopped | idle | error
  program     TEXT,
  x           INTEGER DEFAULT 0,
  y           INTEGER DEFAULT 0,
  atelier_id  INTEGER,
  FOREIGN KEY (atelier_id) REFERENCES Atelier(id) ON DELETE CASCADE
);
