import { apiRequest } from "./queryClient";
import { GeneratePostRequest, PostGenerationResponse } from "@shared/schema";
import { SourceInfo } from "../types";

export async function generatePost(data: GeneratePostRequest): Promise<PostGenerationResponse> {
  const response = await apiRequest("POST", "/api/generate-post", data);
  return response.json();
}

export async function updatePost(id: number, updatedPost: string, sourceInfo: SourceInfo): Promise<any> {
  const response = await apiRequest("POST", `/api/posts/${id}/update`, {
    updatedPost,
    sourceInfo
  });
  return response.json();
}

export async function addCustomSection(id: number, title: string, items: {icon: string, text: string}[]): Promise<any> {
  const response = await apiRequest("POST", `/api/posts/${id}/custom-section`, {
    title,
    items
  });
  return response.json();
}

export async function addFeature(
  id: number, 
  text: string, 
  icon: string = "✓", 
  sectionIndex?: number
): Promise<any> {
  const response = await apiRequest("POST", `/api/posts/${id}/add-feature`, {
    text,
    icon,
    sectionIndex
  });
  return response.json();
}
