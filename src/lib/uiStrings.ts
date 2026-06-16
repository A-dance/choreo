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
  demoReferenceSongTitle: string;
  emptyProjectTitle: string;
  emptyProjectDesc: string;
  booting: string;
  share: string;
  shareTitle: string;
  shareViewSectionDesc: string;
  copyShareLink: string;
  shareViaDevice: string;
  shareAction: string;
  shareSubtitle: string;
  shareCopy: string;
  shareCopied: string;
  shareViewerHint: string;
  mediaLinkCount: (n: number) => string;
  shareViaMail: string;
  shareViaMore: string;
  shareViaCopy: string;
  shareSheetText: (songTitle: string) => string;
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
  projectLastSaved: (when: string) => string;
  projectReorderHint: string;
  projectReorderAria: (name: string) => string;
  myPage: string;
  myPageTitle: string;
  displayNameLabel: string;
  displayNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  avatarLabel: string;
  avatarChange: string;
  avatarRemove: string;
  avatarUploadFailed: string;
  avatarInvalidType: string;
  profileGuest: string;
  profileDisplayLine: (name: string) => string;
  myPageSettings: string;
  myPageAccount: string;
  myPageOverview: string;
  myPageProjectsSection: string;
  myPageOverviewLine: (projects: number, audio: number, videos: number) => string;
  myPageCurrentBadge: string;
  myPageOpenProject: (title: string) => string;
  myPageAbout: string;
  myPageAppName: string;
  myPageVersion: (version: string) => string;
  myPageDataDeletion: string;
  myPageDataDeletionStoredLabel: string;
  myPageDataDeletionItems: string[];
  myPageDataDeletionWarnings: string[];
  myPageDeleteAccount: string;
  myPageDeleteAccountConfirmTitle: string;
  myPageDeleteAccountFailed: string;
  authLoginTitle: string;
  authSignUpTitle: string;
  authLoginHint: string;
  authSignUpHint: string;
  authSwitchToSignUp: string;
  authSwitchToSignIn: string;
  authSwitchToSignUpAction: string;
  authSwitchToSignInAction: string;
  authContinueWithGoogle: string;
  authOrDivider: string;
  authGoogleError: string;
  authProviderNotEnabled: string;
  authForgotPassword: string;
  authForgotSent: string;
  authForgotNeedsEmail: string;
  authResetPasswordTitle: string;
  authResetPasswordHint: string;
  authResetPasswordSubmit: string;
  authResetPasswordInvalidLink: string;
  authShowPassword: string;
  authHidePassword: string;
  authLoginSubtitle: string;
  authSignUpSubtitle: string;
  loginHeroLabel: string;
  loginHeroTagline: string;
  loginHeroHeadline: string;
  loginHeroDesc: string;
  loginHeroFeatures: string[];
  loginStageHint: string;
  authSection: string;
  authSignIn: string;
  authSignUp: string;
  authSignOut: string;
  authPassword: string;
  authPasswordConfirm: string;
  authSubmitSignIn: string;
  authSubmitSignUp: string;
  authSignedInHint: string;
  authNotConfigured: string;
  authAnonKeyMissing: string;
  authErrorGeneric: string;
  authPasswordMismatch: string;
  authPasswordHint: string;
  authPasswordWeak: string;
  authDisplayNameRequired: string;
  authCheckEmail: string;
  authCloudSynced: string;
  authCloudUploaded: string;
  authWelcomeTitle: string;
  authWelcomeSubtitle: string;
  authWelcomeBack: string;
  authGoToMyPage: string;
  authGoToEditor: string;
  authContinueWithoutAccount: string;
  authNotSignedInHint: string;
  authGoToLogin: string;
  authUnavailableTitle: string;
  authUnavailableHint: string;
  backToEditor: string;
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
  musicEmptyHint: string;
  musicFetching: string;
  musicLinkPlaceholder: string;
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
  newProjectDesc: "Set song title, BPM, member count, and counts per section.",
  songTitleLabel: "Song title",
  countsPerSection: "Counts per section",
  languageLabel: "Language",
  create: "Create",
  sections: "Sections",
  sectionName: "Section name",
  sectionTabHint:
    "Click to select · drag to reorder · double-click to rename and show delete",
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
  demoReferenceSongTitle: "Sample (Reference)",
  emptyProjectTitle: "No projects yet",
  emptyProjectDesc: "Create a project to start arranging formations.",
  booting: "Loading…",
  share: "Share",
  shareTitle: "Share project",
  shareViewSectionDesc:
    "Copy a view-only link to share formation, music, and reference videos.",
  copyShareLink: "Copy view link",
  shareViaDevice: "Share via apps…",
  shareAction: "Share",
  shareSubtitle: "Anyone with the link can view",
  shareCopy: "Copy",
  shareCopied: "Copied",
  shareViewerHint: "Viewers can see formations but cannot edit.",
  mediaLinkCount: (n: number) => `${n} ${n === 1 ? "link" : "links"}`,
  shareViaMail: "Email",
  shareViaMore: "More",
  shareViaCopy: "Copy Link",
  shareSheetText: (songTitle: string) =>
    `Formation for "${songTitle}" — view it here:`,
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
  projectLastSaved: (when) => `Last saved ${when}`,
  projectReorderHint: "Click to open · drag to reorder",
  projectReorderAria: (name) => `Reorder ${name}`,
  myPage: "My page",
  myPageTitle: "My page",
  displayNameLabel: "Display name",
  displayNamePlaceholder: "Your name",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  avatarLabel: "Profile photo",
  avatarChange: "Choose image",
  avatarRemove: "Remove image",
  avatarUploadFailed: "Could not save image",
  avatarInvalidType: "Please choose an image file",
  profileGuest: "Guest",
  profileDisplayLine: (name) => name.trim() || "Guest",
  myPageSettings: "Settings",
  myPageAccount: "Account",
  myPageOverview: "Overview",
  myPageProjectsSection: "Projects",
  myPageOverviewLine: (projects, audio, videos) =>
    `${projects} project${projects === 1 ? "" : "s"} · ${audio} audio · ${videos} video${videos === 1 ? "" : "s"}`,
  myPageCurrentBadge: "Current",
  myPageOpenProject: (title) => `Open ${title}`,
  myPageAbout: "About",
  myPageAppName: "bamiri — SHARE",
  myPageVersion: (version) => `Version ${version}`,
  myPageDataDeletion: "Data & deletion",
  myPageDataDeletionStoredLabel: "Stored in your account",
  myPageDataDeletionItems: [
    "Display name and email",
    "Profile photo (if set)",
    "Formation projects and settings",
  ],
  myPageDataDeletionWarnings: [
    "All cloud data will be permanently deleted.",
    "This cannot be undone.",
    "Data saved only in this browser will also be cleared.",
  ],
  myPageDeleteAccount: "Delete account",
  myPageDeleteAccountConfirmTitle: "Delete your account?",
  myPageDeleteAccountFailed: "Could not delete account. Please try again.",
  authLoginTitle: "Sign in",
  authSignUpTitle: "Create account",
  authLoginHint: "Enter your email and password.",
  authSignUpHint: "Choose an email and password for your account.",
  authSwitchToSignUp: "Don't have an account?",
  authSwitchToSignIn: "Already have an account?",
  authSwitchToSignUpAction: "Sign up",
  authSwitchToSignInAction: "Sign in",
  authContinueWithGoogle: "Continue with Google",
  authOrDivider: "or",
  authGoogleError: "Google sign-in failed. Please try again.",
  authProviderNotEnabled:
    "This sign-in method is not set up yet. Ask the app owner to enable it in Supabase.",
  authForgotPassword: "Forgot password?",
  authForgotSent: "Password reset email sent.",
  authForgotNeedsEmail: "Enter your email first.",
  authResetPasswordTitle: "Set a new password",
  authResetPasswordHint: "Choose a new password for your account.",
  authResetPasswordSubmit: "Save and sign in",
  authResetPasswordInvalidLink:
    "This reset link is invalid or has expired. Request a new one from the login page.",
  authShowPassword: "Show password",
  authHidePassword: "Hide password",
  authLoginSubtitle: "",
  authSignUpSubtitle: "",
  loginHeroLabel: "About bamiri — SHARE",
  loginHeroTagline: "FOR DANCERS & CHOREOGRAPHERS",
  loginHeroHeadline: "Formations, digitally.",
  loginHeroDesc:
    "Create formations intuitively with BPM sync and drag & drop. A tool for choreographers to share with your team in real time.",
  loginHeroFeatures: [
    "BPM-synced timeline",
    "Real-time sharing",
    "Section management",
    "6+ dancers",
  ],
  loginStageHint: "↑ Drag & drop to edit formations",
  authSection: "Sign in",
  authSignIn: "Sign in",
  authSignUp: "Create account",
  authSignOut: "Sign out",
  authPassword: "Password",
  authPasswordConfirm: "Confirm password",
  authSubmitSignIn: "Sign in →",
  authSubmitSignUp: "Create account →",
  authSignedInHint: "Projects sync to your account across devices.",
  authNotConfigured: "Cloud sign-in is not configured on this server.",
  authAnonKeyMissing:
    "The app could not connect to the account service. If you are the developer, check Supabase settings and restart the dev server.",
  authErrorGeneric: "Sign-in failed. Check your email and password.",
  authPasswordMismatch: "Passwords do not match.",
  authPasswordHint: "At least 8 characters with uppercase and lowercase letters.",
  authPasswordWeak:
    "Password must be at least 8 characters and include uppercase and lowercase letters.",
  authDisplayNameRequired: "Enter your display name.",
  authCheckEmail: "Check your email to confirm your account.",
  authCloudSynced: "Loaded projects from cloud",
  authCloudUploaded: "Saved local projects to cloud",
  authWelcomeTitle: "Welcome",
  authWelcomeSubtitle: "Create an account or sign in to edit and sync your projects.",
  authWelcomeBack: "Welcome back",
  authGoToMyPage: "Go to my page",
  authGoToEditor: "Open editor",
  authContinueWithoutAccount: "Open editor without signing in",
  authNotSignedInHint: "Sign in to sync projects across devices.",
  authGoToLogin: "Sign in",
  authUnavailableTitle: "Sign-in is temporarily unavailable",
  authUnavailableHint:
    "The app could not connect to the account service. If you are the developer, check Supabase settings and restart the dev server.",
  backToEditor: "Back to editor",
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
  musicEmptyHint: "Paste a music link above to get started.",
  musicFetching: "Looking up…",
  musicLinkPlaceholder: "Paste a link (Linkfire, TuneCore, Spotify…)",
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
  newProjectDesc: "曲名・BPM・人数・各セクションのカウント数を設定します。",
  songTitleLabel: "曲名",
  countsPerSection: "カウント数（各セクション）",
  languageLabel: "言語",
  create: "作成",
  sections: "セクション",
  sectionName: "セクション名",
  sectionTabHint:
    "クリックで選択 · ドラッグで並べ替え · ダブルクリックで名前変更と×表示",
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
  demoReferenceSongTitle: "サンプル（参考）",
  emptyProjectTitle: "プロジェクトがありません",
  emptyProjectDesc: "新規プロジェクトを作成して、編成づくりを始めましょう。",
  booting: "読み込み中…",
  share: "Share",
  shareTitle: "Share",
  shareViewSectionDesc:
    "配置・音源・参考動画を、編集できない閲覧用リンクとして共有します。",
  copyShareLink: "閲覧用リンクをコピー",
  shareViaDevice: "LINEなどのアプリで共有…",
  shareAction: "シェア",
  shareSubtitle: "リンクを知っている人は閲覧できます",
  shareCopy: "コピー",
  shareCopied: "コピー済み",
  shareViewerHint: "閲覧者は配置を見られますが、編集はできません。",
  mediaLinkCount: (n: number) => `リンク${n}件`,
  shareViaMail: "メール",
  shareViaMore: "その他",
  shareViaCopy: "リンクコピー",
  shareSheetText: (songTitle: string) =>
    `「${songTitle}」のダンス配置を共有します。こちらから見られます↓`,
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
  projectLastSaved: (when) => `最終保存 ${when}`,
  projectReorderHint: "クリックで開く · ドラッグで並べ替え",
  projectReorderAria: (name) => `「${name}」の順番を変更`,
  myPage: "マイページ",
  myPageTitle: "マイページ",
  displayNameLabel: "表示名",
  displayNamePlaceholder: "名前",
  emailLabel: "メールアドレス",
  emailPlaceholder: "you@example.com",
  avatarLabel: "プロフィール画像",
  avatarChange: "画像を選ぶ",
  avatarRemove: "画像を削除",
  avatarUploadFailed: "画像を保存できませんでした",
  avatarInvalidType: "画像ファイルを選んでください",
  profileGuest: "ゲスト",
  profileDisplayLine: (name) => {
    const trimmed = name.trim();
    return trimmed ? `${trimmed} 様` : "ゲスト";
  },
  myPageSettings: "設定",
  myPageAccount: "アカウント",
  myPageOverview: "概要",
  myPageProjectsSection: "プロジェクト",
  myPageOverviewLine: (projects, audio, videos) =>
    `${projects}件 · 音源${audio} · 動画${videos}`,
  myPageCurrentBadge: "使用中",
  myPageOpenProject: (title) => `「${title}」を開く`,
  myPageAbout: "アプリ",
  myPageAppName: "bamiri — SHARE",
  myPageVersion: (version) => `バージョン ${version}`,
  myPageDataDeletion: "データの削除",
  myPageDataDeletionStoredLabel: "保存している情報",
  myPageDataDeletionItems: [
    "表示名・メールアドレス",
    "プロフィール画像（設定した場合）",
    "ダンス配置のプロジェクトと関連設定",
  ],
  myPageDataDeletionWarnings: [
    "クラウド上のデータはすべて完全に削除されます。",
    "元に戻すことはできません。",
    "このブラウザに保存されているデータも消去されます。",
  ],
  myPageDeleteAccount: "アカウントを削除",
  myPageDeleteAccountConfirmTitle: "アカウントを削除しますか？",
  myPageDeleteAccountFailed: "アカウントを削除できませんでした。もう一度お試しください。",
  authLoginTitle: "ログイン",
  authSignUpTitle: "新規登録",
  authLoginHint: "メールアドレスとパスワードを入力してください。",
  authSignUpHint: "使うメールアドレスとパスワードを設定してください。",
  authSwitchToSignUp: "アカウントをお持ちでない方は",
  authSwitchToSignIn: "すでにアカウントをお持ちの方は",
  authSwitchToSignUpAction: "新規登録",
  authSwitchToSignInAction: "ログイン",
  authContinueWithGoogle: "Googleで続ける",
  authOrDivider: "または",
  authGoogleError: "Googleログインに失敗しました。もう一度お試しください。",
  authProviderNotEnabled:
    "このログイン方法はまだ設定されていません。Supabase でプロバイダを有効化してください。",
  authForgotPassword: "忘れた方はこちら",
  authForgotSent: "パスワード再設定メールを送信しました。",
  authForgotNeedsEmail: "先にメールアドレスを入力してください。",
  authResetPasswordTitle: "新しいパスワードを設定",
  authResetPasswordHint: "アカウントの新しいパスワードを入力してください。",
  authResetPasswordSubmit: "保存してログイン",
  authResetPasswordInvalidLink:
    "再設定リンクが無効か期限切れです。ログイン画面からもう一度リクエストしてください。",
  authShowPassword: "パスワードを表示",
  authHidePassword: "パスワードを隠す",
  authLoginSubtitle: "",
  authSignUpSubtitle: "",
  loginHeroLabel: "bamiri — SHARE について",
  loginHeroTagline: "FOR DANCERS & CHOREOGRAPHERS",
  loginHeroHeadline: "フォーメーションを、デジタルに。",
  loginHeroDesc:
    "BPM同期・ドラッグ＆ドロップで直感的にフォーメーションを作成。チームとリアルタイムで共有できる振付師のためのツール。",
  loginHeroFeatures: [
    "BPM同期タイムライン",
    "リアルタイム共有",
    "セクション管理",
    "6名以上対応",
  ],
  loginStageHint: "↑ フォーメーションをドラッグ＆ドロップで編集",
  authSection: "ログイン",
  authSignIn: "ログイン",
  authSignUp: "新規登録",
  authSignOut: "ログアウト",
  authPassword: "パスワード",
  authPasswordConfirm: "パスワード（確認）",
  authSubmitSignIn: "ログイン →",
  authSubmitSignUp: "アカウントを作成 →",
  authSignedInHint: "ログインすると端末間でプロジェクトが同期されます。",
  authNotConfigured: "このサーバーではクラウドログインが設定されていません。",
  authAnonKeyMissing:
    "アカウントサービスに接続できませんでした。開発中の場合は設定を確認し、サーバーを再起動してください。",
  authErrorGeneric: "ログインに失敗しました。メールとパスワードを確認してください。",
  authPasswordMismatch: "パスワードが一致しません。",
  authPasswordHint: "8文字以上、大文字・小文字を含めてください。",
  authPasswordWeak: "パスワードは8文字以上で、大文字と小文字を含めてください。",
  authDisplayNameRequired: "表示名を入力してください。",
  authCheckEmail: "確認メールを送信しました。メールを確認してください。",
  authCloudSynced: "クラウドからプロジェクトを読み込みました",
  authCloudUploaded: "ローカルのプロジェクトをクラウドに保存しました",
  authWelcomeTitle: "ようこそ",
  authWelcomeSubtitle: "アカウントを作成するか、ログインして配置を編集・同期しましょう。",
  authWelcomeBack: "おかえりなさい",
  authGoToMyPage: "マイページへ",
  authGoToEditor: "エディターを開く",
  authContinueWithoutAccount: "アカウントなしでエディターを開く",
  authNotSignedInHint: "ログインすると端末間でプロジェクトが同期されます。",
  authGoToLogin: "ログイン",
  authUnavailableTitle: "ログインの準備ができていません",
  authUnavailableHint:
    "アカウントサービスに接続できませんでした。開発中の場合は設定を確認し、サーバーを再起動してください。",
  backToEditor: "エディターに戻る",
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
  musicEmptyHint: "上の欄にリンクを貼り付けて追加してください。",
  musicFetching: "取得中…",
  musicLinkPlaceholder: "リンクを貼り付け（Linkfire、TuneCore、Spotify など）",
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

export const DEFAULT_LANGUAGE: ProjectLanguage = "en";

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
