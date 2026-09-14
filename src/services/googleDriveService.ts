export interface GoogleDriveVideoItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  sizeMb?: number;
  thumbnailLink?: string;
  downloadUrl?: string;
  createdTime?: string;
}

const STORAGE_KEY_DRIVE_API_KEY = 'remotion_google_drive_api_key';
const STORAGE_KEY_LAST_DRIVE_FOLDER = 'remotion_last_drive_folder_url';

export function getSavedDriveApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_DRIVE_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveDriveApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_DRIVE_API_KEY, key.trim());
  } catch (e) {
    console.warn('Failed to save Drive API Key:', e);
  }
}

export function getSavedLastDriveFolder(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_DRIVE_FOLDER) || '';
  } catch {
    return '';
  }
}

export function saveLastDriveFolder(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_DRIVE_FOLDER, url.trim());
  } catch (e) {
    console.warn('Failed to save last Drive folder:', e);
  }
}

/**
 * Trích xuất Google Drive Folder ID từ nhiều định dạng URL hoặc ID trực tiếp
 * Ví dụ:
 * - https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
 * - https://drive.google.com/drive/u/0/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ?usp=sharing
 * - 1aBcDeFgHiJkLmNoPqRsTuVwXyZ
 */
export function extractDriveFolderId(input: string): string | null {
  if (!input || !input.trim()) return null;
  const clean = input.trim();

  // 1. Kiểm tra format /folders/{id}
  const folderMatch = clean.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // 2. Kiểm tra format ?id={id}
  const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // 3. Nếu là chuỗi ID thuần tuý (thường 20-50 ký tự)
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Quét danh sách file video trong thư mục Google Drive
 */
export async function scanDriveFolderVideos(
  folderUrlOrId: string,
  apiKey?: string
): Promise<GoogleDriveVideoItem[]> {
  const folderId = extractDriveFolderId(folderUrlOrId);
  if (!folderId) {
    throw new Error('Link thư mục hoặc Folder ID Google Drive không hợp lệ!');
  }

  saveLastDriveFolder(folderUrlOrId);

  const effectiveKey = (apiKey || getSavedDriveApiKey()).trim();

  // 1. Thử gọi qua Backend Proxy nếu có
  try {
    const proxyRes = await fetch('/api/drive/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, apiKey: effectiveKey })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (Array.isArray(data.files) && data.files.length > 0) {
        return data.files;
      }
    }
  } catch (err) {
    console.warn('Backend proxy /api/drive/scan error, falling back to direct API:', err);
  }

  // 2. Gọi trực tiếp Google Drive API v3 nếu có API Key
  if (effectiveKey) {
    const query = encodeURIComponent(
      `'${folderId}' in parents and (mimeType contains 'video/' or fileExtension = 'mp4' or fileExtension = 'mov' or fileExtension = 'webm' or fileExtension = 'mkv') and trashed = false`
    );
    const fields = encodeURIComponent('files(id,name,mimeType,size,thumbnailLink,webContentLink,createdTime)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&key=${effectiveKey}&pageSize=100`;

    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `HTTP ${res.status}: Không thể quét thư mục Drive`;
      throw new Error(msg);
    }

    const data = await res.json();
    const files = (data.files || []).map((f: any) => {
      const sizeBytes = Number(f.size) || 0;
      return {
        id: f.id,
        name: f.name || 'Video_Drive',
        mimeType: f.mimeType || 'video/mp4',
        sizeBytes,
        sizeMb: Number((sizeBytes / (1024 * 1024)).toFixed(2)),
        thumbnailLink: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+$/, '=s400') : undefined,
        downloadUrl: f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`,
        createdTime: f.createdTime
      };
    });

    return files;
  }

  // 3. Fallback: Nếu không có API Key, hướng dẫn nhập API Key hoặc thông báo
  throw new Error(
    'Cần có Google Drive API Key để quét thư mục. Vui lòng nhập API Key hoặc cấu hình thư mục chia sẻ công khai.'
  );
}

/**
 * Tải file video từ Google Drive và chuyển đổi thành đối tượng File của trình duyệt
 */
export async function downloadDriveVideoAsFile(
  file: GoogleDriveVideoItem,
  apiKey?: string,
  onProgress?: (progressPercent: number) => void
): Promise<File> {
  const effectiveKey = (apiKey || getSavedDriveApiKey()).trim();

  // Thử tải qua proxy server để tránh CORS
  const proxyUrl = `/api/drive/download?id=${encodeURIComponent(file.id)}${
    effectiveKey ? `&key=${encodeURIComponent(effectiveKey)}` : ''
  }`;

  let response: Response | null = null;

  try {
    response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Proxy status: ${response.status}`);
    }
  } catch (proxyErr) {
    console.warn('Proxy download failed, trying direct Google Drive API:', proxyErr);
    // Direct Google Drive API download
    if (effectiveKey) {
      const directApiUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${effectiveKey}`;
      response = await fetch(directApiUrl);
    } else {
      const directUcUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
      response = await fetch(directUcUrl);
    }
  }

  if (!response || !response.ok) {
    throw new Error('Không thể tải file video từ Google Drive. Vui lòng kiểm tra quyền chia sẻ file!');
  }

  const contentLengthHeader = response.headers.get('content-length');
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : file.sizeBytes || 0;

  // Stream reader để cập nhật % tiến trình tải
  if (!response.body) {
    const blob = await response.blob();
    return new File([blob], file.name || 'video_drive.mp4', {
      type: file.mimeType || 'video/mp4',
      lastModified: Date.now()
    });
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      chunks.push(value);
      receivedBytes += value.length;

      if (totalBytes > 0 && onProgress) {
        const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
        onProgress(percent);
      }
    }
  }

  if (onProgress) onProgress(100);

  const mergedBlob = new Blob(chunks as any[], { type: file.mimeType || 'video/mp4' });
  return new File([mergedBlob], file.name || 'video_drive.mp4', {
    type: file.mimeType || 'video/mp4',
    lastModified: Date.now()
  });
}
