import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for static assets (uploads, images, etc.)
 * This is the backend server URL without the /api/v1 path
 */
export function getStaticBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  // Remove /api/v1 suffix to get the base server URL
  return apiUrl.replace(/\/api\/v1$/, '');
}

/**
 * Construct a full URL for an image path
 * Handles both relative paths (e.g., /uploads/...) and full URLs
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return '/placeholder.svg';
  }

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

   // Handle paths like "uploads/..." without leading slash
   if (imagePath.startsWith('uploads/')) {
     return `${getStaticBaseUrl()}/${imagePath}`;
   }

  // If it's a relative path starting with /uploads, prepend the base URL
  if (imagePath.startsWith('/uploads')) {
    return `${getStaticBaseUrl()}${imagePath}`;
  }

  // For other relative paths (like /placeholder.svg), return as-is
  return imagePath;
}

/**
 * Process an array of image paths to full URLs
 */
export function getImageUrls(images: string[] | undefined | null): string[] {
  if (!images || images.length === 0) {
    return ['/placeholder.svg'];
  }
  return images.map(getImageUrl);
}
