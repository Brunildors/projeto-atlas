import logoUrl from "../assets/iport-logo.png";

interface BrandProps {
  variant: "sidebar" | "login";
}

export function Brand({ variant }: BrandProps) {
  return (
    <div className={`brand brand--${variant}`}>
      <img className="brand-image" src={logoUrl} alt="iPORT Solutions" />
    </div>
  );
}
