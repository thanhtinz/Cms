// Kiem tra ten mien bang DNS-over-HTTPS (Cloudflare) — khong can API key.
export interface DomainCheck {
  domain: string;
  valid: boolean;
  exists: boolean | null; // null = khong xac dinh duoc
  onCloudflare: boolean;
  cnameRoot: string | null;
  cnameWww: string | null;
  pointsToUs: boolean;
  messages: string[];
}

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
}

async function doh(name: string, type: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { accept: "application/dns-json" }, cache: "no-store" }
    );
    if (!res.ok) return [];
    const json: any = await res.json();
    return (json.Answer ?? []).map((a: any) => String(a.data).replace(/\.$/, ""));
  } catch {
    return [];
  }
}

export async function checkDomain(raw: string, cnameTarget: string): Promise<DomainCheck> {
  const domain = normalizeDomain(raw);
  const messages: string[] = [];
  if (!DOMAIN_RE.test(domain)) {
    return { domain, valid: false, exists: null, onCloudflare: false, cnameRoot: null, cnameWww: null, pointsToUs: false, messages: ["Tên miền không đúng định dạng. Ví dụ đúng: shopcuaban.vn"] };
  }
  const [ns, cnameRootArr, cnameWwwArr, aRoot] = await Promise.all([
    doh(domain, "NS"),
    doh(domain, "CNAME"),
    doh(`www.${domain}`, "CNAME"),
    doh(domain, "A"),
  ]);
  const onCloudflare = ns.some((n) => {
    const h = n.toLowerCase();
    return h.includes(".ns.cloudflare.com") || /^ns\d+\.cloudflare\.com$/.test(h);
  });
  const cnameRoot = cnameRootArr[0] ?? null;
  const cnameWww = cnameWwwArr[0] ?? null;
  const target = cnameTarget.toLowerCase();
  const pointsToUs =
    (cnameRoot ?? "").toLowerCase() === target || (cnameWww ?? "").toLowerCase() === target;
  const exists = ns.length > 0 || aRoot.length > 0 || !!cnameRoot;

  if (!exists) messages.push("Chưa tra thấy bản ghi DNS nào — tên miền có thể chưa được đăng ký hoặc chưa cấu hình DNS.");
  if (onCloudflare) messages.push("Tên miền đang dùng Cloudflare — đạt yêu cầu của hệ thống.");
  else if (exists) messages.push("Tên miền chưa dùng Cloudflare. Hãy thêm tên miền vào Cloudflare (miễn phí) và đổi Nameserver theo hướng dẫn của Cloudflare trước khi kết nối.");
  if (pointsToUs) messages.push(`Tên miền đã trỏ CNAME về hệ thống (${cnameTarget}).`);
  else if (cnameRoot || cnameWww) messages.push(`Tên miền đang trỏ CNAME tới nơi khác (${cnameRoot ?? cnameWww}). Nếu tiếp tục, bạn cần đổi CNAME về ${cnameTarget}.`);

  return { domain, valid: true, exists, onCloudflare, cnameRoot, cnameWww, pointsToUs, messages };
}
