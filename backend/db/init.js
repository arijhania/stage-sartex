const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) {
      console.error('Erreur schema:', err.message);
      process.exit(1);
    }
    console.log('Schema OK');

    db.exec(seed, (err2) => {
      if (err2) {
        console.error('Erreur seed:', err2.message);
        process.exit(1);
      }
      console.log('Seed OK');
      console.log('Base initialisée ->', dbPath);
      db.close();
    });
  });
});
