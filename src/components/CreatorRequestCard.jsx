import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  Download,
  Check,
  X,
  Trash2,
  FileText,
  Mail,
  UserRound,
  MoreHorizontal,
} from "lucide-react";
import api from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "./dialogs/ConfirmationDialog";
// ⬇️ Use your component
import { RejectConfirmationDialog } from "./dialogs/RejectionDialog"; // ← update path if needed
import { usePermissions } from "@/hooks/use-permissions";

function prettyStatus(s) {
  if (s === "approved")
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 rounded-sm">
        Approved
      </Badge>
    );
  if (s === "rejected")
    return (
      <Badge
        variant="destructive"
        className={" text-white bg-red-600 border-0 rounded-sm"}
      >
        Rejected
      </Badge>
    );
  return (
    <Badge variant="secondary" className={"rounded-sm"}>
      Pending
    </Badge>
  );
}

export default function CreatorRequestCard({
  item = {},
  onApprove,
  onReject,
  onDelete,
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const { can } = usePermissions();

  const name = item?.name || item?.userId?.name || "Unknown";
  const email = item?.userId?.email || "-";
  const status = item?.status || "pending";
  const canApprove = status === "pending";
  const canReject = status === "pending";
  const canDelete = can("creatorRequest", "delete");

  // Prefer path if present, fallback to legacy link
  const pathOrUrl = item?.documentPath || item?.documentLink;

  async function handlePreview() {
    if (!pathOrUrl) return;
    if (!/^https?:\/\//i.test(pathOrUrl)) {
      const res = await api().get("/api/docs/sign-read", {
        params: { path: pathOrUrl },
      });
      if (res.data?.url)
        window.open(res.data.url, "_blank", "noopener,noreferrer");
    } else {
      window.open(pathOrUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleDownload() {
    if (!pathOrUrl) return;
    if (!/^https?:\/\//i.test(pathOrUrl)) {
      const res = await api().get("/api/docs/sign-download", {
        params: { path: pathOrUrl, filename: "creator-doc" },
      });
      const url = res.data?.url;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.click();
      }
    } else {
      const a = document.createElement("a");
      a.href = pathOrUrl;
      a.setAttribute("download", "document");
      a.click();
    }
  }

  return (
    <Card className="h-full border border-border/60 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <UserRound className="h-4 w-4" /> {name}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {email}
            </CardDescription>
          </div>
          <div className="shrink-0">{prettyStatus(status)}</div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="truncate" title={pathOrUrl || ""}>
            {pathOrUrl || "No document"}
          </span>
        </div>

        {item?.rejectReason && status === "rejected" && (
          <div className="rounded-md border border-border/50 p-3 bg-muted/30">
            <Label className="text-xs text-muted-foreground">
              Reject Reason
            </Label>
            <p className="text-sm mt-1">{item.rejectReason}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2 pt-0">
        <div className="ml-auto flex gap-2">
          {(canApprove || canReject) && can("creatorRequest", "update") ? (
            <>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setApproveOpen(true)}
                disabled={!canApprove}
              >
                <Check className="h-4 w-4" /> Approve
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                disabled={!canReject}
                onClick={() => setRejectOpen(true)}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
            </>
          ) : null}

          {/* actions menu on the right */}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border border-gray-200 dark:border-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4" /> Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handlePreview}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete…
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ConfirmationDialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            title="Approve request?"
            description="Are you sure you want to approve this request?"
            confirmText="Approve"
            cancelText="Cancel"
            onConfirm={onApprove}
          />

          <RejectConfirmationDialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            rejectReason={item?.rejectReason || ""}
            title="Reject Request"
            description="Please provide a short reason for rejection."
            confirmText="Reject"
            cancelText="Cancel"
            onConfirm={(reason) => onReject?.(reason || "Not specified")}
          />

          {/* delete confirmation */}
          <ConfirmationDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Delete request?"
            description="This will permanently remove this request. This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={onDelete}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
