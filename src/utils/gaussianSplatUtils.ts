import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

/**
 * Detect Gaussian Splat file format from filename or path
 * @param fileNameOrPath - File name or path
 * @returns SceneFormat enum value
 */
export function detectSplatFormat(fileNameOrPath: string): number {
  const lower = fileNameOrPath.toLowerCase();

  if (lower.endsWith('.ksplat')) {
    return GaussianSplats3D.SceneFormat.KSplat;
  } else if (lower.endsWith('.splat')) {
    return GaussianSplats3D.SceneFormat.Splat;
  } else if (lower.endsWith('.ply')) {
    return GaussianSplats3D.SceneFormat.Ply;
  }

  // Default to PLY
  return GaussianSplats3D.SceneFormat.Ply;
}

/**
 * Get format name as string
 * @param format - SceneFormat enum value
 * @returns Format name
 */
export function getFormatName(format: number): string {
  switch (format) {
    case GaussianSplats3D.SceneFormat.KSplat:
      return 'KSplat';
    case GaussianSplats3D.SceneFormat.Splat:
      return 'Splat';
    case GaussianSplats3D.SceneFormat.Ply:
      return 'PLY';
    default:
      return 'Unknown';
  }
}

/**
 * Check if SharedArrayBuffer is available and cross-origin isolated
 * @returns true if GPU acceleration can be used
 */
export function canUseGPUAcceleration(): boolean {
  return typeof SharedArrayBuffer !== 'undefined' &&
         typeof self !== 'undefined' &&
         self.crossOriginIsolated === true;
}

/**
 * Get recommended settings based on file size
 * @param fileSizeBytes - File size in bytes
 * @returns Recommended settings object
 */
export function getRecommendedSettings(fileSizeBytes: number) {
  const sizeMB = fileSizeBytes / (1024 * 1024);

  // Small files (< 50MB)
  if (sizeMB < 50) {
    return {
      progressiveLoad: false,
      sphericalHarmonicsDegree: 2,
      antialiased: true,
      splatAlphaRemovalThreshold: 1,
      inMemoryCompressionLevel: 0
    };
  }

  // Medium files (50-150MB)
  if (sizeMB < 150) {
    return {
      progressiveLoad: true,
      sphericalHarmonicsDegree: 1,
      antialiased: true,
      splatAlphaRemovalThreshold: 5,
      inMemoryCompressionLevel: 1
    };
  }

  // Large files (> 150MB)
  return {
    progressiveLoad: true,
    sphericalHarmonicsDegree: 0,
    antialiased: false,
    splatAlphaRemovalThreshold: 10,
    inMemoryCompressionLevel: 2
  };
}

/**
 * Format file size to human readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "12.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

/**
 * Check if file is a valid Gaussian Splat format
 * @param fileName - File name to check
 * @returns true if valid format
 */
export function isValidSplatFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.ply') ||
         lower.endsWith('.splat') ||
         lower.endsWith('.ksplat');
}

/**
 * Get file extension
 * @param fileName - File name
 * @returns Extension without dot (e.g., "ply")
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}
