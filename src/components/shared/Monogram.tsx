import React from 'react';

interface MonogramProps {
  className?: string;
  size?: number;
}

export function Monogram({ className = 'w-6 h-6', size }: MonogramProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="The Movement Monogram"
      role="img"
    >
      {/* Outer rounded stamp with ink border */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="6"
        className="fill-lime stroke-ink stroke-[2.5]"
      />
      {/* Bold geometric 'M' monogram */}
      <path
        d="M8 23V9L16 17L24 9V23H20.5V14.5L16 19.5L11.5 14.5V23H8Z"
        className="fill-ink"
      />
      {/* Dot accent top-right */}
      <circle cx="23" cy="7" r="1.5" className="fill-cobalt" />
    </svg>
  );
}
