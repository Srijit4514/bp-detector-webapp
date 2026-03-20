# rPPG Heart Rate Monitor

A browser-based heart rate monitor that uses remote photoplethysmography (rPPG) to estimate BPM from a user's webcam.

## Features
- Real-time face detection and tracking (MediaPipe FaceMesh)
- ROI (Region of Interest) extraction from forehead and cheeks
- POS (Plane-Orthogonal-to-Skin) rPPG algorithm
- FFT-based BPM estimation
- Pulse waveform visualization

## How it works
The system analyzes subtle color variations in the skin caused by the cardiac cycle. By extracting the average RGB values from specific facial regions and applying the POS algorithm, we can isolate the pulse signal and estimate the heart rate in real-time.

## Deployment to Vercel

You can easily deploy this application to Vercel:

### Method 1: Vercel Dashboard (Recommended)
1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
3. Click "New Project".
4. Import your repository.
5. Vercel will automatically detect Vite. Ensure the build command is `npm run build` and the output directory is `dist`.
6. Click "Deploy".

### Method 2: Vercel CLI
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in the project root.
3. Follow the prompts to link your account and deploy.

**Note:** The application requires HTTPS to access the webcam, which Vercel provides by default.

## Development
```bash
npm install
npm run dev
```
