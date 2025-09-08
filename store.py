#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
store.py – pywebview + serielle Geräte (RFID, Barcode, LED-Anzeige)
- Lädt je nach RFID-Tag unterschiedliche Frontend-Seiten
- Ruft bei Barcode-Scan eine JS-Routine im Frontend auf
- Frontend kann per window.pywebview.api.* Python-Funktionen auslösen
"""

import threading
import json
import time
import pathlib
import sys
from typing import Optional

import webview
import serial  # pip install pyserial
from serial.serialutil import SerialException


# ------------------------------------------------------------
# Einstellungen
# ------------------------------------------------------------

BASE = pathlib.Path(__file__).resolve().parent
ASSETS = BASE / "frontend"  # enthält index.html, lager.html, admin.html, ...

# Serielle Ports anpassen (udev-Symlinks sind ideal, z. B. /dev/rfid0)
RFID_PORT = "/dev/ttyUSB0"
RFID_BAUD = 9600

BARCODE_PORT = "/dev/ttyUSB1"
BARCODE_BAUD = 115200

LED_PORT: Optional[str] = None        # z. B. "/dev/ttyUSB2" wenn vorhanden
LED_BAUD: int = 9600

# RFID-Tag → Zielseite
RFID_ROUTING = {
    "04A1B2C3D4": "lager.html",
    "3020FF99AB": "admin.html",
}
DEFAULT_PAGE = "unknown.html"          # falls Tag nicht gemappt ist

# ------------------------------------------------------------
# Hilfsfunktionen
# ------------------------------------------------------------

def open_serial(port: str, baud: int, timeout: float = 0.2) -> Optional[serial.Serial]:
    try:
        return serial.Serial(port, baudrate=baud, timeout=timeout)
    except SerialException as e:
        print(f"[WARN] Konnte {port} nicht öffnen ({e}). Versuche später erneut ...")
        return None


def reopen_loop(getter, setter, port, baud, name):
    """
    Hält eine serielle Verbindung am Leben. Falls getrennt, wird periodisch neu versucht.
    getter(): -> Optional[Serial]
    setter(Serial|None)
    """
    while True:
        ser = getter()
        if ser is None or not ser.is_open:
            ser = open_serial(port, baud)
            setter(ser)
            time.sleep(1.0)
        else:
            time.sleep(5.0)


def read_lines(ser: serial.Serial, terminators=(b"\n", b"\r")):
    """
    Generator: liest zeilenartig von einem Serialport. Akzeptiert \n oder \r.
    """
    buf = bytearray()
    while True:
        chunk = ser.read(64)
        if chunk:
            buf.extend(chunk)
            # Suche das erste Terminator-Zeichen
            pos = min([buf.find(t) for t in terminators if buf.find(t) != -1] or [-1])
            if pos != -1:
                line = bytes(buf[:pos])
                # Rest behalten (inkl. evtl. zweites Terminator-Zeichen entfernen)
                rest = buf[pos + 1:]
                buf.clear()
                buf.extend(rest)
                yield line
        else:
            # kleines Nickerchen, um CPU zu schonen
            time.sleep(0.01)

# ------------------------------------------------------------
# pywebview API
# ------------------------------------------------------------

class Api:
    """
    Methoden dieser Klasse sind im Frontend via window.pywebview.api.* erreichbar.
    """
    def __init__(self, window: webview.Window):
        self.window = window
        self._led_ser: Optional[serial.Serial] = None

    # Setter wird von der LED-Reconnect-Schleife verwendet
    def _set_led_serial(self, s: Optional[serial.Serial]):
        self._led_ser = s
        if s:
            print("[INFO] LED-Serial geöffnet:", s.port)

    def _get_led_serial(self) -> Optional[serial.Serial]:
        return self._led_ser

    def show_on_led(self, text: str):
        """
        Beispiel: Text auf einer LED-Anzeige ausgeben (wenn LED_PORT definiert).
        """
        print(f"[API] LED anzeigen: {text!r}")
        if LED_PORT is None:
            return {"ok": False, "error": "LED_PORT nicht konfiguriert"}
        ser = self._get_led_serial()
        if ser is None or not ser.is_open:
            return {"ok": False, "error": "LED-Serial nicht verfügbar"}
        try:
            ser.write((text + "\r\n").encode("utf-8", errors="ignore"))
            ser.flush()
            return {"ok": True}
        except Exception as e:
            return {"ok": False, "error": str(e)}

# ------------------------------------------------------------
# Hardware-Threads
# ------------------------------------------------------------

def start_hardware_threads(window: webview.Window):
    """
    Wird von webview.start aufgerufen, sobald das UI bereit ist.
    Startet Leser für RFID & Barcode und optional LED-Reconnect.
    """
    print("[INFO] UI bereit. Starte Hardware-Threads …")

    # Lokale Serial-Referenzen + Reconnect-Schleifen
    state = {
        "rfid": open_serial(RFID_PORT, RFID_BAUD),
        "barcode": open_serial(BARCODE_PORT, BARCODE_BAUD),
    }

    # LED nur, wenn konfiguriert
    api: Api = window.gui.api  # pywebview hängt die API hier an
    if LED_PORT:
        api._set_led_serial(open_serial(LED_PORT, LED_BAUD))

        threading.Thread(
            target=reopen_loop,
            args=(api._get_led_serial, api._set_led_serial, LED_PORT, LED_BAUD, "LED"),
            daemon=True
        ).start()

    def set_rfid(s): state["rfid"] = s
    def get_rfid(): return state["rfid"]
    def set_bar(s): state["barcode"] = s
    def get_bar(): return state["barcode"]

    # Reconnect-Schleifen für RFID/Barcode
    threading.Thread(
        target=reopen_loop, args=(get_rfid, set_rfid, RFID_PORT, RFID_BAUD, "RFID"),
        daemon=True
    ).start()
    threading.Thread(
        target=reopen_loop, args=(get_bar, set_bar, BARCODE_PORT, BARCODE_BAUD, "BARCODE"),
        daemon=True
    ).start()

    def rfid_reader():
        while True:
            ser = get_rfid()
            if ser is None or not ser.is_open:
                time.sleep(0.2)
                continue
            try:
                for raw in read_lines(ser):
                    tag = raw.decode(errors="ignore").strip()
                    if not tag:
                        continue
                    target = RFID_ROUTING.get(tag, DEFAULT_PAGE)
                    page_uri = (ASSETS / target).as_uri()

                    print(f"[RFID] Tag: {tag} → {target}")
                    # Seite wechseln
                    try:
                        window.load_url(page_uri)
                    except Exception as e:
                        print("[ERR] load_url:", e)

                    # Optional JS-Event feuern
                    try:
                        evt = {
                            "tag": tag,
                            "page": target,
                        }
                        js = (
                            "window.dispatchEvent(new CustomEvent('rfid',"
                            f"{{detail:{json.dumps(evt)}}}));"
                        )
                        window.evaluate_js(js)
                    except Exception as e:
                        print("[ERR] evaluate_js (rfid):", e)
            except Exception as e:
                print("[ERR] RFID-Reader:", e)
                time.sleep(0.5)

    def barcode_reader():
        while True:
            ser = get_bar()
            if ser is None or not ser.is_open:
                time.sleep(0.1)
                continue
            try:
                for raw in read_lines(ser):
                    code = raw.decode(errors="ignore").strip()
                    if not code:
                        continue
                    print(f"[BARCODE] {code}")

                    # JS-Routine onBarcode(code) oder Fallback auf Event
                    try:
                        payload = json.dumps(code)
                        window.evaluate_js(
                            f"(window.onBarcode && window.onBarcode({payload}))"
                            "|| window.dispatchEvent(new CustomEvent('barcode',"
                            f"{{detail:{{code:{payload}}}}}));"
                        )
                    except Exception as e:
                        print("[ERR] evaluate_js (barcode):", e)
            except Exception as e:
                print("[ERR] Barcode-Reader:", e)
                time.sleep(0.3)

    threading.Thread(target=rfid_reader, daemon=True).start()
    threading.Thread(target=barcode_reader, daemon=True).start()

# ------------------------------------------------------------
# Main
# ------------------------------------------------------------

def main():
    index = (ASSETS / "index.html").as_uri()
    # Api-Instanz zuerst anlegen
    dummy_window = webview.create_window  # nur für Typ-Checker-Ruhe im Editor

    # Fenster mit JS-API binden (nicht bei start(), sondern hier!)
    # Wichtig: js_api=api
    # Die API-Instanz benötigt das Fenster-Objekt. Wir erzeugen erst ein leeres Window,
    # hängen die API später per create_window(js_api=api) ein (siehe unten).
    # Dafür bauen wir Api erst NACH create_window, damit sie das echte Fenster bekommt.
    window = webview.create_window("Terminal", url=index)  # temporär ohne API
    api = Api(window)

    # Jetzt ein neues Fenster mit API? Nein – besser: wir setzen die API am existierenden Window.
    # pywebview erlaubt create_window(..., js_api=api) direkt. Also neu erstellen:
    # (einfachste Variante: verwerfen und korrekt erstellen)
    del window
    #window = webview.create_window("Terminal", url=index, js_api=api)
    window = webview.create_window(
        "Kiosk",
        "http://127.0.0.1:3000",
        fullscreen=True,
        frameless=True,
        easy_drag=False,      # verhindert, dass Wischgesten als Fenster-Drag interpretiert werden
        confirm_close=True,    # zeigt Dialog statt sofort zuzumachen
        js_api=api
    )
    # Starten; func wird aufgerufen, wenn UI steht.
    webview.start(
        func=start_hardware_threads,
        args=(window,),
        gui=None,
        debug=False,
        http_server=False,
        private_mode=False,
    )

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Abbruch durch Benutzer")
        sys.exit(0)

