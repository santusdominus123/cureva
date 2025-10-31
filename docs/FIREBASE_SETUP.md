# 🔥 Firebase Setup Guide - Fix Google Auth Error

## ❌ Error: `auth/unauthorized-domain`

Error ini muncul saat mencoba login dengan Google karena domain belum diotorisasi di Firebase.

---

## 🔧 Cara Memperbaiki (5 Menit)

### 1️⃣ Buka Firebase Console

1. Pergi ke [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda (Cureva)

### 2️⃣ Tambahkan Authorized Domains

#### **Langkah Detail:**

1. **Di sidebar kiri**, klik **"Authentication"** (ikon kunci)

2. **Klik tab "Settings"** di bagian atas

3. **Scroll ke bawah** ke section **"Authorized domains"**

4. **Klik tombol "Add domain"**

5. **Tambahkan domain berikut satu per satu:**

   ```
   localhost
   ```

   Klik **"Add"**

   Jika menggunakan custom port, tambahkan juga:
   ```
   localhost:5173
   ```

   Untuk production, tambahkan:
   ```
   yourdomain.com
   www.yourdomain.com
   ```

6. **Klik "Save"**

### 3️⃣ Refresh Aplikasi

1. Kembali ke aplikasi Anda
2. Refresh halaman (F5)
3. Coba login dengan Google lagi
4. ✅ Seharusnya sudah berhasil!

---

## 📸 Visual Guide

### Tampilan Firebase Console:

```
Firebase Console
├── Authentication (sidebar)
    ├── Users
    ├── Sign-in method
    └── Settings ⬅️ KLIK INI
        └── Authorized domains
            ├── localhost ✅
            ├── localhost:5173 ✅
            ├── yourdomain.com
            └── [+ Add domain]
```

---

## 🔍 Troubleshooting

### Masih Error Setelah Menambahkan Domain?

1. **Clear Browser Cache:**
   - Chrome: `Ctrl + Shift + Delete`
   - Pilih "Cached images and files"
   - Klik "Clear data"

2. **Coba Incognito/Private Mode:**
   - Chrome: `Ctrl + Shift + N`
   - Test login di incognito window

3. **Periksa Firebase Config:**
   - File: `.env`
   - Pastikan `VITE_FIREBASE_API_KEY` dan config lainnya benar

4. **Restart Dev Server:**
   ```bash
   # Stop server (Ctrl + C)
   npm run dev
   ```

---

## ⚙️ Setup Google Auth di Firebase (Jika Belum)

Jika Google Auth belum aktif:

1. **Firebase Console** → **Authentication**
2. **Tab "Sign-in method"**
3. Cari **"Google"** di list
4. Klik **"Enable"**
5. Isi:
   - **Project support email**: your-email@gmail.com
6. Klik **"Save"**

---

## 🌐 Authorized Domains untuk Production

Ketika deploy ke production, tambahkan domain berikut:

### **Netlify:**
```
your-app.netlify.app
your-custom-domain.com
```

### **Vercel:**
```
your-app.vercel.app
your-custom-domain.com
```

### **Firebase Hosting:**
```
your-project.web.app
your-project.firebaseapp.com
your-custom-domain.com
```

### **Custom Domain:**
```
yourdomain.com
www.yourdomain.com
app.yourdomain.com
```

---

## ✅ Checklist Setup

- [ ] Firebase Console dibuka
- [ ] Authentication → Settings dibuka
- [ ] `localhost` ditambahkan ke Authorized domains
- [ ] `localhost:5173` ditambahkan (jika perlu)
- [ ] Perubahan di-save
- [ ] Browser di-refresh
- [ ] Login Google berhasil ✅

---

## 🚀 Production Checklist

Sebelum deploy ke production:

- [ ] Tambahkan production domain ke Authorized domains
- [ ] Test login di production URL
- [ ] Pastikan `.env.production` sudah benar
- [ ] Test di berbagai browser (Chrome, Firefox, Safari)
- [ ] Test di mobile devices

---

## 📞 Jika Masih Bermasalah

1. **Screenshot error message** lengkap
2. **Cek Firebase Console** apakah ada warning
3. **Cek browser console** untuk error lain
4. **Pastikan internet stabil** (Firebase perlu internet)

---

## 📚 Resources

- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Authorized Domains Docs](https://firebase.google.com/docs/auth/web/auth-domain)
- [Google Sign-In Setup](https://firebase.google.com/docs/auth/web/google-signin)

---

**Status:** 🟡 Menunggu setup di Firebase Console
**ETA:** 5 menit
**Difficulty:** ⭐ Easy

---

## 🎯 Quick Fix Summary

```bash
1. Go to: https://console.firebase.google.com/
2. Select your project
3. Authentication → Settings
4. Authorized domains → Add domain
5. Add: localhost
6. Save & Refresh browser
7. ✅ Done!
```

**Setelah setup, Google Login akan berfungsi dengan sempurna!** 🎉
