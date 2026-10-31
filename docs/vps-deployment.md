# Triển khai lên VPS & tối ưu hệ thống

Tài liệu này là bản thiết kế vận hành khi nền tảng ThuêWeb chuyển từ bản demo (Vercel + Neon) sang **VPS riêng** — nơi cả web chính lẫn toàn bộ website khách thuê cùng chạy. Nguyên tắc xuyên suốt: **một codebase đa khách (multi-tenant)**, không cài riêng từng website; tài nguyên được **cấp phát tự động theo gói** ngay khi website được tạo.

## 1. Kiến trúc trên VPS

```
Internet ── Cloudflare (DNS + CDN + WAF, Custom Hostnames cho tên miền khách)
              │
              ▼
        Caddy (reverse proxy, HTTPS tự động, nén brotli/gzip, cache tĩnh)
              │
      ┌───────┴────────────┐
      ▼                    ▼
  Web chính (Next.js)   Sites khách (cùng 1 app, route theo Host → tenant)
      └───────┬────────────┘
              ▼
  PostgreSQL (1 DB, mọi bảng có tenant/site id) ── PgBouncer (pool kết nối)
              ▼
  Lưu trữ file: thư mục /data/sites/{siteId}/ trên đĩa (sau này: S3-compatible)
  Redis (cache + hàng đợi việc nền) · Cron jobs (hết hạn, reset băng thông, nhắc hạn)
```

VPS khởi điểm hợp lý: 4 vCPU / 8 GB RAM / 200 GB NVMe — đủ cho vài trăm website nhỏ. Khai báo đúng số này vào **Admin → Cài đặt → Sức chứa VPS** để hệ thống cấp phát theo.

## 2. Tự động chia dung lượng khi có người thuê (đã có trong code)

1. Admin tạo **Gói thời gian** (Admin → Gói thời gian): mỗi gói khai báo sẵn dung lượng đĩa, băng thông/tháng, giới hạn sản phẩm/trang, số tài khoản CMS. Trang gói luôn hiển thị *"còn cấp được ~N website gói này"* theo sức chứa còn trống.
2. Khách thuê → thanh toán được admin xác nhận → hệ thống **tự động snapshot hạn mức của gói vào bản ghi website** (`quotaStorageGb`, `quotaBandwidthGb`, `quotaProducts`, `quotaPages`, `quotaCmsUsers`). Việc snapshot (không đọc thẳng từ gói) đảm bảo admin sửa gói sau này không làm thay đổi quyền lợi của khách đã mua.
3. Trước khi tạo website mới, hệ thống kiểm tra tổng hạn mức đã cấp (các website đang ở trạng thái chờ DNS/hoạt động/tạm ngưng) so với `sức chứa × hệ số bán vượt`. **Hết dung lượng → dừng xác nhận đơn, báo rõ lý do cho admin** (gia hạn cho khách cũ vẫn được duyệt và cập nhật hạn mức theo gói gia hạn).
4. Admin theo dõi ở **Tổng quan quản trị → Dung lượng hệ thống**: thanh % đĩa/băng thông đã cấp, số website, dung lượng còn trống. Khách xem hạn mức + mức dùng của chính website mình trong Dashboard → Website của tôi.
5. Mức sử dụng thực tế (`usedStorageMb`, `usedBandwidthGb`) do CMS của từng website khách cập nhật về (API nội bộ sẽ bổ sung cùng mã nguồn `sites/`); kỳ băng thông reset hàng tháng theo `usagePeriod`.

Ở tầng hệ điều hành, khi provision website thật: tạo thư mục `/data/sites/{siteId}` và áp **quota đĩa cứng** (XFS project quota hoặc `setquota`) đúng bằng `quotaStorageGb`; giới hạn băng thông tại Caddy/nginx theo tenant (rate limit + đếm byte qua log để cộng vào `usedBandwidthGb` mỗi giờ bằng cron).

## 3. Tối ưu theo từng tầng

**Cloudflare (trước VPS):**
- Bật cache cho tài nguyên tĩnh của mọi tenant (Cache Rules theo đuôi file), bật Brotli, HTTP/3, Early Hints.
- Ảnh qua Cloudflare Polish/Resizing hoặc `next/image` với định dạng WebP/AVIF — thường giảm 60–80% băng thông ảnh.
- WAF + rate limit cho `/dang-nhap`, API — chặn brute force ngay ở biên, VPS không tốn tài nguyên.

**Reverse proxy (Caddy):**
- Nén brotli/gzip mọi response text; `Cache-Control` dài hạn cho `/_next/static` và file tĩnh (đã có hash).
- Giới hạn kích thước upload + timeout theo route; ghi log theo tenant để tính băng thông.

**Ứng dụng (Next.js):**
- Một tiến trình duy nhất phục vụ mọi tenant (route theo Host) — RAM không nhân theo số website như mô hình mỗi khách một cài đặt.
- Đã có: **cache cài đặt hệ thống trong RAM (TTL 30s)** — `getSettings()` không còn truy vấn DB ở mọi request.
- Tiếp tục: cache danh sách mẫu/bài viết công khai (TTL ngắn + xoá khi admin sửa), `React cache()` cho truy vấn lặp trong cùng request.
- Chạy bằng PM2 cluster (số worker = số vCPU) hoặc Docker + restart tự động; tắt source map production.

**Cơ sở dữ liệu (PostgreSQL):**
- **PgBouncer** (transaction pooling) giữa app và Postgres — bắt buộc khi nhiều tiến trình/website cùng kết nối.
- Index theo `siteId`/`userId`/`domain` cho mọi bảng của tenant; `VACUUM/ANALYZE` tự động; `shared_buffers` ≈ 25% RAM.
- Sao lưu: `pg_dump` nén hàng đêm + gửi ra ngoài VPS (S3/R2), giữ 7–30 ngày, diễn tập khôi phục định kỳ.

**Lưu trữ & media:**
- File khách để ngoài DB (đĩa `/data/sites/...`), DB chỉ giữ metadata.
- Khi đĩa đầy theo chiều ngang: chuyển media sang object storage (S3/R2/MinIO) — website chỉ giữ file nhẹ, CDN gánh tải.

**Việc nền (cron/systemd timer):**
- Quét hết hạn: vào ân hạn → tạm ngưng → lưu trữ → xoá theo đúng vòng đời trong Cài đặt (trial/grace/archive days).
- Reset `usedBandwidthGb` đầu tháng; cộng băng thông từ log proxy mỗi giờ.
- Nhắc hạn thuê trước 30/7/3/1 ngày qua email.
- Dọn session hết hạn, log cũ (logrotate).

**Giám sát & an toàn:**
- Uptime + cảnh báo (Uptime Kuma/BetterStack), theo dõi đĩa/RAM/CPU (Netdata 1 container) — cảnh báo khi đĩa thật > 80% hoặc hạn mức đã cấp > 85%.
- UFW chỉ mở 80/443/SSH; fail2ban; SSH key-only; cập nhật bảo mật tự động (unattended-upgrades).
- Mỗi tenant bị cô lập bằng hạn mức + thư mục riêng; tuyệt đối không cho code khách chạy chung tiến trình với web chính.

## 4. Lộ trình nâng cấp khi lớn dần

1. **1 VPS** (hiện tại): mọi thứ trên một máy, tối ưu như trên — vài trăm website.
2. **Tách DB** sang VPS riêng + thêm Redis khi truy vấn tăng.
3. **Nhiều VPS ứng dụng** sau load balancer (app stateless, session trong DB/Redis, file ở object storage) + Cloudflare Load Balancing.
4. Multi-region/CDN đầy đủ khi khách ở nhiều khu vực.

## 5. Checklist đưa lên VPS lần đầu

- [ ] Cài Docker + Caddy; trỏ tên miền nền tảng về VPS; bật HTTPS.
- [ ] Tạo Postgres + PgBouncer; đặt `DATABASE_URL` trỏ qua PgBouncer.
- [ ] Đặt biến môi trường, build & chạy app bằng PM2/Docker; kiểm tra `/`, `/portal`, `/admin`.
- [ ] Vào Admin → Cài đặt: khai báo **sức chứa VPS** đúng cấu hình máy (đĩa/băng thông) + hệ số bán vượt mong muốn.
- [ ] Tạo các gói thời gian với hạn mức khớp sức chứa (trang gói sẽ báo còn cấp được bao nhiêu website).
- [ ] Bật cron sao lưu DB + diễn tập khôi phục 1 lần.
- [ ] Bật Cloudflare proxy + cache rules + WAF cho tên miền nền tảng và quy trình Custom Hostnames cho tên miền khách.
