import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { maskCPF, validateCPF, stripCPF } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CpfInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (raw: string, masked: string, valid: boolean) => void;
  showValidation?: boolean;
}

const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(
  ({ value, onChange, showValidation = true, className, ...props }, ref) => {
    const digits = stripCPF(value);
    const isComplete = digits.length === 11;
    const isValid = isComplete && validateCPF(digits);
    const isInvalid = showValidation && isComplete && !isValid;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskCPF(e.target.value);
      const raw = stripCPF(masked);
      const valid = raw.length === 11 && validateCPF(raw);
      onChange(raw, masked, valid);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          placeholder="000.000.000-00"
          maxLength={14}
          className={cn(
            "bg-background border-border",
            isInvalid && "border-destructive focus-visible:ring-destructive",
            isValid && showValidation && "border-success focus-visible:ring-success",
            className
          )}
          {...props}
        />
        {showValidation && isComplete && (
          <span className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium",
            isValid ? "text-success" : "text-destructive"
          )}>
            {isValid ? "Válido" : "Inválido"}
          </span>
        )}
      </div>
    );
  }
);
CpfInput.displayName = "CpfInput";

export default CpfInput;
