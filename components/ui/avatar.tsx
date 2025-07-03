import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Avatar({ src, alt, children, className = "" }: AvatarProps) {
  return (
    <div className={`rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`} style={{ width: 32, height: 32 }}>
      {src ? <AvatarImage src={src} alt={alt} /> : children}
    </div>
  );
}

export function AvatarImage({ src, alt }: { src?: string; alt?: string }) {
  return src ? <img src={src} alt={alt} style={{ width: 32, height: 32, objectFit: "cover" }} /> : null;
}

export function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <span className="text-gray-500 text-sm font-bold">{children}</span>;
} 