INSERT INTO Atelier (nom) VALUES ('Atelier A'), ('Atelier B'), ('Atelier C');

-- Machines "en stock" (x=0,y=0) -> visibles dans la sidebar
INSERT INTO Machine (code, nom, status, program, x, y, atelier_id)
VALUES
  ('CNC-01', 'CNC Fanuc', 'stopped', 'P-001', 0, 0, 1),
  ('WLD-02', 'Soudure MIG', 'idle', 'W-100', 0, 0, 1),
  ('PRT-03', 'Presse 30T', 'running', 'PR-22', 0, 0, 2),
  ('ASM-04', 'Robot Assembly', 'error', 'RB-9', 0, 0, 3);

-- Machines déjà sur canvas (x,y != 0)
INSERT INTO Machine (code, nom, status, program, x, y, atelier_id)
VALUES
  ('CNC-05', 'CNC Haas', 'running', 'P-222', 200, 120, 1),
  ('PKG-06', 'Emballage', 'idle', 'PK-5', 380, 80, 2);
