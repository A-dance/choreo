import { createDemoReferenceState } from "./choreoUtils";
import { DEMO_ACCOUNT_EMAIL } from "./passwordPolicy";
import { createProjectRecord } from "./projectStore";
import type { Workspace } from "./types";

export const DEMO_REFERENCE_PROJECT_ID = "demo-reference-project";

export function isDemoAccountEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL;
}

export function createDemoReferenceWorkspace(): Workspace {
  const record = createProjectRecord(
    createDemoReferenceState("ja"),
    DEMO_REFERENCE_PROJECT_ID,
  );
  return {
    version: 1,
    activeProjectId: record.id,
    projects: [record],
  };
}
