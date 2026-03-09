import { Pool } from "pg";
import type { User } from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface IStorage {
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string): Promise<User>;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at?.toISOString(),
  };
}

class DbStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined;
  }

  async createUser(email: string, passwordHash: string): Promise<User> {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email.toLowerCase(), passwordHash]
    );
    return rowToUser(result.rows[0]);
  }
}

export const storage = new DbStorage();
