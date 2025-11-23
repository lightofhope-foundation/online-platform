// Bunny CDN Stream API integration
const BUNNY_LIBRARY_ID = "423953";
const BUNNY_API_KEY = "70f9abb8-4960-4c9b-95364af7f0e6-25b4-419d";
const BUNNY_API_BASE = "https://video.bunnycdn.com";

export interface BunnyVideo {
  videoLibraryId: number;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: unknown[];
  chapters: unknown[];
  moments: unknown[];
  metaTags: unknown[];
  transcodingMessages: unknown[];
  statusCode?: number;
}

export interface BunnyVideoStatus {
  videoLibraryId: number;
  guid: string;
  title: string;
  status: number;
  encodeProgress: number;
  message?: string;
}

// Status codes from Bunny API
export const BUNNY_STATUS = {
  CREATED: 0,
  UPLOADING: 1,
  PROCESSING: 2,
  ENCODING: 3,
  FINISHED: 4,
  ERROR: 5,
} as const;

export function getStatusText(status: number, encodeProgress: number): string {
  switch (status) {
    case BUNNY_STATUS.CREATED:
      return "Erstellt";
    case BUNNY_STATUS.UPLOADING:
      return "Wird hochgeladen...";
    case BUNNY_STATUS.PROCESSING:
      return "Wird verarbeitet...";
    case BUNNY_STATUS.ENCODING:
      return `Wird kodiert... ${encodeProgress}%`;
    case BUNNY_STATUS.FINISHED:
      return "Bereit zur Veröffentlichung";
    case BUNNY_STATUS.ERROR:
      return "Fehler";
    default:
      return "Unbekannt";
  }
}

export function isStatusReady(status: number): boolean {
  return status === BUNNY_STATUS.FINISHED;
}

/**
 * Create a new video in Bunny CDN
 */
export async function createBunnyVideo(title: string): Promise<BunnyVideo> {
  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos`, {
    method: "POST",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Bunny video: ${error}`);
  }

  return response.json();
}

/**
 * Upload video file to Bunny CDN (client-side only)
 * This function should only be called from client components
 * According to Bunny Stream API: PUT /library/{libraryId}/videos/{videoId}
 * The file should be sent as raw binary data, not FormData
 */
export async function uploadBunnyVideo(
  videoId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("uploadBunnyVideo can only be called from client-side");
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const errorText = xhr.responseText || `Status ${xhr.status}`;
        reject(new Error(`Upload failed: ${errorText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed: Network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload failed: Aborted"));
    });

    xhr.open("PUT", `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`);
    xhr.setRequestHeader("AccessKey", BUNNY_API_KEY);
    // Don't set Content-Type - let the browser set it automatically for binary data
    // Send the file directly as binary data
    xhr.send(file);
  });
}

/**
 * Get video status from Bunny CDN
 */
export async function getBunnyVideoStatus(videoId: string): Promise<BunnyVideoStatus> {
  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: "GET",
    headers: {
      AccessKey: BUNNY_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Bunny video status: ${error}`);
  }

  const video: BunnyVideo = await response.json();
  return {
    videoLibraryId: video.videoLibraryId,
    guid: video.guid,
    title: video.title,
    status: video.status,
    encodeProgress: video.encodeProgress,
  };
}

/**
 * Poll video status until ready
 */
export async function pollBunnyVideoStatus(
  videoId: string,
  onStatusUpdate?: (status: BunnyVideoStatus) => void,
  maxAttempts: number = 60,
  intervalMs: number = 3000
): Promise<BunnyVideoStatus> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getBunnyVideoStatus(videoId);
    
    if (onStatusUpdate) {
      onStatusUpdate(status);
    }

    if (isStatusReady(status.status)) {
      return status;
    }

    if (status.status === BUNNY_STATUS.ERROR) {
      throw new Error("Video encoding failed");
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Video encoding timeout");
}

/**
 * Delete video from Bunny CDN
 */
export async function deleteBunnyVideo(videoId: string): Promise<void> {
  const response = await fetch(`${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      AccessKey: BUNNY_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete Bunny video: ${error}`);
  }
}

