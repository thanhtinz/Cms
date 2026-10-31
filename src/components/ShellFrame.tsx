import SupportChat from "./SupportChat";

// Khung noi dung cho Dashboard khach va trang Quan tri.
// He thong chi con MOT header + MOT menu (AppMenu o header web chinh) +
// MOT footer — ShellFrame khong con header/sidebar/footer rieng,
// chi giu khung noi dung va bong bong tro ly ho tro.
export default function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      <SupportChat />
    </div>
  );
}
