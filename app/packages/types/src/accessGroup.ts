import type { AuthorizationAction } from "./auth";

export interface AccessGroup {
  id: string;
  name: string;
  description: string | null;
  capabilities: AuthorizationAction[];
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface AccessGroupInput {
  name: string;
  description?: string | null;
  capabilities: AuthorizationAction[];
}

export interface AccessGroupOptions {
  capabilities: AuthorizationAction[];
}
