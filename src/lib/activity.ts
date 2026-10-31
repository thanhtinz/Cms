import { prisma } from "./db";
import { getCurrentUser } from "./auth";

// Nhãn hiển thị cho từng loại thao tác trong trang Nhật ký hoạt động
export const ACTIVITY_LABELS: Record<string, string> = {
  CONFIRM_PAYMENT: "Xác nhận thanh toán",
  CANCEL_ORDER: "Huỷ đơn thuê",
  ACTIVATE_SITE: "Kích hoạt website",
  SET_SITE_STATUS: "Đổi trạng thái website",
  REGEN_KEY: "Cấp lại key kích hoạt",
  SAVE_SETTINGS: "Cập nhật cài đặt",
  VOUCHER: "Voucher",
  NEWS: "Tin tức",
  TEMPLATE: "Mẫu website",
  TIME_PACKAGE: "Gói thời gian",
  TICKET_STATUS: "Trạng thái ticket",
};

// Ghi 1 dòng nhật ký cho thao tác admin vừa thực hiện. Best-effort:
// lỗi ghi nhật ký KHÔNG BAO GIỜ được làm hỏng thao tác chính.
export async function logActivity(action: string, detail: string) {
  try {
    const u = await getCurrentUser();
    await prisma.activityLog.create({
      data: {
        actorId: u?.id ?? null,
        actorName: u ? `${u.name} (${u.email})` : "Hệ thống",
        action,
        detail,
      },
    });
  } catch {
    // bo qua — nhat ky la phu, thao tac chinh quan trong hon
  }
}
