import React from 'react';

interface StatProps {
  value: number | string;
  label: string;
  sublabel?: string;
  accent?: 'cobalt' | 'lime' | 'tomato' | 'sun' | 'lavender' | 'ink';
  className?: string;
}

export function Stat({
  value,
  label,
  sublabel,
  accent = 'ink',
  className = '',
}: StatProps) {
  const accentClasses = {
    cobalt: 'text-cobalt',
    lime: 'text-ink bg-lime px-2 py-0.5 inline-block',
    tomato: 'text-tomato',
    sun: 'text-ink bg-sun px-2 py-0.5 inline-block',
    lavender: 'text-ink bg-lavender px-2 py-0.5 inline-block',
    ink: 'text-ink',
  }[accent];

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className={`text-4xl md:text-5xl font-black font-sans tracking-tight tabular-nums ${accentClasses}`}>
        {value}
      </div>
      <div className="text-sm font-semibold text-ink/80 leading-snug">
        {label}
      </div>
      {sublabel && (
        <div className="text-xs text-ink/60">
          {sublabel}
        </div>
      )}
    </div>
  );
}
