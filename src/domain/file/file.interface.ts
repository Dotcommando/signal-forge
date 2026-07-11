import { FILE_KIND } from './file-kind.enum';

export interface IFileDimensions {
  width: number;
  height: number;
}

export interface IFileAsset {
  id: string;
  kind: FILE_KIND;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  originalFileName?: string;
  dimensions?: IFileDimensions;
  durationMilliseconds?: number;
  storedAt: Date;
}

export interface IFileReference {
  fileId: string;
  sourceUrl?: string;
  sourceExternalId?: string;
  position: number;
  caption?: string;
  altText?: string;
}
