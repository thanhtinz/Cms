# Cms — Nền tảng cho thuê website theo mẫu

Web chính của nền tảng cho thuê website: khách chọn mẫu → chọn gói + thời hạn → nhập tên miền riêng (tự trỏ về Cloudflare) → thanh toán → hệ thống tạo website.

**Mọi nội dung đều cấu hình trong Admin, không hard-code:** mẫu website, gói thuê, thời hạn & chiết khấu, FAQ, thương hiệu, thông tin thanh toán VietQR, tên miền nền tảng và các thông số vòng đời thuê bao.

## Cấu trúc repo

- `src/` — web chính (Next.js 14 + Prisma): trang chủ, kho mẫu, bảng giá, luồng thuê, portal khách, trang quản trị.
- `sites/` — mã nguồn các website cho khách thuê (mỗi mẫu một folder nhỏ, xem `sites/README.md`). _Giai đoạn sau._
- `prisma/` — schema + seed dữ liệu ban đầu.

## Chạy local

Cần một PostgreSQL (Neon free / Supabase / Postgres cài local):

```bash
cp .env.example .env   # điền DATABASE_URL của bạn
npm install
npm run db:setup   # generate + tạo bảng + seed
npm run dev        # http://localhost:3000
```

Tài khoản admin seed: `admin@thueweb.vn` / `Admin@123` — **đổi mật khẩu ngay** (tạo user ADMIN mới rồi xoá tài khoản này khi lên production).

## Deploy Vercel

1. Import repo này vào Vercel (framework Next.js).
2. Gắn **Neon Postgres** (Storage → Create → Neon) cho Production + Preview — Neon tự cấp `DATABASE_URL` và `DATABASE_URL_UNPOOLED`.
3. `vercel.json` đã đặt Build Command tự chạy `prisma db push` + `prisma db seed` (seed idempotent, chạy lại an toàn) trước `next build` — không cần thao tác tay.

## Luồng nghiệp vụ đã chạy được

1. Khách xem kho mẫu/bảng giá (dữ liệu thật từ DB) → đặt thuê: chọn mẫu, gói, thời hạn → nhập tên website + tên miền → **kiểm tra tên miền trực tiếp** (định dạng, đã dùng trong hệ thống chưa, đã ở trên Cloudflare chưa, đã trỏ về nền tảng chưa — tra DNS qua Cloudflare DoH).
2. Đơn thuê sinh mã đơn; trang thanh toán hiện VietQR theo tài khoản cấu hình trong Admin → Cài đặt.
3. Admin xác nhận thanh toán → hệ thống **tự tạo bản ghi website**: slug tên miền tạm duy nhất + token DNS riêng, trạng thái *Chờ trỏ tên miền*.
4. Portal của khách hiện **đúng 3 bản ghi DNS** cần thêm trên Cloudflare của họ (CNAME về hệ thống, TXT token sở hữu, CNAME `_acme-challenge` uỷ quyền SSL) kèm nút tự kiểm tra DNS trực tiếp.
5. Admin kích hoạt khi khách trỏ xong → trạng thái *Đang hoạt động*, **hạn thuê tính từ ngày kích hoạt** theo đúng số tháng của đơn.

## Chưa làm (giai đoạn tiếp theo)

- Tích hợp Cloudflare for SaaS API để tự tạo Custom Hostname, tự poll DNS/SSL và tự kích hoạt (hiện admin bấm kích hoạt sau khi kiểm tra).
- Tự đối soát SePay webhook (hiện admin xác nhận tay theo mã đơn).
- Src website thật trong `sites/` + provisioning nhân bản src + CMS của từng website khách.
- Job nhắc hết hạn/ân hạn/tạm ngưng tự động; gia hạn tự động từ portal.
## Demo online

Đã deploy: https://cms-swart-delta.vercel.app (Vercel project `cms`, GitHub-linked repo này, Neon Postgres free). Mỗi lần push lên `main`, Vercel tự build lại — Build Command trong `vercel.json` tự chạy `prisma generate` + `db push` + `db seed` trước `next build`.
