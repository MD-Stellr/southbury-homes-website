---
name: optimize-asset
description: Optimize an image or video for web use and place it into assets/. Use when the user provides a photo, logo, or video file to add to the Southbury Homes site. Pass the file path as the argument.
---

# Optimize an asset for the site

Input: a path to an image or video (`$ARGUMENTS`). Optimize it for web and place it under `assets/`. Tools available: `sips` and `ffmpeg`/`ffprobe` (macOS).

## Images

First check the source: `sips -g pixelWidth -g pixelHeight -g hasAlpha "<file>"`.

- **Photos (JPEG, no transparency):** resize down to a max width of ~2400px and re-encode:
  ```bash
  sips --resampleWidth 2400 "<src>" --out assets/img/<name>.jpg >/dev/null 2>&1
  sips -s format jpeg -s formatOptions 80 assets/img/<name>.jpg --out assets/img/<name>.jpg >/dev/null 2>&1
  ```
  (Skip the resize if the source is already ≤2400px wide.) Target 200–600 KB.
- **Logos / anything with transparency (`hasAlpha: yes`):** keep PNG, resize to ~1200px wide:
  ```bash
  sips --resampleWidth 1200 "<src>" --out assets/img/<name>.png >/dev/null 2>&1
  ```

## Videos

Probe first: `ffprobe -v error -show_entries stream=codec_type,width,height,duration -of default=noprint_wrappers=1 "<file>"`.

Transcode for web — strip audio (the hero is muted), cap at 1080p, fast-start:

```bash
ffmpeg -y -i "<src>" -an -vf "scale='min(1920,iw)':-2:flags=lanczos" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 -preset slow \
  -movflags +faststart assets/video/<name>.mp4
```

Target a few MB. To trim, add `-ss <start> -t <seconds>` before `-i`. Aim for a single continuous shot when it will loop.

**If this video becomes the hero**, regenerate the poster so it matches the first frame:

```bash
ffmpeg -y -i assets/video/hero.mp4 -frames:v 1 -q:v 2 assets/img/hero.jpg
```

## Verify

- Confirm the output is a valid file: `file "<path>"` and check the size is sane (not a tiny error page).
- For images, `Read` the file to confirm it looks right before wiring it into `index.html`.
- After placing, update the relevant `src=""` in `index.html` if the filename changed.
