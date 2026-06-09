import type { ProjectLanguage } from "./uiStrings";

export type { ProjectLanguage };

export interface Position {
  x: number;
  y: number;
}

export interface Member {
  id: number;
  name: string;
  color: string;
}

/** フルカウント（1〜8）または半カウント（&） */
export type CountSlot =
  | { type: "count"; num: number }
  | { type: "half" };

export interface Section {
  id: string;
  name: string;
  slots: CountSlot[];
}

export interface FlatSlot {
  globalIndex: number;
  sectionId: string;
  sectionName: string;
  slotIndex: number;
  slot: CountSlot;
  label: string;
  isHalf: boolean;
}

export interface CountData {
  positions: Record<number, Position>;
  memo: string;
  /** このカウント以降、非表示にするメンバー ID */
  hidden?: number[];
  /** このカウント以降、再表示するメンバー ID（hidden より優先） */
  shown?: number[];
}

export interface FormationClipboard {
  positions: Record<number, Position>;
}

export interface StageConfig {
  bamiriHalfWidth: number;
  bamiriDepth: number;
  scaleW: number;
  scaleH: number;
  /** null = 人数・ばみりから自動。数値 = 全員共通のドット直径(px) */
  memberDotPx: number | null;
}

export interface ProjectMedia {
  audioTracks: AudioTrackMeta[];
  referenceVideos: ReferenceVideoMeta[];
}

export type MusicSource =
  | "file"
  | "smart_link"
  | "spotify"
  | "apple_music"
  | "youtube_music";

export interface AudioTrackMeta {
  id: string;
  name: string;
  createdAt: number;
  source: MusicSource;
  /** ストリーミングサービスの URL（ファイルの場合は未設定） */
  externalUrl?: string;
  thumbnailUrl?: string;
}

export type ReferenceVideoSource = "file" | "youtube" | "vimeo";

export interface ReferenceVideoMeta {
  id: string;
  name: string;
  createdAt: number;
  message: string;
  source: ReferenceVideoSource;
  /** YouTube / Vimeo などの URL（ファイルの場合は未設定） */
  externalUrl?: string;
}

export type AppMode = "edit" | "view";

export interface ChoreoState {
  songTitle: string;
  language: ProjectLanguage;
  sections: Section[];
  members: Member[];
  /** 削除済み（リスト非表示）。表示ボタンで members に復帰 */
  removedMembers: Member[];
  bpm: number;
  currentCount: number;
  countData: Record<number, CountData>;
  stage: StageConfig;
  nextId: number;
  isPlaying: boolean;
}

export interface ProjectRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  state: ChoreoState;
  media: ProjectMedia;
}

export interface ProjectSummary {
  id: string;
  songTitle: string;
  bpm: number;
  updatedAt: number;
  audioCount: number;
  videoCount: number;
}

export interface Workspace {
  version: 1;
  activeProjectId: string;
  projects: ProjectRecord[];
}

export interface NewProjectParams {
  songTitle: string;
  bpm: number;
  countsPerSection: number;
  memberCount: number;
  language: ProjectLanguage;
}
