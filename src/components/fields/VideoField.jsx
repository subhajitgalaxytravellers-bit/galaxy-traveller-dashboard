import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus, Play } from "lucide-react";

/**
 * VideoField — supports YouTube, Vimeo, and Instagram videos
 * Accepts raw URLs or iframe HTML (extracts src automatically)
 */
export default function VideoField({
  multiple = false,
  value = multiple ? [] : "",
  onChange,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isInstagram, setIsInstagram] = useState(false);

  // --- Parse iframe or normal URL ---
  const extractUrl = (input = "") => {
    const raw = input.trim();
    if (!raw) return "";

    // If iframe HTML was pasted, extract its src
    const iframeSrcMatch = raw.match(/src=["']([^"']+)["']/i);
    let url = iframeSrcMatch ? iframeSrcMatch[1] : raw;

    // Normalize YouTube
    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      url = `https://www.youtube.com/embed/${id}`;
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      url = `https://www.youtube.com/embed/${id}`;
    } else if (url.includes("youtube.com/shorts/")) {
      const id = url.split("shorts/")[1]?.split("?")[0];
      url = `https://www.youtube.com/embed/${id}`;
    }

    // Normalize Instagram post or reel
    if (url.includes("instagram.com")) {
      const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([^/?#&]+)/i);
      if (match?.[1]) {
        url = `https://www.instagram.com/p/${match[1]}/embed`;
      }
    }

    return url;
  };

  // --- Handlers for multiple mode ---
  const handleAdd = () => onChange([...(value || []), ""]);
  const handleUpdate = (index, newValue) => {
    const url = extractUrl(newValue);
    const updated = [...value];
    updated[index] = url;
    onChange(updated);
  };
  const handleRemove = (index) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  // --- Single video handler ---
  const handleSingleChange = (e) => {
    const url = extractUrl(e.target.value);
    onChange(url);
  };

  // --- Load Instagram embed script when needed ---
  useEffect(() => {
    setIsInstagram(previewUrl?.includes("instagram.com") || false);

    if (previewUrl?.includes("instagram.com")) {
      if (
        !document.querySelector(
          'script[src="https://www.instagram.com/embed.js"]'
        )
      ) {
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        script.onload = () => window.instgrm?.Embeds?.process();
        document.body.appendChild(script);
      } else {
        window.instgrm?.Embeds?.process();
      }
    }
  }, [previewUrl]);

  // --- Ensure embed re-renders after dialog opens ---
  useEffect(() => {
    if (isInstagram && previewUrl && window.instgrm) {
      const t = setTimeout(() => window.instgrm.Embeds.process(), 100);
      return () => clearTimeout(t);
    }
  }, [isInstagram, previewUrl]);

  // --- Preview dialog ---
  const PreviewDialog = () => (
    <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
      <DialogContent className="w-auto p-0 border-0 bg-transparent shadow-none flex items-center justify-center">
        {previewUrl && (
          <div
            className="
              relative 
              aspect-[9/16] 
              w-[90vw] 
              max-h-[90vh]
              bg-black 
              overflow-hidden 
              rounded-xl
              flex items-center justify-center
            "
          >
            {/* Video Wrapper */}
            {isInstagram ? (
              <blockquote
                className="instagram-media w-full h-full"
                data-instgrm-permalink={previewUrl.replace("/embed", "")}
                data-instgrm-version="14"
              ></blockquote>
            ) : previewUrl.includes("youtube") ||
              previewUrl.includes("youtu.be") ? (
              <iframe
                src={previewUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                title="YouTube preview"
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                autoPlay
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="my-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
      {/* Single video mode */}
      {!multiple && (
        <div className="flex gap-2 items-center">
          <Input
            value={value || ""}
            onChange={handleSingleChange}
            placeholder="Paste YouTube, Vimeo, or Instagram URL / iframe"
            className="flex-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
          {value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPreviewUrl(value)}
              title="Preview"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Multiple video mode */}
      {multiple && (
        <div className="my-3">
          {(value || []).map((url, index) => (
            <div key={index} className="flex gap-2 my-2 items-center">
              <Input
                value={url}
                onChange={(e) => handleUpdate(index, e.target.value)}
                placeholder={`Video ${
                  index + 1
                } (YouTube, Vimeo, or Instagram)`}
                className="flex-1 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              />
              {url && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPreviewUrl(url)}
                  title="Preview"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                title="Remove"
                className="text-gray-100 bg-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAdd}
            className="flex items-center gap-2 mt-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <Plus className="w-4 h-4" /> Add Video
          </Button>
        </div>
      )}

      {/* Preview modal */}
      <PreviewDialog />
    </div>
  );
}
