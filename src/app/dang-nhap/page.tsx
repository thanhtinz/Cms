import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginPage({ searchParams }: { searchParams: { loi?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        {searchParams.loi && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{searchParams.loi}</div>}
        <form action={loginAction} className="mt-5 space-y-4">
          <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
          <div><label className="label">Mật khẩu</label><input name="password" type="password" required className="input" /></div>
          <button className="btn-primary w-full py-2.5">Đăng nhập</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">Chưa có tài khoản? <Link href="/dang-ky" className="font-semibold text-brand-700">Đăng ký</Link></p>
      </div>
    </div>
  );
}
