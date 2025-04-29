import { apiRequest } from "./queryClient";
import { GeneratePostRequest, PostGenerationResponse } from "@shared/schema";

export async function generatePost(data: GeneratePostRequest): Promise<PostGenerationResponse> {
  const response = await apiRequest("POST", "/api/generate-post", data);
  return response.json();
}
