import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

const APP_FOLDER = "TutorPlus";

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "download";
}

function getSaveSuccessMessage(): string {
  if (Capacitor.getPlatform() === "ios") {
    return `Файл сохранён.\nОткройте «Файлы» → «На iPhone» → ${APP_FOLDER}.`;
  }
  return `Файл сохранён.\nОткройте «Файлы» → «Документы» → ${APP_FOLDER}.`;
}

async function ensureStoragePermissions() {
  if (Capacitor.getPlatform() !== "android") {
    return;
  }

  const status = await Filesystem.checkPermissions();
  if (status.publicStorage === "granted") {
    return;
  }

  const requested = await Filesystem.requestPermissions();
  if (requested.publicStorage !== "granted") {
    throw new Error(
      "Нет доступа к памяти устройства. Разрешите доступ в настройках приложения.",
    );
  }
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
  await ensureStoragePermissions();

  const safeName = sanitizeFileName(fileName);
  const path = `${APP_FOLDER}/${safeName}`;

  try {
    await Filesystem.mkdir({
      path: APP_FOLDER,
      directory: Directory.Documents,
      recursive: true,
    });
  } catch {
    // Folder already exists.
  }

  await Filesystem.downloadFile({
    url: downloadUrl,
    path,
    directory: Directory.Documents,
    recursive: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return getSaveSuccessMessage();
}

export async function downloadFileToDevice(
  downloadUrl: string,
  fileName: string,
  token: string | null,
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const message = await downloadFileNative(downloadUrl, fileName, token);
    alert(message);
    return;
  }

  await downloadFileWeb(downloadUrl, fileName, token);
}
