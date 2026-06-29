"use client";

type LogoVariant = "horizontal" | "vertical" | "icon" | "dark" | "light" | "monochrome";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  width?: number;
  height?: number;
}

const gradDefs = {
  brand: `<linearGradient id="lg-b" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#2D4BFC"/><stop offset="100%" stop-color="#06D4E6"/></linearGradient>`,
  brandDark: `<linearGradient id="lg-bd" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#22D3EE"/></linearGradient>`,
};

function IconShape({ fill, accent, grad }: { fill: string; accent: string; grad: string }) {
  return (
    <g>
      <rect x="22" y="16" width="14" height="70" rx="7" fill={fill} />
      <rect x="22" y="70" width="44" height="16" rx="7" fill={fill} />
      <path d="M36 86 C52 86 72 70 88 54" stroke={grad} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="86" r="5" fill={accent} />
      <circle cx="88" cy="28" r="2.5" fill={accent} opacity="0.8" />
      <circle cx="92" cy="44" r="2" fill={accent} opacity="0.6" />
    </g>
  );
}

export function Logo({ variant = "horizontal", className, width, height }: LogoProps) {
  switch (variant) {
    case "icon":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={width || 40} height={height || 40} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: gradDefs.brand }} />
          <IconShape fill="#0F172A" accent="#06D4E6" grad="url(#lg-b)" />
        </svg>
      );

    case "vertical":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" width={width || 60} height={height || 90} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradDefs.brand} <linearGradient id="lg-ai-v" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#2D4BFC"/><stop offset="100%" stop-color="#06D4E6"/></linearGradient>` }} />
          <g transform="translate(10, 6)"><IconShape fill="#0F172A" accent="#06D4E6" grad="url(#lg-b)" /></g>
          <text x="60" y="116" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="28" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em" textAnchor="middle">LITHY</text>
          <text x="60" y="150" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="28" fontWeight="300" fill="url(#lg-ai-v)" letterSpacing="0.06em" textAnchor="middle">AI</text>
        </svg>
      );

    case "dark":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradDefs.brandDark} <linearGradient id="lg-ai-dk" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#22D3EE"/></linearGradient>` }} />
          <g transform="translate(6, 16)"><IconShape fill="#FFFFFF" accent="#22D3EE" grad="url(#lg-bd)" /></g>
          <g transform="translate(110, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="url(#lg-ai-dk)" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );

    case "light":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradDefs.brand} <linearGradient id="lg-ai-lt" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#2D4BFC"/><stop offset="100%" stop-color="#06D4E6"/></linearGradient>` }} />
          <g transform="translate(6, 16)"><IconShape fill="#0F172A" accent="#06D4E6" grad="url(#lg-b)" /></g>
          <g transform="translate(110, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="url(#lg-ai-lt)" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );

    case "monochrome":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <g transform="translate(6, 16)">
            <rect x="22" y="16" width="14" height="70" rx="7" fill="#0F172A" />
            <rect x="22" y="70" width="44" height="16" rx="7" fill="#0F172A" />
            <path d="M36 86 C52 86 72 70 88 54" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="86" r="5" fill="#0F172A" />
          </g>
          <g transform="translate(110, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="#0F172A" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );

    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradDefs.brand} <linearGradient id="lg-ai-hz" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#2D4BFC"/><stop offset="100%" stop-color="#06D4E6"/></linearGradient>` }} />
          <g transform="translate(6, 16)"><IconShape fill="#0F172A" accent="#06D4E6" grad="url(#lg-b)" /></g>
          <g transform="translate(110, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="url(#lg-ai-hz)" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );
  }
}
