import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "download";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to encode file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(blob);
  });
}

async function downloadFileWeb(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

async function downloadFileNative(blob: Blob, fileName: string) {
  const safeName = sanitizeFileName(fileName);
  const path = `downloads/${Date.now()}_${safeName}`;
  const base64 = await blobToBase64(blob);

  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
  });

  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache,
  });

  await Share.share({
    title: safeName,
    url: uri,
    dialogTitle: "Сохранить файл",
  });
}

export async function saveDownloadedFile(blob: Blob, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    await downloadFileNative(blob, fileName);
    return;
  }

  await downloadFileWeb(blob, fileName);
}
