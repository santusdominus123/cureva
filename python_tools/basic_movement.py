from djitellopy import Tello
import cv2
import time
import math

def fly_one_full_circle(tello: Tello, speed: int, radius_cm: int, clockwise: bool = True):
    """
    Memerintahkan Tello untuk terbang 1x putaran penuh dengan hidung menghadap pusat.
    Gerakan dimulai dan diakhiri dengan mulus (smooth acceleration/deceleration).
    """
    if radius_cm <= 0 or speed <= 0:
        print("❌ Kecepatan dan Radius harus lebih besar dari nol.")
        return

    circumference_cm = 2 * math.pi * radius_cm
    duration_s = circumference_cm / speed
    
    print(f"🔄 Memulai 1x putaran penuh:")
    print(f"   - Kecepatan: {speed} cm/s, Radius: {radius_cm} cm")
    print(f"   - Estimasi Waktu: {duration_s:.2f} detik")

    angular_velocity_deg = (speed / radius_cm) * (180 / math.pi)
    
    correction_factor = 1.7 
    yaw_speed = int(angular_velocity_deg * correction_factor)

    if yaw_speed > 100: yaw_speed = 100
    
    direction_multiplier = 1 if clockwise else -1
    left_right_target = speed * direction_multiplier
    yaw_target = yaw_speed * (-1 * direction_multiplier)

    print(f"⚙️ Nilai RC Target: Left/Right={left_right_target}, Yaw={yaw_target}")
    
    # === PERBAIKAN: AKSELERASI & DESELERASI MULUS ===
    # Waktu dalam detik untuk fase akselerasi (ramp-up) dan deselerasi (ramp-down).
    ramp_time = 1.6
    
    # Pastikan durasi total cukup untuk melakukan ramp up dan down
    if duration_s < ramp_time * 2:
        print("⚠️ Durasi terlalu singkat untuk akselerasi/deselerasi. Coba radius/speed yang lebih besar.")
        ramp_time = duration_s / 2

    ramp_down_start_time = duration_s - ramp_time
    
    print(f"✈️ Memulai gerakan melingkar (Akselerasi {ramp_time}s, Deselerasi {ramp_time}s)...")
    start_time = time.time()
    while True:
        elapsed_time = time.time() - start_time
        if elapsed_time > duration_s:
            break

        progress = 1.0
        # Tentukan progress untuk akselerasi dan deselerasi
        if elapsed_time < ramp_time:
            # Fase 1: Akselerasi (Ramp-up)
            progress = elapsed_time / ramp_time
        elif elapsed_time > ramp_down_start_time:
            # Fase 3: Deselerasi (Ramp-down)
            progress = (duration_s - elapsed_time) / ramp_time
        # Fase 2 (di antara keduanya): Kecepatan Konstan (progress = 1.0)

        current_left_right = int(left_right_target * progress)
        current_yaw = int(yaw_target * progress)
        
        tello.send_rc_control(current_left_right, 0, 0, current_yaw)
        time.sleep(0.05)

    # PENTING: Hentikan semua gerakan setelah selesai
    print("✅ Gerakan melingkar selesai. Hovering...")
    tello.send_rc_control(0, 0, 0, 0)
    time.sleep(1)


# --- KODE UTAMA ---
# Saya kembalikan nilai speed dan radius ke nilai yang lebih umum,
# Anda bisa mengubahnya kembali ke 20 dan 45 untuk pengujian Anda.
tello = Tello()
tello.connect()

battery_level = tello.get_battery()
print(f"🔋 Baterai: {battery_level}%")

if battery_level < 15:
    print("⚠️ Baterai terlalu lemah untuk terbang! Harap isi daya.")
else:
    tello.streamon()
    frame_read = tello.get_frame_read()

    tello.takeoff()
    time.sleep(3)
    
    print("🚁 Menaikkan ketinggian...")
    tello.move_up(30)
    time.sleep(2)

    try:
        while True:
            img = frame_read.frame
            if img is None:
                continue

            img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

            cv2.putText(img_bgr, "KLIK JENDELA INI, lalu gunakan tombol:", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            cv2.putText(img_bgr, "W/A/S/D: Gerak | Q/E: Putar | R/F: Naik/Turun", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(img_bgr, "C: 1x Putaran Searah Jarum Jam", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(img_bgr, "V: 1x Putaran Berlawanan", (20, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            cv2.putText(img_bgr, "ESC: Mendarat & Keluar", (20, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 1)
            
            cv2.imshow("Tello Control", img_bgr)
            
            key = cv2.waitKey(1) & 0xFF

            if key != -1:
                print(f"Tombol ditekan: '{chr(key)}'")

            if key == 27:
                break
            elif key == ord('w'):
                tello.move_forward(30)
            elif key == ord('s'):
                tello.move_back(30)
            elif key == ord('a'):
                tello.move_left(30)
            elif key == ord('d'):
                tello.move_right(30)
            elif key == ord('e'):
                tello.rotate_clockwise(30)
            elif key == ord('q'):
                tello.rotate_counter_clockwise(30)
            elif key == ord('r'):
                tello.move_up(30)
            elif key == ord('f'):
                tello.move_down(30)
            
            elif key == ord('c'):
                fly_one_full_circle(tello, speed=20, radius_cm=45, clockwise=True)
                
            elif key == ord('v'):
                fly_one_full_circle(tello, speed=30, radius_cm=80, clockwise=False)

    finally:
        print("🛬 Mendarat...")
        tello.send_rc_control(0, 0, 0, 0) 
        time.sleep(1)
        try:
            tello.land()
        except Exception as e:
            print(f"Gagal mendarat (mungkin sudah di darat): {e}")
        
        tello.streamoff()
        cv2.destroyAllWindows()
        print("Program Selesai.")