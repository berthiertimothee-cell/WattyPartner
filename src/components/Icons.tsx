import { cn } from "@/lib/utils";

type P = { className?: string };
function I({ className, children }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={cn("h-5 w-5", className)} aria-hidden>
      {children}
    </svg>
  );
}

export const GridIcon = (p: P) => (
  <I {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </I>
);
export const UsersIcon = (p: P) => (
  <I {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </I>
);
export const PinIcon = (p: P) => (
  <I {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </I>
);
export const BoltIcon = (p: P) => (
  <I {...p}>
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8Z" />
  </I>
);
export const WrenchIcon = (p: P) => (
  <I {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" />
  </I>
);
export const TruckIcon = (p: P) => (
  <I {...p}>
    <path d="M1 6h13v10H1z" />
    <path d="M14 9h4l3 3v4h-7z" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </I>
);
export const CoinIcon = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.3A3 3 0 0 0 12 8c-1.7 0-3 1-3 2.3 0 3 6 1.4 6 4.4 0 1.3-1.3 2.3-3 2.3a3 3 0 0 1-2.5-1.3M12 6.5v11" />
  </I>
);
export const MegaphoneIcon = (p: P) => (
  <I {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M11 18v3" />
  </I>
);
export const DocIcon = (p: P) => (
  <I {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
  </I>
);
export const ChartIcon = (p: P) => (
  <I {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-4 3 3 4-6" />
  </I>
);
export const BellIcon = (p: P) => (
  <I {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </I>
);
export const CogIcon = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 6.9 4.6l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </I>
);
export const SparkleIcon = (p: P) => (
  <I {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  </I>
);
export const ArrowUpRight = (p: P) => (
  <I {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </I>
);
export const ChevronRight = (p: P) => (
  <I {...p}>
    <path d="m9 6 6 6-6 6" />
  </I>
);
export const ArrowLeft = (p: P) => (
  <I {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </I>
);
export const CheckIcon = (p: P) => (
  <I {...p}>
    <path d="M20 6 9 17l-5-5" />
  </I>
);
export const ClockIcon = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </I>
);
export const AlertTriangleIcon = (p: P) => (
  <I {...p}>
    <path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v5M12 17h.01" />
  </I>
);
export const DownloadIcon = (p: P) => (
  <I {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </I>
);
export const MailIcon = (p: P) => (
  <I {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </I>
);
export const PlusIcon = (p: P) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const SearchIcon = (p: P) => (
  <I {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </I>
);
export const PowerIcon = (p: P) => (
  <I {...p}>
    <path d="M18.4 6.6a9 9 0 1 1-12.8 0M12 2v10" />
  </I>
);
export const LeafIcon = (p: P) => (
  <I {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-6 8-9 16-9 0 8-3 16-9 16Z" />
    <path d="M9 14c2-3 5-5 9-6" />
  </I>
);
