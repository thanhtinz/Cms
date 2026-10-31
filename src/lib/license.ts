import crypto from "crypto";
import { prisma } from "./db";

// Key kich hoat rieng cho MOI lan thue: phat sinh khi website duoc tao (admin
// xac nhan thanh toan). Khach nhap key nay o buoc setup website lan dau tien;
// website con goi POST /api/kich-hoat-website de xac thuc + danh dau da kich hoat.
// Dinh dang: TW-XXXXXX-XXXXXX-XXXXXX (bo ky tu de nham: 0/O/1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLicenseKey(): string {
  const group = () =>
    Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
  return `TW-${group()}-${group()}-${group()}`;
}

// Sinh key chua trung (kiem tra DB), toi da 5 lan thu
export async function generateUniqueLicenseKey(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const key = generateLicenseKey();
    const exists = await prisma.site.findUnique({ where: { licenseKey: key }, select: { id: true } });
    if (!exists) return key;
  }
  return generateLicenseKey() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();
}

// Website tao truoc khi co tinh nang key -> tu cap key khi can hien thi
export async function ensureLicenseKey(site: { id: string; licenseKey: string | null }): Promise<string> {
  if (site.licenseKey) return site.licenseKey;
  const key = await generateUniqueLicenseKey();
  await prisma.site.update({ where: { id: site.id }, data: { licenseKey: key } });
  return key;
}

export function maskKeyHint(key: string) {
  return key;
}
