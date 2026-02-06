import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea"; // Assuming you're using a Textarea component

const countWords = (text = "") =>
  text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

export function RejectConfirmationDialog({
  open,
  onOpenChange,
  rejectReason = "",
  title = "Reject Item",
  description = "Please provide a reason for rejection.",
  confirmText = "Reject",
  cancelText = "Cancel",
  onConfirm,
  maxWords = 500,
}) {
  const [reason, setReason] = React.useState("");
  const wordsUsed = React.useMemo(() => countWords(reason), [reason]);
  const overLimit = wordsUsed > maxWords;
  const canSubmit = !!reason.trim() && !overLimit;

  React.useEffect(() => {
    setReason(rejectReason || "");
  }, [rejectReason, open]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    if (overLimit) {
      alert(`Please keep the reason within ${maxWords} words`);
      return;
    }
    onConfirm(reason.trim());
    setReason(""); // Reset reason after submission
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type the reason here..."
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Required</span>
            <span className={overLimit ? "text-destructive" : undefined}>
              {wordsUsed}/{maxWords} words
            </span>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
