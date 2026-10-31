import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Cache cai dat trong RAM 30 giay: getSettings duoc goi o moi request
// (metadata, header, footer, API...) — tranh truy van DB lien tuc cho du lieu
// gan nhu khong doi. Admin luu cai dat se xoa cache ngay (bustSettingsCache).
type SettingRow = Awaited<ReturnType<typeof prisma.setting.upsert>>;
let settingsCache: { value: SettingRow; at: number } | null = null;
const SETTINGS_TTL_MS = 30_000;

export function bustSettingsCache() {
  settingsCache = null;
}

export async function getSettings() {
  const now = Date.now();
  if (settingsCache && now - settingsCache.at < SETTINGS_TTL_MS) return settingsCache.value;
  const value = await prisma.setting.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });
  settingsCache = { value, at: now };
  return value;
}
