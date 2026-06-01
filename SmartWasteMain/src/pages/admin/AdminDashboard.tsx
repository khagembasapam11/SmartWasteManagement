import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import MapPlaceholder from "@/components/dashboard/MapPlaceholder";
import { StatusBadge, WasteBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClipboardList, AlertTriangle, CheckCircle2, Users, Search, TrendingUp, Activity, Bell } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { type WasteType } from "@/lib/types";
import { reportsApi, workersApi, type ApiReport, type ApiUser, type ApiWorker } from "@/api/client";
import { toast } from "sonner";
import { Routes, Route, useLocation } from "react-router-dom";

const getPersonName = (person?: string | ApiUser) => {
  if (!person) return "-";
  return typeof person === "string" ? person.slice(0, 8) : person.name;
};

const getPersonId = (person?: string | ApiUser) => {
  if (!person) return "";
  return typeof person === "string" ? person : person._id;
};

const shortId = (id: string) => id.slice(-6).toUpperCase();

function Overview({ data, workers }: { data: ApiReport[]; workers: ApiWorker[] }) {
  const total = data.length;
  const pending = data.filter((r) => r.status === "pending").length;
  const completed = data.filter((r) => r.status === "completed").length;
  const assigned = data.filter((r) => r.status === "assigned").length;
  const collected = data.filter((r) => r.status === "collected").length;
  const resolvedPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {pending > 0 && (
        <Card className="border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-warning" />
            <div>
              <p className="font-semibold">{pending} new report{pending === 1 ? "" : "s"} waiting for assignment</p>
              <p className="text-sm text-muted-foreground">Open Manage Reports to assign work to a field worker.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Reports" value={total} icon={ClipboardList} tone="primary" hint="Live from users" />
        <StatCard label="Pending" value={pending} icon={AlertTriangle} tone="warning" />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Active Workers" value={workers.length} icon={Users} tone="secondary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 card-hover">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Report Queue</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { status: "Pending", count: pending },
                { status: "Assigned", count: assigned },
                { status: "Collected", count: collected },
                { status: "Completed", count: completed },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 card-hover">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Resolution Efficiency</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="relative flex h-[240px] items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Completed", value: completed },
                    { name: "Pending", value: pending },
                    { name: "Assigned", value: assigned },
                    { name: "Collected", value: collected },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={total > 0 ? 5 : 0}
                  dataKey="value"
                >
                  {[0, 1, 2, 3].map((_, index) => (
                    <Cell key={index} fill={["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--secondary))", "#3b82f6"][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{resolvedPct}%</span>
              <span className="text-[10px] uppercase text-muted-foreground">Resolved</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 card-hover">
          <h3 className="mb-4 text-base font-semibold">Reports by waste type</h3>
          <div className="space-y-3">
            {(["wet", "dry", "hazardous"] as WasteType[]).map((t) => {
              const count = data.filter((r) => r.type === t).length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={t}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize font-medium">{t}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${t === "wet" ? "bg-waste-wet" : t === "dry" ? "bg-waste-dry" : "bg-waste-hazard"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5 card-hover">
          <h3 className="mb-4 text-base font-semibold">Worker Load</h3>
          <div className="space-y-3">
            {workers.length > 0 ? workers.map((w) => (
              <div key={w._id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-secondary/15 text-secondary text-sm">{w.name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{data.filter((r) => getPersonId(r.assignedTo) === w._id).length} tasks</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No worker accounts yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ManageReports({
  data,
  workers,
  onAssigned,
}: {
  data: ApiReport[];
  workers: ApiWorker[];
  onAssigned: (report: ApiReport) => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<ApiReport | null>(null);
  const [worker, setWorker] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const filtered = useMemo(
    () =>
      data.filter(
        (r) =>
          (type === "all" || r.type === type) &&
          (status === "all" || r.status === status) &&
          (q === "" || `${r._id} ${r.location} ${getPersonName(r.reporter)} ${getPersonName(r.assignedTo)}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [data, q, type, status]
  );

  const assign = async () => {
    if (!target || !worker) return toast.error("Pick a worker");
    try {
      setAssigning(true);
      const response = await workersApi.assign(worker, target._id);
      onAssigned(response.report);
      toast.success(`Assigned report ${shortId(target._id)} to ${workers.find((w) => w._id === worker)?.name}`);
      setOpen(false);
      setTarget(null);
      setWorker("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign task";
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleReward = async (reportId: string) => {
    try {
      const updated = await reportsApi.rewardWorker(reportId);
      onAssigned(updated);
      toast.success("Reward points given to worker!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to give reward";
      toast.error(message);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search id, location, reporter..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="wet">Wet</SelectItem>
              <SelectItem value="dry">Dry</SelectItem>
              <SelectItem value="hazardous">Hazardous</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="collected">Collected (In Transit)</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead>
              <TableHead>Status</TableHead><TableHead>Reporter</TableHead>
              <TableHead>Worker</TableHead><TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r._id}>
                <TableCell className="font-mono text-xs">{shortId(r._id)}</TableCell>
                <TableCell>{r.location}</TableCell>
                <TableCell><WasteBadge type={r.type} /></TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-muted-foreground">{getPersonName(r.reporter)}</TableCell>
                <TableCell className="text-muted-foreground">{getPersonName(r.assignedTo)}</TableCell>
                <TableCell className="text-right">
                  {r.status === "completed" ? (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={r.rewarded}
                      onClick={() => handleReward(r._id)}
                      className={r.rewarded ? "bg-muted text-muted-foreground opacity-50 hover:bg-muted" : "bg-success text-white hover:bg-success/90 shadow-sm"}
                    >
                      {r.rewarded ? "Rewarded" : "Reward"}
                    </Button>
                  ) : r.status === "collected" ? (
                    <Button size="sm" disabled className="text-xs bg-warning/15 text-warning border border-warning/30 opacity-100 font-semibold shadow-sm">
                      Route to Dump
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant={r.status === "assigned" ? "default" : "outline"}
                      className={r.status === "assigned" ? "bg-blue-500 text-white hover:bg-blue-600 border-transparent shadow-sm" : ""} 
                      onClick={() => { setTarget(r); setWorker(getPersonId(r.assignedTo)); setOpen(true); }}
                    >
                      {r.status === "assigned" ? "Re-assign" : "Assign"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No reports match your filters.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign report {target ? shortId(target._id) : ""}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{target?.location}</p>
              <p className="text-muted-foreground">{target?.description || "No description provided."}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Worker</Label>
              <Select value={worker} onValueChange={setWorker}>
                <SelectTrigger><SelectValue placeholder="Select a worker" /></SelectTrigger>
                <SelectContent>
                  {workers.map((w) => <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={assign} disabled={assigning || workers.length === 0} className="bg-gradient-hero text-white">
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function WorkersPage({ data, workers }: { data: ApiReport[]; workers: ApiWorker[] }) {
  // Sort workers by points descending to create the leaderboard ranking, and only keep the top 3
  const rankedWorkers = [...workers].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3);

  return (
    <div className="space-y-10">
      {/* LEADERBOARD SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Worker Leaderboard</h2>
          <p className="text-sm text-muted-foreground">Ranked by performance (Eco-Points)</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rankedWorkers.length > 0 ? rankedWorkers.map((w, index) => {
            const tasks = data.filter((r) => getPersonId(r.assignedTo) === w._id);
            const done = tasks.filter((t) => t.status === "completed").length;
            
            let RankIcon = null;
            if (index === 0) RankIcon = <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-lg shadow-soft border-2 border-white">🥇</div>;
            else if (index === 1) RankIcon = <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-lg shadow-soft border-2 border-white">🥈</div>;
            else if (index === 2) RankIcon = <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-lg shadow-soft border-2 border-white">🥉</div>;
            
            return (
              <Card key={w._id} className="relative p-5 card-hover transition">
                {RankIcon}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-gradient-hero text-white">{w.name.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <p className="font-semibold flex items-center justify-between">
                      {w.name}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase text-primary font-bold">{w.points || 0} pts</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{w.email || "Field worker"}</p>
                  </div>
                </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-lg font-bold">{tasks.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg bg-warning/10 p-2">
                  <p className="text-lg font-bold text-warning">{tasks.length - done}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="rounded-lg bg-success/10 p-2">
                  <p className="text-lg font-bold text-success">{done}</p>
                  <p className="text-xs text-muted-foreground">Done</p>
                </div>
              </div>
            </Card>
          );
        }) : (
          <Card className="p-12 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">Create a worker account, then it will appear here for assignment.</Card>
        )}
        </div>
      </section>

      {/* ALL WORKERS DIRECTORY TABLE */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">All Workers Directory</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Active Tasks</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-right">Total Eco-Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((w) => {
                  const tasks = data.filter((r) => getPersonId(r.assignedTo) === w._id);
                  const done = tasks.filter((t) => t.status === "completed").length;
                  const active = tasks.length - done;
                  return (
                    <TableRow key={w._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="bg-gradient-hero text-white text-xs">{w.name.charAt(0)}</AvatarFallback></Avatar>
                          {w.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{w.email || "No email"}</TableCell>
                      <TableCell className="text-center font-medium">{active}</TableCell>
                      <TableCell className="text-center font-medium text-success">{done}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{w.points || 0} pts</TableCell>
                    </TableRow>
                  );
                })}
                {workers.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No workers available.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </div>
  );
}

function CityMap({ data }: { data: ApiReport[] }) {
  return (
    <Card className="p-2">
      <MapPlaceholder pins={data.map((r) => ({ id: r._id, label: `${shortId(r._id)} - ${r.location}`, type: r.type, coords: r.coords }))} height="h-[520px]" />
    </Card>
  );
}

const titles: Record<string, string> = {
  "/admin": "Admin Overview",
  "/admin/reports": "Manage Reports",
  "/admin/workers": "Workers",
  "/admin/map": "City Map",
};

export default function AdminDashboard() {
  const [data, setData] = useState<ApiReport[]>([]);
  const [workers, setWorkers] = useState<ApiWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    let active = true;

    const load = async (showErrors = true) => {
      try {
        const [reports, workerList] = await Promise.all([
          reportsApi.getAll(),
          workersApi.getAll(),
        ]);
        if (!active) return;
        setData(reports);
        setWorkers(workerList);
      } catch (error) {
        if (showErrors) {
          const message = error instanceof Error ? error.message : "Failed to load admin data";
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
  }, []);

  const upsertReport = (report: ApiReport) => {
    setData((current) => current.map((item) => (item._id === report._id ? report : item)));
  };

  if (loading) {
    return (
      <DashboardLayout title={titles[pathname] || "Admin"}>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={titles[pathname] || "Admin"}>
      <Routes>
        <Route index element={<Overview data={data} workers={workers} />} />
        <Route path="reports" element={<ManageReports data={data} workers={workers} onAssigned={upsertReport} />} />
        <Route path="workers" element={<WorkersPage data={data} workers={workers} />} />
        <Route path="map" element={<CityMap data={data} />} />
      </Routes>
    </DashboardLayout>
  );
}
