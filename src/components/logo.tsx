"use client";

import { useId } from "react";

/**
 * شعار سَكِينَة — هلالٌ يحتضن نجمةً فوق أمواجٍ هادئة.
 * SVG متجهي حادّ في كل الأحجام، بألوان الثيم الليلي.
 */
export function Logo({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bgId = `sk-bg-${uid}`;
  const moonId = `sk-moon-${uid}`;
  const glowId = `sk-glow-${uid}`;
  const cutId = `sk-cut-${uid}`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="شعار سَكِينَة"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={bgId}
          x1="8"
          y1="4"
          x2="40"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#123c3e" />
          <stop offset="0.55" stopColor="#0a262b" />
          <stop offset="1" stopColor="#06191d" />
        </linearGradient>
        <linearGradient
          id={moonId}
          x1="17"
          y1="14"
          x2="34"
          y2="36"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ccfbf1" />
          <stop offset="0.5" stopColor="#5eead4" />
          <stop offset="1" stopColor="#2dd4bf" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.32" />
          <stop offset="1" stopColor="#5eead4" stopOpacity="0" />
        </radialGradient>
        <mask id={cutId}>
          <rect width="48" height="48" fill="black" />
          <circle cx="25" cy="24" r="11" fill="white" />
          <circle cx="20.5" cy="20" r="9.5" fill="black" />
        </mask>
      </defs>

      {/* الدرع الدائري */}
      <circle
        cx="24"
        cy="24"
        r="22.75"
        fill={`url(#${bgId})`}
        stroke="rgba(94,234,212,0.35)"
        strokeWidth="1.1"
      />
      <circle cx="24" cy="24" r="19.5" stroke="rgba(94,234,212,0.1)" strokeWidth="0.8" />

      {/* توهج القمر */}
      <circle cx="25" cy="24" r="17" fill={`url(#${glowId})`} />

      {/* الهلال */}
      <circle cx="25" cy="24" r="11" fill={`url(#${moonId})`} mask={`url(#${cutId})`} />

      {/* النجمة في حضن الهلال */}
      <path
        d="M 19.5 13.5 C 20.1 16.2 21.3 16.9 23.5 17.5 C 21.3 18.1 20.1 18.8 19.5 21.5 C 18.9 18.8 17.7 18.1 15.5 17.5 C 17.7 16.9 18.9 16.2 19.5 13.5 Z"
        fill="#eafffb"
        opacity="0.95"
      />

      {/* نجوم صغيرة */}
      <circle cx="34" cy="12.5" r="1.1" fill="#99f6e4" opacity="0.55" />
      <circle cx="13" cy="31" r="0.85" fill="#99f6e4" opacity="0.38" />
      <circle cx="37.5" cy="34" r="0.7" fill="#99f6e4" opacity="0.3" />

      {/* أمواج الهدوء */}
      <path
        d="M 14 35 Q 24 40 34 35"
        stroke="rgba(94,234,212,0.28)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M 17 37.5 Q 24 41 31 37.5"
        stroke="rgba(94,234,212,0.15)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
