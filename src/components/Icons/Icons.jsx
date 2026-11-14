const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

export function HeartIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
    </svg>
  )
}

export function PawIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="6" cy="11" r="1.8" />
      <circle cx="10" cy="6.5" r="1.8" />
      <circle cx="15" cy="6.5" r="1.8" />
      <circle cx="19" cy="11" r="1.8" />
      <path d="M12.5 12c-3 0-5.5 3-5.5 5.2 0 1.6 1.4 2.3 2.8 2.3 1 0 1.7-.4 2.7-.4s1.7.4 2.7.4c1.4 0 2.8-.7 2.8-2.3 0-2.2-2.5-5.2-5.5-5.2Z" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  )
}

export function UserIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" />
    </svg>
  )
}