/*  WS281x Test – Protokoll-Wechsler
    IMPL: 1 = FastLED @800k  |  2 = Adafruit @800k  |  3 = Adafruit @400k
    Tipp: erst mit IMPL=1 probieren, dann 2, dann 3. Bei Bedarf LED_PIN=5 testen.
*/

#define IMPL        2      // <-- HIER durchprobieren: 1, dann 2, dann 3
#define LED_PIN     6      // ggf. auf 5 ändern und Draht umstecken
#define NUM_LEDS    25      // klein halten zum Test (1..10)
#define BRIGHTNESS  64     // moderat
#define USE_RGB     0      // 0 = GRB (üblich); 1 = RGB (wenn Farben verdreht wirken)

// --------- Gemeinsame Helfer -----------
void delay_ms(unsigned long ms) { unsigned long t=millis()+ms; while (millis()<t) {} }

#if (IMPL==1)
  // --------- Variante 1: FastLED @800k ---------
  #include <FastLED.h>
  #if USE_RGB
    #define COLOR_ORDER RGB
  #else
    #define COLOR_ORDER GRB
  #endif
  #define LED_TYPE WS2812B   // bei zickigen Alt-Chips notfalls auf WS2812 ändern

  CRGB leds[NUM_LEDS];

  void setup() {
    pinMode(LED_BUILTIN, OUTPUT); // 1s-Blink zur Taktkontrolle
    FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS);
    FastLED.setBrightness(BRIGHTNESS);
  }

  void loop() {
    digitalWrite(LED_BUILTIN, HIGH); delay(1000);
    digitalWrite(LED_BUILTIN, LOW);  delay(1000);

    // Muster 1: LED0 rot blinken
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    leds[0] = CRGB::Red;  FastLED.show(); delay_ms(700);
    leds[0] = CRGB::Black;FastLED.show(); delay_ms(700);

    // Muster 2: 3er-Lauflicht (falls NUM_LEDS>=3)
    for (int i=0; i<NUM_LEDS; i++) { leds[i]=CRGB::Green; FastLED.show(); delay_ms(120); leds[i]=CRGB::Black; }
  }

#elif (IMPL==2)
  // --------- Variante 2: Adafruit NeoPixel @800k ---------
  #include <Adafruit_NeoPixel.h>
  #if USE_RGB
    #define PIXEL_FLAGS (NEO_RGB + NEO_KHZ800)
  #else
    #define PIXEL_FLAGS (NEO_GRB + NEO_KHZ800)
  #endif
  Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, PIXEL_FLAGS);

  void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    strip.begin();
    strip.setBrightness(BRIGHTNESS);
    strip.show(); // alles aus
  }

  void loop() {
    digitalWrite(LED_BUILTIN, HIGH); delay(1000);
    digitalWrite(LED_BUILTIN, LOW);  delay(1000);

    // LED0 rot blinken
    strip.clear();
    strip.setPixelColor(0, strip.Color(255,0,0)); strip.show(); delay(700);
    strip.setPixelColor(0, 0);                    strip.show(); delay(700);

    // 3er-Lauflicht
    for (int i=0; i<strip.numPixels(); i++) {
      strip.clear();
      strip.setPixelColor(i, strip.Color(0,255,0));
      strip.show(); delay(120);
    }
  }

#elif (IMPL==3)
  // --------- Variante 3: Adafruit NeoPixel @400k (Alt-/kompatible Chips) ---------
  #include <Adafruit_NeoPixel.h>
  #if USE_RGB
    #define PIXEL_FLAGS (NEO_RGB + NEO_KHZ400)
  #else
    #define PIXEL_FLAGS (NEO_GRB + NEO_KHZ400)
  #endif
  Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, PIXEL_FLAGS);

  void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    strip.begin();
    strip.setBrightness(BRIGHTNESS);
    strip.show();
  }

  void loop() {
    digitalWrite(LED_BUILTIN, HIGH); delay(1000);
    digitalWrite(LED_BUILTIN, LOW);  delay(1000);

    // LED0 rot blinken
    strip.clear();
    strip.setPixelColor(0, strip.Color(255,0,0)); strip.show(); delay(700);
    strip.setPixelColor(0, 0);                    strip.show(); delay(700);

    // 3er-Lauflicht
    for (int i=0; i<strip.numPixels(); i++) {
      strip.clear();
      strip.setPixelColor(i, strip.Color(0,255,0));
      strip.show(); delay(120);
    }
  }
#else
  #error "IMPL must be 1, 2, or 3"
#endif
