"use client";

import { Badge } from "@/components/ui/badge";
import { Copy, Radio, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

interface RoomHeaderProps {
  title: string;
  code: string;
  subtitle?: React.ReactNode;
  isHost?: boolean;
  onCopy?: () => void;
  rightElement?: React.ReactNode;
}

export function RoomHeader({
  title,
  code,
  subtitle,
  isHost,
  onCopy,
  rightElement,
}: RoomHeaderProps) {
  return (
    <header className="px-4 md:px-6 py-3 md:py-4 border-b bg-card/80 backdrop-blur-md flex justify-between items-center z-10 shadow-sm sticky top-0 shrink-0">
      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href="/"
          className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
        >
          <Home className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground hover:text-foreground" />
        </Link>
        <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <Radio className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base md:text-xl font-bold tracking-tight leading-tight whitespace-nowrap">
            {title}
          </h1>
          <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 md:gap-2">
            {subtitle && <span className="hidden sm:inline">{subtitle}</span>}
            <Badge
              variant="secondary"
              className={`font-mono px-1.5 md:px-2 py-0 h-5 md:h-6 flex items-center ${isHost ? "cursor-pointer hover:bg-secondary/80 transition-colors" : ""}`}
              onClick={isHost && onCopy ? onCopy : undefined}
            >
              {code} {isHost && <Copy className="w-3 h-3 ml-1.5 opacity-50" />}
            </Badge>
          </div>
        </div>
      </div>

      {rightElement && <div className="ml-2 shrink-0">{rightElement}</div>}
    </header>
  );
}
