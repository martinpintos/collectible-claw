import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalog, getCatalogPreview, getMachine, getMachines } from "@/lib/data/repository";
import { averageValue } from "@/lib/domain/odds";
import { PREFS_COOKIE, parsePrefs } from "@/lib/domain/prefs";
import { WALLET_COOKIE, parseWallet } from "@/lib/domain/wallet";
import { ClawFlowProvider } from "@/store/claw-flow-provider";
import { PrefsProvider } from "@/store/prefs-provider";
import { ClawFlow } from "@/components/flow/ClawFlow";
import { Header } from "./Header";
import { MachineDetails } from "./MachineDetails";
import { MachineHero } from "./MachineHero";
import { StickyPurchaseBar } from "./PurchasePanel";
import { RecentPulls, RecentPullsSkeleton } from "./RecentPulls";
import { TopItems, TopItemsSkeleton } from "./TopItems";

/**
 * The claw page. Fully server-rendered: machine data, odds, top items and the
 * recent-pulls feed never touch the client bundle. Reading the two cookies opts
 * the route into dynamic rendering so the first HTML already carries the
 * visitor's sound/animation preference and wallet balance.
 */
export async function MachinePage({ slug }: { slug: string }) {
  const machine = await getMachine(slug);
  if (!machine) notFound();

  const cookieStore = await cookies();
  const prefs = parsePrefs(cookieStore.get(PREFS_COOKIE)?.value);
  const wallet = parseWallet(cookieStore.get(WALLET_COOKIE)?.value);

  const [machines, catalog, preview] = await Promise.all([
    getMachines(),
    getCatalog(machine),
    getCatalogPreview(machine),
  ]);
  const machineAverageValue = averageValue(machine.tiers, catalog);

  return (
    <PrefsProvider initial={prefs}>
      <ClawFlowProvider machineSlug={machine.slug} maxQuantity={machine.maxQuantity}>
        <div id="page-root" className="flex min-h-full flex-1 flex-col">
        <Header wallet={wallet} />
        <main className="mx-auto w-full max-w-[1380px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <MachineHero machine={machine} />
            <MachineDetails machine={machine} machines={machines} averageValue={machineAverageValue} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Both feeds are a fixed height and scroll internally, so the row never
                grows with the amount of stock and stays a little taller than the
                machine row above it. */}
            <section
              aria-labelledby="top-items-heading"
              className="panel flex h-[560px] min-w-0 flex-col p-4 lg:h-[860px]"
            >
              <h2 id="top-items-heading" className="mb-4 shrink-0 text-center text-2xl font-semibold text-white">
                Top Items
              </h2>
              <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <Suspense fallback={<TopItemsSkeleton />}>
                  <TopItems machine={machine} />
                </Suspense>
              </div>
            </section>
            <section
              aria-labelledby="recent-pulls-heading"
              className="panel flex h-[560px] min-w-0 flex-col p-4 lg:h-[860px]"
            >
              <h2 id="recent-pulls-heading" className="mb-4 shrink-0 text-center text-2xl font-semibold text-white">
                Recent Pulls
              </h2>
              <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <Suspense fallback={<RecentPullsSkeleton />}>
                  <RecentPulls />
                </Suspense>
              </div>
            </section>
          </div>
        </main>
        <StickyPurchaseBar />
        </div>
        <ClawFlow machine={machine} preview={preview} wallet={wallet} />
      </ClawFlowProvider>
    </PrefsProvider>
  );
}
