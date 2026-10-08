# 👑 GlowVAI Enterprise Admin Console (GitHub Pages Ready)

This directory (`/docs`) contains the complete, production-ready, standalone **GlowVAI Multi-Vendor Admin Console**.

---

## 🚀 Instant 1-Click GitHub Pages Hosting

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: glowvai dark store vendor app & firebase admin portal"
   git push origin main
   ```
2. On GitHub, navigate to your repository **Settings**:
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select Branch: **`main`** and Folder: **`/docs`**.
   - Click **Save**.
3. Your admin console is immediately live at:  
   `https://<your-github-username>.github.io/<your-repo-name>/`

---

## ⚡ Direct Firebase Real-Time Synchronization

The admin panel integrates directly with your active Firebase project (**`glowvai-v2`**):
- **Firebase Database URL**: `https://glowvai-v2-default-rtdb.firebaseio.com`
- **Firestore Project**: `glowvai-v2`

### Key Capabilities
- **Multi-Vendor Dossiers**: Real-time list of all onboarded dark stores (`VND-001`, `VND-002`, `VND-003`, etc.) with duty toggle (`🟢 ON DUTY` / `🔴 PAUSED`), KYC status, and phone numbers.
- **Individual Vendor Stock Matrix**: Filter the entire catalog to see products, SKUs, and stock quantities input by any specific vendor.
- **Live Stock Steppers**: Increment/decrement `[−] qty [+]` directly from the admin table with instant real-time sync across the vendor mobile app.
- **Live Orders Stream**: Orders queue with automatic 12% platform take-rate / 88% vendor net payout calculation.
- **Simulate Quick-Commerce Order**: 1-tap dispatch to trigger loud sound alerts and incoming popups on the vendor app.
- **Export Database JSON**: 1-click backup of all vendors, stock levels, and order history.
