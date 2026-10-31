# sites/ — Mã nguồn các website cho khách thuê

Mỗi thư mục con trong `sites/` là mã nguồn (src) của **một mẫu website** mà khách thuê trên nền tảng.

## Quy ước

- Tên thư mục = `folderSlug` khai báo trong **Admin → Mẫu website** của web chính (ví dụ mẫu "Shop Bán Hàng" khai `folderSlug = shop-ban-hang` → src nằm ở `sites/shop-ban-hang/`).
- Mỗi src là một "folder nhỏ", độc lập tối đa: có README riêng ghi cách chạy, biến môi trường cần thiết và cấu trúc dữ liệu mẫu (seed) của nó.
- Khi khách thuê một mẫu, hệ thống provisioning (giai đoạn tiếp theo) sẽ nhân bản src tương ứng, gắn `tenant_id`, tên miền tạm và tài khoản CMS cho khách.

## Danh sách hiện tại

| Thư mục | Mẫu tương ứng | Trạng thái |
|---|---|---|
| `_mau-chuan/` | Khung chuẩn để tạo mẫu mới | Khung tham chiếu |
| `shop-san-pham-so/` | Shop Sản Phẩm Số — Giao Key Tự Động (Digital Store) | Đã có src thật + tích hợp key kích hoạt nền tảng |

> Web chính (nền tảng cho thuê) nằm ở thư mục gốc của repo — không nằm trong `sites/`.
