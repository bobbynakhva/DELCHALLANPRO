import { randomBytes } from "node:crypto";
import { hashPassword } from "@better-auth/utils/password";
import { getSql, type Sql } from "@/lib/db";
import { DEMO_PASSWORD, DEMO_USERS, PERMS, type Role } from "./constants";
import { n } from "./format";

export type Staff = {
  id: number;
  user_id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

let seedPromise: Promise<void> | null = null;

export async function erpSql(): Promise<Sql> {
  const sql = await getSql();
  seedPromise ??= seedDemoUsers(sql).catch((err) => {
    seedPromise = null;
    throw err;
  });
  await seedPromise;
  return sql;
}

async function seedDemoUsers(sql: Sql): Promise<void> {
  for (const u of DEMO_USERS) {
    const existing = await sql.query<{ id: string }>(
      `select id from "user" where email = $1`,
      [u.email],
    );
    let userId = existing[0]?.id;
    if (!userId) {
      userId = randomBytes(16).toString("hex");
      const password = await hashPassword(DEMO_PASSWORD);
      const now = new Date();
      await sql.query(
        `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         values ($1, $2, $3, true, $4, $4)`,
        [userId, u.name, u.email, now],
      );
      await sql.query(
        `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         values ($1, $2, 'credential', $3, $4, $5, $5)`,
        [randomBytes(16).toString("hex"), userId, userId, password, now],
      );
    }
    const staff = await sql.query<{ id: number }>(
      `select id from staff where email = $1`,
      [u.email],
    );
    if (!staff[0]) {
      await sql.query(
        `insert into staff (user_id, name, email, role, active) values ($1, $2, $3, $4, true)
         on conflict (user_id) do nothing`,
        [userId, u.name, u.email, u.role],
      );
    } else {
      await sql.query(`update staff set user_id = $1, role = $2, name = $3 where email = $4`, [
        userId,
        u.role,
        u.name,
        u.email,
      ]);
    }
  }
}

export async function requireStaff(userId: string): Promise<Staff> {
  const sql = await erpSql();
  const rows = await sql.query<Staff>(
    `select id, user_id, name, email, role, active from staff where user_id = $1 and active = true`,
    [userId],
  );
  if (rows[0]) return rows[0];
  const user = await sql.query<{ id: string; name: string; email: string }>(
    `select id, name, email from "user" where id = $1`,
    [userId],
  );
  const u = user[0];
  const name = u?.name || "Grok viewer";
  const email = u?.email || `${userId}@tambaerp.in`;
  await sql.query(
    `insert into staff (user_id, name, email, role, active) values ($1, $2, $3, 'OWNER', true)
     on conflict (user_id) do nothing`,
    [userId, name, email],
  );
  const again = await sql.query<Staff>(
    `select id, user_id, name, email, role, active from staff where user_id = $1`,
    [userId],
  );
  if (!again[0]) throw new Error("Could not provision staff profile");
  return again[0];
}

export function assertPerm(staff: Staff, perm: keyof typeof PERMS) {
  if (!PERMS[perm].includes(staff.role)) {
    void erpSql()
      .then((sql) =>
        audit(sql, {
          userId: staff.user_id,
          action: "PERM_DENY",
          entity: perm,
          after: { role: staff.role, perm },
        }),
      )
      .catch(() => undefined);
    throw new Error(`${staff.role} cannot perform ${perm.replace("_", " ")}`);
  }
}

export async function nextDoc(sql: Sql, docType: string): Promise<string> {
  const rows = await sql.query<{ prefix: string; n: number; pad: number }>(
    `update number_series set next_no = next_no + 1 where doc_type = $1
     returning prefix, (next_no - 1)::int as n, pad`,
    [docType],
  );
  const r = rows[0];
  if (!r) throw new Error(`No number series for ${docType}`);
  return `${r.prefix}${String(r.n).padStart(r.pad, "0")}`;
}

export async function audit(
  sql: Sql,
  opts: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string | number;
    before?: unknown;
    after?: unknown;
  },
) {
  await sql.query(
    `insert into audit_log (user_id, action, entity, entity_id, before_json, after_json)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      opts.userId ?? null,
      opts.action,
      opts.entity,
      opts.entityId != null ? String(opts.entityId) : null,
      opts.before ? JSON.stringify(opts.before) : null,
      opts.after ? JSON.stringify(opts.after) : null,
    ],
  );
}

export async function setting(sql: Sql, key: string, fallback: string): Promise<string> {
  const rows = await sql.query<{ value: string }>(`select value from settings where key = $1`, [
    key,
  ]);
  return rows[0]?.value ?? fallback;
}

export { n };
