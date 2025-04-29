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

export { PostGenerationResponse };
