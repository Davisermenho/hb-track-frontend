import { apiClient } from "./client";

export interface Category {
  id: number;
  name: string;
  min_age?: number;
  max_age?: number;
}

export const categoriesService = {
  async list(): Promise<Category[]> {
    return apiClient.get<Category[]>("/categories");
  },
};
