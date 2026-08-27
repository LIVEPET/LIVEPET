import logoImg from "@/assets/livepet-logo.png";

interface LogoProps {
  variant?: "default" | "light";
  className?: string;
}

const Logo = ({ variant = "default", className = "" }: LogoProps) => {
  const isLight = variant === "light";
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoImg}
        alt="Live Pet — cuidando do seu pet"
        width={160}
        height={80}
        className={`h-14 w-auto object-contain sm:h-16 ${isLight ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
};

export default Logo;
