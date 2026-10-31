import { getSettings, prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import HeaderBar from "./HeaderBar";

export default async function Header() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  let badges: { support?: number; orders?: number } | undefined;
  if (user?.role === "ADMIN") {
    const [orders, support] = await Promise.all([
      prisma.rentalOrder.count({ where: { status: "CHO_THANH_TOAN" } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
    ]);
    badges = { orders: orders || undefined, support: support || undefined };
  } else if (user) {
    const support = await prisma.supportTicket.count({ where: { userId: user.id, status: "ANSWERED" } });
    badges = { support: support || undefined };
  }
  return (
    <HeaderBar
      brandName={settings.brandName}
      logoUrl={settings.logoUrl}
      user={user ? { name: user.name, email: user.email, role: user.role } : null}
      badges={badges}
    />
  );
}
