# FarmFlow Project Style Guide

## 📱 PWA & Mobile Optimization

### **1. PWA Deployment (iPhone/Android)**
- **Icons**: Always provide `icon-192.png` and `icon-512.png` in the `public/` directory.
- **Manifest**: Managed via `vite-plugin-pwa` in `vite.config.ts`. 
- **iOS Meta Tags**: Ensure `apple-mobile-web-app-capable` is set to `yes` in `index.html`.
- **Theme Color**: Use FarmFlow Green (`#22c55e`) for the PWA theme and status bar.

### **2. Mobile Ergonomics (iPhone)**
- **Safe Areas**: Use `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to avoid content being cut off by the iPhone notch or home bar.
- **Touch Targets**: All buttons and interactive elements must have a minimum size of 44x44px for accessibility.
- **Status Bar**: Set to `black-translucent` to allow the background/header to bleed into the status bar area.

### **3. Data Resilience & Offline Support**
- **Local Storage**: Use `localStorage` or `IndexedDB` for high-performance offline persistence.
- **Feature Detection**: Services (like Grain Movement or Activity Logging) must check for browser capabilities before attempting to use storage.
- **Service Workers**: Automatically managed by the Vite PWA plugin for "Automatic Update" behavior.

---

## 🎨 UI & Aesthetics
- **Theme**: Dark Mode by default.
- **Typography**: Inter (Google Fonts).
- **Icons**: Lucide React.
- **Visuals**: Modern, high-glare visibility for outdoor agricultural use.
