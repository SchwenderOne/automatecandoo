import { GoogleGenerativeAI } from "@google/generative-ai";

interface HotelData {
  hotelName: string;
  hotelCategory?: string;
  destination: string;
  features: string[];
  featureIcons?: string[];
  amenities: string[];
  description?: string;
  imageUrl?: string;
  price?: string;
  duration?: string;
}

interface GenerationOptions {
  useEmojis: boolean;
  style: "enthusiastic" | "elegant" | "family" | "adventure";
}

// Feature emoji mapping für Hotelmerkmale
const featureEmojiMap: Record<string, string> = {
  "pool": "🏊‍♀️",
  "strand": "🏖️",
  "meer": "🌊",
  "frühstück": "🍽️",
  "restaurant": "🍽️",
  "essen": "🍽️",
  "gourmet": "🍽️",
  "kulinarisch": "🍽️",
  "dining": "🍽️",
  "spa": "💆‍♂️",
  "wellness": "🧖‍♀️",
  "massage": "💆‍♀️",
  "fitness": "💪",
  "gym": "🏋️‍♂️",
  "lage": "📍",
  "zentral": "📍",
  "zentrum": "📍",
  "aussicht": "🌇",
  "view": "🌇",
  "blick": "🌇",
  "family": "👨‍👩‍👧‍👦",
  "familie": "👨‍👩‍👧‍👦",
  "kinder": "👶",
  "zimmer": "🛏️",
  "suite": "🛏️",
  "bett": "🛏️",
  "design": "🎨",
  "stil": "🎨",
  "stylish": "🎨",
  "modern": "🎨",
  "bar": "🍸",
  "cocktail": "🍹",
  "wein": "🍷",
  "garten": "🌿",
  "terrasse": "🌴",
  "balkon": "🌴",
  "infinity": "♾️",
  "service": "👑",
  "exklusiv": "✨",
  "luxus": "✨",
  "boutique": "🛍️",
  "rooftop": "🏙️",
  "dachterrasse": "🏙️",
  "stadt": "🏙️",
  "privat": "🔐",
  "ruhig": "🧘",
  "entspannung": "🧘",
  "party": "🎉",
  "unterhaltung": "🎭",
  "show": "🎭",
  "kultur": "🏛️",
  "sehenswürdigkeiten": "🏛️",
  "sport": "⚽",
  "aktivität": "🚶‍♂️",
  "abenteuer": "🧗‍♂️",
  "natur": "🌲",
  "landschaft": "🏞️",
  "shopping": "🛍️",
  "einkaufen": "🛍️",
  "transfer": "🚗",
  "flughafen": "✈️",
  "internet": "📶",
  "wifi": "📶",
  "parken": "🅿️",
  "garage": "🅿️"
};

// Hilfsfunktion zum Zuordnen von Emojis zu Features
const getFeatureEmoji = (feature: string): string => {
  const lowerFeature = feature.toLowerCase();
  for (const [keyword, emoji] of Object.entries(featureEmojiMap)) {
    if (lowerFeature.includes(keyword)) {
      return emoji;
    }
  }
  return "✅"; // Default emoji if no match found
};

// Hilfsfunktion zum Zuordnen von Emojis zu Destinationen
const getDestinationEmoji = (destination: string): string => {
  const lowerDestination = destination.toLowerCase();
  
  if (lowerDestination.includes("mallorca") || lowerDestination.includes("spanien")) return "🇪🇸";
  if (lowerDestination.includes("italien")) return "🇮🇹";
  if (lowerDestination.includes("griechenland")) return "🇬🇷";
  if (lowerDestination.includes("türkei")) return "🇹🇷";
  if (lowerDestination.includes("ägypten")) return "🇪🇬";
  if (lowerDestination.includes("dubai") || lowerDestination.includes("vae")) return "🇦🇪";
  if (lowerDestination.includes("thailand")) return "🇹🇭";
  if (lowerDestination.includes("malediven")) return "🇲🇻";
  if (lowerDestination.includes("marokko")) return "🇲🇦";
  if (lowerDestination.includes("tunesien")) return "🇹🇳";
  if (lowerDestination.includes("frankreich")) return "🇫🇷";
  if (lowerDestination.includes("österreich")) return "🇦🇹";
  if (lowerDestination.includes("schweiz")) return "🇨🇭";
  if (lowerDestination.includes("usa") || lowerDestination.includes("amerika")) return "🇺🇸";
  if (lowerDestination.includes("karibik") || lowerDestination.includes("caribbean")) return "🏝️";
  if (lowerDestination.includes("bali") || lowerDestination.includes("indonesien")) return "🇮🇩";
  if (lowerDestination.includes("mexiko")) return "🇲🇽";
  if (lowerDestination.includes("dom rep") || lowerDestination.includes("dominikanische")) return "🇩🇴";
  if (lowerDestination.includes("portugal")) return "🇵🇹";
  if (lowerDestination.includes("kroatien")) return "🇭🇷";
  
  // Generic destination emojis
  if (lowerDestination.includes("strand") || lowerDestination.includes("beach")) return "🏖️";
  if (lowerDestination.includes("berg") || lowerDestination.includes("alpen")) return "🏔️";
  if (lowerDestination.includes("city") || lowerDestination.includes("stadt")) return "🌆";
  if (lowerDestination.includes("insel")) return "🏝️";
  if (lowerDestination.includes("see") || lowerDestination.includes("lake")) return "🌊";
  
  return "✨"; // Default emoji
};

// Style-Beschreibungen für verschiedene Textstile
const styleDescriptions = {
  enthusiastic: "begeistert, energetisch und lebhaft. Verwende ausdrucksstarke Sprache und Ausrufezeichen, um Begeisterung zu vermitteln.",
  elegant: "elegant, kultiviert und luxuriös. Verwende gehobene Sprache, die Exklusivität und Premium-Qualität betont.",
  family: "familienfreundlich und warm. Betone Aspekte, die für Familien wichtig sind, wie Sicherheit, Komfort und Aktivitäten für Kinder.",
  adventure: "abenteuerlich und aufregend. Betone die Möglichkeit für Erlebnisse, Entdeckungen und aktive Freizeitgestaltung."
};

// Initialize Gemini API
function getGeminiApi() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API Key fehlt. Bitte API-Key konfigurieren.");
  }
  
  return new GoogleGenerativeAI(apiKey);
}

// Few-Shot-Beispiele für verschiedene Stile
const getFewShotExamples = (style: string): string => {
  // Beispiele für verschiedene Stile
  const examples: Record<string, string[]> = {
    enthusiastic: [
      `☀️ Traumurlaub auf Mallorca - Nur 799€! 🇪🇸
Hotel Paradiso - dein 4-Sterne Hotel direkt am Strand!

🏖️ Direkt am traumhaften Sandstrand gelegen
🍽️ All-Inclusive-Verpflegung mit mediterranen Spezialitäten
🏊‍♀️ Großzügige Poollandschaft mit Swim-up-Bar
👨‍👩‍👧‍👦 Vielfältiges Unterhaltungsprogramm für die ganze Familie
🧖‍♀️ Wellnessbereich mit Sauna und Massage-Anwendungen

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Dein Sommermärchen wartet - Pack die Koffer und los! ✨
➡️ Jetzt schnell sichern, bevor die besten Plätze weg sind!`,

      `🌴 Bali ruft! Tropisches Paradies ab nur 1.099€! 🇮🇩
Sunset Beach Resort - dein 5-Sterne Traumhotel auf Bali!

🌊 Atemberaubender Meerblick aus jedem Zimmer
🍹 2 exotische Restaurants & 3 stilvolle Bars
🏊‍♀️ Infinity-Pool mit Blick auf den Ozean
💆‍♂️ Traditionelle balinesische Spa-Behandlungen
🚣‍♀️ Kostenlose Wassersportaktivitäten inklusive

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Erlebe den Zauber der Insel der Götter! ✨
➡️ Jetzt deine Auszeit im Paradies buchen!`
    ],
    elegant: [
      `✨ Exklusiver Aufenthalt an der Amalfiküste - ab 1.290€ 🇮🇹
Villa Belvedere - Ihr distinguiertes 5-Sterne Hideaway in Positano

🌇 Privilegierte Lage mit spektakulärem Panoramablick
🍽️ Preisgekröntes Restaurant mit mediterraner Gourmetküche
🍷 Exquisite Weinverkostungen in historischem Gewölbekeller
🛏️ Elegant gestaltete Suiten mit privaten Terrassen
🧖‍♀️ Exklusiver Spa-Bereich mit maßgeschneiderten Anwendungen

💳 Und wie immer bei uns: Sie buchen jetzt – und zahlen später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Erleben Sie italienische Lebenskunst in ihrer vollendeten Form ✨
➡️ Sichern Sie sich Ihren Aufenthalt in einem der begehrtesten Refugien Italiens`,

      `🌺 Diskreter Luxus auf Mauritius - Premium-Suite ab 1.890€ 🇲🇺
Royal Palm Beachcomber - Ihr exquisites 5-Sterne Luxusresort

🏝️ Privilegierte Lage an einem der schönsten Strände der Insel
👨‍🍳 Kulinarische Meisterwerke des Sternekochs Michel Laurent
🛥️ Privater Jachtausflug zu den Nachbarinseln inklusive
🧖‍♀️ Preisgekrönter Spa mit Clarins-Treatments
🍸 Erlesene Cocktailkreationen in der Royal Sunset Lounge

💳 Und wie immer bei uns: Sie buchen jetzt – und zahlen später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Ein Ort zeitloser Eleganz für den distinguierten Reisenden ✨
➡️ Reservieren Sie jetzt Ihren Aufenthalt in diskreter Exklusivität`
    ],
    family: [
      `🌞 Familienurlaub in der Türkei - All-Inclusive ab 899€! 🇹🇷
SunnyBeach Family Resort - euer kinderfreundliches 4-Sterne Hotel in Antalya

👨‍👩‍👧‍👦 Großzügige Familienzimmer mit getrennten Kinderbereichen
🎡 Wasserspielplatz und Kinderclub mit täglichem Programm (3-12 Jahre)
🍦 Kinderfreundliches Buffet mit gesunden Optionen
🏊‍♀️ Kinderbecken mit Wasserrutschen und Spritztieren
🎭 Abendliche Familienunterhaltung und Mini-Disco

💳 Und wie immer bei uns: Ihr bucht jetzt – und zahlt später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Glückliche Kinder, entspannte Eltern - Urlaub wie er sein soll! ✨
➡️ Jetzt euren perfekten Familienurlaub planen und gemeinsam Erinnerungen schaffen!`
    ],
    adventure: [
      `🏔️ Abenteuer in Costa Rica - 14 Tage ab 1.299€! 🇨🇷
Jungle Explorer Lodge - dein außergewöhnliches Naturresort im Regenwald

🌋 Spektakuläre Lage zwischen Vulkan Arenal und Nebelwald
🦥 Geführte Wildlife-Touren mit Chancen auf Faultiere, Tukane & mehr
🧗‍♂️ Zip-Lining und Canyoning-Abenteuer inklusive
🚣‍♀️ Wildwasser-Rafting auf dem Rio Pacuare (Klasse III-IV)
🌿 Nachhaltig gebaute Eco-Lodges mit Panorama-Regenwaldsicht

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Das Abenteuer deines Lebens wartet im Herzen des Regenwalds! ✨
➡️ Schnapp dir deinen Rucksack und erlebe die pure Kraft der Natur!`
    ]
  };

  // Wähle 1-2 Beispiele für den ausgewählten Stil
  const selectedExamples = examples[style] || examples.enthusiastic;
  return selectedExamples.slice(0, 2).join('\n\n--- WEITERES BEISPIEL ---\n\n');
};

// Dynamische Temperatur-Einstellung je nach Stil
const getTemperatureForStyle = (style: string): number => {
  switch (style) {
    case "enthusiastic": return 0.8;  // Kreativere Texte für begeisterten Stil
    case "elegant": return 0.6;       // Kontrollierter für eleganten Stil
    case "family": return 0.7;        // Ausgewogen für Familienstil
    case "adventure": return 0.75;    // Etwas kreativer für abenteuerlustigen Stil
    default: return 0.7;              // Standard
  }
};

export async function generateWhatsAppPost(hotelData: HotelData, options: GenerationOptions): Promise<string> {
  try {
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create enhanced features with emojis if enabled
    const enhancedFeatures = hotelData.features.map((feature, index) => {
      if (options.useEmojis) {
        const emoji = hotelData.featureIcons?.[index] || getFeatureEmoji(feature);
        return `${emoji} ${feature}`;
      }
      return `- ${feature}`;
    });
    
    const destEmoji = options.useEmojis ? getDestinationEmoji(hotelData.destination) : "";
    
    // Vereinfache die Destination - entferne Duplikate und kürze zu lange Destination
    let cleanDestination = hotelData.destination;
    if (cleanDestination.includes(',') || cleanDestination.includes('&')) {
      const parts = cleanDestination.split(/[,&]/);
      const uniqueParts: string[] = [];
      parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.length > 0 && !uniqueParts.includes(trimmed)) {
          uniqueParts.push(trimmed);
        }
      });
      cleanDestination = uniqueParts.join(', ');
    }
    
    // Füge Few-Shot-Beispiele hinzu
    const fewShotExamples = getFewShotExamples(options.style);

    // Verbesserter System-Prompt
    const systemPrompt = `
Du bist ein erstklassiger WhatsApp-Marketing-Texter für Reiseangebote der Firma ucandoo.
Deine Aufgabe ist es, einen präzisen, ansprechenden WhatsApp-Post im vorgegebenen Format zu erstellen,
der ${styleDescriptions[options.style]}

WICHTIG - Folgendes muss EXAKT so in dem Post enthalten sein:
1. Der genaue Hotelname: "${hotelData.hotelName}"
2. Die genaue Destination: "${cleanDestination}"
3. Der exakte Preis (wenn vorhanden): "${hotelData.price || ""}"
4. Die exakten Merkmale des Hotels (nutze genau die angegebenen, erfinde keine)
5. Die exakte ucandoo-Zahlungsinfos: "Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo"
6. Die exakten 3 Links: "Jetzt buchen", "Ratenrechner", "Reisebüro finden"

VERBOTEN im Post:
- Telefonnummern, E-Mail-Adressen oder Internetadressen
- Fehlermeldungen oder "keine Ergebnisse", "leider nicht verfügbar" etc.
- Platzhalter wie [TEXT] oder ähnliches
- Zusätzliche Links oder CTAs außer den vorgegebenen
- Website-Navigation wie "Impressum", "Startseite" etc.
`;

    // Verbesserter Haupt-Prompt
    const prompt = `
Hier sind die Informationen zum Reiseangebot:
- Hotelname: ${hotelData.hotelName}
- Kategorie: ${hotelData.hotelCategory || "Luxuriöses Hotel"}
- Destination: ${cleanDestination}
${hotelData.price ? `- Preis: ${hotelData.price}` : ''}
${hotelData.duration ? `- Dauer: ${hotelData.duration}` : ''}
- Hauptmerkmale:
${hotelData.features.map(f => "  * " + f).join("\n")}
${hotelData.description ? `- Beschreibung: ${hotelData.description}` : ""}

EXAKTES FORMAT für den Post:
1. Beginne mit einer catchy Headline, die Destination und Hotel nennt. Erwähne den Preis, wenn bekannt.
2. Dann 4-5 Bullet Points mit den Hauptmerkmalen 
3. Dann die Zeile mit dem ucandoo-Bezahlhinweis: "💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo."
4. Dann die folgenden 3 Links exakt so formatiert:
   👉 Jetzt buchen
   👉 Ratenrechner
   👉 Reisebüro finden
5. Dann einen markanten Abschlusssatz zwischen ✨ Emojis
6. Als allerletzte Zeile ein Call-to-Action, der mit ➡️ beginnt

Beispiel-Format:
☀️ Mallorca in Luxus – und zwar richtig! ${destEmoji}
${hotelData.hotelName} – dein ${hotelData.hotelCategory || "Traumhotel"} auf ${cleanDestination}!

${enhancedFeatures.join("\n")}
💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Dein Traumurlaub wartet – Sonne, Strand und pure Erholung! ✨
➡️ Schnell buchen und Koffer packen!

Hier sind erfolgreiche Beispiele als Inspiration:

${fewShotExamples}

Erstelle nun einen neuen originellen Post im gleichen Format für das angegebene Hotel!
`;

    // Dynamische Temperature basierend auf dem Stil
    const temperature = getTemperatureForStyle(options.style);

    const generationConfig = {
      temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
    };

    // Erste Anfrage mit systemPrompt
    const result = await model.generateContent({
      contents: [
        { role: "system", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig,
    });

    const response = result.response;
    let generatedText = response.text().trim();
    
    // Validiere den generierten Text
    if (!validateGeneratedPost(generatedText, hotelData)) {
      console.log("Erster Generierungsversuch enthielt nicht alle erforderlichen Elemente. Versuche es erneut mit angepasstem Prompt...");
      
      // Zweiter Versuch mit strikterem Prompt und weniger Kreativität
      const strictPrompt = prompt + "\n\nWICHTIG: Stelle sicher, dass der Hotelname, die Destination und alle anderen Informationen korrekt enthalten sind. Halte dich EXAKT an das vorgegebene Format!";
      
      const secondResult = await model.generateContent({
        contents: [
          { role: "system", parts: [{ text: systemPrompt }] },
          { role: "user", parts: [{ text: strictPrompt }] }
        ],
        generationConfig: {
          ...generationConfig,
          temperature: Math.max(0.3, temperature - 0.3), // Reduziere Kreativität
        },
      });
      
      generatedText = secondResult.response.text().trim();
    }
    
    return generatedText;
  } catch (error) {
    console.error("Error with Gemini API:", error);
    throw new Error(`Fehler bei der Generierung mit Gemini: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
  }
}

// Validierungsfunktion für generierte Posts
function validateGeneratedPost(post: string, hotelData: HotelData): boolean {
  // Überprüfe, ob alle erforderlichen Elemente im Post enthalten sind
  const requiredElements = [
    hotelData.hotelName,
    hotelData.destination,
    "ucandoo",
    "Jetzt buchen",
    "Ratenrechner",
    "Reisebüro finden"
  ];
  
  if (hotelData.price) {
    requiredElements.push(hotelData.price.replace(/[€\s.,]/g, '').substring(0, 4)); // Preisprüfung relaxed
  }
  
  // Überprüfe, ob alle erforderlichen Elemente enthalten sind
  for (const element of requiredElements) {
    const elementLC = element.toLowerCase();
    const postLC = post.toLowerCase();
    
    if (!postLC.includes(elementLC)) {
      console.warn(`Validierungsfehler: "${element}" fehlt im generierten Post`);
      return false;
    }
  }
  
  // Überprüfe, ob keine verbotenen Elemente enthalten sind
  const forbiddenPatterns = [
    "nicht verfügbar",
    "keine Angabe",
    "leider",
    "Fehler",
    "@",
    "http",
    "www",
    "[",
    "]",
    "Impressum",
    "Datenschutz",
    "Kontakt",
    "+49",
    "Tel",
    "Telefon",
    /\+\d{2,}/
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (typeof pattern === 'string' && post.includes(pattern)) {
      console.warn(`Validierungsfehler: Verbotener Inhalt "${pattern}" im generierten Post gefunden`);
      return false;
    } else if (pattern instanceof RegExp && pattern.test(post)) {
      console.warn(`Validierungsfehler: Verbotenes Muster im generierten Post gefunden`);
      return false;
    }
  }
  
  return true;
}