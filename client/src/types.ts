import { PostGenerationResponse } from "@shared/schema";

export type PostGenerationStatus = "idle" | "loading" | "success" | "error";

export type Feature = {
  icon: string;
  text: string;
};

export type CustomSection = {
  title: string;
  items: Feature[];
};

export type SourceInfo = {
  hotelName: string;
  hotelCategory?: string;
  destination: string;
  featuresWithIcons: Feature[];
  customSections: CustomSection[];
  originalUrl: string;
};

export type SourceInfoUpdate = {
  key: 'hotelName' | 'hotelCategory' | 'destination' | 'feature' | 'customSection' | 'customSectionItem' | 'newCustomSection' | 'newFeature';
  value: string;
  index?: number; // Für Updates an featuresWithIcons-Elementen oder customSections
  sectionIndex?: number; // Für Updates an customSections Items
  icon?: string; // Für hinzugefügte Features/Items
};

export { PostGenerationResponse };
