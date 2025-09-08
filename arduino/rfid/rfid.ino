#include <SPI.h>
#include <MFRC522.h>

// Pins für Arduino Nano
#define SS_PIN 10   // SDA/SS
#define RST_PIN 9   // RST

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  SPI.begin();        // SPI starten
  rfid.PCD_Init();    // RFID Reader initialisieren
  Serial.println("RFID Test - Karte oder Chip auflegen...");
}

void loop() {
  // Warten bis Karte in Reichweite ist
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }
  // UID auslesen
  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  Serial.print("UID: ");
  for (byte i = 0; i < rfid.uid.size; i++) {
    Serial.print(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    Serial.print(rfid.uid.uidByte[i], HEX);
    Serial.print(" ");
  }
  Serial.println();

  rfid.PICC_HaltA();  // Karte stoppen
  rfid.PCD_StopCrypto1();
}

