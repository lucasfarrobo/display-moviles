import { getMobilesFromSheets } from "@/lib/sheets";
import { Dashboard } from "./components/Dashboard";

export const revalidate = 60;

export default async function Home() {
  const { mobiles, source } = await getMobilesFromSheets();
  return <Dashboard initialMobiles={mobiles} dataSource={source} />;
}
