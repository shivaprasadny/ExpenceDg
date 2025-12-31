import * as SQLite from "expo-sqlite";
import { schema } from "./schema";
import { uid } from "../utils/uid";

const db = SQLite.openDatabaseSync("expensedg.db");

export function initDb() {
  db.execSync(schema);

  const row = db.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM categories");
  if (!row || row.c === 0) {
    const now = new Date().toISOString();

    const defaults = [
      { type: "income", name: "Salary", icon: "briefcase", color: "#4CAF50" },
      { type: "income", name: "Tips", icon: "coins", color: "#2E7D32" },
      { type: "income", name: "Other", icon: "plus", color: "#66BB6A" },

      { type: "expense", name: "Food", icon: "utensils", color: "#FF7043" },
      { type: "expense", name: "Rent", icon: "home", color: "#8D6E63" },
      { type: "expense", name: "Transport", icon: "car", color: "#42A5F5" },
      { type: "expense", name: "Bills", icon: "file-text", color: "#AB47BC" },
      { type: "expense", name: "Health", icon: "heart", color: "#EF5350" },
      { type: "expense", name: "Other", icon: "more-horizontal", color: "#BDBDBD" },
    ] as const;

    db.execSync("BEGIN;");
    try {
      for (const c of defaults) {
        db.runSync(
          `INSERT INTO categories (id, type, name, icon, color, isDefault, createdAt)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [uid(), c.type, c.name, c.icon, c.color, now]
        );
      }
      db.execSync("COMMIT;");
    } catch (e) {
      db.execSync("ROLLBACK;");
      throw e;
    }
  }
}

export function getDb() {
  return db;
}
