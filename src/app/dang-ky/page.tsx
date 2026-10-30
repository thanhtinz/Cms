import Link from "next/link";
import { registerAction } from "@/lib/actions";

export default function RegisterPage({ searchParams }: { searchParams: { loi?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Đăng ký tài khoản</h1>
        <p className="mt-1 text-sm text-slate-500">Tài khoản dùng để quản lý các website bạn thuê.</p>
        {searchParams.loi && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
        <form action={registerAction} className="mt-5 space-y-4">
          <div><label className="label">Họ và tên</label><input name="name" required className="input" /></div>
          <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
          <div><label className="label">Số điện thoại</label><input name="phone" className="input" /></div>
          <div><label className="label">Mật khẩu (tối thiểu 6 ký tự)</label><input name="password" type="password" required className="input" /></div>
          <button className="btn-primary w-full py-2.5">Đăng ký</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">Đã có tài khoản? <Link href="/dang-nhap" className="font-semibold text-brand-700">Đăng nhập</Link></p>
      </div>
    </div>
  );
}
