# 📡 DJI Tello WiFi Hotspot Connection Guide

## 🚁 Langkah-langkah Koneksi ke Tello Drone

### 1️⃣ **Nyalakan Drone Tello**
- Tekan tombol power di drone sampai lampu berkedip
- Tunggu sampai lampu stabil (sekitar 10-15 detik)
- Drone akan membuat WiFi hotspot sendiri

### 2️⃣ **Cari WiFi Tello di Windows**

#### Cara 1: Settings
1. Klik **Start Menu** → **Settings** (⚙️)
2. Pilih **Network & Internet**
3. Klik **WiFi**
4. Klik **Show available networks**
5. Cari network dengan nama: **TELLO-XXXXXX** (X = nomor unik drone Anda)

#### Cara 2: Quick Access (Cepat)
1. Klik icon WiFi di **System Tray** (pojok kanan bawah)
2. Cari network: **TELLO-XXXXXX**
3. Klik **Connect**

### 3️⃣ **Connect ke Tello WiFi**

```
Network Name: TELLO-XXXXXX
Password: (Tidak ada password - Open Network)
```

**PENTING:**
- ✅ WiFi Tello adalah **Open Network** (tidak pakai password)
- ✅ Nama network selalu format: `TELLO-XXXXXX`
- ✅ X adalah 6 digit angka unik untuk setiap drone

### 4️⃣ **Verifikasi Koneksi**

Setelah terkoneksi, cek di Command Prompt:

```bash
# Buka Command Prompt (Win + R, ketik: cmd)
ping 192.168.10.1

# Jika berhasil, akan muncul:
# Reply from 192.168.10.1: bytes=32 time<1ms TTL=64
```

IP Address Tello: `192.168.10.1`

### 5️⃣ **Jalankan Aplikasi**

```bash
python src/python/drone_sam_tracker_windows.py
```

Kemudian klik tombol **"Connect Drone"**

---

## 🔧 Troubleshooting

### ❌ Problem: Tidak Muncul WiFi TELLO-XXXXXX

**Solusi:**
1. ✅ Pastikan drone sudah nyala (lampu berkedip lalu stabil)
2. ✅ Restart drone (matikan, tunggu 5 detik, nyalakan lagi)
3. ✅ Pastikan laptop WiFi aktif
4. ✅ Coba reset WiFi Windows:
   ```bash
   # Buka Command Prompt as Administrator
   netsh wlan show interfaces
   netsh wlan disconnect
   netsh wlan connect name="TELLO-XXXXXX"
   ```

### ❌ Problem: Terkoneksi tapi Aplikasi Gagal Connect

**Solusi:**
1. ✅ Cek IP dengan ping: `ping 192.168.10.1`
2. ✅ Pastikan tidak ada firewall yang block
3. ✅ Disable VPN jika aktif
4. ✅ Close aplikasi lain yang pakai drone (seperti Tello app)

### ❌ Problem: Connection Timeout

**Solusi:**
1. ✅ Pastikan jarak < 10 meter dari drone
2. ✅ Tidak ada obstacle besar antara laptop dan drone
3. ✅ WiFi laptop tidak terhubung ke jaringan lain secara bersamaan
4. ✅ Restart aplikasi dan coba lagi

### ❌ Problem: Video Lag / Patah-patah

**Solusi:**
1. ✅ Tutup aplikasi lain yang menggunakan bandwidth
2. ✅ Pastikan hanya 1 device yang connect ke Tello
3. ✅ Kurangi jarak ke drone (ideal: 3-5 meter)
4. ✅ Hindari area dengan banyak WiFi interference

---

## 📋 Checklist Sebelum Terbang

```
☑️ Drone battery > 50%
☑️ Laptop terkoneksi ke WiFi TELLO-XXXXXX
☑️ Ping 192.168.10.1 berhasil
☑️ Aplikasi sudah running
☑️ SAM model sudah di-load
☑️ Area terbang aman (indoor/outdoor luas)
☑️ Tidak ada orang/hewan di sekitar
```

---

## 🎯 Quick Start Command

Buka PowerShell dan jalankan:

```powershell
# 1. Check WiFi networks
netsh wlan show networks

# 2. Connect to Tello
netsh wlan connect name="TELLO-XXXXXX"

# 3. Verify connection
ping 192.168.10.1

# 4. Run application
cd C:\Users\hengh\Downloads\cureva
python src\python\drone_sam_tracker_windows.py
```

---

## 📱 Alternative: Tello App (Optional)

Jika ingin test drone dulu sebelum pakai aplikasi custom:

1. Download **Tello App** dari:
   - iOS: App Store
   - Android: Google Play Store

2. Connect smartphone ke WiFi TELLO-XXXXXX
3. Buka Tello App
4. Test takeoff/landing

Setelah test OK, disconnect smartphone dan connect laptop.

---

## 🔐 Network Specifications

```
SSID Format: TELLO-XXXXXX
Security: Open (No Password)
IP Address: 192.168.10.1
UDP Port: 8889 (Command)
Video Stream Port: 11111
State Port: 8890
```

---

## ⚠️ SAFETY NOTES

1. ⚠️ **Selalu terbang di area aman**
2. ⚠️ **Jangan terbang dekat orang/hewan**
3. ⚠️ **Indoor: Butuh ruang minimal 3x3 meter**
4. ⚠️ **Outdoor: Hindari angin kencang**
5. ⚠️ **Siap tombol Emergency Stop (E)**
6. ⚠️ **Jangan terbang di atas air**
7. ⚠️ **Battery minimal 20% untuk landing aman**

---

## 🆘 Emergency Procedures

### Jika Drone Tidak Merespon:

1. **Tekan E** di keyboard (Emergency Stop)
2. **Atau klik tombol ⚠️ EMERGENCY STOP**
3. Jika masih tidak respond: **Matikan drone secara manual**

### Jika Aplikasi Freeze:

1. Close aplikasi (Alt + F4)
2. Tunggu 5 detik
3. Buka aplikasi lagi
4. Drone akan auto-landing jika kehilangan koneksi >15 detik

---

## 📞 Support

Jika masih ada masalah:

1. Check Tello SDK Documentation:
   https://dl-cdn.ryzerobotics.com/downloads/Tello/Tello%20SDK%202.0%20User%20Guide.pdf

2. djitellopy GitHub:
   https://github.com/damiafuentes/DJITelloPy

3. Tello Forum:
   https://tellopilots.com/

---

**Happy Flying! 🚁✨**
