import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import MapPlaceholder from "@/components/dashboard/MapPlaceholder";
import { StatusBadge, WasteBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ClipboardList, AlertTriangle, CheckCircle2, Bell, Leaf, Bus, Award, Coffee } from "lucide-react";
import { sessionsApi, reportsApi, type ApiSession, type ApiReport } from "@/api/client";
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

function Overview({ reports, activeSession }: { reports: ApiReport[], activeSession: ApiSession | null }) {
  const active = reports.filter((r) => r.status !== "completed");
  const done = reports.filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-6">
      {activeSession && (
        <Card className="border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Active Route Session</p>
              <p className="text-sm text-muted-foreground">You have a route with {activeSession.reports.length} locations assigned. Open My Tasks to complete them.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={reports.length} icon={ClipboardList} tone="primary" />
        <StatCard label="Assigned" value={reports.filter(r => r.status === "assigned").length} icon={AlertTriangle} tone="warning" />
        <StatCard label="In Transit" value={reports.filter(r => r.status === "collected").length} icon={MapPin} tone="secondary" hint="Heading to dump" />
        <StatCard label="Completed" value={done} icon={CheckCircle2} tone="success" />
      </div>
      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold">Today's Route Map</h3>
        <MapPlaceholder pins={active.filter(r => r.coords).map((r) => ({ id: r._id, label: `${shortId(r._id)} - ${r.location}`, type: r.type, coords: r.coords! }))} height="h-[380px]" />
      </Card>
    </div>
  );
}

function SessionView({ session, onReload }: { session: ApiSession | null, onReload: () => void }) {
  const [claiming, setClaiming] = useState(false);

  const claimNearest = () => {
    setClaiming(true);
    const performClaim = async (lat?: number, lng?: number) => {
      try {
        await sessionsApi.claimNearest(lat, lng);
        toast.success("Successfully claimed a route session!");
        onReload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to claim route");
      } finally {
        setClaiming(false);
      }
    };

    if (!navigator.geolocation) {
      toast.warning("Geolocation not supported. Claiming any available route...");
      performClaim();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => performClaim(position.coords.latitude, position.coords.longitude),
      (err) => {
        toast.warning("Unable to retrieve location. Claiming any available route...");
        performClaim();
      }
    );
  };

  const toggleReport = async (r: ApiReport) => {
    try {
      const next = r.status === "assigned" ? "collected" : "assigned";
      await reportsApi.update(r._id, { status: next });
      toast.success(next === "collected" ? "Waste collected!" : "Task reopened");
      onReload();
    } catch (e) {
      toast.error("Failed to update");
    }
  };

  const completeSession = async () => {
    if (!session) return;
    try {
      await sessionsApi.complete(session._id);
      toast.success("Dumped! Route Session completed.");
      onReload();
    } catch (e) {
      toast.error("Failed to complete session");
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[40vh] border-2 border-dashed border-border rounded-xl">
        <MapPin className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">No Active Route</h2>
        <p className="text-muted-foreground mb-8 max-w-md">You don't have an assigned route session right now. Click below to automatically find and claim the nearest pending route cluster.</p>
        <Button size="lg" onClick={claimNearest} disabled={claiming}>
          {claiming ? "Locating..." : "Find & Claim Nearest Route"}
        </Button>
      </div>
    );
  }

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const nearestDump = session ? DUMPING_SITES.reduce((prev, curr) => {
    const distPrev = getDistance(session.centerCoords.lat, session.centerCoords.lng, prev.coords.lat, prev.coords.lng);
    const distCurr = getDistance(session.centerCoords.lat, session.centerCoords.lng, curr.coords.lat, curr.coords.lng);
    return distCurr < distPrev ? curr : prev;
  }) : DUMPING_SITES[0];

  const allCollected = session?.reports.every((r: ApiReport) => r.status === "collected" || r.status === "completed");

  return (
    <div className="space-y-6">
      <Card className="p-5 border-primary bg-primary/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold capitalize">{session?.sessionType} Route Session</h2>
            <p className="text-sm text-muted-foreground">{session?.reports.length} locations in this route cluster</p>
          </div>
          {allCollected && session?.status !== "completed" && (
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white hover:bg-muted text-foreground">Navigate to Dump</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Select Disposal Site</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {DUMPING_SITES.map((site) => {
                    const isNearest = site.id === nearestDump.id;
                    return (
                      <DropdownMenuItem 
                        key={site.id}
                        className="cursor-pointer flex items-center justify-between"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${site.coords.lat},${site.coords.lng}`, '_blank')}
                      >
                        <span className="font-medium">{site.name}</span>
                        {isNearest && <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm ml-2">Nearest</span>}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={completeSession} className="bg-success text-white hover:bg-success/90 shadow-sm">
                Mark as Dumped
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        {session.reports.map((r: ApiReport) => (
           <Card key={r._id} className="p-5">
             <div className="flex justify-between items-start">
               <div>
                 <p className="font-mono text-xs text-muted-foreground">{shortId(r._id)}</p>
                 <h3 className="font-semibold text-lg mt-1">{r.location}</h3>
               </div>
               <div className="flex flex-col items-end gap-1">
                 <WasteBadge type={r.type} />
                 <StatusBadge status={r.status} />
               </div>
             </div>
             <div className="mt-4 flex gap-2">
               <Button 
                 onClick={() => toggleReport(r)} 
                 variant={r.status === "collected" || r.status === "completed" ? "outline" : "default"}
                 className={r.status === "assigned" ? "bg-gradient-hero text-white" : ""}
               >
                 {r.status === "collected" || r.status === "completed" ? "Collected" : "Mark Collected"}
               </Button>
               <Button variant="ghost" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.coords?.lat},${r.coords?.lng}`, '_blank')}>
                 <Navigation className="w-4 h-4 mr-2" /> Navigate
               </Button>
             </div>
           </Card>
        ))}
      </div>
    </div>
  );
}

function MyTasks({ sessions, onReload }: { sessions: ApiSession[], onReload: () => void }) {
  const activeSession = sessions.find((s) => s.status !== "completed") || null;
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const completedReports = completedSessions.flatMap(s => s.reports);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold mb-4">Ongoing Tasks</h2>
        <SessionView session={activeSession} onReload={onReload} />
      </section>

      {completedReports.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedReports.map(r => (
              <Card key={r._id} className="p-5 opacity-80">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="font-mono text-xs text-muted-foreground">{shortId(r._id)}</p>
                     <h3 className="font-semibold text-base mt-1">{r.location}</h3>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                     <WasteBadge type={r.type} />
                     <StatusBadge status={r.status} />
                   </div>
                 </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RouteMap({ session }: { session: ApiSession | null }) {
  if (!session) return <Card className="p-8 text-center text-sm text-muted-foreground">No active route.</Card>;
  const active = session.reports.filter((r: ApiReport) => r.status !== "completed");
  const reportPins = active.filter(r => r.coords).map((r: ApiReport) => ({ id: r._id, label: `${shortId(r._id)} - ${r.location}`, type: r.type, coords: r.coords! }));
  const dumpPins = DUMPING_SITES.map((site) => ({ id: site.id, label: `🏭 ${site.name}`, type: "dump" as any, coords: site.coords }));
  
  return (
    <Card className="p-2">
      <MapPlaceholder pins={[...reportPins, ...dumpPins]} height="h-[520px]" />
    </Card>
  );
}

function Rewards() {
  const items = [
    { title: "Plant a Tree", cost: 500, desc: "We'll plant a tree in your name in the city park.", icon: Leaf },
    { title: "Bus Pass Discount", cost: 200, desc: "Get a 20% discount on your next monthly bus pass.", icon: Bus },
    { title: "Eco-Warrior Badge", cost: 100, desc: "A shiny badge for your profile and social media.", icon: Award },
    { title: "Coffee Voucher", cost: 150, desc: "Free coffee at any participating local cafe.", icon: Coffee },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((i) => (
        <Card key={i.title} className="p-5 flex items-start gap-4 transition hover:-translate-y-1 hover:shadow-glow">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <i.icon className="h-6 w-6" />
          </div>
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
  "/worker": "Overview",
  "/worker/tasks": "My Tasks",
  "/worker/map": "Live Map",
  "/worker/rewards": "Eco-Rewards",
};

export default function WorkerDashboard() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();
  const { user } = useAuth();

  const load = async (showErrors = true) => {
    try {
      if (!user) return;
      const res = await sessionsApi.getAll({ assignedTo: user.id });
      setSessions(res);
    } catch (error) {
      if (showErrors) toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(false), 15000);
    return () => window.clearInterval(interval);
  }, [user]);

  const activeSession = sessions.find((s) => s.status !== "completed") || null;
  const allReports = sessions.flatMap((s) => s.reports);

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
        <Route index element={<Overview reports={allReports} activeSession={activeSession} />} />
        <Route path="tasks" element={<MyTasks sessions={sessions} onReload={load} />} />
        <Route path="map" element={<RouteMap session={activeSession} />} />
        <Route path="rewards" element={<Rewards />} />
      </Routes>
    </DashboardLayout>
  );
}
