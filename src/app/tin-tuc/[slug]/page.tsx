import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, getSettings } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import NewsCard from "@/components/NewsCard";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function NewsDetail({ params }: { params: { slug: string } }) {
  const post = await prisma.newsPost.findUnique({ where: { slug: params.slug } });
  if (!post || !post.published) notFound();
  const [related, settings] = await Promise.all([
    prisma.newsPost.findMany({
      where: { published: true, id: { not: post.id }, category: post.category },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
    getSettings(),
  ]);
  const paragraphs = post.content.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-700">Trang chủ</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <Link href="/tin-tuc" className="hover:text-brand-700">Tin tức</Link>
        <span className="mx-1.5 text-slate-300">/</span>
        <span className="font-medium text-slate-700">{post.category}</span>
      </nav>

      <article className="mx-auto mt-6 max-w-3xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">{post.category}</span>
          <span className="text-slate-400">{formatDate(post.createdAt)} · {settings.brandName}</span>
        </div>
        <h1 className="mt-3 text-3xl font-black leading-tight text-slate-900 md:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-3 text-lg leading-relaxed text-slate-500">{post.excerpt}</p>}
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="card mt-6 aspect-[16/8] w-full object-cover" />
        )}
        <div className="mt-7 space-y-5 leading-[1.85] text-slate-700">
          {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
          <div className="text-xl font-black">Chưa có website bán hàng?</div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            Chọn một mẫu có sẵn, nhập tên miền của bạn — hệ thống tự tạo website, bạn chỉ việc đăng sản phẩm và bán.
          </p>
          <Link href="/mau" className="btn-primary mt-4 px-5 py-2.5">
            Xem kho mẫu <ArrowRightIcon className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-black text-slate-900">Bài viết cùng mục</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <NewsCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
