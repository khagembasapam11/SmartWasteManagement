import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import MapPlaceholder from "@/components/dashboard/MapPlaceholder";
import { StatusBadge, WasteBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle2, AlertTriangle, MapPin, Bell } from "lucide-react";
import { reportsApi, type ApiReport } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Routes, Route, useLocation } from "react-router-dom";
import { DUMPING_SITES } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const shortId = (id: string) => id.slice(-6).toUpperCase();

const getNearestDump = (lat: number, lng: number) => {
  let nearest = DUMPING_SITES[0];
  let minDistance = Infinity;
  DUMPING_SITES.forEach((site) => {
    const dLat = site.coords.lat - lat;
    const dLng = site.coords.lng - lng;
    const distance = dLat * dLat + dLng * dLng;
    if (distance < minDistance) {
      minDistance = distance;
      nearest = site;
    }
  });
  return nearest;
};

function Overview({ data }: { data: ApiReport[] }) {
  const active = data.filter((r) => r.status !== "completed");
  const done = data.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <Card className="border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">{active.length} assigned task{active.length === 1 ? "" : "s"} waiting</p>
              <p className="text-sm text-muted-foreground">Open My Tasks to review and complete assigned reports.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="My Tasks" value={data.length} icon={ClipboardList} tone="primary" />
        <StatCard label="Assigned" value={data.filter(r => r.status === "assigned").length} icon={AlertTriangle} tone="warning" />
        <StatCard label="In Transit" value={data.filter(r => r.status === "collected").length} icon={MapPin} tone="secondary" hint="Heading to dump" />
        <StatCard label="Completed" value={done} icon={CheckCircle2} tone="success" />
      </div>
      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold">Today's route</h3>
        <MapPlaceholder pins={active.map((r) => ({ id: r._id, label: `${shortId(r._id)} - ${r.location}`, type: r.type, coords: r.coords }))} height="h-[380px]" />
      </Card>
    </div>
  );
}

function MyTasks({ data, onUpdated }: { data: ApiReport[]; onUpdated: (report: ApiReport) => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const activeFirst = useMemo(
    () => [...data].sort((a, b) => Number(a.status === "completed") - Number(b.status === "completed")),
    [data]
  );

  const toggle = async (report: ApiReport) => {
    let next: typeof report.status;
    if (report.status === "assigned") next = "collected";
    else if (report.status === "collected") next = "completed";
    else next = "assigned";

    try {
      setUpdatingId(report._id);
      const updated = await reportsApi.update(report._id, { status: next });
      onUpdated(updated);
      if (next === "collected") toast.success("Waste collected! Please navigate to dumping site.");
      else if (next === "completed") toast.success("Dumped! Task completed.");
      else toast.success("Task reopened");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update task";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (data.length === 0) {
    return <Card className="p-12 text-center text-muted-foreground">No tasks assigned to you yet.</Card>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {activeFirst.map((r) => (
        <Card key={r._id} className="p-5 transition hover:shadow-soft">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{shortId(r._id)}</p>
              <h3 className="mt-1 flex items-center gap-1.5 text-base font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> {r.location}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.description || "No additional details."}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <WasteBadge type={r.type} />
              <StatusBadge status={r.status} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => toggle(r)}
              disabled={updatingId === r._id}
              className={r.status === "assigned" ? "bg-gradient-hero text-white" : r.status === "collected" ? "bg-gradient-hero text-white shadow-sm hover:opacity-90" : ""}
              variant={r.status === "completed" ? "outline" : "default"}
            >
              {updatingId === r._id ? "Updating..." : r.status === "assigned" ? "Mark Collected" : r.status === "collected" ? "Mark Dumped" : "Re-open"}
            </Button>
            {r.status === "collected" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <img src="/navigate-icon.png" alt="Navigate" className="w-4 h-4 mr-2" />
                    Nav to Dump
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Select Disposal Site</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {DUMPING_SITES.map((site) => {
                    const isNearest = r.coords && r.coords.lat && getNearestDump(r.coords.lat, r.coords.lng).id === site.id;
                    return (
                      <DropdownMenuItem 
                        key={site.id}
                        className="flex flex-col items-start cursor-pointer py-2"
                        onClick={() => {
                          window.open(`https://www.google.com/maps/dir/?api=1&origin=${r.coords.lat},${r.coords.lng}&destination=${site.coords.lat},${site.coords.lng}`, '_blank', 'noopener,noreferrer');
                          toast.info(`Navigating to ${site.name}`);
                        }}
                      >
                        <span className="font-medium">{site.name}</span>
                        {isNearest && <span className="text-[10px] uppercase text-primary font-bold mt-1 bg-primary/10 px-1.5 py-0.5 rounded-sm">Nearest</span>}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost"
                onClick={() => {
                  if (r.coords && r.coords.lat && r.coords.lng) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.coords.lat},${r.coords.lng}`, '_blank', 'noopener,noreferrer');
                  } else {
                    toast.error("Location coordinates not available for this task.");
                  }
                }}
              >
                <img src="/navigate-icon.png" alt="Navigate" className="w-4 h-4 mr-2" />
                Navigate
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RouteMap({ data }: { data: ApiReport[] }) {
  const active = data.filter((r) => r.status !== "completed");
  
  const reportPins = active.map((r) => ({ id: r._id, label: `${shortId(r._id)} - ${r.location}`, type: r.type, coords: r.coords }));
  const dumpPins = DUMPING_SITES.map((site) => ({ id: site.id, label: `🏭 ${site.name}`, type: "dump" as any, coords: site.coords }));
  const allPins = [...reportPins, ...dumpPins];

  return (
    <div className="space-y-4">
      <Card className="p-2">
        <MapPlaceholder pins={allPins} height="h-[520px]" />
      </Card>
      {active.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Your active assigned reports will appear on this live route map along with nearby disposal sites.
        </Card>
      )}
    </div>
  );
}

function Rewards() {
  const items = [
    { title: "Plant a Tree", cost: 500, desc: "We'll plant a tree in your name in the city park.", icon: "🌱" },
    { title: "Bus Pass Discount", cost: 200, desc: "Get a 20% discount on your next monthly bus pass.", icon: "🚌" },
    { title: "Eco-Warrior Badge", cost: 100, desc: "A shiny badge for your profile and social media.", icon: "🏆" },
    { title: "Coffee Voucher", cost: 150, desc: "Free coffee at any participating local cafe.", icon: "☕" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <Card key={i.title} className="p-5 flex items-start gap-4 transition hover:shadow-glow">
          <div className="text-3xl">{i.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{i.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{i.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">{i.cost} pts</span>
              <Button size="sm" variant="outline">Redeem</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

const titles: Record<string, string> = {
  "/worker": "Worker Overview",
  "/worker/tasks": "My Tasks",
  "/worker/map": "Route Map",
  "/worker/rewards": "Eco-Rewards",
};

export default function WorkerDashboard() {
  const [data, setData] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async (showErrors = true) => {
      try {
        const reports = await reportsApi.getAll({ assignedTo: user.id });
        if (active) setData(reports);
      } catch (error) {
        if (showErrors) {
          const message = error instanceof Error ? error.message : "Failed to load worker tasks";
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(() => load(false), 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const upsertReport = (report: ApiReport) => {
    setData((current) => current.map((item) => (item._id === report._id ? report : item)));
  };

  if (loading) {
    return (
      <DashboardLayout title={titles[pathname] || "Worker"}>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={titles[pathname] || "Worker"}>
      <Routes>
        <Route index element={<Overview data={data} />} />
        <Route path="tasks" element={<MyTasks data={data} onUpdated={upsertReport} />} />
        <Route path="map" element={<RouteMap data={data} />} />
        <Route path="rewards" element={<Rewards />} />
      </Routes>
    </DashboardLayout>
  );
}
