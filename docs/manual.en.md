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
| Header | Song title, BPM / grid / dots / members, Play, Copy, Paste, Undo, **Share**, **ASK AI** |
| Center | Stage (BACK / AUDIENCE labels). **Tool** button top-right (drawing tools) |
| Bottom | Timeline (section tabs + counts) |
| Sidebar | Search, **+ New project**, **Folder**, project list (Bookmarks / Folders / Other), **Music** / **Reference videos**, My page (avatar) |

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
- Deleting account removes cloud data; active Pro subscription is canceled (see dialog)
- To cancel Pro only, use **Manage subscription** (Stripe portal)

### 3.4 My page
- **← Back** to return to the editor
- Display name, email (read-only), **language** (English / 日本語)
- Avatar: choose / remove image
- Plan: Free (1 project) or Pro (unlimited). Upgrade card on free plan
- **Manage subscription** (Pro) … opens Stripe Customer Portal (cancel, payment method). No in-app cancel button
- Project list (read-only, **in use** badge)

---

## 4. Projects (sidebar)

### 4.1 Open / close
- **≡** top-left opens sidebar; backdrop or **Close** (×) closes it.

### 4.2 Toolbar (search · new · folder)
Grouped at the top of the sidebar:

| Item | Action |
|------|--------|
| **Search…** | Filter by project or folder name. Matching a folder shows all projects inside it |
| **+ New project** | Create dialog (title, BPM, members, counts per section) |
| **Folder** | Add a new folder (default name: “New folder”) |

Drag reorder is disabled while searching.

### 4.3 List layout
The list is split into blocks (with dividers):

1. **Bookmarks** … starred projects and starred folders (with their contents)
2. **Folders** … each folder and its projects
3. **Other** … projects not in any folder

### 4.4 Switch / create
1. **Click** a project row to switch (no switch toast)
2. **+ New project** → title, BPM, members, counts → **Create**
3. New projects include default sections (Intro, Verse, Chorus, etc.)

### 4.5 Rename project
- **Sidebar** … **double-click** the project name → underline input → **Enter** or blur to save, **Escape** to cancel
- **Header** … edit the song title field for the open project (auto-save)

### 4.6 Reorder
- With 2+ projects and an empty search box, **drag** rows to reorder

### 4.7 Folders
- **Folder** button adds a folder. **Click** folder name to rename
- **▸ / ▾** collapse / expand
- **Drag** a project onto a folder header to move it into that folder
- **Remove from folder** … drag to the **Other** section (header or empty area)
- Dropping onto a project row in **Other** also removes the dragged project from its folder
- **×** on folder header deletes the folder only (projects move to **Other**; projects are not deleted)
- **☆** left of × bookmarks the folder

### 4.8 Bookmarks
- **☆** on each project row (left of ×) toggles bookmark
- Bookmarked projects and folders also appear under **Bookmarks** (they remain in their usual place too)

### 4.9 Delete
- **×** on project row or folder header → confirm → delete
- Deleting the last project shows the empty-state prompt
- **Last saved** timestamp on each row

### 4.10 Plans
- **Free**: 1 project
- **Pro** (¥500/month): unlimited projects
- Creating a 2nd project opens **Upgrade to Pro** → **Subscribe with Stripe**
- **Cloud sync** when logged in applies to **both** Free and Pro (not Pro-only)

---

## 5. Header tools

### 5.1 Song title — editable in header

### 5.2 BPM — 40–240

### 5.3 Grid — **W** / **D**, each 1–20; 0 = center

### 5.4 Dot size — **Dots** field, 14–64 px (Enter or blur)

### 5.5 Members — **Members** button → member panel (§7)

### 5.6 Action buttons (English labels)
- **Play**, **Copy**, **Paste**, **Undo**
- **Share** … share dialog (left of ASK AI)
- **ASK AI** … help chat (? icon; border matches Members button)

**View-only mode** (share link or preview): **Share** and **ASK AI** are unavailable.

---

## 6. Stage

### 6.1 Members & navigation
- **Drag** members (grid snap); ~8px threshold separates click vs drag
- **Click** select; **Escape** deselect
- **Delete** with member selected → hide on current count only
- Navigate via timeline, section tabs, **← →** / **[ ]**
- **Resize handles** on hover (right / bottom / corner)
- Playback: touching member pauses; hidden members still animate (invisible)
- Labels: BACK, AUDIENCE, STAGE LEFT, STAGE RIGHT

### 6.2 Stage drawing tools (arrow · × · pen)

Use the **Tool** button (pen icon + “Tool” label) at the top-right of the stage to add arrows, × marks, and pen strokes on the **current count**. Drawings are stored per count and change when you switch counts.

#### Open / close
1. Click **Tool** on the stage → floating toolbar appears inside the stage (top-right)
2. Close with toolbar **×** or click **Tool** again
3. **Tool** is disabled during playback

#### Tools (icons only)
| Icon | Action |
|------|--------|
| Arrow | Drag from start to end |
| × | Click to place |
| Pen | Drag to draw freehand (each stroke is separate; draw as many as you like) |

Click the same tool again to return to member-move mode.

#### Color
- Pick a color from the **swatches** at the bottom of the toolbar
- New strokes use the selected color

#### Select · move · resize · delete
- With the toolbar open and **pen off**, click an existing drawing to select it
- **Drag center** … move
- **Drag arrow ends** / **× tips** … resize
- **Trash** in the toolbar … delete selected drawing
- While **pen** is on, drawing takes priority; turn pen off to select or delete other drawings

#### Members vs drawings
- With the toolbar closed or draw tools off, drag members as usual
- Drawings are **not** covered by **Undo** (use the trash button)

#### View-only
- **Tool** and drawing tools are **hidden** in view-only mode (share link / preview)

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

| Key | Action |
|------|--------|
| Space | Play / pause |
| ← → or [ ] | Previous / next count |
| Delete / Backspace | Member selected: hide on current count / else: delete count |
| ⌘C / Ctrl+C | Copy formation |
| ⌘V / Ctrl+V | Paste formation |
| ⌘Z / Ctrl+Z | Undo |
| Escape | Deselect, close ×, close panels, stop playback |

Some shortcuts are disabled while typing in a field.

---

## 12. Share

### 12.1 Create link
1. Click **Share** in the header
2. Dialog opens and creates a link automatically (**Creating link…**)
3. If you have multiple projects:
   - **Folder** … filter by **All songs**, **Uncategorized**, or a folder
   - **Project to share** … pick which song to share from the filtered list
4. **Copy**, or send via **LINE**, **X**, **Mail**, or **Copy link**

There is no share button on folder rows in the sidebar — always use the **Share** dialog.

### 12.2 What is shared
- Formation (positions, sections, counts)
- **Stage drawings** (arrows, × marks, pen strokes per count)
- Music / video **links** (metadata)
- Uploaded **local files** may be omitted from the link

### 12.3 Preview
- **Preview in view mode** in the dialog (uses the selected project)
- **Exit view mode** in the header during preview
- **ASK AI** is unavailable during preview

### 12.4 Share link visitors
- View-only, no login
- No edit, **Share**, **ASK AI**, or member changes
- **No exit button** back to the editor

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
- **Escape** closes the panel

**Unavailable in view-only mode** (external share links and Share dialog preview).

---

## 15. Toasts

Brief feedback: project create/delete, copy/paste, undo, media added, share errors, etc.

No toast when switching projects.

---

## 16. View-only summary

| Context | Edit | Share | ASK AI | Exit |
|---------|------|-------|--------|------|
| External share link | No | No | No | No exit button |
| Share preview | No | No | No | **Exit view mode** |

Stage **Tool** / drawing tools are also unavailable in view-only mode.

---

## 17. Limits

BPM 40–240; grid 1–20; dots 14–64 px; members 1–500; counts/section max 64; free plan 1 project.
