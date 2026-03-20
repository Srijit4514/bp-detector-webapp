export interface SignalPoint {
  r: number;
  g: number;
  b: number;
  timestamp: number;
}

/**
 * POS (Plane-Orthogonal-to-Skin) algorithm implementation
 * Based on: "Robust Pulse Rate From Facial Video Using a Plane-Orthogonal-to-Skin (POS) Algorithm"
 * @param window The buffer of RGB values
 */
export function pos(window: SignalPoint[]): number[] {
  const n = window.length;
  if (n < 2) return [];

  const r = window.map(p => p.r);
  const g = window.map(p => p.g);
  const b = window.map(p => p.b);

  // 1. Calculate mean for each channel
  const rMean = r.reduce((a, b) => a + b, 0) / n;
  const gMean = g.reduce((a, b) => a + b, 0) / n;
  const bMean = b.reduce((a, b) => a + b, 0) / n;

  // 2. Normalize
  const rNorm = r.map(v => v / rMean);
  const gNorm = g.map(v => v / gMean);
  const bNorm = b.map(v => v / bMean);

  // 3. Define the POS projection matrix components
  // S = [rNorm; gNorm; bNorm]
  // Projection axes:
  // P1 = [0, 1, -1]
  // P2 = [-2, 1, 1]

  const X = gNorm.map((gv, i) => gv - bNorm[i]);
  const Y = rNorm.map((rv, i) => rv * -2 + gNorm[i] + bNorm[i]);

  // 4. Alpha (dynamic ratio of standard deviations)
  const stdX = Math.sqrt(X.map(v => v * v).reduce((a, b) => a + b, 0) / n);
  const stdY = Math.sqrt(Y.map(v => v * v).reduce((a, b) => a + b, 0) / n);

  const alpha = stdX / stdY;

  // 5. Final signal
  return X.map((xv, i) => xv + alpha * Y[i]);
}

/**
 * Simple Bandpass Filter (Recursive ButterWorth approach or just Frequency domain filtering)
 * For simplicity in JS, frequency domain filtering after FFT or a simple moving average detrending.
 */
export function bandpassFilter(signal: number[], fs: number, low: number, high: number): number[] {
  const n = signal.length;
  const fft = computeFFT(signal);

  for (let i = 0; i < fft.length; i++) {
    const freq = (i * fs) / fft.length;
    if (freq < low || freq > high) {
      fft[i] = { re: 0, im: 0 };
    }
  }

  // Inverse FFT
  const ifft = computeIFFT(fft);
  return ifft.map(c => c.re).slice(0, n);
}

function computeIFFT(input: { re: number; im: number }[]): { re: number; im: number }[] {
  const n = input.length;
  const data = input.map(c => ({ re: c.re, im: -c.im }));
  fftInPlace(data);
  return data.map(c => ({ re: c.re / n, im: -c.im / n }));
}

/**
 * FFT implementation for BPM estimation
 */
export function estimateBPM(signal: number[], fs: number): { bpm: number; confidence: number } {
  const n = signal.length;
  if (n < fs * 2) return { bpm: 0, confidence: 0 }; // Need at least 2 seconds

  // Apply Hanning window
  const windowed = signal.map((v, i) => v * (0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)))));

  // Simple DFT (Since we don't have a complex FFT library yet)
  // For better performance, we should use a library like 'fft.js' or implement Cooley-Tukey
  // Given the small window (~256-512 samples), DFT is okay-ish but FFT is better.

  // Let's implement a basic FFT for real-time performance.
  const fft = computeFFT(windowed);
  const magnitudes = fft.map(c => Math.sqrt(c.re * c.re + c.im * c.im));

  const lowIdx = Math.floor((0.7 * n) / fs); // 42 BPM
  const highIdx = Math.ceil((4.0 * n) / fs); // 240 BPM

  let maxMag = 0;
  let maxIdx = 0;

  for (let i = lowIdx; i <= highIdx && i < n / 2; i++) {
    if (magnitudes[i] > maxMag) {
      maxMag = magnitudes[i];
      maxIdx = i;
    }
  }

  const bpm = (maxIdx * fs * 60) / n;

  // Simple confidence: ratio of peak to mean magnitude in heart rate range
  let sumMag = 0;
  for (let i = lowIdx; i <= highIdx && i < n / 2; i++) {
    sumMag += magnitudes[i];
  }
  const meanMag = sumMag / (highIdx - lowIdx + 1);
  const confidence = maxMag / meanMag;

  return { bpm, confidence };
}

function computeFFT(input: number[]): { re: number; im: number }[] {
  const n = input.length;
  // If n is not power of 2, pad or use DFT
  // For simplicity here, let's use DFT as a fallback or just assume it's small enough.
  // Actually, let's do a power-of-2 FFT if possible.

  const m = Math.pow(2, Math.ceil(Math.log2(n)));
  const data = new Array(m).fill(0).map((_, i) => ({ re: i < n ? input[i] : 0, im: 0 }));

  fftInPlace(data);
  return data;
}

function fftInPlace(data: { re: number; im: number }[]) {
  const n = data.length;
  if (n <= 1) return;

  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [data[i], data[j]] = [data[j], data[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (2 * Math.PI) / len;
    const wlen = { re: Math.cos(ang), im: -Math.sin(ang) };
    for (let i = 0; i < n; i += len) {
      let w = { re: 1, im: 0 };
      for (let j = 0; j < len / 2; j++) {
        const u = data[i + j];
        const v = {
          re: data[i + j + len / 2].re * w.re - data[i + j + len / 2].im * w.im,
          im: data[i + j + len / 2].re * w.im + data[i + j + len / 2].im * w.re
        };
        data[i + j] = { re: u.re + v.re, im: u.im + v.im };
        data[i + j + len / 2] = { re: u.re - v.re, im: u.im - v.im };
        const nextW = {
          re: w.re * wlen.re - w.im * wlen.im,
          im: w.re * wlen.im + w.im * wlen.re
        };
        w = nextW;
      }
    }
  }
}
