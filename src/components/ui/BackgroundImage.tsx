// src/components/ui/BackgroundImage.tsx
import React, { useState, useEffect } from 'react';

interface BackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
  overlayClassName?: string;
  blurDataURL?: string;
}

/**
 * Optimized background image component with progressive loading
 * Features:
 * - Preloading with blur placeholder
 * - Smooth fade-in transition
 * - Loading state management
 */
const BackgroundImage: React.FC<BackgroundImageProps> = ({
  src,
  alt = 'Background',
  className = '',
  overlayClassName = '',
  blurDataURL
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(blurDataURL || '');

  useEffect(() => {
    // Preload the image
    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      // Small delay for smooth transition
      setTimeout(() => setIsLoaded(true), 50);
    };

    img.onerror = () => {
      console.error('Failed to load background image:', src);
      // Still show placeholder or error state
      setIsLoaded(true);
    };

    // Start loading
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <>
      {/* Background Image Container */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        } ${className}`}
        style={{
          backgroundImage: imageSrc ? `url('${imageSrc}')` : undefined,
          filter: !isLoaded ? 'blur(20px)' : 'blur(0px)',
        }}
        role="img"
        aria-label={alt}
      />

      {/* Overlay */}
      {overlayClassName && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}

      {/* Loading Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black animate-pulse" />
      )}
    </>
  );
};

export default BackgroundImage;
