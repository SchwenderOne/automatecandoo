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

// Dynamische Parametereinstellung je nach Stil und Kontext
const getGenerationParams = (style: string, hotelData: HotelData): { temperature: number; topP: number; topK: number } => {
  // Basis-Temperatur je nach gewähltem Stil
  let baseTemperature = 0.7;
  let topP = 0.95;
  let topK = 40;
  
  switch (style) {
    case "enthusiastic":
      baseTemperature = 0.8;   // Kreativere Texte für begeisterten Stil
      topP = 0.97;             // Mehr Vielfalt bei begeistertem Stil
      break;
    case "elegant":
      baseTemperature = 0.6;   // Kontrollierter für eleganten Stil
      topP = 0.92;             // Weniger Varianz für konsistent eleganten Ton
      topK = 30;               // Konzentriertere Wortwahl für eleganten Stil
      break;
    case "family":
      baseTemperature = 0.7;   // Ausgewogen für Familienstil
      topK = 50;               // Etwas größere Auswahl für familienfreundliche Formulierungen
      break;
    case "adventure":
      baseTemperature = 0.75;  // Etwas kreativer für abenteuerlustigen Stil
      topP = 0.96;             // Leicht erhöhte Vielfalt für abenteuerliche Beschreibungen
      break;
  }
  
  // Kontextabhängige Feinabstimmung
  
  // Bei Luxushotels (5-Sterne) etwas kontrollierter für einen "ehrwürdigeren" Ton
  if (hotelData.hotelCategory?.includes('5-Sterne')) {
    baseTemperature = Math.max(0.55, baseTemperature - 0.1);
    topP = Math.max(0.9, topP - 0.02);
  }
  
  // Bei Familienhotels oder wenn "Familie/Kinder" in den Features erwähnt wird, etwas wärmer
  const familyRelated = hotelData.features.some(f => 
    f.toLowerCase().includes('familie') || 
    f.toLowerCase().includes('kinder')
  );
  if (familyRelated && style !== "elegant") {
    baseTemperature = Math.min(0.85, baseTemperature + 0.05);
  }
  
  // Bei Strandhotels etwas lebhafter für Urlaubsgefühl
  const beachRelated = hotelData.features.some(f => 
    f.toLowerCase().includes('strand') || 
    f.toLowerCase().includes('meer') ||
    f.toLowerCase().includes('beach')
  );
  if (beachRelated && style !== "elegant") {
    baseTemperature = Math.min(0.85, baseTemperature + 0.05);
  }
  
  return { 
    temperature: baseTemperature,
    topP,
    topK
  };
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

    // Dynamische Parameter basierend auf Stil und Hotelkontext
    const params = getGenerationParams(options.style, hotelData);

    const generationConfig = {
      temperature: params.temperature,
      topK: params.topK,
      topP: params.topP,
      maxOutputTokens: 1000,
    };

    // Gemini 1.5 unterstützt keine system role, daher fügen wir den systemPrompt zum Hauptprompt hinzu
    const combinedPrompt = `${systemPrompt}\n\n${prompt}`;
    
    // Erste Anfrage mit kombiniertem Prompt
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: combinedPrompt }] }
      ],
      generationConfig,
    });

    const response = result.response;
    let generatedText = response.text().trim();
    
    // Validiere den generierten Text
    if (!validateGeneratedPost(generatedText, hotelData)) {
      console.log("Erster Generierungsversuch enthielt nicht alle erforderlichen Elemente. Versuche es erneut mit angepasstem Prompt...");
      
      // Zweiter Versuch mit strikterem Prompt und weniger Kreativität
      const strictPrompt = combinedPrompt + "\n\nWICHTIG: Stelle sicher, dass der Hotelname, die Destination und alle anderen Informationen korrekt enthalten sind. Halte dich EXAKT an das vorgegebene Format!";
      
      const secondResult = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: strictPrompt }] }
        ],
        generationConfig: {
          ...generationConfig,
          temperature: Math.max(0.3, params.temperature - 0.3), // Reduziere Kreativität
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

// Erweiterte Validierungsfunktion für generierte Posts
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
  
  // Preis-Validierung - flexibler durch verschiedene Möglichkeiten der Preiswiedergabe
  if (hotelData.price) {
    const priceDigitsOnly = hotelData.price.replace(/[^0-9]/g, '');
    const priceValue = parseInt(priceDigitsOnly, 10);
    
    // Verschiedene Prüfungen für den Preis, da er in verschiedenen Formaten erscheinen kann
    if (priceValue > 0) {
      // Überprüfe, ob die Preiszahl (mindestens die ersten Ziffern) enthalten ist
      const pricePattern = new RegExp(`\\b${priceDigitsOnly.substring(0, Math.min(4, priceDigitsOnly.length))}\\b`);
      
      if (!pricePattern.test(post.replace(/\./g, ''))) { // Punkte entfernen, da sie als Tausendertrennzeichen variieren können
        console.warn(`Validierungsfehler: Preis "${hotelData.price}" (bzw. Preiszahl) fehlt im generierten Post`);
        return false;
      }
    }
  }
  
  // Überprüfe, ob alle anderen erforderlichen Elemente enthalten sind
  for (const element of requiredElements) {
    // Bei längeren Elementen wie Hotelnamen auch Teilmatch akzeptieren
    let matchFound = false;
    const elementLC = element.toLowerCase();
    const postLC = post.toLowerCase();
    
    if (element === hotelData.hotelName && element.length > 15) {
      // Bei sehr langen Hotelnamen auch Teilmatch akzeptieren (mindestens 70% des Namens)
      const words = element.split(/\s+/);
      let matchedWords = 0;
      
      for (const word of words) {
        if (word.length > 3 && postLC.includes(word.toLowerCase())) {
          matchedWords++;
        }
      }
      
      if (matchedWords >= Math.ceil(words.length * 0.7)) {
        matchFound = true;
      }
    } else {
      matchFound = postLC.includes(elementLC);
    }
    
    if (!matchFound) {
      console.warn(`Validierungsfehler: "${element}" fehlt im generierten Post`);
      return false;
    }
  }
  
  // Strukturvalidierung - prüft die erwartete Struktur des Posts
  const structureValidation = [
    { pattern: /👉\s*Jetzt buchen/i, name: "Buchungs-Link" },
    { pattern: /👉\s*Ratenrechner/i, name: "Ratenrechner-Link" },
    { pattern: /👉\s*Reisebüro finden/i, name: "Reisebüro-Link" },
    { pattern: /💳|ucandoo/i, name: "Zahlungshinweis" },
    { pattern: /✨.*✨|✨/i, name: "Abschlusssatz mit Emoji" },
    { pattern: /➡️/i, name: "Call-to-Action mit Pfeil" }
  ];
  
  for (const { pattern, name } of structureValidation) {
    if (!pattern.test(post)) {
      console.warn(`Validierungsfehler: Strukturelement "${name}" fehlt im generierten Post`);
      return false;
    }
  }
  
  // Überprüfe, ob wichtige Hotel-Feature erwähnt werden (mindestens eines, wenn vorhanden)
  if (hotelData.features && hotelData.features.length > 0) {
    let featureMentioned = false;
    
    // Definiere wichtige Feature-Begriffe, die erwähnt werden sollten
    const importantFeatures = ['pool', 'strand', 'meer', 'spa', 'wellness', 'restaurant', 'frühstück'];
    
    for (const feature of hotelData.features) {
      const featureLC = feature.toLowerCase();
      
      // Prüfe, ob eines der wichtigen Features im Text enthalten ist
      for (const important of importantFeatures) {
        if (featureLC.includes(important) && post.toLowerCase().includes(important)) {
          featureMentioned = true;
          break;
        }
      }
      
      if (featureMentioned) break;
    }
    
    // Prüfe auch, ob mindestens ein Feature-Text direkt übernommen wurde
    if (!featureMentioned) {
      for (const feature of hotelData.features) {
        // Nehme wichtige Wörter aus dem Feature (mindestens 5 Zeichen lang)
        const featureWords = feature.split(/\s+/).filter(word => word.length >= 5);
        
        for (const word of featureWords) {
          if (post.toLowerCase().includes(word.toLowerCase())) {
            featureMentioned = true;
            break;
          }
        }
        
        if (featureMentioned) break;
      }
    }
    
    if (!featureMentioned && hotelData.features.length >= 2) {
      console.warn("Validierungsfehler: Keine wichtigen Hotelmerkmale im Post erwähnt");
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
    "{",
    "}",
    "Impressum",
    "Datenschutz",
    "Kontakt",
    "+49",
    "Tel",
    "Telefon",
    /\+\d{2,}/,
    /\(\d+\)/, // Nummern in Klammern (oft Telefonnummern)
    /\d{5,}/, // Lange Zahlenfolgen (vermutlich Nummern)
    /Bitte/i, // Oft in Fehlermeldungen oder Hinweisen "Bitte kontaktieren Sie..."
    /Anfrage/i, // Häufig in Kontakt/Formular-Kontexten
    /\bEmail\b/i, // Email-Hinweise
    /\bSeite\b.*\bnicht\b/i, // "Seite nicht gefunden" oder Ähnliches
    /\bSeite\b.*\bverlassen\b/i, // "Diese Seite verlassen" etc.
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
  
  // Prüfe Länge und Struktur - zu kurze Posts sind vermutlich unvollständig
  const lines = post.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 10) {
    console.warn(`Validierungsfehler: Post zu kurz (nur ${lines.length} Zeilen)`);
    return false;
  }
  
  // Alles gut!
  return true;
}