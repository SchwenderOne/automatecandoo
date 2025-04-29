import { PostGenerationResponse } from "@shared/schema";

export type PostGenerationStatus = "idle" | "loading" | "success" | "error";

export type Feature = {
  icon: string;
  text: string;
};

export type SourceInfo = {
  hotelName: string;
  hotelCategory?: string;
  destination: string;
  featuresWithIcons: Feature[];
  originalUrl: string;
};

export type SourceInfoUpdate = {
  key: 'hotelName' | 'hotelCategory' | 'destination' | 'feature';
  value: string;
  index?: number; // Für Updates an featuresWithIcons-Elementen
};

export { PostGenerationResponse };
