import serial

# Passe den Port und Baudrate an dein Arduino-Setup an
PORT = "/dev/ttyUSB1"        # oder "/dev/ttyUSB0"
BAUDRATE = 115200

def main():
    try:
        with serial.Serial(PORT, BAUDRATE, timeout=1) as ser:
            print(f"Listening on {PORT} @ {BAUDRATE} baud...")
            while True:
                line = ser.readline().decode(errors="ignore").strip()
                if line:  # wenn was angekommen ist
                    #print("Hallo Welt!")
                    #print("Gelesene UID:", line)
                    print(line)
    except serial.SerialException as e:
        print("Fehler beim Öffnen des Ports:", e)

if __name__ == "__main__":
    main()

