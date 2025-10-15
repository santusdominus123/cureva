// Utility untuk menyimpan dan mengelola file Gaussian Splats yang diupload

export interface UploadedGaussianFile {
  id: string;
  name: string;
  file?: File;
  url?: string;
  size: number;
  type: string;
  uploadedAt: number;
  thumbnail?: string;
  status: 'processing' | 'completed';
}

const STORAGE_KEY = 'cureva-uploaded-files';

// Simpan file baru ke localStorage
export const saveUploadedFile = (file: File, status: 'processing' | 'completed' = 'completed'): UploadedGaussianFile => {
  const uploadedFile: UploadedGaussianFile = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    uploadedAt: Date.now(),
    status,
  };

  const files = getUploadedFiles();
  files.unshift(uploadedFile); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));

  // Dispatch event untuk update UI
  window.dispatchEvent(new CustomEvent('gaussianFileUploaded'));

  return uploadedFile;
};

// Ambil semua file yang sudah diupload
export const getUploadedFiles = (): UploadedGaussianFile[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading uploaded files:', error);
  }
  return [];
};

// Update status file
export const updateFileStatus = (id: string, status: 'processing' | 'completed'): void => {
  const files = getUploadedFiles();
  const fileIndex = files.findIndex(f => f.id === id);

  if (fileIndex !== -1) {
    files[fileIndex].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }
};

// Hapus file dari storage
export const deleteUploadedFile = (id: string): void => {
  const files = getUploadedFiles();
  const filteredFiles = files.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredFiles));
};

// Clear semua file
export const clearAllFiles = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Get file by ID
export const getFileById = (id: string): UploadedGaussianFile | undefined => {
  const files = getUploadedFiles();
  return files.find(f => f.id === id);
};
