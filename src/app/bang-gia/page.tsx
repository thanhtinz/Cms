import { permanentRedirect } from "next/navigation";

// Trang Bang gia da BO (theo chu truong: gia thue theo GOI THOI GIAN va nam
// ngay trong trang chi tiet cua tung mau) — chuyen huong vinh vien ve Kho mau
// de link cu/bookmark khong bao gio ra trang trong.
export default function BangGiaRemoved() {
  permanentRedirect("/mau");
}
