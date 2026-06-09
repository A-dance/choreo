const DB_NAME = "choreo-media";
const DB_VERSION = 1;
const STORE = "blobs";

export type MediaKind = "audio" | "video";

export interface StoredBlob {
  key: string;
  projectId: string;
  mediaId: string;
  kind: MediaKind;
  name: string;
  mimeType: string;
  blob: Blob;
  updatedAt: number;
}

function mediaKey(projectId: string, mediaId: string): string {
  return `${projectId}:${mediaId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export function newMediaId(): string {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveMediaFile(
  projectId: string,
  mediaId: string,
  kind: MediaKind,
  file: File,
): Promise<void> {
  const db = await openDb();
  const record: StoredBlob = {
    key: mediaKey(projectId, mediaId),
    projectId,
    mediaId,
    kind,
    name: file.name,
    mimeType: file.type || (kind === "audio" ? "audio/mpeg" : "video/mp4"),
    blob: file,
    updatedAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    tx.objectStore(STORE).put(record);
  });
  db.close();
}

export async function getMediaBlob(
  projectId: string,
  mediaId: string,
): Promise<Blob | null> {
  const db = await openDb();
  const record = await new Promise<StoredBlob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(mediaKey(projectId, mediaId));
    req.onsuccess = () => resolve(req.result as StoredBlob | undefined);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB read failed"));
  });
  db.close();
  return record?.blob ?? null;
}

export async function deleteMediaBlob(
  projectId: string,
  mediaId: string,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
    tx.objectStore(STORE).delete(mediaKey(projectId, mediaId));
  });
  db.close();
}

export async function deleteProjectMedia(projectId: string): Promise<void> {
  const db = await openDb();
  const keys = await new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => {
      const prefix = `${projectId}:`;
      resolve(
        (req.result as string[]).filter((k) => k.startsWith(prefix)),
      );
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB keys failed"));
  });
  if (keys.length) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB bulk delete failed"));
      const store = tx.objectStore(STORE);
      for (const key of keys) store.delete(key);
    });
  }
  db.close();
}

export async function importMediaBlob(
  projectId: string,
  mediaId: string,
  kind: MediaKind,
  name: string,
  mimeType: string,
  blob: Blob,
): Promise<void> {
  const db = await openDb();
  const record: StoredBlob = {
    key: mediaKey(projectId, mediaId),
    projectId,
    mediaId,
    kind,
    name,
    mimeType,
    blob,
    updatedAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB import failed"));
    tx.objectStore(STORE).put(record);
  });
  db.close();
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
