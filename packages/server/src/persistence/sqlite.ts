import Database from 'better-sqlite3';
import { Package, PackageRepository } from './interface.js';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

export class SQLitePackageRepository implements PackageRepository {
  private db: Database.Database;

  constructor(dbPath: string) {
    try {
      const resolvedPath = resolve(dbPath);
      const dir = dirname(resolvedPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Open database with specific flags for better concurrency
      this.db = new Database(resolvedPath, {
        verbose: console.log, // Optional: see SQL queries
        fileMustExist: false
      });
      
      // Force WAL mode and optimize for concurrent access
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL'); 
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');
      this.db.pragma('mmap_size = 268435456'); // 256MB
      
      console.log(`SQLite: Database opened with WAL mode`);
      console.log(`SQLite: Journal mode: ${this.db.pragma('journal_mode', { simple: true })}`);
      
      this.initializeDatabase();
    } catch (error) {
      console.error('SQLite initialization error:', error);
      throw error;
    }
  }

  private initializeDatabase() {
    const createTable = `
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        unique_name TEXT UNIQUE NOT NULL,
        command TEXT NOT NULL,
        args TEXT NOT NULL,
        env TEXT NOT NULL,
        installed_at TEXT NOT NULL
      )
    `;
    this.db.exec(createTable);
  }

  async create(pkg: Omit<Package, 'id' | 'installedAt'>): Promise<Package> {
    const id = randomUUID();
    const installedAt = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO packages (id, unique_name, command, args, env, installed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      pkg.uniqueName,
      pkg.command,
      JSON.stringify(pkg.args),
      JSON.stringify(pkg.env),
      installedAt
    );

    return {
      id,
      uniqueName: pkg.uniqueName,
      command: pkg.command,
      args: pkg.args,
      env: pkg.env,
      installedAt
    };
  }

  async findByUniqueName(uniqueName: string): Promise<Package | null> {
    const stmt = this.db.prepare('SELECT * FROM packages WHERE unique_name = ?');
    const row = stmt.get(uniqueName) as any;

    if (!row) return null;

    return {
      id: row.id,
      uniqueName: row.unique_name,
      command: row.command,
      args: JSON.parse(row.args),
      env: JSON.parse(row.env),
      installedAt: row.installed_at
    };
  }

  async findAll(): Promise<Package[]> {
    const stmt = this.db.prepare('SELECT * FROM packages ORDER BY installed_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      uniqueName: row.unique_name,
      command: row.command,
      args: JSON.parse(row.args),
      env: JSON.parse(row.env),
      installedAt: row.installed_at
    }));
  }

  async deleteByUniqueName(uniqueName: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM packages WHERE unique_name = ?');
    const result = stmt.run(uniqueName);
    return result.changes > 0;
  }

  async count(): Promise<number> {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM packages');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  close() {
    this.db.close();
  }
}