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
  enthusiastic: "einen begeisterten, energiegeladenen und motivierenden Ton hat. Nutze dynamische Ausdrücke, überraschende Wendungen und spritzige Wortwahl, um echte Begeisterung zu vermitteln.",
  elegant: "einen eleganten, gehobenen und anspruchsvollen Ton hat. Verwende distinguierte Sprache, höfliche Anrede und kultivierte Ausdrucksweise, die gehobene Ansprüche respektiert.",
  family: "einen herzlichen, familienfreundlichen und einladenden Ton hat. Betone Aspekte, die für Familien mit Kindern wichtig sind, wie Sicherheit, Kinderfreundlichkeit und gemeinsame Aktivitäten.",
  adventure: "einen abenteuerlustigen, aufregenden und entdeckungsfreudigen Ton hat. Hebe Aktivitäten, Erlebnisse und die Möglichkeit zur Erkundung hervor, um Abenteuerlust zu wecken."
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

🏖️ Nur 150 m zum feinsandigen Playa de Palma Strand
🍽️ 3 Restaurants mit mediterranen und internationalen Spezialitäten
🏊‍♀️ 2 Swimmingpools (800 m² & 400 m²) mit Swim-up-Bar und Sonnenterrasse
👨‍👩‍👧‍👦 Kids Club (4-12 Jahre) mit täglichem Animationsprogramm 
🧖‍♀️ 600 m² Spa-Bereich mit beheiztem Hallenbad, 2 Saunen und 5 Behandlungsräumen

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Dein Sommermärchen wartet - Pack die Koffer und los! ✨
➡️ Jetzt schnell sichern, bevor die besten Plätze weg sind!`,

      `🌴 Bali ruft! Tropisches Paradies ab nur 1.099€! 🇮🇩
Sunset Beach Resort - dein 5-Sterne Traumhotel auf Bali!

🌊 42 m² Deluxe-Zimmer mit privatem Balkon und 180° Meerblick
🍹 2 Gourmet-Restaurants mit balinesischer & internationaler Küche + 3 Cocktailbars
🏊‍♀️ 120 m² Infinity-Pool direkt am Strand von Jimbaran Bay
💆‍♂️ Preisgekrönter Spa-Bereich mit 7 traditionellen balinesischen Behandlungen
🚣‍♀️ Kostenlose Wassersportausrüstung (Kajak, SUP, Schnorchel-Set)

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Erlebe den Zauber der Insel der Götter! ✨
➡️ Jetzt deine Auszeit im Paradies buchen!`,

      `🔥 TRAUMURLAUB ALERT! Paris erleben ab 599 € 🇫🇷
Hôtel Les Jardins de Montmartre - dein stylisches Stadthotel im Herzen der Romantik!

📍 Nur 450 m zum weltberühmten Sacré-Cœur und 2 km zum Moulin Rouge
🥐 Täglich frische Croissants & französisches Frühstücksbuffet mit 12+ Optionen
🛏️ 24 m² Zimmer mit King-Size-Bett und kostenfreiem WLAN (100 Mbit/s)
🚶‍♀️ 5 Gehminuten zur Metro-Station Abbesses (Linie 12)

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Paris verzaubert dich - lass dich von der Stadt der Liebe verführen! ✨
➡️ Bereit für dein französisches Abenteuer? Jetzt buchen!`,

      `🌊 GRIECHENLAND-HAMMER! Santorini ab nur 799 € 🏝️
Blue Bay Resort & Spa - dein traumhaftes 4-Sterne Hideaway mit MEGA-Meerblick!

🌅 Alle 48 Zimmer mit privatem Balkon und direktem Blick auf die Caldera
🍹 250 m² Infinity-Pool mit Swim-up Cocktailbar und 8 Unterwasser-Liegen
🥙 Frühstücksbuffet mit 15+ griechischen Spezialitäten und lokalen Bio-Produkten
💆‍♀️ 400 m² Wellness-Oase mit Thalasso-Therapie und 6 Behandlungsräumen

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Dein perfekter Insel-Traumurlaub wartet! Opa! ✨
➡️ Schnapp dir deinen Santorini-Deal, bevor jemand anders es tut!`
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
➡️ Reservieren Sie jetzt Ihren Aufenthalt in diskreter Exklusivität`,

      `✨ Pariser Eleganz im Herzen von Montmartre 🇫🇷
Hôtel Les Jardins de Montmartre - Ihr distinguiertes Refugium in der Stadt der Lichter

🥐 Genießen Sie ein exquisites französisches Frühstück mit Patisserie-Spezialitäten
🎨 Befinden Sie sich in unmittelbarer Nähe zu den berühmten Künstlerateliers
🏛️ Erleben Sie kulturelle Höhepunkte wie den Sacré-Cœur in Gehentfernung
🛏️ Residieren Sie in stilvoll eingerichteten Zimmern mit erlesener Ausstattung

💳 Und wie immer bei uns: Sie buchen jetzt – und zahlen später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Paris – eine Symphonie für alle Sinne ✨
➡️ Reservieren Sie Ihren exklusiven Aufenthalt in der französischen Metropole`,

      `✨ Mediterrane Grandezza an der Costa del Sol 🌊
Hotel Don Carlos Leisure Resort & Spa - Ihr exklusives 5-Sterne Domizil in Marbella

🌿 Weitläufige, subtropische Gartenanlage mit jahrhundertealten Olivenbäumen
🍷 Erstklassige Gastronomie mit exzellenter mediterraner und internationaler Küche
🧖‍♀️ Luxuriöses Spa-Retreat mit Thalasso-Therapie und ganzheitlichen Treatments
🏊‍♀️ Elegante Poollandschaft mit diskretem Service und Meerblick

💳 Und wie immer bei uns: Sie buchen jetzt – und zahlen später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Marbella – wo Exklusivität und Lebensart verschmelzen ✨
➡️ Sichern Sie sich Ihren perfekten Aufenthalt an Spaniens privilegierter Küste`
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
➡️ Jetzt euren perfekten Familienurlaub planen und gemeinsam Erinnerungen schaffen!`,

      `👨‍👩‍👧‍👦 Familienglück in Paris - Entdeckungsreise für alle! 🗼
Hôtel Les Jardins de Montmartre - euer gemütliches Zuhause in Paris

🚶‍♀️ Nur 650 m zum kinderfreundlichen Parc Monceau mit 8 verschiedenen Spielplätzen
🥐 Spezielles Kinder-Frühstücksbuffet mit 8 gesunden Optionen und Spaß-Snacks
🛌 35 m² Familienzimmer mit Trennwand und separatem Kinder-TV (Netflix Kids inklusive)
🎭 Kostenlose Family-Tour-Karte mit 12 kindgerechten Attraktionen in Gehdistanz

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Paris mit Kindern erleben - aufregend, lehrreich und unvergesslich! ✨
➡️ Packt die Koffer und macht euch bereit für ein Familienabenteuer in Paris!`,

      `🌈 Familienspaß unter Griechenlands Sonne! 👨‍👩‍👧‍👦
Aeolos Beach Resort - euer kinderfreundliches 4-Sterne Paradies auf Korfu

🏊‍♀️ 3 Pools mit Kinderbecken (25-45 cm tief) und 350 m² Wasserpark mit 5 Rutschen
🍕 Familien-Buffet mit spezieller Kinderecke (17:30-19:00 Uhr) und 14 kindgerechten Gerichten
👶 Professioneller Kids-Club mit 6 ausgebildeten Betreuern (3 Altersgruppen: 3-5, 6-9, 10-12 Jahre)
🏖️ 250 m langer, flach abfallender Sandstrand mit kostenloser Kinderausrüstung (Eimer, Schaufeln)

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Urlaub, der die ganze Familie glücklich macht! ✨
➡️ Jetzt buchen und gemeinsam griechische Familienabenteuer erleben!`
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
➡️ Schnapp dir deinen Rucksack und erlebe die pure Kraft der Natur!`,

      `🗼 PARIS ENTDECKEN - Vom Montmartre bis zum Untergrund! 🧭
Hôtel Les Jardins de Montmartre - dein perfekter Ausgangspunkt für Stadterkundungen!

🚶‍♀️ Erkunde versteckte Gassen und Street Art im authentischen Montmartre
🏛️ Tour zu den verborgenen Katakomben und geheimen Orten der Stadt
🚴‍♂️ Fahrradverleih direkt im Hotel für spontane Stadtabenteuer
🍷 Weinverkostungen in historischen Kellern abseits der Touristenpfade

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Paris hat so viel mehr zu bieten als den Eiffelturm! ✨
➡️ Bereit für dein urbanes Abenteuer? Jetzt loslegen!`,

      `🌋 ABENTEUER TENERIFFA - Zwischen Vulkanen und Meer! 🏄‍♂️
Sandos San Blas Nature Resort - deine ultimative Basis für Outdoor-Action!

🥾 Direkter Zugang zu spektakulären Wanderwegen am Vulkan Teide
🚣‍♀️ Kajak und Stand-Up-Paddling auf dem hoteleigenen Naturreservoir
🚵‍♂️ Geführte Mountainbike-Touren durch beeindruckende Lavalandschaften
🤿 Tauchbasis am Hotel für Erkundungen der faszinierenden Unterwasserwelt

💳 Und wie immer bei uns: Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.

👉 Jetzt buchen
👉 Ratenrechner
👉 Reisebüro finden

✨ Teneriffa - die Insel der 1000 Abenteuer wartet auf dich! ✨
➡️ Bist du bereit für den ultimativen Adrenalinkick? Jetzt buchen!`
    ]
  };

  // Wähle 2-3 Beispiele für den ausgewählten Stil
  const selectedExamples = examples[style] || examples.enthusiastic;
  // Zufällige Auswahl von 3 Beispielen (oder weniger, falls nicht genug vorhanden)
  const shuffled = [...selectedExamples].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(3, shuffled.length));
  return selected.join('\n\n--- WEITERES BEISPIEL ---\n\n');
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

ABSOLUT ENTSCHEIDEND FÜR DIE BULLET POINTS:
- Die Bullet Points müssen KONKRETE und SPEZIFISCHE Details dieses Hotels beschreiben
- Vermeide um jeden Preis generische Aussagen wie "ideale Lage", "hervorragender Service" oder "entspannende Atmosphäre"
- Stattdessen: gib EXAKTE Details, z.B. "300 m zum Sandstrand" statt "strandnah" oder "4 mediterranene Restaurants" statt "tolles Essen"
- Nutze messbare Angaben wo immer möglich (Entfernungen, Anzahl, Größen, etc.)
- Erwähne tatsächliche Ausstattungsmerkmale, nicht die damit verbundenen Gefühle
- Konzentriere dich auf Fakten und Details, die für dieses konkrete Hotel EINZIGARTIG sind

VERBOTEN im Post:
- Telefonnummern, E-Mail-Adressen oder Internetadressen
- Fehlermeldungen oder "keine Ergebnisse", "leider nicht verfügbar" etc.
- Platzhalter wie [TEXT] oder ähnliches
- Zusätzliche Links oder CTAs außer den vorgegebenen
- Website-Navigation wie "Impressum", "Startseite" etc.
- Generische Beschreibungen, die auf jedes Hotel zutreffen könnten
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