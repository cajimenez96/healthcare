// Pure port — no framework or Mongo imports. Implementations live in lib/storage.

export interface UploadedFile {
  id: string;
  url: string;
}

export interface IFileStorage {
  upload(blob: Blob, fileName: string): Promise<UploadedFile>;
}
