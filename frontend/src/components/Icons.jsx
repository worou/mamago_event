/** Icônes en trait, alignées sur les maquettes. `currentColor` partout. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': 'true',
}

export const CalendarIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
)

export const ClockIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const PinIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const TicketIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
    <path d="M14 6v12" strokeDasharray="2 2" />
  </svg>
)

export const SearchIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const UserIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </svg>
)

export const ShieldIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6l7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m5 13 4 4L19 7" />
  </svg>
)

export const DownloadIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M5 19h14" />
  </svg>
)

export const ArrowLeftIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </svg>
)

export const ArrowRightIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" />
  </svg>
)

export const LockIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
  </svg>
)

export const HeadsetIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 13v-1a8 8 0 1 1 16 0v1" />
    <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
    <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
    <path d="M20 19v1a3 3 0 0 1-3 3h-3" />
  </svg>
)

export const MailIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
)

export const CardIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="M2.5 10h19" />
  </svg>
)

export const RefreshIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 11a8 8 0 1 0-.6 4" />
    <path d="M20 4v7h-7" />
  </svg>
)

export const LogoutIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M15 12H4m0 0 4-4m-4 4 4 4" />
    <path d="M10 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7" />
  </svg>
)

export const EyeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const HeartIcon = ({ filled = false, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}>
    <path d="M12 20s-7-4.4-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5c0 5.1-7 9.5-7 9.5Z" />
  </svg>
)

export const HomeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
  </svg>
)

export const ChevronDownIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ShareIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
)

export const UsersIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3 2.9-5 6.5-5s6.5 2 6.5 5" />
    <path d="M17 8.2a3.5 3.5 0 0 1 0 6.6M18.5 20c0-1.6-.5-3-1.4-4" />
  </svg>
)

export const MicIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
)

export const QuestionIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-1 .8-1 1.4v.4" />
    <path d="M12 17h.01" />
  </svg>
)

export const EyeOffIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M10.6 6.1A7.9 7.9 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-3 3.6M6.3 7.8A15 15 0 0 0 2.5 12S6 18 12 18c1.4 0 2.6-.3 3.7-.8" />
    <path d="m3 3 18 18" />
  </svg>
)
