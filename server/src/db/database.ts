/**
 * SQLite Database Service
 * Handles asset metadata caching for Lingo Island
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { AssetRecord, AssetInsert } from '../types/index.js';

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService | null = null;

  private constructor(dbPath: string) {
    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  /**
   * Get singleton instance of DatabaseService
   */
  static getInstance(dbPath?: string): DatabaseService {
    if (!DatabaseService.instance) {
      const finalPath = dbPath || process.env.DATABASE_PATH || './data/lingo-island.db';
      DatabaseService.instance = new DatabaseService(finalPath);
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    // Create assets table for caching 3D model metadata
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        style TEXT NOT NULL,
        local_url TEXT NOT NULL,
        meshy_task_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(keyword, style)
      );

      CREATE INDEX IF NOT EXISTS idx_assets_keyword ON assets(keyword);
      CREATE INDEX IF NOT EXISTS idx_assets_style ON assets(style);
      CREATE INDEX IF NOT EXISTS idx_assets_keyword_style ON assets(keyword, style);
    `);

    console.log('[DB] Database tables initialized');
  }

  /**
   * Find an asset by keyword and style
   */
  findAsset(keyword: string, style: string): AssetRecord | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM assets 
      WHERE keyword = ? AND style = ?
    `);
    return stmt.get(keyword.toLowerCase(), style) as AssetRecord | undefined;
  }

  /**
   * Find an asset by keyword only (returns first match)
   */
  findAssetByKeyword(keyword: string): AssetRecord | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM assets 
      WHERE keyword = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get(keyword.toLowerCase()) as AssetRecord | undefined;
  }

  /**
   * Insert a new asset record
   */
  insertAsset(asset: AssetInsert): AssetRecord {
    const stmt = this.db.prepare(`
      INSERT INTO assets (keyword, style, local_url, meshy_task_id)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      asset.keyword.toLowerCase(),
      asset.style,
      asset.local_url,
      asset.meshy_task_id || null
    );

    return this.getAssetById(result.lastInsertRowid as number)!;
  }

  /**
   * Update an existing asset record
   */
  updateAsset(id: number, updates: Partial<AssetInsert>): AssetRecord | undefined {
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (updates.keyword !== undefined) {
      fields.push('keyword = ?');
      values.push(updates.keyword.toLowerCase());
    }
    if (updates.style !== undefined) {
      fields.push('style = ?');
      values.push(updates.style);
    }
    if (updates.local_url !== undefined) {
      fields.push('local_url = ?');
      values.push(updates.local_url);
    }
    if (updates.meshy_task_id !== undefined) {
      fields.push('meshy_task_id = ?');
      values.push(updates.meshy_task_id);
    }

    if (fields.length === 0) return this.getAssetById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(String(id));

    const stmt = this.db.prepare(`
      UPDATE assets 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.getAssetById(id);
  }

  /**
   * Get asset by ID
   */
  getAssetById(id: number): AssetRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM assets WHERE id = ?');
    return stmt.get(id) as AssetRecord | undefined;
  }

  /**
   * Get all assets
   */
  getAllAssets(): AssetRecord[] {
    const stmt = this.db.prepare('SELECT * FROM assets ORDER BY created_at DESC');
    return stmt.all() as AssetRecord[];
  }

  /**
   * Delete an asset by ID
   */
  deleteAsset(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM assets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Check if asset exists
   */
  assetExists(keyword: string, style: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM assets 
      WHERE keyword = ? AND style = ?
      LIMIT 1
    `);
    return stmt.get(keyword.toLowerCase(), style) !== undefined;
  }

  /**
   * Get asset count
   */
  getAssetCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM assets');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Search assets by keyword pattern
   */
  searchAssets(pattern: string): AssetRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM assets 
      WHERE keyword LIKE ?
      ORDER BY created_at DESC
    `);
    return stmt.all(`%${pattern.toLowerCase()}%`) as AssetRecord[];
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    DatabaseService.instance = null;
    console.log('[DB] Database connection closed');
  }
}

export default DatabaseService;
