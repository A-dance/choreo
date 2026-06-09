export type ProjectLanguage = "en" | "ja";

export type UiStrings = {
  projects: string;
  projectList: string;
  close: string;
  songTitle: string;
  tools: string;
  grid: string;
  gridWidth: string;
  gridDepth: string;
  widthShort: string;
  depthShort: string;
  dots: string;
  dotSize: string;
  openMembers: string;
  members: string;
  undo: string;
  undoShortcut: string;
  playing: string;
  resizeWidth: string;
  resizeHeight: string;
  resizeStage: string;
  newProject: string;
  deleteProject: string;
  cannotDeleteLastProject: string;
  deleteProjectAria: (title: string) => string;
  deleteConfirmTitle: string;
  deleteConfirmBody: (title: string) => string;
  cancel: string;
  delete: string;
  newProjectTitle: string;
  newProjectDesc: string;
  songTitleLabel: string;
  countsPerSection: string;
  languageLabel: string;
  create: string;
  sections: string;
  sectionName: string;
  sectionTabHint: string;
  deleteSection: string;
  deleteSectionAria: (name: string) => string;
  deleteSectionConfirm: (name: string) => string;
  insertHalfCount: string;
  countDeleteHint: string;
  deleteCount: string;
  deleteCountAria: (label: string) => string;
  deleteCountConfirm: (label: string) => string;
  deleteCountWithDataConfirm: (label: string) => string;
  editMembers: string;
  editingPosition: string;
  memberCount: string;
  noVisibleMembers: string;
  hideOnCount: string;
  showOnCount: string;
  hide: string;
  show: string;
  removeFromList: string;
  removed: string;
  restoreToList: string;
  memberNameAria: (name: string) => string;
  memberFallback: string;
  undoDone: string;
  paused: string;
  playingToast: string;
  saveFailed: string;
  saved: string;
  switchedProject: (title: string) => string;
  createdProject: (title: string) => string;
  projectDeleted: string;
  copied: string;
  pasted: string;
  memberRemoved: (name: string) => string;
  memberRestored: string;
  halfCountAdded: string;
  countDeleted: string;
  sectionDeletedToast: string;
  sectionMovedLeft: string;
  sectionMovedRight: string;
  sectionsSwapped: string;
  sectionReordered: string;
  sectionNameDefault: (n: number) => string;
  progressAria: (current: number, total: number, sections: number) => string;
  defaultSongTitle: string;
  share: string;
  shareTitle: string;
  shareViewSectionDesc: string;
  copyShareLink: string;
  previewViewMode: string;
  viewPreviewStarted: string;
  viewPreviewEnded: string;
  shareLinkCopied: string;
  shareLinkCopiedFilesSkipped: string;
  shareLinkCopiedLegacy: string;
  shareLinkCopying: string;
  shareLinkCreateFailed: string;
  shareLinkCopyFailed: string;
  shareLoadFailed: string;
  shareLinkTooLong: string;
  viewModeBanner: string;
  exitViewMode: string;
  viewOnlyProjectHint: string;
  sidebarMedia: string;
  mediaPanelTitle: string;
  mediaPerProjectHint: string;
  mediaCounts: (audioCount: number, videoCount: number) => string;
  mediaAudioCount: (n: number) => string;
  mediaVideoCount: (n: number) => string;
  openAudio: string;
  openReferenceVideos: string;
  audioSection: string;
  audioSectionDesc: string;
  addMusicLink: string;
  musicLinkLabel: string;
  musicLinkAddButton: string;
  musicPasteClipboard: string;
  musicPasteAndAdd: string;
  musicEmptyHint: string;
  musicFetching: string;
  musicLinkPlaceholder: string;
  musicLinkHint: string;
  musicLinkInvalid: string;
  musicLinkAdded: string;
  musicTrackTitle: string;
  musicTrackTitlePlaceholder: string;
  musicTrackUntitled: string;
  openInMusicApp: string;
  openMusicLink: string;
  musicSourceSmartLink: string;
  musicSourceLinkfire: string;
  musicSourceTunecore: string;
  musicSourceSpotify: string;
  musicSourceApple: string;
  musicSourceYoutubeMusic: string;
  musicSourceFile: string;
  noAudio: string;
  referenceVideosSection: string;
  referenceVideosDesc: string;
  addReferenceVideoLink: string;
  referenceVideoLinkPlaceholder: string;
  referenceVideoTitle: string;
  referenceVideoTitlePlaceholder: string;
  referenceVideoUntitled: string;
  referenceVideoMessage: string;
  referenceVideoMessagePlaceholder: string;
  referenceVideoAddedAt: string;
  referenceVideoSourceFile: string;
  referenceVideoSourceYoutube: string;
  referenceVideoSourceVimeo: string;
  videoLinkInvalid: string;
  videoLinkAdded: string;
  noReferenceVideos: string;
  removeMedia: string;
  videoUploaded: string;
  viewOnlyHint: string;
};

const en: UiStrings = {
  projects: "Projects",
  projectList: "Project list",
  close: "Close",
  songTitle: "Song title",
  tools: "Tools",
  grid: "Grid",
  gridWidth: "Grid width",
  gridDepth: "Grid depth",
  widthShort: "W",
  depthShort: "D",
  dots: "Dots",
  dotSize: "Dot size",
  openMembers: "Open members",
  members: "Members",
  undo: "Undo",
  undoShortcut: "Undo (⌘Z / Ctrl+Z)",
  playing: "Playing",
  resizeWidth: "Resize width",
  resizeHeight: "Resize height",
  resizeStage: "Resize stage",
  newProject: "+ New project",
  deleteProject: "Delete project",
  cannotDeleteLastProject: "Cannot delete the last project",
  deleteProjectAria: (title) => `Delete ${title}`,
  deleteConfirmTitle: "Delete this project?",
  deleteConfirmBody: (title) =>
    `"${title}" will be deleted. This cannot be undone.`,
  cancel: "Cancel",
  delete: "Delete",
  newProjectTitle: "New project",
  newProjectDesc: "Set language, song title, BPM, member count, and counts per section.",
  songTitleLabel: "Song title",
  countsPerSection: "Counts per section",
  languageLabel: "Language",
  create: "Create",
  sections: "Sections",
  sectionName: "Section name",
  sectionTabHint:
    "Click to select · drag to reorder · double-click to rename",
  deleteSection: "Delete section",
  deleteSectionAria: (name) => `Delete section ${name}`,
  deleteSectionConfirm: (name) =>
    `Delete the entire section "${name}"?\n(This is not the same as deleting a single count.)`,
  insertHalfCount: "Insert & (half-count)",
  countDeleteHint: "Double-click to show delete · Delete key also works",
  deleteCount: "Delete count",
  deleteCountAria: (label) => `Delete count ${label}`,
  deleteCountConfirm: (label) => `Delete count "${label}"?`,
  deleteCountWithDataConfirm: (label) =>
    `Delete count "${label}"? Formation data on this count will be lost.`,
  editMembers: "Edit members",
  editingPosition: "Editing position",
  memberCount: "Count",
  noVisibleMembers: "No visible members",
  hideOnCount: "Hide on this count",
  showOnCount: "Show on this count",
  hide: "Hide",
  show: "Show",
  removeFromList: "Remove from list",
  removed: "Removed",
  restoreToList: "Restore to list",
  memberNameAria: (name) => `${name} name`,
  memberFallback: "Member",
  undoDone: "Undone",
  paused: "Paused",
  playingToast: "Playing",
  saveFailed: "Save failed",
  saved: "Saved",
  switchedProject: (title) => `Switched to “${title}”`,
  createdProject: (title) => `Created “${title}”`,
  projectDeleted: "Project deleted",
  copied: "Copied",
  pasted: "Pasted",
  memberRemoved: (name) => `Removed ${name}`,
  memberRestored: "Restored to list",
  halfCountAdded: "Added & half-count",
  countDeleted: "Count deleted",
  sectionDeletedToast: "Section deleted",
  sectionMovedLeft: "Section moved left",
  sectionMovedRight: "Section moved right",
  sectionsSwapped: "Sections swapped",
  sectionReordered: "Section reordered",
  sectionNameDefault: (n) => `Section ${n}`,
  progressAria: (current, total, sections) =>
    `${current}/${total}, ${sections} section${sections === 1 ? "" : "s"}`,
  defaultSongTitle: "Untitled",
  share: "Share",
  shareTitle: "Share project",
  shareViewSectionDesc:
    "Copy a view-only link to share formation, music, and reference videos.",
  copyShareLink: "Copy view link",
  previewViewMode: "Preview in view mode",
  viewPreviewStarted: "View mode — editing disabled",
  viewPreviewEnded: "Back to edit mode",
  shareLinkCopied: "Link copied",
  shareLinkCopiedFilesSkipped: "Link copied",
  shareLinkCopiedLegacy: "Link copied",
  shareLinkCopying: "Creating link…",
  shareLinkCreateFailed: "Could not create share link",
  shareLinkCopyFailed: "Could not copy to clipboard",
  shareLoadFailed: "Share link not found or expired",
  shareLinkTooLong: "Project too large for URL-only link",
  viewModeBanner: "View-only mode — editing is disabled",
  exitViewMode: "Exit view mode",
  viewOnlyProjectHint: "View-only — only this project is shown",
  sidebarMedia: "Media",
  mediaPanelTitle: "Project media",
  mediaPerProjectHint: "Audio and reference videos are saved per project.",
  mediaCounts: (a, v) => `${a} audio · ${v} videos`,
  mediaAudioCount: (n) => (n === 0 ? "None" : `${n} file${n === 1 ? "" : "s"}`),
  mediaVideoCount: (n) => (n === 0 ? "None" : `${n} video${n === 1 ? "" : "s"}`),
  openAudio: "Music",
  openReferenceVideos: "Reference videos",
  audioSection: "Music sources",
  audioSectionDesc:
    "Linkfire (lnk.to) or TuneCore LinkShare URL, or Spotify / Apple Music link. Song title loads automatically; artwork when available.",
  addMusicLink: "Add music link",
  musicLinkLabel: "Audio link",
  musicLinkAddButton: "Add",
  musicPasteClipboard: "Paste from clipboard",
  musicPasteAndAdd: "Paste link to add",
  musicEmptyHint: "Paste a Linkfire, TuneCore, or streaming link in the field above.",
  musicFetching: "Looking up…",
  musicLinkPlaceholder: "Linkfire, TuneCore, Spotify, Apple Music…",
  musicLinkHint:
    "Tip: use “Paste from clipboard” if the link is embedded in text.",
  musicLinkInvalid:
    "Could not read that link — paste the full URL as copied",
  musicLinkAdded: "Audio link added",
  musicTrackTitle: "Title",
  musicTrackTitlePlaceholder: "Song or playlist name",
  musicTrackUntitled: "Untitled track",
  openInMusicApp: "Open in app",
  openMusicLink: "Open link",
  musicSourceSmartLink: "Smart link",
  musicSourceLinkfire: "Linkfire",
  musicSourceTunecore: "TuneCore",
  musicSourceSpotify: "Spotify",
  musicSourceApple: "Apple Music",
  musicSourceYoutubeMusic: "YouTube Music",
  musicSourceFile: "File",
  noAudio: "No music yet",
  referenceVideosSection: "Reference videos",
  referenceVideosDesc:
    "Add YouTube or Vimeo links. You can add notes for each video.",
  addReferenceVideoLink: "Add",
  referenceVideoLinkPlaceholder: "https://www.youtube.com/watch?v=…",
  referenceVideoTitle: "Title",
  referenceVideoTitlePlaceholder: "Reference video name",
  referenceVideoUntitled: "Untitled video",
  referenceVideoMessage: "Note",
  referenceVideoMessagePlaceholder: "Choreo notes, timestamps, reminders…",
  referenceVideoAddedAt: "Added",
  referenceVideoSourceFile: "File",
  referenceVideoSourceYoutube: "YouTube",
  referenceVideoSourceVimeo: "Vimeo",
  videoLinkInvalid: "Could not read that link — use YouTube or Vimeo",
  videoLinkAdded: "Link added",
  noReferenceVideos: "No reference videos",
  removeMedia: "Remove",
  videoUploaded: "Video added",
  viewOnlyHint: "View only",
};

const ja: UiStrings = {
  projects: "Projects",
  projectList: "プロジェクト一覧",
  close: "閉じる",
  songTitle: "曲名",
  tools: "ツール",
  grid: "ばみり",
  gridWidth: "横ばみり",
  gridDepth: "縦ばみり",
  widthShort: "横",
  depthShort: "縦",
  dots: "ドット",
  dotSize: "ドットサイズ",
  openMembers: "メンバー一覧を開く",
  members: "人数",
  undo: "元に戻す",
  undoShortcut: "元に戻す（⌘Z / Ctrl+Z）",
  playing: "再生中",
  resizeWidth: "横幅を調整",
  resizeHeight: "高さを調整",
  resizeStage: "サイズを調整",
  newProject: "+ 新規プロジェクト",
  deleteProject: "プロジェクトを削除",
  cannotDeleteLastProject: "最後のプロジェクトは削除できません",
  deleteProjectAria: (title) => `${title} を削除`,
  deleteConfirmTitle: "削除しますか？",
  deleteConfirmBody: (title) =>
    `「${title}」を削除します。この操作は取り消せません。`,
  cancel: "キャンセル",
  delete: "削除",
  newProjectTitle: "新規プロジェクト",
  newProjectDesc: "言語・曲名・BPM・人数・各セクションのカウント数を設定します。",
  songTitleLabel: "曲名",
  countsPerSection: "カウント数（各セクション）",
  languageLabel: "言語",
  create: "作成",
  sections: "セクション",
  sectionName: "セクション名",
  sectionTabHint:
    "クリックで選択 · ドラッグで並べ替え · ダブルクリックで名前変更",
  deleteSection: "セクションを削除",
  deleteSectionAria: (name) => `セクション「${name}」を削除`,
  deleteSectionConfirm: (name) =>
    `セクション「${name}」を丸ごと削除します。\n（カウントの削除ではありません）`,
  insertHalfCount: "＆を挿入（半カウント）",
  countDeleteHint: "ダブルクリックで削除ボタン表示 · Delete キーでも削除",
  deleteCount: "カウントを削除",
  deleteCountAria: (label) => `カウント「${label}」を削除`,
  deleteCountConfirm: (label) => `カウント「${label}」を削除しますか？`,
  deleteCountWithDataConfirm: (label) =>
    `カウント「${label}」を削除しますか？このカウントの配置データは失われます。`,
  editMembers: "メンバー編集",
  editingPosition: "編集中の位置",
  memberCount: "人数",
  noVisibleMembers: "表示中のメンバーがいません",
  hideOnCount: "このカウントで非表示にする",
  showOnCount: "このカウントで表示する",
  hide: "非表示",
  show: "表示",
  removeFromList: "リストから削除",
  removed: "削除済み",
  restoreToList: "リストに戻す",
  memberNameAria: (name) => `${name}の名前`,
  memberFallback: "メンバー",
  undoDone: "元に戻しました",
  paused: "停止",
  playingToast: "再生中",
  saveFailed: "保存に失敗しました",
  saved: "保存しました",
  switchedProject: (title) => `「${title}」に切り替え`,
  createdProject: (title) => `「${title}」を作成`,
  projectDeleted: "プロジェクトを削除しました",
  copied: "コピーしました",
  pasted: "ペーストしました",
  memberRemoved: (name) => `${name} を削除`,
  memberRestored: "表示に戻しました",
  halfCountAdded: "＆ 半カウントを追加",
  countDeleted: "カウントを削除",
  sectionDeletedToast: "セクションを削除",
  sectionMovedLeft: "セクションを左へ",
  sectionMovedRight: "セクションを右へ",
  sectionsSwapped: "セクションを入れ替え",
  sectionReordered: "セクションを移動",
  sectionNameDefault: (n) => `セクション${n}`,
  progressAria: (current, total, sections) =>
    `${current}/${total}、${sections}セクション`,
  defaultSongTitle: "新曲タイトル",
  share: "共有",
  shareTitle: "共有",
  shareViewSectionDesc:
    "配置・音源・参考動画を、編集できない閲覧用リンクとして共有します。",
  copyShareLink: "閲覧用リンクをコピー",
  previewViewMode: "閲覧モードでプレビュー",
  viewPreviewStarted: "閲覧モード — 編集できません",
  viewPreviewEnded: "編集モードに戻りました",
  shareLinkCopied: "リンクをコピーしました",
  shareLinkCopiedFilesSkipped: "リンクをコピーしました",
  shareLinkCopiedLegacy: "リンクをコピーしました",
  shareLinkCopying: "リンク作成中…",
  shareLinkCreateFailed: "共有リンクを作成できませんでした",
  shareLinkCopyFailed: "クリップボードにコピーできませんでした",
  shareLoadFailed: "共有リンクが見つかりません",
  shareLinkTooLong: "URLに載せきれません",
  viewModeBanner: "閲覧専用モード — 編集できません",
  exitViewMode: "閲覧モードを終了",
  viewOnlyProjectHint: "閲覧専用 — このプロジェクトのみ表示",
  sidebarMedia: "メディア",
  mediaPanelTitle: "プロジェクトのメディア",
  mediaPerProjectHint: "音源・参考動画はプロジェクトごとに保存されます。",
  mediaCounts: (a, v) => `${a}音源・${v}動画`,
  mediaAudioCount: (n) => (n === 0 ? "なし" : `${n}曲`),
  mediaVideoCount: (n) => (n === 0 ? "なし" : `${n}本`),
  openAudio: "音源",
  openReferenceVideos: "参考動画",
  audioSection: "音源",
  audioSectionDesc:
    "Linkfire（lnk.to）や TuneCore の LinkShare、Spotify / Apple Music などのリンクを貼り付け。曲名は自動取得（ジャケットも表示されます）。",
  addMusicLink: "音源リンクを追加",
  musicLinkLabel: "音源リンク",
  musicLinkAddButton: "追加",
  musicPasteClipboard: "クリップボードから貼り付け",
  musicPasteAndAdd: "リンクを貼り付けて追加",
  musicEmptyHint: "上の入力欄に Linkfire・TuneCore などのリンクを貼り付けてください。",
  musicFetching: "取得中…",
  musicLinkPlaceholder: "Linkfire、TuneCore、Spotify、Apple Music…",
  musicLinkHint:
    "うまくいかないときは「クリップボードから貼り付け」を試してください。",
  musicLinkInvalid:
    "リンクを読み取れません — URL 全体をそのまま貼り付けてください",
  musicLinkAdded: "音源リンクを追加しました",
  musicTrackTitle: "タイトル",
  musicTrackTitlePlaceholder: "曲名・プレイリスト名",
  musicTrackUntitled: "無題",
  openInMusicApp: "アプリで開く",
  openMusicLink: "リンクを開く",
  musicSourceSmartLink: "スマートリンク",
  musicSourceLinkfire: "Linkfire",
  musicSourceTunecore: "TuneCore",
  musicSourceSpotify: "Spotify",
  musicSourceApple: "Apple Music",
  musicSourceYoutubeMusic: "YouTube Music",
  musicSourceFile: "ファイル",
  noAudio: "音源なし",
  referenceVideosSection: "参考動画",
  referenceVideosDesc:
    "YouTube や Vimeo のリンクを追加できます。メモも残せます。",
  addReferenceVideoLink: "追加",
  referenceVideoLinkPlaceholder: "https://www.youtube.com/watch?v=…",
  referenceVideoTitle: "タイトル",
  referenceVideoTitlePlaceholder: "参考動画の名前",
  referenceVideoUntitled: "無題の動画",
  referenceVideoMessage: "メモ",
  referenceVideoMessagePlaceholder: "振付メモ、タイムスタンプ、共有事項など",
  referenceVideoAddedAt: "追加日",
  referenceVideoSourceFile: "ファイル",
  referenceVideoSourceYoutube: "YouTube",
  referenceVideoSourceVimeo: "Vimeo",
  videoLinkInvalid: "リンクを読み取れません — YouTube または Vimeo の URL を入力してください",
  videoLinkAdded: "リンクを追加しました",
  noReferenceVideos: "参考動画なし",
  removeMedia: "削除",
  videoUploaded: "参考動画を追加しました",
  viewOnlyHint: "閲覧専用",
};

export const STRINGS: Record<ProjectLanguage, UiStrings> = { en, ja };

export function getStrings(lang: ProjectLanguage | undefined): UiStrings {
  return STRINGS[lang === "ja" ? "ja" : "en"];
}

export function detectBrowserLanguage(): ProjectLanguage {
  if (typeof navigator !== "undefined" && navigator.language.startsWith("ja")) {
    return "ja";
  }
  return "en";
}

export function normalizeLanguage(lang: unknown): ProjectLanguage {
  return lang === "ja" ? "ja" : "en";
}

/** @deprecated use getStrings(lang).defaultSongTitle */
export const DEFAULT_SONG_TITLE = en.defaultSongTitle;

/** @deprecated use getStrings() */
export const UI = en;
