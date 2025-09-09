# store.py
import threading
import re
import serial
import webview

PORT = "/dev/ttyUSB1"
BAUDRATE = 115200

UID_USER  = "37:4A:B6:3B".upper()
UID_ADMIN = "B3:5C:BD:AB".upper()

BASE = "http://127.0.0.1:3000"
URL_USER  = f"{BASE}/"
URL_ADMIN = f"{BASE}/admin"

window = None
stop_flag = False

def on_closing():
    return False

import re
UID_RE = re.compile(r'^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){3,}$')
EAN_RE = re.compile(r'^\d{6,20}$')

def extract_uid(line: str):
    line = line.strip()
    if line.startswith("UID:"):
        uid_part = line.split("|")[0].replace("UID:", "").strip()
        return uid_part.upper()
    if UID_RE.match(line):
        return line.upper()
    return None

def extract_barcode(line: str):
    s = line.strip()
    s = s.removeprefix("BC:").removeprefix("BARCODE:").strip()
    if EAN_RE.match(s):
        return s
    return None

def go_role(role: str, next_url: str):
    role = role.lower()
    url = f"{BASE}/auth/set-role?role={role}&next={next_url}"
    window.load_url(url)

def handle_uid(uid: str):
    u = uid.upper()
    print("RFID:", u)
    if u == UID_ADMIN:
        print("→ ADMIN")
        go_role("admin", URL_ADMIN)
    elif u == UID_USER:
        print("→ USER")
        go_role("user", URL_USER)
    else:
        print("→ unbekannte UID (keine Navigation)")

def handle_barcode(code: str):
    print("BARCODE:", code)
    window.load_url(f"{BASE}/item/{code}")

def serial_worker():
    global stop_flag
    try:
        with serial.Serial(PORT, BAUDRATE, timeout=1) as ser:
            print(f"[Serial] Listening on {PORT} @ {BAUDRATE} ...")
            while not stop_flag:
                raw = ser.readline().decode(errors="ignore").strip()
                if not raw:
                    continue
                uid = extract_uid(raw)
                if uid:
                    handle_uid(uid); continue
                barcode = extract_barcode(raw)
                if barcode:
                    handle_barcode(barcode); continue
    except serial.SerialException as e:
        print("[Serial] Fehler:", e)

def on_ready():
    print("huhu")
    try:
        # Qt nativ maximieren
        if hasattr(window, 'gui') and window.gui:
            window.gui.showMaximized()
    except Exception:
        pass

def fill_available_screen():
    try:
        if hasattr(window, 'gui') and window.gui:
            screen = window.gui.screen()
            geo = screen.availableGeometry()   # QRect
            window.gui.setGeometry(geo)        # Position + Größe in einem Rutsch
    except Exception:
        pass

def resize_and_move():
    try:
        window.resize(1080, 800)
        window.move(0, 0)
    except Exception:
        pass


def start_app():
    global window, stop_flag
    window = webview.create_window(
        "Kiosk",
        URL_USER,
        fullscreen=True,
        frameless=True,
        easy_drag=False,
        confirm_close=True
    )
    window.events.closing += on_closing
    window.events.shown += on_ready   # Backup-Haken nach dem Anzeigen
    window.events.shown += fill_available_screen
    window.events.shown += resize_and_move

    t = threading.Thread(target=serial_worker, daemon=True)
    t.start()

    try:
        # on_ready wird im UI-Thread aufgerufen – hier Fullscreen erzwingen
        webview.start(on_ready, window, gui='qt')
    finally:
        stop_flag = True

if __name__ == '__main__':
    start_app()

