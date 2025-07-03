import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorHoverCard } from "./ErrorHoverCard";
import { useFormContext } from "react-hook-form";

function PasswordInput({ name, label }: { name: string; label: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // Simplified errorMessage logic based on name
  const errorMessage = errors[name]?.message?.toString();

  return (
    <div className="grid gap-2 relative">
      <Label htmlFor={name} className="text-sm font-medium text-foreground mb-1">{label}</Label>
      <Input
        id={name}
        {...register(name)}
        type="password"
        required
        placeholder={`Your ${label}...`}
        className="bg-background border border-input rounded-lg px-4 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all shadow-card"
      />
      {errorMessage && <ErrorHoverCard message={errorMessage} />}
    </div>
  );
}

export default PasswordInput;
