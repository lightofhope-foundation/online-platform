// Bunny CDN Stream API integration
const BUNNY_API_BASE = "https://video.bunnycdn.com";

function getBunnyConfig() {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  if (!libraryId?.trim() || !apiKey?.trim()) {
    throw new Error(
      "BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_API_KEY must be set in the environment"
    );
  }
  return { libraryId, apiKey };
}

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
  const { libraryId, apiKey } = getBunnyConfig();
  const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey,
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
    const formData = new FormData();
    formData.append("videoId", videoId);
    formData.append("file", file);

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

    // Upload through our backend route (prevents browser->Bunny auth/CORS issues).
    xhr.open("POST", "/api/admin/videos/upload");
    xhr.send(formData);
  });
}

/**
 * Get video status from Bunny CDN
 */
export async function getBunnyVideoStatus(videoId: string): Promise<BunnyVideoStatus> {
  const { libraryId, apiKey } = getBunnyConfig();
  const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
    method: "GET",
    headers: {
      AccessKey: apiKey,
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
  const { libraryId, apiKey } = getBunnyConfig();
  const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: {
      AccessKey: apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete Bunny video: ${error}`);
  }
}

