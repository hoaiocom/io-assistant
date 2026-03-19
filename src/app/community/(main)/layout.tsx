import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/member-auth";
import { CommunityShell } from "@/components/community/CommunityShell";
import { SWRProvider } from "@/components/providers/SWRProvider";

export default async function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMemberSession();

  if (!session.isLoggedIn) {
    redirect("/community/login");
  }

  return (
    <SWRProvider>
      <CommunityShell>{children}</CommunityShell>
    </SWRProvider>
  );
}
