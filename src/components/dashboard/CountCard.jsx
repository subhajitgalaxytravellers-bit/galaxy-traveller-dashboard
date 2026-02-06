import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight } from "lucide-react";

export default function CountCard({ label, icon: Icon, value, href, loading }) {
  return (
    <Card className="p-2 min-w-0 rounded-lg border border-muted-foreground bg-card text-card-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <span className="grid place-items-center h-10 w-10 rounded-md bg-muted/40 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}

          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-2xl font-semibold leading-none">
              {loading ? <Skeleton className="h-6 w-16 rounded" /> : value}
            </div>
          </div>
        </div>

        {href ? (
          <Button asChild variant="ghost" className="h-8 px-2 my-auto text-xs">
            <a href={href} className="inline-flex items-center gap-1">
              Manage <ArrowUpRight className="h-3 w-3" />
            </a>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
