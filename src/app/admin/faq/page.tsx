import { prisma } from "@/lib/db";
import { saveFaqAction, deleteFaqAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminFaqs() {
  const faqs = await prisma.faq.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Hỏi đáp (FAQ) trang chủ</h1>
      <div className="mt-5 space-y-4">
        {faqs.map((f) => (
          <form key={f.id} action={saveFaqAction} className="card space-y-3 p-5">
            <input type="hidden" name="id" value={f.id} />
            <div><label className="label">Câu hỏi</label><input name="question" defaultValue={f.question} className="input" /></div>
            <div><label className="label">Câu trả lời</label><textarea name="answer" rows={3} defaultValue={f.answer} className="input" /></div>
            <div className="flex items-center gap-4">
              <div className="w-28"><label className="label">Thứ tự</label><input name="sort" type="number" defaultValue={f.sort} className="input" /></div>
              <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={f.active} className="h-4 w-4" /> Đang hiện</label>
              <button className="btn-primary mt-5">Lưu</button>
              <button formAction={deleteFaqAction} className="mt-5 font-semibold text-red-600 hover:underline">Xoá</button>
            </div>
          </form>
        ))}
      </div>
      <form action={saveFaqAction} className="card mt-6 space-y-3 border-dashed p-5">
        <div className="font-bold">Thêm câu hỏi mới</div>
        <div><label className="label">Câu hỏi</label><input name="question" required className="input" /></div>
        <div><label className="label">Câu trả lời</label><textarea name="answer" rows={3} required className="input" /></div>
        <div className="flex items-center gap-4">
          <div className="w-28"><label className="label">Thứ tự</label><input name="sort" type="number" defaultValue={0} className="input" /></div>
          <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked className="h-4 w-4" /> Đang hiện</label>
          <button className="btn-primary mt-5">Thêm FAQ</button>
        </div>
      </form>
    </div>
  );
}
