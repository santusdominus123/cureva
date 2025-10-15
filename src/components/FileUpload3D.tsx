import React, { useCallback, useState } from 'react';
import { Upload, FileIcon, X, CheckCircle } from 'lucide-react';

interface FileUpload3DProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
  multiple?: boolean;
  selectedFile?: File | null;
}

const FileUpload3D: React.FC<FileUpload3DProps> = ({
  onFileSelect,
  onFileRemove,
  acceptedFormats = ['.ply', '.obj'],
  maxFileSize = 50, // 50MB default
  multiple = false,
  selectedFile = null
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setError(`Ukuran file (${fileSizeMB.toFixed(1)}MB) melebihi ukuran maksimal yang diizinkan (${maxFileSize}MB)`);
      return false;
    }

    // Check file format
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      setError(`Format file ${fileExtension} tidak didukung. Format yang diterima: ${acceptedFormats.join(', ')}`);
      return false;
    }

    return true;
  }, [maxFileSize, acceptedFormats]);

  const handleFiles = useCallback((files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
          `}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-3d')?.click()}
        >
          <input
            id="file-upload-3d"
            type="file"
            className="hidden"
            accept={acceptedFormats.join(',')}
            onChange={handleChange}
            multiple={multiple}
          />

          <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />

          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {dragActive ? 'Letakkan file 3D Anda di sini' : 'Unggah Model 3D'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Seret dan letakkan file Anda di sini, atau klik untuk memilih
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Format yang didukung: {acceptedFormats.join(', ')} (maks {maxFileSize}MB)
            </p>
            <div className="flex justify-center space-x-4 mt-3">
              <a
                href="/sample/cube.ply"
                download="cube.ply"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Unduh Contoh PLY
              </a>
              <a
                href="/sample/pyramid.obj"
                download="pyramid.obj"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Unduh Contoh OBJ
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Display */}
      {selectedFile && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove();
                    setError(null);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Upload Button for Selected File */}
      {selectedFile && !error && (
        <div className="mt-4 text-center">
          <button
            onClick={() => document.getElementById('file-upload-3d')?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            Ganti File
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload3D;