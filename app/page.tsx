import { getAllGccs } from "@/lib/gcc-repo";
import { Portal } from "@/components/portal";

export const dynamic = "force-dynamic";

export default async function Home() {
  const gccs = await getAllGccs();
  return <Portal gccs={gccs} />;
}
