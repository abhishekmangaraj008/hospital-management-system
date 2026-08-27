import React from 'react'

// Signature motif: a hairline divider with a single ECG-style pulse.
// Deliberately quiet — used once per screen (under the brand/heading), never decorative clutter.
export default function VitalsRule({ color = '#3FA796' }) {
  return (
    <svg className="vitals-rule" viewBox="0 0 300 14" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="7" x2="110" y2="7" stroke="#DDE3E0" strokeWidth="1.5" />
      <polyline
        points="110,7 122,7 128,1 134,13 140,4 146,7 158,7"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="158" y1="7" x2="300" y2="7" stroke="#DDE3E0" strokeWidth="1.5" />
    </svg>
  )
}
