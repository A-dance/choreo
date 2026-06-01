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
  /** このカウントで非表示にするメンバー ID（未設定時は前のカウントを継承） */
  hidden?: number[];
}

export interface FormationClipboard {
  positions: Record<number, Position>;
  hidden: number[];
}

export interface StageConfig {
  bamiriHalfWidth: number;
  bamiriDepth: number;
  scaleW: number;
  scaleH: number;
}

export interface ChoreoState {
  songTitle: string;
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
