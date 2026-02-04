# Polaroid Wall Online

A multi-user photo wall that renders selected Google Photos as polaroids with captions. Users pick photos via the Google Photos Picker, add notes (stored in Supabase), and view walls in grid/curved layouts. Owners can invite editors/viewers and generate share links.

## Stack

- Next.js App Router (TS)
- Supabase Postgres
- Google OAuth + Google Photos Picker API

## How It Works

### Auth
- OAuth flow via Google; we store tokens in `auth_tokens` and a session cookie in `sessions`.
- Required scopes:
  - `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`
  - `https://www.googleapis.com/auth/photoslibrary.readonly` (or `photoslibrary`)

### Picking Photos
1. User creates a collection.
2. User opens the Picker (via `/api/picker/session`).
3. Selected media item IDs are stored in `photos` with the returned `base_url`.

### Rendering Photos
- The wall uses `/api/photos/image/[photoId]` as a proxy to Google media URLs.
- The proxy fetches images using the owner’s access token.
- If a `base_url` expires, the proxy attempts to refresh it via `mediaItems.get`.
- Share links pass `token` to the image proxy for read-only viewing.

### Roles
- **Owner**: full access, manage collaborators, share links.
- **Editor**: add photos, edit captions, hide/remove photos.
- **Viewer**: read-only (UI hides edit/add).

## Supabase Schema (Key Tables)

- `users`: Google user info.
- `sessions`: session cookie + expiry.
- `auth_tokens`: access/refresh tokens.
- `collections`: user collections, wall title/subtitle, layout, share token.
- `photos`: selected media items, captions, hidden flag.
- `collection_members`: collaborators (email + role).

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## Local Dev

```
npm run dev
```
Open `http://localhost:3000`.

## Known Constraints

- Google Photos `base_url` is short-lived. The proxy refreshes it when possible.
- Older photos selected before adding the correct Photos scopes may fail to refresh.
  - If you hit persistent 403s on old photos, remove them and re-pick in the Picker.

## Share Links

- Share links are read-only and use a `share_token`.
- Anyone with the link can view photos and captions for that collection.

## Current Features

- Curved / grid wall layout with persistence.
- Title/subtitle per collection.
- Caption editing (limit 80 chars) + hide/remove.
- Add photos from edit page.
- Remove all photos.
- Share links.
- Collaborators (viewer/editor/owner).
- Settings page + sign out.

## Next Steps Plan

1. **Image refresh hardening**
   - Skip refresh unless image fetch fails.
   - Improve fallback if refresh fails (use cached base_url).
2. **Publishing**
   - Complete Google OAuth verification or keep app in testing and add testers.
3. **Observability**
   - Add basic logging for image proxy failures and picker sessions.
4. **Product**
   - Optional: album-based auto-rotation or scheduled refresh.

## Notes on Google Verification

If you want non-test users to log in, you must publish the OAuth consent screen. While in testing, only tester emails can access the app.
