function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

/** API base: `/api` on web (nginx/vite proxy), direct backend URL on mobile. */
export function getApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }
  return "/api";
}

/** Origin for static assets like `/uploads/...` (empty = same origin on web). */
export function getAssetBaseUrl(): string {
  const apiUrl = getApiUrl();
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    // nginx: API at /api, uploads at /uploads on the same host
    if (apiUrl.endsWith("/api")) {
      return apiUrl.slice(0, -4);
    }
    return apiUrl;
  }
  return "";
}

export function resolveAssetUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${getAssetBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isNativeApp(): boolean {
  return import.meta.env.VITE_CAPACITOR === "true";
}
