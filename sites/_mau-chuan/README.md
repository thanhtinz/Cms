# _mau-chuan — Khung chuẩn cho một src website khách thuê

Sao chép thư mục này khi bắt đầu làm một mẫu website mới cho khách thuê, đổi tên thành slug của mẫu (khớp `folderSlug` trong Admin → Mẫu website).

Một src hoàn chỉnh cần có:

- `README.md` — mô tả mẫu, cách chạy local, biến môi trường, tài khoản CMS mặc định khi seed.
- Mã nguồn website + CMS quản trị nội dung của chính website đó (trang, bài viết, sản phẩm, menu, tuỳ biến giao diện).
- Dữ liệu mẫu (seed): trang chủ, trang giới thiệu/liên hệ, bài viết/sản phẩm mẫu để hệ thống nhân bản cho khách — khách sửa lại thành nội dung của mình.
- Điểm tích hợp với nền tảng (giai đoạn provisioning): nhận `tenant_id`, tên miền và gói thuê (giới hạn dung lượng/sản phẩm/tài khoản) từ nền tảng khi được tạo.
