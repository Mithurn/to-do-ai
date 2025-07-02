import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorHoverCard } from "./ErrorHoverCard";
import { useFormContext } from "react-hook-form";
function EmailInput({ name, label }: { name: string; label: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const errorMessage = errors["email"] && errors["email"].message;
  return (
    <div className="grid gap-2 relative">
      <Label htmlFor="email" className="text-sm font-medium text-foreground mb-1">{label}</Label>
      <Input
        {...register("email")}
        id={name}
        type="email"
        placeholder="m@example.com"
        required
        className="bg-background border border-input rounded-lg px-4 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all shadow-card"
      />
      {errors["email"] && (
        <>
          <ErrorHoverCard message={errorMessage?.toString()} />
        </>
      )}
    </div>
  );
}

export default EmailInput;
