"use client";

type LogoVariant = "horizontal" | "vertical" | "icon" | "dark" | "light" | "monochrome";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  width?: number;
  height?: number;
}

const gradients = {
  brand: `<linearGradient id="lg-brand" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient>`,
  brandLight: `<linearGradient id="lg-brand-l" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#22D3EE"/></linearGradient>`,
};

function Icon({ fill, accent, grad }: { fill: string; accent: string; grad: string }) {
  return (
    <g transform="translate(0, 1)">
      <rect x="30" y="25" width="16" height="54" rx="8" fill={fill} />
      <path d="M46 70 L82 34" stroke={grad} strokeWidth="16" strokeLinecap="round" fill="none" />
      <circle cx="46" cy="70" r="6.5" fill={accent} />
    </g>
  );
}

export function Logo({ variant = "horizontal", className, width, height }: LogoProps) {
  switch (variant) {
    case "icon":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={width || 40} height={height || 40} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: gradients.brand }} />
          <Icon fill="#0F172A" accent="#06B6D4" grad="url(#lg-brand)" />
        </svg>
      );

    case "vertical":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 168" width={width || 60} height={height || 84} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradients.brand} <linearGradient id="lg-ai-v" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient>` }} />
          <Icon fill="#0F172A" accent="#06B6D4" grad="url(#lg-brand)" />
          <text x="60" y="112" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="28" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em" textAnchor="middle">LITHY</text>
          <text x="60" y="146" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="28" fontWeight="300" fill="url(#lg-ai-v)" letterSpacing="0.06em" textAnchor="middle">AI</text>
        </svg>
      );

    case "dark":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradients.brandLight} <linearGradient id="lg-ai-dk" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#22D3EE"/></linearGradient>` }} />
          <Icon fill="#FFFFFF" accent="#22D3EE" grad="url(#lg-brand-l)" />
          <g transform="translate(96, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#FFFFFF" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="url(#lg-ai-dk)" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );

    case "light":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradients.brand} <linearGradient id="lg-ai-lt" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient>` }} />
          <Icon fill="#0F172A" accent="#06B6D4" grad="url(#lg-brand)" />
          <g transform="translate(96, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="url(#lg-ai-lt)" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );

    case "monochrome":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <Icon fill="#0F172A" accent="#0F172A" grad="#0F172A" />
          <g transform="translate(96, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="#0F172A" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );

    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width={width || 140} height={height || 50} className={className}>
          <defs dangerouslySetInnerHTML={{ __html: `${gradients.brand} <linearGradient id="lg-ai-hz" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient>` }} />
          <Icon fill="#0F172A" accent="#06B6D4" grad="url(#lg-brand)" />
          <g transform="translate(96, 28)">
            <text x="0" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="700" fill="#0F172A" letterSpacing="-0.02em">LITHY</text>
            <text x="122" y="0" fontFamily="system-ui, -apple-system, 'Inter', 'Segoe UI', sans-serif" fontSize="36" fontWeight="300" fill="url(#lg-ai-hz)" letterSpacing="0.04em">AI</text>
          </g>
        </svg>
      );
  }
}
