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

## Tính năng chính

- **Thuê ngay trong trang chi tiết mẫu** (`/mau/[slug]`): xem gallery, tính năng, giá trọn gói thấp nhất — rồi chọn **một gói thời gian** + voucher + tên miền và đặt thuê tại chỗ, không có trang thuê riêng.
- **Giá theo gói thời gian**: khách chỉ chọn 1 gói (đã gồm số tháng + tổng giá trọn gói, cấu hình trong Admin > Gói thời gian, có tier để khoá mẫu Premium). Không còn mô hình chọn gói tháng × thời hạn chiết khấu. Trang chủ không hiển thị giá — giá chỉ có ở trang Bảng giá, kho mẫu và trang chi tiết mẫu.
- **Voucher giảm giá**: Admin tạo mã (giảm % hoặc giảm thẳng, trần giảm, đơn tối thiểu, giới hạn lượt, thời hạn). Mã đang chạy hiện ở trang chủ để khách sao chép; khách nhập mã trong form thuê, hệ thống kiểm tra trực tiếp và trừ vào tổng giá gói. Huỷ đơn tự hoàn lượt dùng.
- **Tin tức**: Admin viết bài (tiêu đề, slug, chuyên mục, ảnh bìa, tóm tắt, nội dung) — đăng ở `/tin-tuc` và mục tin mới trên trang chủ.
- Toàn bộ nội dung (mẫu, gói thời gian, FAQ, voucher, tin tức, cài đặt thương hiệu/thanh toán/DNS) đều cấu hình trong Admin.
- **Dashboard khách & trang Quản trị là 2 khu vực riêng** với header/footer/menu burger của chính nó (không dùng chung header/footer web chính): Dashboard khách có Tổng quan (việc cần xử lý: chờ DNS, sắp hết hạn, chờ thanh toán), Website của tôi, Đơn thuê & gia hạn (tự huỷ đơn chưa trả), **gia hạn website ngay trong Dashboard** (admin xác nhận là cộng thêm tháng vào hạn hiện tại), Hồ sơ & đổi mật khẩu, Hỗ trợ.
- **Hỗ trợ 2 lớp**: trợ lý AI trả lời tức thì từ dữ liệu nền tảng (FAQ, gói, voucher, cài đặt thanh toán — bong bóng chat ở Dashboard/Admin) + ticket hỗ trợ người thật hai chiều giữa khách và admin.
- **Thông báo toast toàn cục**: đăng nhập/đăng xuất/thành công/thất bại đều có thông báo nổi rõ ràng (tham số `tb`/`ok`/`loi` sau mỗi lần chuyển trang).

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
