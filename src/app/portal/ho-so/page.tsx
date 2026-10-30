import { requireUser } from "@/lib/auth";
import { updateProfileAction, changePasswordAction } from "@/lib/actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Ho so ca nhan + doi mat khau
export default async function PortalProfilePage({ searchParams }: { searchParams: { ok?: string; loi?: string } }) {
  const user = await requireUser();
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Hồ sơ & bảo mật</h1>
      <p className="mt-1 text-slate-500">Thông tin tài khoản và mật khẩu đăng nhập Dashboard.</p>

      {searchParams.ok && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchParams.ok}</div>}
      {searchParams.loi && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={updateProfileAction} className="card h-fit space-y-4 p-6">
          <h2 className="font-bold text-slate-900"><i className="fa-solid fa-user-pen mr-2 text-brand-600" aria-hidden /> Thông tin cá nhân</h2>
          <div><label className="label">Họ tên *</label><input name="name" required defaultValue={user.name} className="input" /></div>
          <div><label className="label">Số điện thoại</label><input name="phone" defaultValue={user.phone ?? ""} className="input" placeholder="Để đội hỗ trợ liên hệ khi cần" /></div>
          <div><label className="label">Email đăng nhập</label><input value={user.email} disabled className="input bg-slate-50 text-slate-500" /><p className="mt-1 text-xs text-slate-400">Email là định danh tài khoản, không thay đổi được. Tài khoản tạo ngày {formatDate(user.createdAt)}.</p></div>
          <button className="btn-primary">Lưu thông tin</button>
        </form>

        <form action={changePasswordAction} className="card h-fit space-y-4 p-6">
          <h2 className="font-bold text-slate-900"><i className="fa-solid fa-key mr-2 text-brand-600" aria-hidden /> Đổi mật khẩu</h2>
          <div><label className="label">Mật khẩu hiện tại *</label><input name="current" type="password" required className="input" autoComplete="current-password" /></div>
          <div><label className="label">Mật khẩu mới *</label><input name="next" type="password" required className="input" autoComplete="new-password" /><p className="mt-1 text-xs text-slate-400">Tối thiểu 6 ký tự — nên dùng 10+ ký tự gồm chữ, số và ký tự đặc biệt.</p></div>
          <div><label className="label">Nhập lại mật khẩu mới *</label><input name="confirm" type="password" required className="input" autoComplete="new-password" /></div>
          <button className="btn-primary">Đổi mật khẩu</button>
        </form>
      </div>
    </div>
  );
}
