import { redirect } from "next/navigation";
import { getClaims } from "@/lib/supabase/server";
import { getAmsterdamDate } from "@/lib/utils";
import { getMidRate } from "@/lib/settle/transfers";
import { transferInitialFrom } from "@/lib/settle/transfer-data";
import { TransferComparer } from "@/components/settle/transfer-comparer";

/**
 * The signed-in India–Netherlands transfer comparer.
 *
 * Same component and the same cached ECB rate as the public page. Nothing is
 * read from or written to the user's settle tables: quotes live in component
 * state only.
 *
 * Not level-branched, and no XP: see app/(app)/settle/page.tsx.
 */
export default async function SendMoneyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [claims, mid, params] = await Promise.all([getClaims(), getMidRate(), searchParams]);
  if (!claims?.sub) redirect("/login");

  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  return (
    <TransferComparer
      initial={transferInitialFrom(one)}
      mid={mid}
      asOf={getAmsterdamDate()}
      backLink={{ href: "/settle", label: "Settle" }}
    />
  );
}
