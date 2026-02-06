import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

function GCSBreadcrumb({ currentPath, setCurrentPath, rootPrefix }) {
  // Remove rootPrefix from display path
  const displayPath = rootPrefix
    ? currentPath.replace(new RegExp(`^${rootPrefix}`), "")
    : currentPath;

  // Split and clean path parts
  const parts = displayPath
    ? displayPath
        .replace(/\/+$/, "") // remove trailing slashes
        .split("/")
        .filter((p) => p && p !== "uploads") // skip empty & "uploads"
    : [];

  let acc = rootPrefix || "";

  return (
    <Breadcrumb className="w-full flex overflow-x-auto">
      <BreadcrumbList>
        {/* Root folder */}
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => setCurrentPath(rootPrefix || "")}
            className="cursor-pointer"
          >
            {rootPrefix ? "My Folder" : "Root"}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {parts.map((seg, idx) => {
          acc += (acc.endsWith("/") ? "" : "/") + seg;
          const pref = acc + "/";

          return (
            <React.Fragment key={pref}>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="capitalize whitespace-nowrap">
                {idx === parts.length - 1 ? (
                  <BreadcrumbPage>{seg}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => setCurrentPath(pref)}
                    className="cursor-pointer"
                  >
                    {seg}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default GCSBreadcrumb;
