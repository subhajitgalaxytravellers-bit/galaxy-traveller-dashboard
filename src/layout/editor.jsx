import * as React from "react";
import { Button } from "../ui/button";

export default function EditorLayout({
  header, // ReactNode (top header)
  children, // main form/content
  className = "",
  onDraft, // () => void
  onPublish, // () => void
  actionsBoxTitle = "Document",
  actionsBoxExtra = null, // optional ReactNode under the buttons (e.g., status, id, etc.)
}) {
  return (
    <div className={["flex h-full w-full flex-col", className].join(" ")}>
      {/* Header row (fixed) */}
      <div className="shrink-0">{header}</div>

      {/* Main area fills remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Scroll container (grid inside so right box sits to the side) */}
        <div className="h-full overflow-hidden px-4 md:px-6 py-4">
          <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Left: content scrolls */}
            <div className="min-w-0 h-full w-full overflow-y-auto overflow-x-hidden custom-y-scroll">
              {children}
            </div>

            {/* Right: fixed-width actions box */}
            <aside className="hidden lg:block w-[320px] shrink-0">
              <div className="sticky top-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {actionsBoxTitle}
                </h3>

                <div className="mt-3 flex min-w-36 flex-col items-stretch gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onDraft}
                    disabled={!onDraft}
                    className="w-full"
                  >
                    Draft
                  </Button>
                  <Button
                    type="button"
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={onPublish}
                    disabled={!onPublish}
                  >
                    Publish
                  </Button>
                </div>

                {actionsBoxExtra && (
                  <div className="mt-4">{actionsBoxExtra}</div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
