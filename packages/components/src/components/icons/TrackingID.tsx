import * as React from 'react'

export const TrackingID = (props: React.HTMLAttributes<SVGElement>) => {
  let stroke: string
  switch (props.color) {
    case 'invert':
      stroke = 'white'
      break
    default:
      stroke = '#35495D'
  }
  return (
    <svg width={24} height={24} fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
