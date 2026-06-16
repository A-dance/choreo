import type { UserProfile } from "./profileStore";
import { createDemoReferenceWorkspace, isDemoAccountEmail } from "./demoWorkspace";
import {
  createEmptyWorkspace,
  normalizeWorkspacePayload,
  workspaceHasActiveProject,
} from "./projectStore";
import type { Workspace } from "./types";
import { getSupabaseBrowser, isSupabaseAuthConfigured } from "./supabaseBrowser";
import { normalizeLanguage, type ProjectLanguage } from "./uiStrings";

export function isCloudSyncConfigured(): boolean {
  return isSupabaseAuthConfigured();
}

export interface CloudProfileRow {
  display_name: string;
  language: string;
  avatar_path: string | null;
  updated_at: string;
}

export interface CloudWorkspaceRow {
  payload: unknown;
  updated_at: string;
}

function workspaceUpdatedAt(workspace: Workspace): number {
  return workspace.projects.reduce(
    (max, project) => Math.max(max, project.updatedAt),
    0,
  );
}

export async function fetchCloudProfile(
  userId: string,
): Promise<CloudProfileRow | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, language, avatar_path, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as CloudProfileRow;
}

export async function upsertCloudProfile(
  userId: string,
  profile: Pick<UserProfile, "displayName" | "language">,
  avatarPath?: string | null,
): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  const row: Record<string, unknown> = {
    id: userId,
    display_name: profile.displayName,
    language: profile.language,
    updated_at: new Date().toISOString(),
  };
  if (avatarPath !== undefined) row.avatar_path = avatarPath;
  const { error } = await supabase.from("profiles").upsert(row);
  return !error;
}

export async function fetchCloudWorkspace(
  userId: string,
): Promise<{ workspace: Workspace; updatedAt: number } | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_workspaces")
    .select("payload, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as CloudWorkspaceRow;
  const workspace = normalizeWorkspacePayload(row.payload);
  if (!workspace) return null;
  const cloudTs = Date.parse(row.updated_at);
  return {
    workspace,
    updatedAt: Number.isFinite(cloudTs) ? cloudTs : workspaceUpdatedAt(workspace),
  };
}

export async function pushCloudWorkspace(
  userId: string,
  workspace: Workspace,
): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return false;
  const payload: Workspace = {
    version: 1,
    activeProjectId: workspace.activeProjectId,
    projects: workspace.projects.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      state: { ...p.state, isPlaying: false },
      media: p.media,
    })),
  };
  const { error } = await supabase.from("user_workspaces").upsert({
    user_id: userId,
    payload,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export function pickWorkspaceSource(
  local: Workspace | null,
  cloud: { workspace: Workspace; updatedAt: number } | null,
): Workspace | null {
  if (!local && !cloud) return null;
  if (!local) return cloud!.workspace;
  if (!cloud) return local;
  const localTs = workspaceUpdatedAt(local);
  return cloud.updatedAt >= localTs ? cloud.workspace : local;
}

export type UserWorkspaceResolution =
  | { kind: "cloud"; workspace: Workspace }
  | { kind: "local"; workspace: Workspace }
  | { kind: "demo-seed"; workspace: Workspace }
  | { kind: "empty"; workspace: Workspace };

export function resolveUserWorkspace(
  email: string | undefined,
  local: Workspace | null,
  cloud: { workspace: Workspace; updatedAt: number } | null,
): UserWorkspaceResolution | null {
  if (cloud) {
    const picked = pickWorkspaceSource(local, cloud);
    if (!picked) return null;
    if (picked === cloud.workspace) {
      return { kind: "cloud", workspace: cloud.workspace };
    }
    return { kind: "local", workspace: picked };
  }

  if (isDemoAccountEmail(email ?? "")) {
    return { kind: "demo-seed", workspace: createDemoReferenceWorkspace() };
  }

  if (local && (workspaceHasActiveProject(local) || local.projects.length > 0)) {
    return { kind: "local", workspace: local };
  }

  return { kind: "empty", workspace: createEmptyWorkspace() };
}

export async function uploadCloudAvatar(
  userId: string,
  blob: Blob,
): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from("avatars").upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
  });
  if (error) return null;
  return path;
}

export async function downloadCloudAvatar(path: string): Promise<Blob | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from("avatars").download(path);
  if (error || !data) return null;
  return data;
}

export async function deleteCloudAvatar(userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`]);
}

export function cloudProfileToUserProfile(
  row: CloudProfileRow,
  email: string,
): UserProfile {
  return {
    displayName: row.display_name,
    email,
    language: normalizeLanguage(row.language) as ProjectLanguage,
  };
}

let workspacePushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPush: { userId: string; workspace: Workspace } | null = null;

export function cancelCloudWorkspacePush(): void {
  if (workspacePushTimer) {
    clearTimeout(workspacePushTimer);
    workspacePushTimer = null;
  }
  pendingPush = null;
}

export function scheduleCloudWorkspacePush(
  userId: string,
  workspace: Workspace,
): void {
  if (!isCloudSyncConfigured()) return;
  pendingPush = { userId, workspace };
  if (workspacePushTimer) clearTimeout(workspacePushTimer);
  workspacePushTimer = setTimeout(() => {
    workspacePushTimer = null;
    const job = pendingPush;
    pendingPush = null;
    if (!job) return;
    void pushCloudWorkspace(job.userId, job.workspace);
  }, 400);
}

export async function flushCloudWorkspacePush(): Promise<void> {
  if (workspacePushTimer) {
    clearTimeout(workspacePushTimer);
    workspacePushTimer = null;
  }
  const job = pendingPush;
  pendingPush = null;
  if (!job) return;
  await pushCloudWorkspace(job.userId, job.workspace);
}
