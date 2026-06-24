import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { TopNav } from "@/components/nav/top-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { ProfileHydrator } from "@/components/profile-hydrator";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Single network call: getProfile() verifies the JWT locally (no getUser
  // round-trip) and fetches the row once, shared with the page via cache().
  const profile = await getProfile();

  if (!profile) redirect("/login");
  if (!profile.username) redirect("/onboarding");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Seed the client store from the server so the nav doesn't re-fetch the
          profile from the browser on every load. */}
      <ProfileHydrator profile={profile} />
      <TopNav />
      <main className="flex-1 pb-32 md:pb-0" id="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
