import { prisma } from "@/lib/prisma";
import FunnelClient from "./funnel-client";

export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  const screens = await prisma.funnelScreen.findMany({
    where: { isActive: true },
    include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const firms = await prisma.firm.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  return (
    <FunnelClient
      screens={JSON.parse(JSON.stringify(screens))}
      firms={JSON.parse(JSON.stringify(firms))}
      settings={settings ? JSON.parse(JSON.stringify(settings)) : null}
    />
  );
}
