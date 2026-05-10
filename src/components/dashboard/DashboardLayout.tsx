import { TopBar } from "@/components/layout/TopBar";
import { WorldMapPanel } from "@/components/map/WorldMapPanel";
import { NewsPanel } from "@/components/news/NewsPanel";

export function DashboardLayout() {
  return (
    <main className="app-shell">
      <TopBar />
      <div className="dashboard">
        <WorldMapPanel />
        <NewsPanel />
      </div>
    </main>
  );
}
