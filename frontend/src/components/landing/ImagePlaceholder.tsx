interface ImagePlaceholderProps {
  label: string;
  className?: string;
  radius?: 'none' | 'lg' | 'full';
}

const radiusClass = {
  none: '',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

/** Placeholder rayado para fotos reales (servicios/profesionales/testimonios) todavía no provistas. */
export function ImagePlaceholder({ label, className = '', radius = 'none' }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center bg-[repeating-linear-gradient(135deg,#efedf9,#efedf9_11px,#e7e4f5_11px,#e7e4f5_22px)] font-mono text-[10px] font-semibold text-[#9a98ac] ${radiusClass[radius]} ${className}`}
    >
      {label}
    </div>
  );
}
