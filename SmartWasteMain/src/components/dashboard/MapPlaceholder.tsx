import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { MapPin } from "lucide-react";
import { wasteTypeMeta, type WasteType } from "@/lib/types";
import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

// Fix for default leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle map resizing when sidebar toggles
function MapResizer() {
  const map = useMap();
  const { state } = useSidebar();
  
  useEffect(() => {
    // Small timeout to allow sidebar animation to complete
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [state, map]);
  
  return null;
}

interface Pin { id: string; label: string; type: WasteType; coords: { lat: number; lng: number } }

const createCustomIcon = (type: WasteType | string) => {
  if (type === "dump") {
    return L.divIcon({
      html: renderToString(
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute h-12 w-12 bg-blue-500 rounded-full animate-ping opacity-40"></div>
          <div className="relative flex items-center justify-center bg-white rounded-full p-1 border-4 border-blue-600 shadow-xl">
            <MapPin className="h-8 w-8 text-blue-600" fill="currentColor" />
          </div>
        </div>
      ),
      className: "custom-marker-icon dump-marker",
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    });
  }

  const color = wasteTypeMeta[type as WasteType]?.color || "text-gray-500";
  return L.divIcon({
    html: renderToString(
      <div className="relative flex flex-col items-center">
        <MapPin className={`h-8 w-8 drop-shadow-md ${color}`} fill="white" />
      </div>
    ),
    className: "custom-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

export default function MapPlaceholder({ pins, height = "h-[420px]" }: { pins: Pin[]; height?: string }) {
  const center: [number, number] = pins.length > 0 
    ? [pins[0].coords.lat, pins[0].coords.lng] 
    : [12.9716, 77.5946];

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-border ${height} z-0`}>
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={false} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        {pins.map((p) => (
          <Marker 
            key={p.id} 
            position={[p.coords.lat, p.coords.lng]} 
            icon={createCustomIcon(p.type)}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <p className="font-bold text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground capitalize">Type: {p.type}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] rounded-md bg-card/90 px-3 py-2 text-xs shadow-soft backdrop-blur border border-border">
        <p className="font-semibold mb-1 text-foreground">Legend</p>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-waste-wet" /> Wet</span>
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-waste-dry" /> Dry</span>
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-waste-hazard" /> Hazard</span>
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-blue-600" /> Dump</span>
        </div>
      </div>
      
      <div className="absolute right-3 top-3 z-[1000] rounded-md bg-card/90 px-2 py-1 text-[10px] uppercase tracking-wider text-primary font-bold shadow-soft backdrop-blur border border-primary/20">
        Live Smart Map
      </div>
    </div>
  );
}
