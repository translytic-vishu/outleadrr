import { Pool } from "pg";
import type { User } from "../shared/schema.js";

export interface CampaignRecord {
  id: number;
  userId: number;
  name: string;
  businessType: string;
  location: string;
  totalLeads: number;
  sent: number;
  failed: number;
  createdAt: string;
}

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string): Promise<User>;
  createGoogleUser(email: string, googleId: string): Promise<User>;
  createCampaign(data: Omit<CampaignRecord, "id" | "createdAt">): Promise<CampaignRecord>;
  getCampaigns(userId: number): Promise<CampaignRecord[]>;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash ?? "",
    createdAt: row.created_at?.toISOString(),
  };
}

function rowToCampaign(row: any): CampaignRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    businessType: row.business_type,
    location: row.location,
    totalLeads: row.total_leads,
    sent: row.sent,
    failed: row.failed,
    createdAt: row.created_at?.toISOString?.() ?? row.created_at ?? "",
  };
}

/* ─── In-memory storage (no DATABASE_URL) ───────────────────────── */
class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private emailIndex = new Map<string, number>();
  private googleIndex = new Map<string, number>();
  private campaigns: CampaignRecord[] = [];
  private nextId = 1;
  private nextCampaignId = 1;

  async getUserById(id: number) { return this.users.get(id); }

  async getUserByEmail(email: string) {
    const id = this.emailIndex.get(email.toLowerCase());
    return id !== undefined ? this.users.get(id) : undefined;
  }

  async getUserByGoogleId(googleId: string) {
    const id = this.googleIndex.get(googleId);
    return id !== undefined ? this.users.get(id) : undefined;
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    const user: User = { id: this.nextId++, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  async createGoogleUser(email: string, googleId: string): Promise<User> {
    const existing = await this.getUserByEmail(email);
    if (existing) { this.googleIndex.set(googleId, existing.id); return existing; }
    const user: User = { id: this.nextId++, email: email.toLowerCase(), passwordHash: "", createdAt: new Date().toISOString() };
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    this.googleIndex.set(googleId, user.id);
    return user;
  }

  async createCampaign(data: Omit<CampaignRecord, "id" | "createdAt">): Promise<CampaignRecord> {
    const record: CampaignRecord = { ...data, id: this.nextCampaignId++, createdAt: new Date().toISOString() };
    this.campaigns.push(record);
    return record;
  }

  async getCampaigns(userId: number): Promise<CampaignRecord[]> {
    return this.campaigns.filter(c => c.userId === userId).sort((a, b) => b.id - a.id);
  }
}

/* ─── PostgreSQL storage (DATABASE_URL present) ──────────────────── */
class DbStorage implements IStorage {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.initCampaignsTable().catch(e => console.error("campaigns table init:", e));
  }

  private async initCampaignsTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        business_type TEXT NOT NULL DEFAULT '',
        location TEXT NOT NULL DEFAULT '',
        total_leads INTEGER NOT NULL DEFAULT 0,
        sent INTEGER NOT NULL DEFAULT 0,
        failed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const r = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return r.rows[0] ? rowToUser(r.rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const r = await this.pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    return r.rows[0] ? rowToUser(r.rows[0]) : undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const r = await this.pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
    return r.rows[0] ? rowToUser(r.rows[0]) : undefined;
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    const r = await this.pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email.toLowerCase(), passwordHash]
    );
    return rowToUser(r.rows[0]);
  }

  async createGoogleUser(email: string, googleId: string): Promise<User> {
    const r = await this.pool.query(
      "INSERT INTO users (email, google_id) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET google_id = $2 RETURNING *",
      [email.toLowerCase(), googleId]
    );
    return rowToUser(r.rows[0]);
  }

  async createCampaign(data: Omit<CampaignRecord, "id" | "createdAt">): Promise<CampaignRecord> {
    const r = await this.pool.query(
      `INSERT INTO campaigns (user_id, name, business_type, location, total_leads, sent, failed)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.userId, data.name, data.businessType, data.location, data.totalLeads, data.sent, data.failed]
    );
    return rowToCampaign(r.rows[0]);
  }

  async getCampaigns(userId: number): Promise<CampaignRecord[]> {
    const r = await this.pool.query(
      "SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return r.rows.map(rowToCampaign);
  }
}

/* Use Postgres in production, memory locally without a DB */
export const storage: IStorage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
