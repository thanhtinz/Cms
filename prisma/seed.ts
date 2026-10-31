import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ---- Tai khoan admin mac dinh (DOI MAT KHAU NGAY sau khi dang nhap lan dau) ----
  const adminHash = await bcrypt.hash("Admin@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@thueweb.vn" },
    update: {},
    create: {
      email: "admin@thueweb.vn",
      passwordHash: adminHash,
      name: "Quản trị viên",
      role: "ADMIN",
    },
  });

  // ---- Cai dat nen tang ----
  await prisma.setting.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });

  // ---- Goi thue (gia de xuat trong ke hoach 30/10/2026 — sua thoai mai trong Admin > Goi thue) ----
  const plans = [
    {
      name: "Khởi nghiệp", slug: "khoi-nghiep", tier: 1, priceMonth: 149000,
      storageGb: 5, bandwidthGb: 100, pagesLimit: 30, productsLimit: 50, cmsUsers: 2, domains: 1,
      ecommerce: false, highlight: false, sort: 1,
      features: "1 website\n1 tên miền riêng\n5 GB dung lượng\nForm liên hệ + hộp thư form\nSEO cơ bản\nSao lưu hàng tuần\nHỗ trợ ticket 24h",
      excluded: "Bán hàng online\nMẫu Premium",
    },
    {
      name: "Chuyên nghiệp", slug: "chuyen-nghiep", tier: 2, priceMonth: 299000,
      storageGb: 20, bandwidthGb: 500, pagesLimit: -1, productsLimit: 500, cmsUsers: 5, domains: 1,
      ecommerce: true, highlight: true, sort: 2,
      features: "Mọi tính năng gói Khởi nghiệp\nDùng tất cả mẫu gồm Premium\n20 GB dung lượng\nBán hàng cơ bản (đơn hàng, COD/chuyển khoản)\nSEO nâng cao: sitemap, schema, redirect\nSao lưu hàng ngày, giữ 7 ngày\nHỗ trợ ticket + chat 12h",
      excluded: "",
    },
    {
      name: "Thương mại", slug: "thuong-mai", tier: 3, priceMonth: 499000,
      storageGb: 50, bandwidthGb: 2000, pagesLimit: -1, productsLimit: 5000, cmsUsers: 10, domains: 2,
      ecommerce: true, highlight: false, sort: 3,
      features: "Mọi tính năng gói Chuyên nghiệp\n50 GB dung lượng\nBán hàng đầy đủ: cổng thanh toán, mã giảm giá, flash sale\nGỡ thương hiệu nền tảng\nSao lưu hàng ngày, giữ 30 ngày\nHỗ trợ ưu tiên 4h",
      excluded: "",
    },
    {
      name: "Doanh nghiệp", slug: "doanh-nghiep", tier: 4, priceMonth: 999000,
      storageGb: 200, bandwidthGb: -1, pagesLimit: -1, productsLimit: -1, cmsUsers: 30, domains: 5,
      ecommerce: true, highlight: false, sort: 4,
      features: "Mọi tính năng gói Thương mại\n200 GB dung lượng\nNhiều tên miền\nSao lưu hàng ngày, giữ 90 ngày + khôi phục theo điểm\nHỗ trợ ưu tiên + hotline",
      excluded: "",
    },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // ---- Thoi han thue ----
  const durations = [
    { months: 1, discountPercent: 0, sort: 1 },
    { months: 3, discountPercent: 5, sort: 2 },
    { months: 6, discountPercent: 10, sort: 3 },
    { months: 12, discountPercent: 20, sort: 4 },
    { months: 24, discountPercent: 30, sort: 5 },
  ];
  for (const d of durations) {
    await prisma.durationOption.upsert({ where: { months: d.months }, update: {}, create: d });
  }

  // ---- Mau website THAT (admin sua/xoa/them trong Admin > Mau website) ----
  // Hien chi co MOT mau co src that: Digital Store o sites/shop-san-pham-so.
  // Anh bia + gallery la anh chup THAT cua ban demo, nam trong public/mau/.
  const templates = [
    {
      name: "Shop Sản Phẩm Số — Giao Key Tự Động", slug: "shop-san-pham-so", category: "Bán hàng",
      description: "Shop bán sản phẩm số hoàn chỉnh (mã nguồn thật Digital Store): bán tài khoản, key bản quyền, gói dịch vụ số — khách thanh toán xong hệ thống tự giao key/tài khoản qua email ngay lập tức. Đầy đủ giỏ hàng, ví, điểm thưởng, flash sale, đánh giá và trang quản trị riêng cho chủ shop.",
      coverImage: "/mau/shop-san-pham-so/cover-v2.jpg",
      gallery: "/mau/shop-san-pham-so/gallery-1.jpg\n/mau/shop-san-pham-so/gallery-2.jpg\n/mau/shop-san-pham-so/cover.jpg",
      features: "Giao key/tài khoản tự động ngay sau thanh toán\nThanh toán Stripe / PayPal / SePay — VietQR\nVí nạp tiền + điểm tích luỹ + flash sale\nTrang quản trị đầy đủ: sản phẩm, kho key FIFO, đơn hàng, voucher\nKích hoạt bản quyền với nền tảng bằng key riêng của từng lần thuê",
      demoUrl: "https://digital-store-pink-eta.vercel.app",
      demoAdminUrl: "https://digital-store-pink-eta.vercel.app/admin",
      folderSlug: "shop-san-pham-so", premium: true, minPlanTier: 2, sort: 1,
    },
  ];
  for (const t of templates) {
    const { slug, ...rest } = t;
    await prisma.template.upsert({ where: { slug }, update: rest, create: t });
  }

  // ---- FAQ ----
  const faqs = [
    { question: "Tôi cần chuẩn bị gì trước khi thuê?", answer: "Bạn chỉ cần một tên miền riêng (mua ở bất kỳ nhà đăng ký nào) và đưa tên miền lên Cloudflare miễn phí. Sau khi thanh toán, hệ thống tự tạo website và hướng dẫn bạn thêm 3 bản ghi DNS — trang quản lý của bạn có hướng dẫn từng bước kèm nút Kiểm tra lại.", sort: 1 },
    { question: "Bao lâu thì website hoạt động?", answer: "Website được tạo tự động trong khoảng 1 phút sau khi thanh toán được xác nhận, truy cập ngay qua tên miền tạm. Khi bạn trỏ DNS xong và SSL được cấp (thường vài phút đến vài giờ tuỳ DNS), website chạy chính thức trên tên miền của bạn. Thời hạn thuê chỉ bắt đầu tính từ ngày tên miền chính thức hoạt động.", sort: 2 },
    { question: "Tên miền có thuộc về tôi không?", answer: "Có, 100%. Tên miền do bạn mua và quản lý bằng tài khoản Cloudflare của bạn. Chúng tôi không giữ tên miền, không giữ dữ liệu — bạn xuất toàn bộ nội dung website của mình bất cứ lúc nào.", sort: 3 },
    { question: "Hết hạn thuê thì sao?", answer: "Hệ thống nhắc bạn trước 30/7/3/1 ngày. Sau ngày hết hạn còn 7 ngày ân hạn website vẫn chạy. Quá ân hạn, website tạm ngưng nhưng dữ liệu được giữ thêm 30 ngày — gia hạn trong thời gian này là khôi phục nguyên trạng.", sort: 4 },
    { question: "Tôi có được cấp mã nguồn (source code) không?", answer: "Không. Đây là dịch vụ cho thuê website chạy trên hạ tầng của chúng tôi — bạn được toàn quyền quản trị nội dung qua CMS, không cần lo server, bảo mật hay cập nhật. Nếu muốn mua đứt mã nguồn, vui lòng liên hệ để được tư vấn gói riêng.", sort: 5 },
  ];
  if ((await prisma.faq.count()) === 0) await prisma.faq.createMany({ data: faqs });

  // ---- Goi thoi gian (mo hinh gia hien tai — sua/xoa/them trong Admin > Goi thoi gian) ----
  const timePackages = [
    {
      name: "Gói 1 Tháng", slug: "goi-1-thang", months: 1, price: 199000, compareAt: 0, tier: 1,
      storageGb: 5, bandwidthGb: 100, pagesLimit: 30, productsLimit: 50, cmsUsers: 2, ecommerce: false, highlight: false, sort: 1,
      features: "1 website + tên miền riêng\n5 GB dung lượng\nForm liên hệ\nSEO cơ bản\nSao lưu hàng tuần",
    },
    {
      name: "Gói 3 Tháng", slug: "goi-3-thang", months: 3, price: 449000, compareAt: 597000, tier: 1,
      storageGb: 10, bandwidthGb: 300, pagesLimit: -1, productsLimit: 200, cmsUsers: 3, ecommerce: true, highlight: false, sort: 2,
      features: "Mọi quyền lợi gói 1 tháng\n10 GB dung lượng\nBán hàng cơ bản (đơn hàng, COD/chuyển khoản)\nSao lưu hàng tuần",
    },
    {
      name: "Gói 6 Tháng", slug: "goi-6-thang", months: 6, price: 799000, compareAt: 1194000, tier: 2,
      storageGb: 20, bandwidthGb: 500, pagesLimit: -1, productsLimit: 500, cmsUsers: 5, ecommerce: true, highlight: true, sort: 3,
      features: "Dùng tất cả mẫu gồm Premium\n20 GB dung lượng\nBán hàng đầy đủ: mã giảm giá, flash sale\nSEO nâng cao: sitemap, schema\nSao lưu hàng ngày, giữ 7 ngày",
    },
    {
      name: "Gói 12 Tháng", slug: "goi-12-thang", months: 12, price: 1399000, compareAt: 2388000, tier: 2,
      storageGb: 50, bandwidthGb: 2000, pagesLimit: -1, productsLimit: 5000, cmsUsers: 10, ecommerce: true, highlight: false, sort: 4,
      features: "Mọi quyền lợi gói 6 tháng\n50 GB dung lượng\nCổng thanh toán online\nGỡ thương hiệu nền tảng\nSao lưu hàng ngày, giữ 30 ngày",
    },
    {
      name: "Gói 24 Tháng", slug: "goi-24-thang", months: 24, price: 2399000, compareAt: 4776000, tier: 3,
      storageGb: 200, bandwidthGb: -1, pagesLimit: -1, productsLimit: -1, cmsUsers: 30, ecommerce: true, highlight: false, sort: 5,
      features: "Mọi quyền lợi gói 12 tháng\n200 GB dung lượng, băng thông không giới hạn hợp lý\nNhiều tên miền\nSao lưu giữ 90 ngày + khôi phục theo điểm\nHỗ trợ ưu tiên + hotline",
    },
  ];
  for (const p of timePackages) {
    await prisma.timePackage.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // ---- Voucher mau (sua/xoa/them trong Admin > Voucher) ----
  const in90Days = new Date(Date.now() + 90 * 24 * 3600 * 1000);
  const vouchers = [
    {
      code: "WEBSITE10", description: "Ưu đãi khách mới — giảm 10% đơn thuê đầu tiên",
      type: "PERCENT", value: 10, maxDiscount: 300000, minTotal: 0, usageLimit: 0, expiresAt: null as Date | null,
    },
    {
      code: "KHAITRUONG", description: "Mừng khai trương — giảm thẳng 100.000 ₫ cho đơn từ 1.000.000 ₫",
      type: "FIXED", value: 100000, maxDiscount: 0, minTotal: 1000000, usageLimit: 200, expiresAt: in90Days,
    },
    {
      code: "THUEDAI25", description: "Thuê dài hạn — giảm 25%, tối đa 500.000 ₫",
      type: "PERCENT", value: 25, maxDiscount: 500000, minTotal: 2000000, usageLimit: 0, expiresAt: in90Days,
    },
  ];
  for (const v of vouchers) {
    await prisma.voucher.upsert({ where: { code: v.code }, update: {}, create: v });
  }

  // ---- Bai viet mau (sua/xoa/them trong Admin > Tin tuc) ----
  const posts = [
    {
      title: "Hướng dẫn đưa tên miền lên Cloudflare trong 5 phút",
      slug: "huong-dan-dua-ten-mien-len-cloudflare",
      category: "Hướng dẫn",
      excerpt: "Tên miền là điều kiện duy nhất bạn cần chuẩn bị trước khi thuê website. Bài này hướng dẫn từng bước đưa tên miền lên Cloudflare miễn phí và giải thích vì sao hệ thống cần 3 bản ghi DNS.",
      coverImage: "https://picsum.photos/seed/tin-cloudflare/900/500",
      sort: 1,
      content:
        "Để website thuê chạy trên tên miền riêng của bạn, tên miền cần được quản lý DNS tại Cloudflare. Đây là dịch vụ miễn phí, bạn giữ toàn quyền sở hữu tên miền và có thể rời đi bất cứ lúc nào.\n\nBước 1: tạo tài khoản Cloudflare và bấm Add a site, nhập tên miền của bạn. Cloudflare sẽ quét các bản ghi DNS hiện có.\n\nBước 2: đổi nameserver tại nhà đăng ký tên miền theo 2 nameserver Cloudflare cấp. Thời gian cập nhật thường từ vài phút tới vài giờ.\n\nBước 3: sau khi thanh toán thuê website, vào trang quản lý của bạn trên nền tảng — hệ thống hiện sẵn đúng 3 bản ghi cần thêm: một CNAME trỏ về nền tảng, một TXT chứng minh bạn là chủ tên miền, và một CNAME uỷ quyền cấp SSL. Thêm xong bấm Kiểm tra lại.\n\nKhi DNS đạt, chứng chỉ SSL được cấp tự động và hạn thuê của bạn mới bắt đầu được tính — bạn không mất một ngày thuê nào cho khâu chuẩn bị.",
    },
    {
      title: "Thuê website khác gì tự làm website? So sánh chi phí thật sau 1 năm",
      slug: "thue-website-khac-gi-tu-lam-website",
      category: "Kinh nghiệm",
      excerpt: "Tự làm website nghe có vẻ rẻ hơn, nhưng hãy cộng đủ: tên miền, hosting, SSL, theme, chi phí bảo trì và thời gian. Bài này bóc tách con số thật của cả hai cách sau 12 tháng.",
      coverImage: "https://picsum.photos/seed/tin-so-sanh/900/500",
      sort: 2,
      content:
        "Rất nhiều chủ shop bắt đầu bằng ý định tự làm website để tiết kiệm, rồi bỏ cuộc ở khâu cài đặt hoặc để website chết dần vì không ai bảo trì. Hãy nhìn vào con số.\n\nTự làm: tên miền khoảng 250.000–350.000 ₫/năm, hosting tử tế 1.200.000–3.000.000 ₫/năm, theme đẹp 1.000.000–2.000.000 ₫ mua một lần, chưa kể công cài đặt, cấu hình thanh toán, xử lý khi web bị hack hoặc hết hạn SSL. Tổng năm đầu thường 3–6 triệu đồng và rất nhiều giờ tự học.\n\nThuê website: một khoản cố định theo tháng đã gồm hạ tầng, SSL, sao lưu, cập nhật bảo mật và hỗ trợ. Bạn chỉ việc đăng sản phẩm và bán hàng. Website được tạo tự động trong vài phút, nâng/hạ gói linh hoạt theo quy mô kinh doanh.\n\nKết luận thực tế: nếu bạn có đội kỹ thuật riêng, tự vận hành có thể là lựa chọn dài hạn. Nếu bạn là chủ shop, chủ doanh nghiệp nhỏ cần web để bán hàng ngay, thuê website là cách rẻ và nhanh hơn rõ rệt khi tính đủ chi phí ẩn.",
    },
    {
      title: "Ra mắt tính năng voucher: giảm giá trực tiếp ngay trong form thuê",
      slug: "ra-mat-tinh-nang-voucher",
      category: "Tin tức",
      excerpt: "Từ hôm nay, các mã ưu đãi của nền tảng hiển thị ngay trên trang chủ — sao chép mã, nhập vào bước thuê trong trang chi tiết mẫu, hệ thống tự trừ tiền và hiện rõ từng khoản giảm.",
      coverImage: "https://picsum.photos/seed/tin-voucher/900/500",
      sort: 3,
      content:
        "Nền tảng vừa bổ sung hệ thống voucher hoàn chỉnh: mỗi mã có thể giảm theo phần trăm hoặc giảm thẳng một số tiền, kèm trần giảm tối đa, mức đơn tối thiểu, giới hạn lượt dùng và thời hạn áp dụng.\n\nCách dùng rất đơn giản: ở mục Ưu đãi đang chạy trên trang chủ, bấm Sao chép mã. Khi thuê website trong trang chi tiết của mẫu, nhập mã vào ô voucher ở cột đơn thuê — hệ thống kiểm tra ngay và trừ trực tiếp vào tổng thanh toán, hiện tách bạch với chiết khấu theo thời hạn thuê.\n\nCác chương trình ưu đãi sẽ thay đổi theo thời gian, nhớ ghé trang chủ thường xuyên để không bỏ lỡ mã tốt nhất cho đơn thuê của bạn.",
    },
  ];
  for (const p of posts) {
    await prisma.newsPost.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  console.log("Seed xong: admin@thueweb.vn / Admin@123 (doi mat khau ngay!)");
}

main().finally(() => prisma.$disconnect());
