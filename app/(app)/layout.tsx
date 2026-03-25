import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/nav/top-nav";
import { MobileNav } from "@/components/nav/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check onboarding completion
  const { data: profileData } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const profile = profileData as { username: string | null } | null;
  if (!profile?.username) redirect("/onboarding");

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 pb-32 md:pb-0" id="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
