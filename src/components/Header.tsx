import { getSettings } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import HeaderBar from "./HeaderBar";

export default async function Header() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  return (
    <HeaderBar
      brandName={settings.brandName}
      logoUrl={settings.logoUrl}
      user={user ? { name: user.name, email: user.email, role: user.role } : null}
    />
  );
}
