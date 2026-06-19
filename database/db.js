/**
 * Database wrapper — provides better-sqlite3-like API over sql.js
 * Handles auto-save, prepared statements, and synchronous query interface.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let _db = null;
let _dbPath = '';
let _saveTimer = null;

function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (_db) {
      const data = _db.export();
      fs.writeFileSync(_dbPath, Buffer.from(data));
    }
  }, 200);
}

function saveNow() {
  if (_saveTimer) clearTimeout(_saveTimer);
  if (_db) {
    const data = _db.export();
    fs.writeFileSync(_dbPath, Buffer.from(data));
  }
}

async function initDatabase(dbPath) {
  _dbPath = dbPath;
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  
  _db.run('PRAGMA journal_mode = WAL');
  _db.run('PRAGMA foreign_keys = ON');
  
  return createWrapper();
}

function createWrapper() {
  return {
    exec(sql) {
      _db.run(sql);
      scheduleSave();
    },
    
    prepare(sql) {
      return {
        run(...params) {
          _db.run(sql, params);
          scheduleSave();
          const lastId = _db.exec('SELECT last_insert_rowid() as id')[0];
          const changes = _db.getRowsModified();
          return {
            lastInsertRowid: lastId ? lastId.values[0][0] : 0,
            changes
          };
        },
        get(...params) {
          let stmt;
          try {
            stmt = _db.prepare(sql);
            if (params.length > 0) stmt.bind(params);
            if (stmt.step()) {
              const cols = stmt.getColumnNames();
              const vals = stmt.get();
              const row = {};
              cols.forEach((c, i) => { row[c] = vals[i]; });
              return row;
            }
            return undefined;
          } finally {
            if (stmt) stmt.free();
          }
        },
        all(...params) {
          let stmt;
          try {
            stmt = _db.prepare(sql);
            if (params.length > 0) stmt.bind(params);
            const results = [];
            while (stmt.step()) {
              const cols = stmt.getColumnNames();
              const vals = stmt.get();
              const row = {};
              cols.forEach((c, i) => { row[c] = vals[i]; });
              results.push(row);
            }
            return results;
          } finally {
            if (stmt) stmt.free();
          }
        }
      };
    },
    
    transaction(fn) {
      return (...args) => {
        _db.run('BEGIN TRANSACTION');
        try {
          fn(...args);
          _db.run('COMMIT');
          scheduleSave();
        } catch (e) {
          _db.run('ROLLBACK');
          throw e;
        }
      };
    },

    close() {
      saveNow();
      if (_db) { _db.close(); _db = null; }
    },

    save() { saveNow(); }
  };
}

module.exports = { initDatabase, createWrapper };
