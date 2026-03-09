interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div
      className={`font-display font-black text-white tracking-tight leading-none ${sizeClasses[size]}`}
    >
      hullabaloo.
    </div>
  );
}
