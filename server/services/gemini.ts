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

export async function generateWhatsAppPost(hotelData: HotelData, options: GenerationOptions): Promise<string> {
  try {
    const genAI = getGeminiApi();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Die aktuellste Gemini-Version verwendet eine andere Methode für Safety Settings
    // Wir entfernen sie vorerst, damit die API richtig funktioniert
    
    // Wir verwenden die globalen Hilfsfunktionen
    
    // Wir verwenden die globalen Definitionen von featureEmojiMap und styleDescriptions
    
    // Create enhanced features with emojis if enabled
    const enhancedFeatures = hotelData.features.map((feature, index) => {
      if (options.useEmojis) {
        const emoji = hotelData.featureIcons?.[index] || getFeatureEmoji(feature);
        return `${emoji} ${feature}`;
      }
      return `- ${feature}`;
    });
    
    const destEmoji = options.useEmojis ? getDestinationEmoji(hotelData.destination) : "";
    
    const prompt = `
Du bist ein erfahrener WhatsApp-Marketing-Texter für Reiseangebote der Firma ucandoo. 
Du sollst einen attraktiven WhatsApp-Post im vorgegebenen Format erstellen.

WICHTIG: Folge EXAKT diesem Format, das ich dir gleich zeige. Keine Abweichungen!

Hier sind die Informationen zum Reiseangebot:
- Hotelname: ${hotelData.hotelName}
- Kategorie: ${hotelData.hotelCategory || "Luxuriöses Hotel"}
- Destination: ${hotelData.destination}
${hotelData.price ? `- Preis: ${hotelData.price}` : ''}
${hotelData.duration ? `- Dauer: ${hotelData.duration}` : ''}
- Hauptmerkmale:
${hotelData.features.map(f => "  * " + f).join("\n")}
${hotelData.description ? `- Beschreibung: ${hotelData.description}` : ""}

Bitte erstelle einen WhatsApp-Post, der ${styleDescriptions[options.style]}

EXAKTES FORMAT für den Post:
1. Beginne mit einer catchy Headline, die Destination und Hotel nennt. Erwähne den Preis, wenn bekannt.
2. Dann 4-5 Bullet Points mit den Hauptmerkmalen (Nutze NUR die gegebenen Merkmale, keine Internet-Links, Telefonnummern oder Kontaktdaten)
3. Dann eine Zeile, die darauf hinweist, dass man mit ucandoo jetzt buchen und später zahlen kann
4. Dann die folgenden 3 Links exakt so formatiert:
   👉 Jetzt buchen
   👉 Ratenrechner
   👉 Reisebüro finden
5. Dann einen markanten Abschlusssatz zwischen ✨ Emojis
6. Als allerletzte Zeile ein Call-to-Action, der mit ➡️ beginnt

Beispiel-Format:
☀️ Mallorca in Luxus – und zwar richtig! ${destEmoji}
${hotelData.hotelName} – dein ${hotelData.hotelCategory || "Traumhotel"} auf ${hotelData.destination}!

${enhancedFeatures.join("\n")}
💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ [Catchy Schlussstatement] ✨
➡️ [Call-to-Action]

WICHTIG:
- Verwende den exakten Hotelname und die exakte Destination
- Behalte die genaue Formatierung des Beispiels bei
- Behalte die exakten ucandoo-Bezahlhinweise bei
- Behalte die exakten 3 Links bei
- Benutze keine PlaceholderTexte wie [Catchy Schlussstatement], sondern kreative eigene Formulierungen
- Verwende KEINE ANDEREN LINKS oder CTAs als die vorgegebenen
- Verwende KEINE Kontaktdaten wie Telefonnummern, E-Mail-Adressen oder Straßennamen in den Hauptmerkmalen
- Verwende KEINE Parameter oder Begriffe wie "Reiseland GmbH" oder "Diese Seite wirklich verlassen" in den Hauptmerkmalen
- Gib nur den fertigen Post zurück, keine Erklärungen
`;

    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1000,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const generatedText = response.text();
    
    return generatedText.trim();
  } catch (error) {
    console.error("Error with Gemini API:", error);
    throw new Error(`Fehler bei der Generierung mit Gemini: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
  }
}
