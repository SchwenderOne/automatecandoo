# ucandoo WhatsApp Post Generator - Projektdokumentation

## 1. Projektübersicht

### Zweck der Anwendung
Die Anwendung ist ein spezialisiertes Tool für den Reiseanbieter ucandoo, das automatisch formatierte WhatsApp-Posts für Hotelwerbung generiert. Durch die Eingabe einer URL von meinreisebuero24.com extrahiert das Tool relevante Hotelinformationen und erstellt daraus ansprechende, markengerechte WhatsApp-Posts mit Emojis, die potenzielle Kunden ansprechen sollen.

### Kernfunktionen
- Extraktion von Hoteldetails aus meinreisebuero24.com URLs
- Generierung strukturierter WhatsApp-Posts mit Gemini AI
- Unterstützung für verschiedene Stilrichtungen (begeistert, elegant, familiär, abenteuerlich)
- Editieren der Quellinformationen vor Post-Generierung
- Hinzufügen benutzerdefinierter Abschnitte und Features
- Persistente Speicherung generierter Posts in PostgreSQL-Datenbank
- Caching für schnellere Ergebnisse bei wiederholten Anfragen

## 2. Technologie-Stack

### Frontend
- React (mit TypeScript)
- TailwindCSS für Styling
- shadcn/ui als Komponentenbibliothek
- React Hook Form für Formulare 
- TanStack Query für API-Anfragen
- wouter für Routing

### Backend
- Node.js mit Express.js
- TypeScript
- PostgreSQL Datenbank
- drizzle-orm für Datenbankzugriff
- REST API für Kommunikation zwischen Frontend und Backend

### AI und externe Dienste
- Google Gemini AI (gemini-1.5-pro) für Textgenerierung
- cheerio für Web-Scraping

### Entwicklungsumgebung
- Vite als Build Tool
- tsx für TypeScript-Ausführung
- Replit als Entwicklungs- und Hosting-Plattform

## 3. Projektstruktur

Die Anwendung folgt einer Client-Server-Architektur mit einer klaren Trennung zwischen Frontend und Backend.

```
/
├── client/                    # Frontend-Anwendung (React)
│   ├── src/
│   │   ├── components/        # UI-Komponenten
│   │   │   ├── ui/            # shadcn/ui Komponenten
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── PostResult.tsx        # Zeigt generierten Post an
│   │   │   └── SourceInformation.tsx # Bearbeitung der Quelldaten
│   │   ├── hooks/             # Benutzerdefinierte React-Hooks
│   │   ├── lib/
│   │   │   ├── api.ts         # API-Funktionen für Backend-Anfragen
│   │   │   ├── queryClient.ts # TanStack Query Konfiguration
│   │   │   └── utils.ts       # Hilfsfunktionen
│   │   ├── pages/             # Ansichten/Routen
│   │   │   ├── home.tsx       # Hauptseite
│   │   │   └── not-found.tsx  # 404-Seite
│   │   ├── App.tsx            # Haupt-App-Komponente und Routing
│   │   ├── index.css          # Globale Styles
│   │   ├── main.tsx           # Einstiegspunkt
│   │   └── types.ts           # Gemeinsame TypeScript-Typen
│   └── index.html             # HTML-Einstiegspunkt
├── server/                    # Backend-Server (Node.js/Express)
│   ├── services/              # Backend-Dienste
│   │   ├── cache.ts           # In-Memory-Cache für schnellere Antworten
│   │   ├── gemini.ts          # Google Gemini AI Integration
│   │   └── scraper.ts         # Web-Scraper für MeinReisebüro24
│   ├── db.ts                  # Datenbankverbindung und Konfiguration
│   ├── index.ts               # Server-Einstiegspunkt
│   ├── routes.ts              # API-Endpunkte
│   ├── storage.ts             # Datenzugriffs-Interface/Implementierung
│   └── vite.ts                # Vite-Konfiguration für Entwicklung
├── shared/                    # Gemeinsam genutzte Dateien
│   └── schema.ts              # Datenbank-Schema und gemeinsame Typen
├── package.json               # Projekt-Abhängigkeiten
└── drizzle.config.ts          # Drizzle ORM Konfiguration
```

## 4. Datenfluss und Architektur

### Genereller Ablauf
1. Benutzer gibt eine URL von meinreisebuero24.com in das Formular ein
2. Backend prüft den Cache für die URL
3. Falls nicht im Cache:
   - Web-Scraper extrahiert Hotelinformationen von der URL
   - Gemini AI generiert WhatsApp-Post basierend auf den extrahierten Daten
   - Ergebnis wird im Cache und Datenbank gespeichert
4. Daten werden an Frontend zurückgegeben
5. Benutzer kann Quellinformationen anpassen und Post neu generieren

### Datenmodell

Das Datenmodell besteht hauptsächlich aus zwei Entitäten:
- `users`: Benutzer der Anwendung (derzeit nicht aktiv genutzt)
- `post_generations`: Gespeicherte generierte Posts

```typescript
// Datenbank-Schema (vereinfacht)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  // ...weitere Felder
});

export const postGenerations = pgTable("post_generations", {
  id: serial("id").primaryKey(),
  originalUrl: text("original_url").notNull(),
  generatedPost: text("generated_post").notNull(),
  sourceInfo: jsonb("source_info").$type<SourceInfo>(),
  createdAt: timestamp("created_at").defaultNow(),
  // ...weitere Felder
});
```

### API-Endpunkte

Die Anwendung bietet folgende API-Endpunkte:

```
POST /api/generate-post
- Nimmt eine URL entgegen und gibt einen generierten Post zurück
- Request-Body: { url: string, style: string, useEmojis: boolean }
- Response: PostGenerationResponse

PATCH /api/update-post/:id
- Aktualisiert einen bereits generierten Post
- Request-Body: { updatedPost: string, sourceInfo: SourceInfo }
- Response: Aktualisierter Post

POST /api/custom-section/:id
- Fügt einen benutzerdefinierten Abschnitt zu einem Post hinzu
- Request-Body: { title: string, items: Feature[] }
- Response: Aktualisierter Post

POST /api/feature/:id
- Fügt ein Feature zu einem Post hinzu
- Request-Body: { icon: string, text: string }
- Response: Aktualisierter Post
```

## 5. Hauptkomponenten im Detail

### Web-Scraper (server/services/scraper.ts)
Der Scraper extrahiert Hotelinformationen von meinreisebuero24.com URLs mithilfe von cheerio. Er verwendet mehrere Extraktionsstrategien für wichtige Informationen wie:
- Hotelname und Kategorie
- Destination
- Features und Ausstattung
- Preise und Aufenthaltsdauer

Da die Website-Struktur variieren kann, implementiert der Scraper mehrere Fallback-Methoden und robuste Extraktionslogik.

#### Preisextraktion
Besonders wichtig ist die korrekte Extraktion von Preisen, die durch verschiedene Methoden und Muster-Matches erfolgt:
```typescript
function cleanPrice(priceText: string): string {
  // Entfernt nicht-numerische Zeichen, normalisiert Formatierung
  // Berücksichtigt verschiedene Preis-Formate
}
```

### Gemini AI Integration (server/services/gemini.ts)
Die KI-Integration nutzt das Google Gemini API mit dem `gemini-1.5-pro`-Modell. Der Dienst verwendet:

1. **Few-Shot Learning**: Mehrere Beispiele für verschiedene Stile helfen dem Modell, den gewünschten Output-Stil zu verstehen:
   ```typescript
   const getFewShotExamples = (style: string): string => {
     // Gibt 2-3 Beispiele für den ausgewählten Stil zurück
   };
   ```

2. **Dynamische Parameter-Anpassung**: Basierend auf Hoteltyp und Kontext werden Parameter wie Temperatur angepasst:
   ```typescript
   const getGenerationParams = (style: string, hotelData: HotelData): { temperature: number; topP: number; topK: number } => {
     // Passt Parameter dynamisch an
   };
   ```

3. **Validierung**: Strenge Validierung stellt sicher, dass alle erforderlichen Elemente im generierten Post enthalten sind:
   ```typescript
   function validateGeneratedPost(post: string, hotelData: HotelData): boolean {
     // Prüft, ob alle erforderlichen Elemente im Post enthalten sind
   }
   ```

### Cache-System (server/services/cache.ts)
Ein In-Memory-Cache speichert generierte Posts für schnelle Wiederverwendung:
```typescript
class Cache {
  private storage: Map<string, CacheEntry<any>> = new Map();
  
  set<T>(key: string, data: T, ttlSeconds: number = 3600): Cache {...}
  get<T>(key: string): T | null {...}
  has(key: string): boolean {...}
  delete(key: string): boolean {...}
  clear(): void {...}
  prune(): number {...}
}
```

### Frontend-Komponenten
- **SourceInformation.tsx**: Ermöglicht die Bearbeitung der Quelldaten vor der Post-Generierung
- **PostResult.tsx**: Zeigt den generierten Post an und ermöglicht das erneute Generieren

## 6. AI-Prompt-Techniken

Die Anwendung verwendet fortschrittliche Prompt-Engineering-Techniken für die Gemini AI:

### 1. Few-Shot-Learning
15+ sorgfältig gestaltete Beispiele über 4 verschiedene Stile, die dem Modell zeigen, wie ein guter Post aussehen sollte.

### 2. Strukturierte Anweisungen
Klare Anweisungen zum Format und Inhalt des Posts:
```
EXAKTES FORMAT für den Post:
1. Beginne mit einer catchy Headline, die Destination und Hotel nennt. Erwähne den Preis, wenn bekannt.
2. Dann 4-5 Bullet Points mit den Hauptmerkmalen 
3. Dann die Zeile mit dem ucandoo-Bezahlhinweis
4. Dann die folgenden 3 Links exakt so formatiert
5. Dann einen markanten Abschlusssatz zwischen ✨ Emojis
6. Als allerletzte Zeile ein Call-to-Action, der mit ➡️ beginnt
```

### 3. Spezifische Content-Anforderungen
Detaillierte Anforderungen für die zu generierenden Bullet Points:
```
ABSOLUT ENTSCHEIDEND FÜR DIE BULLET POINTS:
- Die Bullet Points müssen KONKRETE und SPEZIFISCHE Details dieses Hotels beschreiben
- Vermeide um jeden Preis generische Aussagen wie "ideale Lage", "hervorragender Service"
- Stattdessen: gib EXAKTE Details, z.B. "300 m zum Sandstrand" statt "strandnah"
- Nutze messbare Angaben wo immer möglich (Entfernungen, Anzahl, Größen, etc.)
- Erwähne tatsächliche Ausstattungsmerkmale, nicht die damit verbundenen Gefühle
```

### 4. Dynamische Parametrisierung
Anpassung der Generierungs-Parameter basierend auf Hotel-Typ und Stil:
- Luxushotels: Niedrigere Temperatur für kontrolliertere Sprache
- Familienhotels: Wärmerer Ton durch leicht erhöhte Temperatur
- Strandhotels: Lebhafterer Stil durch angepasste Parameter

## 7. Datenbank-Integration

Die Anwendung verwendet PostgreSQL mit der Drizzle ORM für Datenbankzugriff:

```typescript
// Verbindung zur Datenbank
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Datenbankzugriffs-Klasse
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {...}
  async getUserByUsername(username: string): Promise<User | undefined> {...}
  async createUser(insertUser: InsertUser): Promise<User> {...}
}
```

## 8. Erweiterungs- und Wartungshinweise

### Hinzufügen neuer Funktionen
1. **Neue Scraping-Funktionalität**:
   - Erweiterung des Scrapers in `services/scraper.ts` für neue Datenextraktion
   - Implementierung robuster Fallback-Strategien für verschiedene Website-Strukturen

2. **Neue AI-Stile oder -Modelle**:
   - Hinzufügen neuer Stile in `styleDescriptions` und entsprechender Beispiele in `getFewShotExamples`
   - Anpassung der Parameter in `getGenerationParams` für den neuen Stil

3. **Neue Post-Features**:
   - Erweiterung des `SourceInfo`-Types in `shared/schema.ts`
   - Aktualisierung der `SourceInformation`-Komponente im Frontend

### Bekannte Einschränkungen und Lösungen
1. **Preis- und Dauerinformationen können fehlen**:
   - Die aktuelle Implementierung hat mehrere Extraktionsstrategien
   - Bei Fehlern könnte das Hinzufügen weiterer Selektoren helfen

2. **Cache-Management**:
   - Der In-Memory-Cache wird bei Server-Neustarts gelöscht
   - Implementierung eines persistenten Caches wäre eine sinnvolle Erweiterung

3. **Nutzung unterschiedlicher KI-Modelle**:
   - Derzeit wird ausschließlich Gemini verwendet
   - Ein Fallback auf andere KI-Modelle könnte die Zuverlässigkeit erhöhen

## 9. Umgebungsvariablen und Konfiguration

Die Anwendung benötigt folgende Umgebungsvariablen:

```
# Datenbank-Konfiguration
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
PGHOST=<host>
PGDATABASE=<database>
PGPASSWORD=<password>
PGPORT=<port>
PGUSER=<user>

# AI-API-Schlüssel
GEMINI_API_KEY=<gemini_api_key>
ANTHROPIC_API_KEY=<optional_anthropic_api_key>
```

## 10. Startanleitung

Um die Anwendung lokal zu starten:

1. **Abhängigkeiten installieren**:
   ```
   npm install
   ```

2. **Datenbank einrichten**:
   ```
   npm run db:push
   ```

3. **Entwicklungsserver starten**:
   ```
   npm run dev
   ```

4. **Produktion**:
   ```
   npm run build
   npm start
   ```

Die Anwendung läuft dann unter `http://localhost:5000`.

## 11. Zukünftige Entwicklungsmöglichkeiten

1. **Unterstützung für weitere Reiseportale**:
   - Erweiterung des Scrapers für andere Reiseportale als meinreisebuero24.com

2. **Mehrsprachige Post-Generierung**:
   - Unterstützung für WhatsApp-Posts in verschiedenen Sprachen

3. **Benutzerverwaltung und Zugriffsrechte**:
   - Implementierung des Benutzermodells für Mehrbenutzer-Umgebungen

4. **A/B-Testing für Post-Varianten**:
   - Generierung mehrerer Varianten und Tracking der Effektivität

5. **Post-Vorlagen**:
   - Speichern und Wiederverwenden erfolgreicher Post-Formate

6. **Bilder-Integration**:
   - Extraktion und Embedding von Hotel-Bildern in den Post-Workflow