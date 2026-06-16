# bamiri — SHARE User Manual

Official manual for features and operations. ASK AI uses this as its primary reference.

---

## 1. Overview

Web app for editing and playing dance formations on stage, synced to BPM.

| Term | Meaning |
|------|---------|
| Members (dots) | Colored circles on stage |
| Counts | Beats on timeline (1, 2, 3…) |
| Half-count (&) | Half-beat timing between counts |
| Sections | Intro, verse, chorus, etc. |
| Bamiri grid | Stage grid (0 = center) |

**Access**
- **Login** required for normal use (`/login`).
- **Share links** (`?share=` URLs) open in view-only mode without login.

Edits **auto-save**. Cloud sync when logged in.

---

## 2. Layout

| Area | Contents |
|------|----------|
| Top-left | Project menu (≡) → sidebar |
| Header | Song title, BPM / grid / dots / members, Play, Copy, Paste, Undo, ASK AI, Share |
| Center | Stage (BACK / AUDIENCE labels) |
| Bottom | Timeline (section tabs + counts) |
| Sidebar | Projects, **Music** / **Reference videos**, My page (avatar) |

Zero projects shows **No projects** + **+ New project** in the center.

---

## 3. Login & account

### 3.1 Sign in / sign up
- `/login` — **Sign in** / **Sign up**
- Email + password or **Continue with Google**
- Sign-up: display name, password confirm (8+ chars, upper + lower)

### 3.2 Password reset
1. **Forgot password?** on login screen
2. Email reset link → `/auth/reset-password`

### 3.3 Sign out & delete account
- **My page** → **Sign out** or **Delete account** (with confirmation)

### 3.4 My page
- **← Back to editor**
- Display name, email (read-only), **language** (English / 日本語)
- Avatar: choose / remove image
- Plan: Free (1 project) or Pro; upgrade card on free
- Project list (read-only, **in use** badge)

---

## 4. Projects

### 4.1 Sidebar
- Open via **≡**; close via backdrop or **Close** (×)

### 4.2 Switch / create
1. Click project name to switch
2. **+ New project** → dialog: title, BPM, member count, counts per section → **Create**
3. Default sections: Intro, Verse A, Chorus, Outro (locale-dependent)

### 4.3 Reorder / delete
- Drag rows when 2+ projects
- **×** per row → confirm delete
- Last project delete → empty state prompt
- **Last saved** timestamp per row

### 4.4 Plans
- **Free**: 1 project
- **Pro** (¥500/month): unlimited projects + cloud sync
- 2nd project triggers **Upgrade to Pro** dialog (Stripe coming soon)

---

## 5. Header tools

### 5.1 Song title — editable in header

### 5.2 BPM — 40–240

### 5.3 Grid — **W** / **D**, each 1–20; 0 = center

### 5.4 Dot size — **Dots** field, 14–64 px (Enter or blur)

### 5.5 Members — **Members** button → member panel (§7)

### 5.6 Action buttons (English labels)
- **Play**, **Copy**, **Paste**, **Undo**, **ASK AI**, **Share**

---

## 6. Stage

- **Drag** members (grid snap); ~8px threshold separates click vs drag
- **Click** select; **Escape** deselect
- **Delete** with member selected → hide on current count only
- Navigate via timeline, section tabs, **← →** / **[ ]**
- **Resize handles** on hover (right / bottom / corner)
- Playback: touching member pauses; hidden members still animate (invisible)
- Labels: BACK, AUDIENCE, STAGE LEFT, STAGE RIGHT

---

## 7. Member panel

Open: header **Members** button. Title: **👥 Edit members**. Shows **Editing position**.

- Change count (1–500)
- Rename members
- **Hide** / **Show** on current count only
- **Delete** → removed list; **Show** button restores (tooltip: Restore to list)
- Close: ×, overlay, Escape

---

## 8. Timeline

### 8.1 Section tabs
- Click → select + jump to section start
- Drag → reorder
- Double-click → rename; × deletes (2+ sections, with confirm)

### 8.2 Add section
1. Click **+ Add section** at right end of tab row
2. New section appended; double-click to rename

### 8.3 Counts
- Click navigate; double-click → × delete (confirm if data)
- Dot indicator when formation exists; **S1**, **S2** labels
- Horizontal scroll on count row

### 8.4 Add count
- **+ Add count** at end (max **64** per section)

### 8.5 Half-count (&)
- **+** between counts or after last count

---

## 9. Playback

- **Play** or **Space**; click count while playing to seek
- **Escape** deselects member or stops playback

---

## 10. Copy / paste / undo

| Action | Method |
|--------|--------|
| Copy | **Copy** or **⌘C** |
| Paste | **Paste** or **⌘V** (after copy) |
| Undo | **Undo** or **⌘Z** |

Current count formation only.

---

## 11. Keyboard shortcuts

Space, arrows / [ ], Delete, ⌘C/V/Z, Escape — see §11 in JA manual for full table.

---

## 12. Share

1. **Share** → dialog auto-creates link
2. **Copy**, **LINE**, **X**, **Mail**, **Copy link**, **More** (native share)
3. Includes formation + music/video **links**; uploaded **files** may be omitted
4. **Preview in view mode** in dialog; **Exit view mode** in header during preview
5. **Share URL visitors**: view-only, no edit, **no exit button** to editor

---

## 13. Media (sidebar)

**Music** / **Reference videos** with count badges.

### 13.1 Music (audio links)
- Paste any **http(s) URL** and tap **Add** (saved as a Smart link)
- **Recommended**: Spotify, Apple Music, YouTube Music, Linkfire, TuneCore, song.link
- File-sharing URLs (e.g. Japanese file-bin sites) can be added but open externally — in-app preview is mainly Spotify / YouTube Music

### 13.2 Reference videos
- **YouTube / Vimeo** URLs only (not file-sharing upload links)

---

## 14. ASK AI

- Header **ASK AI** button (? icon + label)
- Unlimited for all plans; suggestions, new chat, Enter to send

---

## 15. Toasts

Brief feedback: project switch/create/delete, copy/paste, undo, media added, share errors, etc.

---

## 16. View-only summary

| Context | Edit | Exit |
|---------|------|------|
| External share link | No | No exit button |
| Share preview | No | **Exit view mode** |

---

## 17. Limits

BPM 40–240; grid 1–20; dots 14–64 px; members 1–500; counts/section max 64; free plan 1 project.
