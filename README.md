# STARK // EDITH CLOUD — Futuristic 3D Personal Cloud Desktop

A secure personal cloud storage web application inspired by **Iron Man** and **Spider-Man**. Built with Next.js, TypeScript, and a Vanilla CSS holographic design system.

---

## 🌟 Key Features

### 1. Main Website & Secure Holographic Login
- **Biometric / Holographic Login Screen**: Stark Industries & EDITH inspired HUD interface with light-blue and cyan neon glowing accents.
- **Server-Side Authentication**: Protected with secure HTTP-only cookies (`cloud_desktop_session`), signed JWTs, and server-side credential verification.
- **Vercel-Managed Password**: Set your password directly in Vercel environment variables without touching code.
- **Private Access**: Strictly private account with no public registration page.
- **Protected Desktop**: All endpoints and views require authentication.

### 2. Real Cloud File Storage & Pluggable Architecture
Supports three storage backends out-of-the-box:
1. **Supabase Storage**: Private bucket storage with signed download URLs.
2. **Cloudflare R2 / AWS S3**: High-performance S3-compatible cloud object storage.
3. **Local Disk Storage**: Instant zero-config local persistence for offline development and testing.

### 3. Main Desktop Interface
- Floating 3D folder icons with mouse-tracking tilt effects:
  - 📁 Documents
  - 🖼️ Photos
  - 🎬 Videos
  - 🎵 Music
  - 📥 Downloads
  - 📦 Other Files
  - 🕒 Recently Uploaded
  - ⭐ Favourites
  - 🗑️ Trash
- Top HUD Telemetry Header displaying live system clock, hardware telemetry, storage gauge, and quick settings.
- Floating Taskbar / Dock with app launchers and running window indicators.

### 4. Complete File Explorer Functionality
- **Folder Management**: Nested custom folder hierarchy, create folders, rename, delete to Trash.
- **Multi-File Uploads**: Drag-and-drop onto the desktop or explorer window with progress feedback.
- **ZIP Archiving**: Download any entire folder and subfolders as a consolidated ZIP file.
- **Search & Sort**: Instant name search and sorting by Name, Date, Size, or File Type.
- **Rich Media Previews**:
  - **Photos**: High-resolution viewer with zoom, rotate, and reset.
  - **Videos**: Floating cinematic HUD video player with seek bar, volume, playback speed, and fullscreen.
  - **Music**: Stark audio player with dynamic animated frequency equalizer waveform.
  - **Documents**: Embedded PDF reader, code/text viewer with clipboard copy.
- **File Inspector**: Detailed metadata modal with MIME classification and storage provider verification.

### 5. Live Wallpaper Gallery (4 Built-in Dynamic Canvas Shaders)
1. **Spider-Man City Swing**: Animated twilight skyscraper skyline, rotating searchlight beams, web trajectory lines, and hero swinging silhouette.
2. **Spider-Man Rescue**: Atmospheric slow-motion rain streaks, warm golden sunset embers, and electric cyan shockwave pulses.
3. **Blue Hologram**: Floating cyan matrix particles with glowing interconnecting constellation links, rotating wireframes, and laser scanlines.
4. **Arc Reactor**: Tony Stark Mark Arc Reactor with rotating copper magnetic coils, palladium core, and blue plasma energy pulses.
- **Custom Live Wallpaper Upload**: Upload your own MP4 or WebM video wallpaper; automatically loops and pauses when the browser tab is hidden to conserve battery!

### 6. Custom Hologram Controls
- **Hologram Opacity Slider (0% - 100%)**: Adjust HUD grid, telemetry lines, and scanlines from fully invisible to prominent.
- **Hologram Amount Slider (0% - 100%)**: Dynamically scales the density of floating particles, rotating digital rings, and telemetry coordinates.
- **Real-Time Visual Response**: Sliders update CSS variables instantly.
- **Device Sync**: Preferences persist to your cloud account across devices.

### 7. Desktop Personalization & Color Matrix
- **Jarvis Cyan Hologram**: Pure Iron Man electric cyan and light-blue HUD accents.
- **Spider-Man Final Suit**: Iconic suit styling featuring vibrant spider-red, neon web-blue, and gold highlights.
- **Stark Arc Plasma**: Deep cobalt blue with warm palladium arc core glow and golden energy circuitry.
- **EDITH Stealth Tactical**: Slate dark mode with ice blue and cybernetic emerald telemetry accents.
- **Luminescence (Brightness) Slider**: Adjust wallpaper background brightness (20% - 100%).

### 8. Storage Management Dashboard
- Real-time analytics displaying total capacity, storage used, remaining space, and percentage used.
- Multi-segmented storage gauge and breakdown across Photos, Videos, Documents, Music, Downloads, Other, and Trash.

---

## 🚀 Getting Started

### 1. Installation & Local Development
```bash
# Clone or navigate to the directory
cd NOLogin

# Install dependencies
npm install

# Start development server
npm run dev
# Or build and run production server:
npm run build
npm run start -- -p 3005
```

The app is running at `http://localhost:3005`.

### 2. Default Login Credentials
- **Username**: `admin`
- **Password**: `stark2026!`

---

## 🔒 Vercel Deployment & Environment Settings

To deploy to Vercel and customize your credentials or cloud storage provider, add these Environment Variables in your **Vercel Project Settings**:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ADMIN_USERNAME` | Admin account username | `admin` |
| `ADMIN_PASSWORD` | Secure personal password | `stark2026!` |
| `SESSION_SECRET` | Secret key for signing session tokens | `auto-generated` |
| `STORAGE_CAPACITY_GB` | Total storage capacity limit in GB | `15` |
| `STORAGE_PROVIDER` | `auto`, `supabase`, `r2`, or `local` | `auto` |

### Connecting Supabase Storage
1. Create a project at [supabase.com](https://supabase.com).
2. Create a private bucket named `personal-cloud`.
3. Add these variables in Vercel:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_BUCKET=personal-cloud
   ```

### Connecting Cloudflare R2 / AWS S3
1. Create an R2 bucket in Cloudflare dashboard.
2. Add these variables in Vercel:
   ```env
   S3_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY_ID=your_access_key_id
   S3_SECRET_ACCESS_KEY=your_secret_access_key
   S3_BUCKET_NAME=personal-cloud
   ```
