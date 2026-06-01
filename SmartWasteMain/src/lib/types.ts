export type WasteType = "wet" | "dry" | "hazardous" | "dump";
export type ReportStatus = "pending" | "assigned" | "collected" | "completed";
export type Role = "user" | "admin" | "worker";

export interface Report {
  id: string;
  location: string;
  type: WasteType;
  status: ReportStatus;
  reporter: string;
  assignedTo?: string;
  createdAt: string;
  description?: string;
  coords: { lat: number; lng: number };
}

export interface Bin {
  id: string;
  name: string;
  fill: number;
  type: WasteType;
  coords: { lat: number; lng: number };
}

export const workers = [
  { id: "w1", name: "Ravi Kumar" },
  { id: "w2", name: "Aisha Khan" },
  { id: "w3", name: "Diego Ortega" },
];

export const reports: Report[] = [
  { id: "R-1042", location: "MG Road, Block A", type: "wet", status: "pending", reporter: "Anita S.", createdAt: "2026-05-03", coords: { lat: 12.97, lng: 77.59 }, description: "Overflowing food waste near bus stop." },
  { id: "R-1043", location: "Park Street 12", type: "hazardous", status: "assigned", reporter: "John D.", assignedTo: "w1", createdAt: "2026-05-03", coords: { lat: 12.98, lng: 77.6 }, description: "Broken batteries dumped on sidewalk." },
  { id: "R-1044", location: "5th Ave Plaza", type: "dry", status: "completed", reporter: "Maya L.", assignedTo: "w2", createdAt: "2026-05-02", coords: { lat: 12.96, lng: 77.58 } },
  { id: "R-1045", location: "Lakeview Apartments", type: "wet", status: "assigned", reporter: "Carlos M.", assignedTo: "w3", createdAt: "2026-05-04", coords: { lat: 12.99, lng: 77.61 } },
  { id: "R-1046", location: "Industrial Zone B", type: "hazardous", status: "pending", reporter: "Priya R.", createdAt: "2026-05-04", coords: { lat: 12.95, lng: 77.62 } },
  { id: "R-1047", location: "Market Square", type: "dry", status: "pending", reporter: "Tom W.", createdAt: "2026-05-04", coords: { lat: 12.97, lng: 77.6 } },
];

export const bins: Bin[] = [
  { id: "B1", name: "Central Park Bin", fill: 72, type: "wet", coords: { lat: 12.97, lng: 77.59 } },
  { id: "B2", name: "Tech Park East", fill: 45, type: "dry", coords: { lat: 12.98, lng: 77.6 } },
  { id: "B3", name: "Riverside", fill: 90, type: "hazardous", coords: { lat: 12.96, lng: 77.58 } },
  { id: "B4", name: "City Mall", fill: 30, type: "dry", coords: { lat: 12.99, lng: 77.61 } },
];

export const DUMPING_SITES = [
  { id: "dump-belortol", name: "Belortol Disposal Site", coords: { lat: 26.1118, lng: 91.6214 } },
  { id: "dump-rgb", name: "RGB Road Transfer Station (Ganeshguri)", coords: { lat: 26.1525, lng: 91.7812 } },
  { id: "dump-gmch", name: "GMCH Transfer Station (Bhangagarh)", coords: { lat: 26.1600, lng: 91.7680 } },
];

export const wasteTypeMeta: Record<WasteType, { label: string; color: string; bg: string }> = {
  wet: { label: "Wet", color: "text-waste-wet", bg: "bg-waste-wet/15 text-waste-wet border-waste-wet/30" },
  dry: { label: "Dry", color: "text-waste-dry", bg: "bg-waste-dry/15 text-waste-dry border-waste-dry/30" },
  hazardous: { label: "Hazardous", color: "text-waste-hazard", bg: "bg-waste-hazard/15 text-waste-hazard border-waste-hazard/30" },
  dump: { label: "Disposal Site", color: "text-blue-600", bg: "bg-blue-600/15 text-blue-600 border-blue-600/30" },
};

export const statusMeta: Record<ReportStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  assigned: "bg-secondary/15 text-secondary border-secondary/30",
  collected: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  completed: "bg-success/15 text-success border-success/30",
};
