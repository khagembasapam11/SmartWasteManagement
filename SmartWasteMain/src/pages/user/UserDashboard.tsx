import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import MapPlaceholder from "@/components/dashboard/MapPlaceholder";
import { StatusBadge, WasteBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, FileText, CheckCircle2, MapPin, Upload, Image as ImageIcon, Bell, Sparkles } from "lucide-react";
import { type WasteType } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Routes, Route, useLocation } from "react-router-dom";
import { reportsApi, binsApi, type ApiBin, type ApiReport, type ApiUser } from "@/api/client";

const getPersonName = (person?: string | ApiUser) => {
  if (!person) return "-";
  return typeof person === "string" ? person.slice(0, 8) : person.name;
};

interface LocationSuggestion {
  label: string;
  coords: { lat: number; lng: number };
}

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
}

const toLocationSuggestion = (place: NominatimPlace): LocationSuggestion => ({
  label: place.display_name,
  coords: { lat: Number(place.lat), lng: Number(place.lon) },
});

function Overview() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [bins, setBins] = useState<ApiBin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadData = async () => {
      try {
        const [reportsData, binsData] = await Promise.all([
          reportsApi.getAll({ reporter: user.id }),
          binsApi.getAll(),
        ]);
        if (!active) return;
        setReports(reportsData);
        setBins(binsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    const interval = window.setInterval(loadData, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const userReports = reports.slice(0, 3);
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const completedCount = reports.filter((r) => r.status === "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {completedCount > 0 && (
        <Card className="border-success/30 bg-success/10 p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">{completedCount} report{completedCount === 1 ? "" : "s"} completed</p>
              <p className="text-sm text-muted-foreground">Your completed waste reports are updated below in My Reports.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Reports" value={reports.length} icon={FileText} tone="primary" hint={`${pendingCount} pending`} />
        <StatCard label="Eco-Points" value={user?.points || 0} icon={CheckCircle2} tone="success" hint="Earned from reports" />
        <StatCard label="Pending" value={pendingCount} icon={ClipboardList} tone="warning" />
        <StatCard label="Nearby Bins" value={bins.length} icon={MapPin} tone="secondary" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2 card-hover">
          <h3 className="mb-4 text-base font-semibold">Recent Reports</h3>
          <div className="space-y-3">
            {userReports.length > 0 ? (
              userReports.map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{r.location}</p>
                    <p className="text-xs text-muted-foreground">{r._id} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <WasteBadge type={r.type} /><StatusBadge status={r.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No reports yet</p>
            )}
          </div>
        </Card>
        <Card className="p-5 card-hover">
          <h3 className="mb-4 text-base font-semibold">Bin Snapshot</h3>
          <div className="space-y-3">
            {bins.slice(0, 4).map((b) => (
              <div key={b._id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground">{b.fill}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${b.fill > 80 ? "bg-destructive" : b.fill > 50 ? "bg-warning" : "bg-success"}`} style={{ width: `${b.fill}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportForm() {
  const [type, setType] = useState<WasteType>("wet");
  const [location, setLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const query = location.trim();
    if (query.length < 3 || selectedCoords) {
      setSearchingLocation(false);
      if (query.length < 3) setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearchingLocation(true);
        const params = new URLSearchParams({
          q: query,
          format: "jsonv2",
          limit: "5",
          addressdetails: "1",
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Location lookup failed");
        const places = (await response.json()) as NominatimPlace[];
        setSuggestions(places.map(toLocationSuggestion));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Location search failed:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setSearchingLocation(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [location, selectedCoords]);

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.label);
    setSelectedCoords(suggestion.coords);
    setSuggestions([]);
  };

  const lookupLocation = async (query: string) => {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    if (!response.ok) return null;
    const places = (await response.json()) as NominatimPlace[];
    return places[0] ? toLocationSuggestion(places[0]) : null;
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        try {
          const params = new URLSearchParams({
            lat: String(latitude),
            lon: String(longitude),
            format: "jsonv2",
          });
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
          const place = response.ok ? (await response.json() as NominatimPlace) : null;
          const suggestion = place?.display_name
            ? toLocationSuggestion(place)
            : { label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, coords };
          selectSuggestion(suggestion);
          toast.success("Location detected! You can refine it if needed.", {
            description: suggestion.label
          });
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          selectSuggestion({ label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, coords });
          toast.success("Location detected! You can refine it if needed.", {
            description: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          });
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        setFetchingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable it in your browser.");
        } else {
          toast.error("Unable to fetch location. Please try again.");
        }
      }
    );
  };

  const analyze = async () => {
    if (!file) return toast.error("Please upload a photo first");
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`http://${window.location.hostname}:8000/predict`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }
      
      const result = await response.json();
      const detected = result.prediction as WasteType;
      const confidence = (result.confidence * 100).toFixed(1);
      
      setType(detected);
      toast.success(`AI detected: ${detected.toUpperCase()} waste`, {
        description: `Classification accuracy: ${confidence}%`
      });
    } catch (error) {
      console.error(error);
      toast.error("Error analyzing image with AI. Please try again or select manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return toast.error("Please add a location");
    
    try {
      setLoading(true);
      
      // Parse coordinates from location string (format: "lat, lng")
      const coordMatch = location.match(/([-\d.]+),\s*([-\d.]+)/);
      const typedSuggestion = selectedCoords ? null : await lookupLocation(location);
      const coords = selectedCoords || typedSuggestion?.coords || (coordMatch 
        ? { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) }
        : { lat: 12.97, lng: 77.59 }); // Default fallback

      await reportsApi.create({
        location,
        type,
        description: desc,
        coords,
      });

      await refreshUser();
      toast.success("Report submitted! +20 Eco-Points earned.");
      setLocation("");
      setSelectedCoords(null);
      setSuggestions([]);
      setDesc("");
      setFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h2 className="text-lg font-semibold">Report Waste</h2>
      <p className="mt-1 text-sm text-muted-foreground">Help keep your neighborhood clean.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setSelectedCoords(null);
                }}
                placeholder="Search street, landmark or area"
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={useCurrentLocation}
              disabled={fetchingLocation}
              className="flex items-center gap-2"
            >
              {fetchingLocation ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="hidden sm:inline">Fetching...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Current</span>
                </>
              )}
            </Button>
          </div>
          {(searchingLocation || suggestions.length > 0) && (
            <div className="rounded-lg border border-border bg-card shadow-soft">
              {searchingLocation && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching real locations...</p>
              )}
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.coords.lat}-${suggestion.coords.lng}-${suggestion.label}`}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="flex w-full items-start gap-2 border-t border-border px-3 py-2 text-left text-sm transition first:border-t-0 hover:bg-muted/60"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="line-clamp-2">{suggestion.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Waste type</Label>
          <Select value={type} onValueChange={(v) => setType(v as WasteType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="wet"><span className="inline-block h-2 w-2 rounded-full bg-waste-wet mr-2" />Wet (organic)</SelectItem>
              <SelectItem value="dry"><span className="inline-block h-2 w-2 rounded-full bg-waste-dry mr-2" />Dry (recyclable)</SelectItem>
              <SelectItem value="hazardous"><span className="inline-block h-2 w-2 rounded-full bg-waste-hazard mr-2" />Hazardous</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Any details that help workers locate it…" rows={3} />
        </div>
        <div className="space-y-3">
          <Label>Photo</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50 hover:bg-primary/5">
            {file ? (
              <><ImageIcon className="h-6 w-6 text-primary" /><span className="text-sm font-medium">{file.name}</span></>
            ) : (
              <><Upload className="h-6 w-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload an image</span></>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <Button
            type="button"
            className={`w-full transition-all duration-300 ${!file || analyzing ? "bg-muted text-muted-foreground" : "bg-gradient-hero text-white shadow-sm hover:shadow"}`}
            disabled={!file || analyzing}
            onClick={analyze}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-sm font-medium">Scanning...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Scan (AI)</span>
              </span>
            )}
          </Button>
        </div>
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-hero text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </span>
          ) : (
            "Submit report"
          )}
        </Button>
      </form>
    </Card>
  );
}

function MyReports() {
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadReports = async () => {
      try {
        const data = await reportsApi.getAll({ reporter: user.id });
        if (active) setReports(data);
      } catch (error) {
        console.error("Error loading reports:", error);
        toast.error("Failed to load reports");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();
    const interval = window.setInterval(loadReports, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-5 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <h2 className="text-lg font-semibold">My submitted reports</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead>
              <TableHead>Status</TableHead><TableHead>Worker</TableHead><TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length > 0 ? (
              reports.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono text-xs">{r._id.slice(0, 8)}</TableCell>
                  <TableCell>{r.location}</TableCell>
                  <TableCell><WasteBadge type={r.type} /></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{getPersonName(r.assignedTo)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  No reports yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function ReportMap() {
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadReports = async () => {
      try {
        const data = await reportsApi.getAll({ reporter: user.id });
        if (active) setReports(data);
      } catch (error) {
        console.error("Error loading report map:", error);
        toast.error("Failed to load report map");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports();
    const interval = window.setInterval(loadReports, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-2">
        <MapPlaceholder
          pins={reports.map((r) => ({
            id: r._id,
            label: `${r._id.slice(-6).toUpperCase()} - ${r.location}`,
            type: r.type,
            coords: r.coords,
          }))}
          height="h-[520px]"
        />
      </Card>
      {reports.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Submit a report and it will appear on this live map.
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
  "/user": "Dashboard",
  "/user/report": "Report Waste",
  "/user/reports": "My Reports",
  "/user/map": "My Report Map",
  "/user/rewards": "Eco-Rewards",
};

export default function UserDashboard() {
  const { pathname } = useLocation();
  return (
    <DashboardLayout title={titles[pathname] || "User"}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="report" element={<ReportForm />} />
        <Route path="reports" element={<MyReports />} />
        <Route path="map" element={<ReportMap />} />
        <Route path="rewards" element={<Rewards />} />
      </Routes>
    </DashboardLayout>
  );
}
