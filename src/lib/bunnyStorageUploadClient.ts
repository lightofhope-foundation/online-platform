/** Browser-only Bunny Storage PUT with upload progress. */

export function uploadBunnyStorageFileDirect(
  putUrl: string,
  accessKey: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("uploadBunnyStorageFileDirect nur im Browser");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", putUrl);
    xhr.setRequestHeader("AccessKey", accessKey);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        reject(
          new Error(
            `Storage-Upload fehlgeschlagen: ${xhr.responseText || `Status ${xhr.status}`}`
          )
        );
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Storage-Upload: Netzwerkfehler (ggf. Bunny Storage CORS prüfen)"))
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Storage-Upload abgebrochen"))
    );

    xhr.send(file);
  });
}
