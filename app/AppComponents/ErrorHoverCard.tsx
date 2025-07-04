import { MdError } from "react-icons/md";
import { HoverCard } from "@/components/ui/hover-card";
import { HoverCardTrigger } from "@/components/ui/hover-card";
import { HoverCardContent } from "@/components/ui/hover-card";

export function ErrorHoverCard({ message }: { message: string | undefined }) {
  return (
    <div className="text-destructive flex items-center gap-1">
      <div className="absolute right-2 top-8">
        <HoverCard>
          <HoverCardTrigger className="cursor-pointer">
            <MdError className="text-destructive text-lg" />
          </HoverCardTrigger>
          <HoverCardContent className="w-auto p-2 px-3 rounded-lg shadow-card bg-card border border-border">
            <p className="text-[13px] mt-[4px] text-destructive font-medium">{message}</p>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  );
}
