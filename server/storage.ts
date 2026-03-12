import { Pool } from "pg";
import type { User } from "@shared/schema";

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string): Promise<User>;
  createGoogleUser(email: string, googleId: string): Promise<User>;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash ?? "",
    createdAt: row.created_at?.toISOString(),
  };
}

/* ─── In-memory storage (no DATABASE_URL) ───────────────────────── */
class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private emailIndex = new Map<string, number>();
  private googleIndex = new Map<string, number>();
  private nextId = 1;

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
}

/* ─── PostgreSQL storage (DATABASE_URL present) ──────────────────── */
class DbStorage implements IStorage {
  private pool: Pool;
  constructor() { this.pool = new Pool({ connectionString: process.env.DATABASE_URL }); }

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
}

/* Use Postgres in production, memory locally without a DB */
export const storage: IStorage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
