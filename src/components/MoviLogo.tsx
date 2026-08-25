import React from "react";
import logoImg from "@/assets/logo-clean.png";
import { cn } from "@/lib/utils";

interface MoviLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
}

export default function MoviLogo({
  className,
  size = "lg",
  interactive = true,
}: MoviLogoProps) {
  // Ajuste de altura e escala para proporção ideal do logo
  const sizeConfig = {
    sm: "h-20 sm:h-20",
    md: "h-24 sm:h-24",
    lg: "h-32 sm:h-32",
    xl: "h-40 sm:h-40",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center select-none group cursor-pointer",
        className
      )}
    >
      {/* Brilho interativo de fundo no hover */}
      {interactive && (
        <div
          className="absolute inset-0 -m-1 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />
      )}

      {/* Imagem do Logotipo com Transição Suave e Sombra Elegante */}
      <img
        src={logoImg}
        alt="MOVI+"
        className={cn(
          "w-auto object-contain transition-all duration-300 ease-out",
          "filter drop-shadow-[0_2px_10px_rgba(200,30,30,0.15)]",
          interactive && "group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(220,38,38,0.4)] active:scale-95",
          sizeConfig[size]
        )}
      />
    </div>
  );
}
