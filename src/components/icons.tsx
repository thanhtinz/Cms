// Icon CSS — Font Awesome 6 (nap bang CSS trong layout), khong dung SVG tu ve,
// khong dung emoji. className truyen vao giu nguyen cac lop mau/kenh le cua
// Tailwind; co chu (h-3..h-6) duoc quy doi sang font-size px.
function fa(name: string, className: string) {
  const m = className.match(/\bh-(\d+(?:\.\d+)?)\b/);
  const size = m ? Math.round(parseFloat(m[1]) * 4) : 16;
  const rest = className.replace(/\b[hw]-\S+/g, "").replace(/\s+/g, " ").trim();
  return (
    <i
      className={`fa-solid ${name} inline-block shrink-0 leading-none ${rest}`}
      style={{ fontSize: size }}
      aria-hidden
    />
  );
}

type P = { className?: string };

export function CheckIcon({ className = "h-5 w-5" }: P) { return fa("fa-check", className); }
export function XIcon({ className = "h-5 w-5" }: P) { return fa("fa-xmark", className); }
export function BoltIcon({ className = "h-6 w-6" }: P) { return fa("fa-bolt", className); }
export function ShieldIcon({ className = "h-6 w-6" }: P) { return fa("fa-shield-halved", className); }
export function GlobeIcon({ className = "h-6 w-6" }: P) { return fa("fa-globe", className); }
export function TicketIcon({ className = "h-6 w-6" }: P) { return fa("fa-ticket", className); }
export function ClockIcon({ className = "h-6 w-6" }: P) { return fa("fa-clock", className); }
export function ServerIcon({ className = "h-6 w-6" }: P) { return fa("fa-server", className); }
export function SparkIcon({ className = "h-6 w-6" }: P) { return fa("fa-wand-magic-sparkles", className); }
export function ArrowRightIcon({ className = "h-5 w-5" }: P) { return fa("fa-arrow-right", className); }
export function PlayIcon({ className = "h-5 w-5" }: P) { return fa("fa-play", className); }
