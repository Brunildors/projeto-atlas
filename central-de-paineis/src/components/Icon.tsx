import type { ReactNode } from "react";
import type { IconName } from "../types";

const SHAPES: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9v11h13V9" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),

  finance: (
    <>
      <path d="M12 2.5v19" />
      <path d="M16.5 7c-.7-1.4-2.3-2.2-4.5-2.2-2.6 0-4.4 1.3-4.4 3.2 0 2 1.8 2.8 4.4 3.4 2.7.6 4.5 1.5 4.5 3.7 0 2-1.9 3.5-4.5 3.5-2.4 0-4-.9-4.7-2.3" />
    </>
  ),

  infra: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="2" />
      <rect x="3.5" y="13" width="17" height="7" rx="2" />
      <path d="M7.5 7.5h.01M7.5 16.5h.01M11.5 7.5h5M11.5 16.5h5" />
    </>
  ),

  marketing: (
    <>
      <path d="M16.34 11.04A7 7 0 1 1 12.96 7.66" />
      <circle cx="10" cy="14" r="3.5" />
      <path d="M10 14 19 5" />
      <path d="M15.5 5.5v3h3M17.5 3.5v3h3" />
    </>
  ),

  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" />
    </>
  ),

  projects: (
    <>
      <path d="M10.5 6.5H20M10.5 12H20M10.5 17.5H20" />
      <path d="m4 6.5 1.6 1.6L8.5 5M4 12l1.6 1.6L8.5 10.5" />
      <rect x="4" y="15.5" width="4" height="4" rx="1" />
    </>
  ),

  assistant: (
    <>
      <path d="M10 4c.7 4.2 2.8 6.3 7 7-4.2.7-6.3 2.8-7 7-.7-4.2-2.8-6.3-7-7 4.2-.7 6.3-2.8 7-7Z" />
      <path d="M18.5 3c.25 1.5 1 2.25 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.25 2.25-1 2.5-2.5Z" />
    </>
  ),

  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.9-3.9 3.9-6 7.5-6s6.6 2.1 7.5 6" />
    </>
  ),

  chat: <path d="M20 11.5a7.5 7.5 0 0 1-11.2 6.5L4 19.5l1.5-4.3A7.5 7.5 0 1 1 20 11.5Z" />,

  send: <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />,

  plus: <path d="M12 5v14M5 12h14" />,

  chevron: <path d="m6 9 6 6 6-6" />,

  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,

  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />,

  close: <path d="M6 6l12 12M18 6 6 18" />,

  folder: <path d="M3.5 7.5a2 2 0 0 1 2-2h3.8l2.2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />,

  grip: (
    <g fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </g>
  ),

  file: (
    <>
      <path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
    </>
  ),

  paperclip: (
    <path d="m19.5 11.5-7.4 7.4a4.8 4.8 0 0 1-6.8-6.8l7.9-7.9a3.2 3.2 0 0 1 4.5 4.5l-7.9 7.9a1.6 1.6 0 0 1-2.3-2.3l7.4-7.4" />
  ),

  upload: <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />,

  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />,

  back: <path d="M19 12H5M11 5.5 4.5 12l6.5 6.5" />,

  heatmap: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />
      <g fill="currentColor" stroke="none">
        <rect x="9.2" y="3.5" width="5.6" height="5.7" />
        <rect x="14.8" y="9.2" width="5.7" height="5.6" />
        <rect x="3.5" y="14.8" width="5.7" height="5.7" />
      </g>
    </>
  ),

  timeline: (
    <>
      <path d="M3.5 4v16.5h17" />
      <rect x="6.5" y="6" width="7" height="3" rx="1.2" />
      <rect x="10" y="11" width="8" height="3" rx="1.2" />
      <rect x="8" y="16" width="5.5" height="2.2" rx="1.1" />
    </>
  ),

  forecast: (
    <>
      <path d="M3.5 4v16.5h17" />
      <path d="m7 15.5 3.5-3.5 3 2.5 5.5-6.5" />
      <path d="M15.5 8h3.5v3.5" />
    </>
  ),

  alert: (
    <>
      <path d="M10.3 4.3 2.9 17.5a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4.5M12 17.2h.01" />
    </>
  ),

  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5Z" />
    </>
  ),

  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),

  history: (
    <>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4.5v3.8h3.8M12 8v4l2.8 1.8" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[name]}
    </svg>
  );
}
