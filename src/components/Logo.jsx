import { forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import logoImg from "@/assets/livepet-logo.png";

/**
 * Logo do LivePet. Sempre leva para a tela inicial ("/").
 * Se a pessoa já estiver na tela inicial, sobe a página até o topo.
 */
const Logo = forwardRef(({ variant = "default", className = "", onClick, ...props }, ref) => {
  const { pathname } = useLocation();
  const isLight = variant === "light";

  const handleClick = (event) => {
    onClick?.(event);
    if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Link
      ref={ref}
      to="/"
      onClick={handleClick}
      aria-label="LivePet: ir para a página inicial"
      className={`flex items-center rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40 ${className}`}
      {...props}
    >
      <img
        src={logoImg}
        alt="Live Pet — cuidando do seu pet"
        width={160}
        height={80}
        className={`h-14 w-auto object-contain sm:h-16 ${isLight ? "brightness-0 invert" : ""}`}
      />
    </Link>
  );
});

Logo.displayName = "Logo";

export default Logo;
