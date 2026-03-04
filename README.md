# 🎵 BeatForge Studio

**Professional Music Production for Android**

BeatForge Studio is a full-featured digital audio workstation (DAW) for Android that lets you create, compose, and mix professional music right on your phone or tablet. Built with synthesized instruments using the Web Audio API — no samples needed!

---

## ✨ Features

### 🥁 Instruments
- **14 Drum Instruments**: Kick, Snare, Hi-Hat (Open & Closed), Clap, 3 Tom variants, Crash, Ride, Rim, Percussion, Shaker, Cowbell — all synthesized from scratch
- **8 Synth Instruments**: Piano, Electric Piano (FM synthesis), Bass Synth, Lead Synth, Pad, Strings, Pluck
- **✨ Nebula Synth** — A unique custom instrument that uses 8 detuned oscillators with independent LFO modulation, shimmer layers, and noise textures to create ethereal, evolving cosmic soundscapes. Every note sounds slightly different!

### 🎚️ Step Sequencer
- 16 or 32 step grid
- Per-track volume and mute controls
- Visual step highlighting during playback
- Click track labels to preview sounds
- Swing control for humanized feel

### 🎹 Multiple Views
- **Sequencer** — Grid-based step sequencer for all instruments
- **Pads** — 4×4 trigger pads with 4 sound banks (Drums, Bass, Synth, Nebula)
- **Keys** — Virtual piano keyboard with 3 octaves, any synth instrument
- **Mixer** — Full channel strip mixer with faders, pan, mute, solo, and meters

### 🎛️ Effects & Processing
- **Reverb** — Convolution reverb with adjustable mix
- **Delay** — Tempo-synced delay with feedback
- **Distortion** — Waveshaper distortion
- **Filter** — Low-pass filter with resonance control
- **Master Compressor & Limiter** — Professional mastering chain

### 📦 Pre-built Patterns
12 genre-specific beat patterns to get you started:
- Hip-Hop: Boom Bap, Trap, Lo-Fi Chill
- Electronic: House, Techno, Dubstep, Drum & Bass, Trance
- World: Reggaeton, Afrobeats
- Other: Rock, Jazz Swing

### 💾 Export
- Export your tracks as **WAV** files
- Choose number of loop repetitions (1-32)
- Custom filename support
- Share directly from the app

---

## 🏗️ Build Instructions

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 17
- Android SDK (API 34)

### Build
```bash
# Clone the repository
git clone https://github.com/Aboss3b13/music-app.git
cd music-app

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease
```

The APK will be at `app/build/outputs/apk/debug/app-debug.apk`

### Automated Builds
GitHub Actions automatically builds the APK on every push. Download the latest from the **Releases** page or **Actions** artifacts.

---

## 🎨 Design

- Dark studio theme with neon cyan and purple accents
- Responsive layout that works on phones and tablets
- Full-screen immersive mode
- Animated waveform and spectrum visualizers
- Smooth, touch-optimized controls

---

## 🔧 Tech Stack

- **Android** (Kotlin) — Native Android wrapper with WebView
- **Web Audio API** — Real-time audio synthesis and processing
- **JavaScript** — Application logic and UI
- **HTML5/CSS3** — Responsive interface with CSS Grid & Flexbox

---

## 📱 Requirements

- Android 8.0 (API 26) or higher
- ~10 MB storage

---

## 🎹 Keyboard Shortcuts (when using a physical keyboard)

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `Escape` | Stop |
| `A-J` | Play white keys (Piano view) |
| `W,E,T,Y,U` | Play black keys (Piano view) |
| `1-4, Q-R, A-F, Z-V` | Trigger pads (Pad view) |

---

## 📄 License

MIT License — Feel free to use, modify, and distribute.

---

*Made with ❤️ and Web Audio API*
