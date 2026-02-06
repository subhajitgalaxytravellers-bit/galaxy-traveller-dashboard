import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import api from "@/lib/api";
import { toast } from "react-toastify";

const MODELS = [
  "blog",
  "tour",
  "user",
  "campaign",
  "category",
  "destination",
  "experience",
  "features",
  "heroSlide",
  "lead",
  "review",
  "testimonial",
];

export default function ExportDialog({ openDialog, setOpenDialog }) {
  const [modelKey, setModelKey] = useState("");
  const [allModels, setAllModels] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (!allModels && !modelKey) {
      alert("Please select a model");
      return;
    }

    const url = allModels
      ? `/api/export/all.xlsx`
      : `/api/export/${modelKey}.xlsx`;

    setExporting(true);
    setProgress(0);

    // Fake progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return 95; // stay below 100 until download completes
        return p + Math.floor(Math.random() * 5) + 1;
      });
    }, 200);

    try {
      const response = await api().get(url, { responseType: "blob" });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = allModels ? "export.xlsx" : `${modelKey}.xlsx`;
      link.click();
    } catch (err) {
      console.error(err);
      toast.error("Export failed.");
    } finally {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setExporting(false);
        setProgress(0);
      }, 500); // small delay to show 100% briefly
    }
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogContent className="sm:max-w-lg w-full  border border-gray-300 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Export all models or a selected model as Excel. Progress will be
            shown during export.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="flex items-center gap-4 mb-4">
          <Button
            size="sm"
            variant={allModels ? "secondary" : "outline"}
            onClick={() => setAllModels(true)}
            disabled={exporting}
          >
            All Models
          </Button>
          <Button
            size="sm"
            variant={!allModels ? "secondary" : "outline"}
            onClick={() => setAllModels(false)}
            disabled={exporting}
          >
            Selected Model
          </Button>
        </div>

        {!allModels && (
          <div className="mb-4">
            <Label htmlFor="modelKey">Model</Label>
            <Select value={modelKey} onValueChange={setModelKey}>
              <SelectTrigger id="modelKey">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {exporting && (
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-blue-500 dark:bg-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpenDialog(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? `Exporting... ${progress}%` : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
