import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "download";
}

function isShareCancelled(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /cancel(l(ed)?)?|abort(ed)?|dismiss(ed)?/i.test(message);
}

async function downloadFileWeb(
  downloadUrl: string,
  fileName: string,
  token: string | null,
) {
  const response = await fetch(downloadUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = `Download failed (${response.status})`;
    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // Response body is not JSON (e.g. nginx HTML error page).
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

async function downloadFileNative(
  downloadUrl: string,
  fileName: string,
  token: string | null,
) {
  const safeName = sanitizeFileName(fileName);
  const path = `${Date.now()}_${safeName}`;

  await Filesystem.downloadFile({
    url: downloadUrl,
    path,
    directory: Directory.Cache,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache,
  });

  try {
    await Share.share({
      title: safeName,
      files: [uri],
      dialogTitle: "Сохранить файл",
    });
  } catch (error) {
    if (isShareCancelled(error)) {
      return;
    }
    throw error;
  }
}

export async function downloadFileToDevice(
  downloadUrl: string,
  fileName: string,
  token: string | null,
) {
  if (Capacitor.isNativePlatform()) {
    await downloadFileNative(downloadUrl, fileName, token);
    return;
  }

  await downloadFileWeb(downloadUrl, fileName, token);
}
