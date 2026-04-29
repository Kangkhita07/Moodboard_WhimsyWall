/**
 * Core type definitions for WhimsyWall Moodboard Application
 */

/**
 * Represents a single moodboard item (image, color, texture, etc.)
 */
export interface MoodboardItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  category: 'image' | 'color' | 'texture' | 'mood' | 'other';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a moodboard collection
 */
export interface Moodboard {
  id: string;
  name: string;
  description?: string;
  items: MoodboardItem[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  views: number;
}

/**
 * Represents user preferences and settings
 */
export interface UserPreferences {
  theme: 'light' | 'dark';
  itemsPerRow: number;
  defaultCategory: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
