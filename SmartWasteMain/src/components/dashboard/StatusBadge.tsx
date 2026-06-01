import { statusMeta, wasteTypeMeta, type ReportStatus, type WasteType } from "@/lib/types";

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusMeta[status]}`}>
      {status}
    </span>
  );
}

export function WasteBadge({ type }: { type: WasteType | string }) {
  const m = wasteTypeMeta[type as WasteType] || { label: type || "Unknown", bg: "bg-gray-100 text-gray-800 border-gray-300" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${m.bg}`}>
      {m.label}
    </span>
  );
}
