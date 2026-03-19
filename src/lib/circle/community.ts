import { circleAdmin } from "./client";
import type { Community } from "./types";

export async function getCommunity(): Promise<Community> {
  return circleAdmin.get<Community>("community");
}

export async function updateCommunity(
  data: Partial<Community>,
): Promise<Community> {
  return circleAdmin.put<Community>("community", { community: data });
}
