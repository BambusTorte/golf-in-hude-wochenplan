import { listSeries } from "@/lib/plan/service";
import { Card, CardBody } from "@/components/ui/Card";
import { SeriesManager, type EditableSeries } from "@/components/admin/SeriesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Turnierserien" };

export default async function SeriesPage() {
  const series = await listSeries();
  const editable: EditableSeries[] = series.map((s) => ({
    id: s.id,
    title: s.title,
    weekday: s.weekday,
    startTime: s.startTime ?? "",
    course: s.course ?? "",
    holes: s.holes != null ? String(s.holes) : "",
    tee: s.tee ?? "",
    participantsEstimate: s.participantsEstimate ?? "",
    playType: s.playType ?? "",
    active: s.active,
    eventCount: s._count.events,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="label-eyebrow !text-accent-400">Verwaltung</p>
        <h1 className="text-3xl font-extrabold text-white">Turnierserien</h1>
      </div>
      <Card>
        <CardBody>
          <SeriesManager series={editable} />
        </CardBody>
      </Card>
    </div>
  );
}
