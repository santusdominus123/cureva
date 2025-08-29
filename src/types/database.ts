export interface Dataset {
  id?: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  description?: string;
  photos: Photo[];
  settings: DatasetSettings;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: number;
  metadata?: PhotoMetadata;
}

export interface PhotoMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface DatasetSettings {
  resolution: number;
  quality: number;
  format: string;
  processingMode: "fast" | "balanced" | "quality";
}
