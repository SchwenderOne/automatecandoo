import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { generatePostSchema, insertPostGenerationSchema, postGenerations } from "@shared/schema";
import { scrapeHotelData } from "./services/scraper";
import { generateWhatsAppPost } from "./services/gemini";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { cache } from "./services/cache";

// Typ für minimale Hotel-Daten zur Dummy-Generierung
type DummyHotelData = {
  hotelName: string;
  destination: string;
  features: string[];
};

// Fallback-Generator bei Gemini-Quota-Fehlern
function generateDummyPost(hotelData: DummyHotelData, options: { useEmojis: boolean; style: string }) {
  const { useEmojis } = options;
  let content = `${useEmojis ? "🏨" : ""} ${hotelData.hotelName} in ${hotelData.destination}`;
  const features = hotelData.features.slice(0, 5)
    .map((f) => `${useEmojis ? "✅" : "-"} ${f}`)
    .join("\n");
  content += "\n" + features;
  content += "\n💳 Du buchst jetzt – und zahlst später ganz flexibel mit ucandoo.";
  content += "\n👉 Jetzt buchen\n👉 Ratenrechner\n👉 Reisebüro finden";
  content += "\n✨ Demo-Modus: KI-Quota erreicht, nutze Platzhalter-Inhalt ✨";
  content += "\n➡️ Probiere es später erneut";
  return content;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate WhatsApp post from travel offer URL
  app.post("/api/generate-post", async (req, res) => {
    try {
      // Validate request body
      const result = generatePostSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          message: "Ungültige Anfrage",
          errors: result.error.format(),
        });
      }
      
      const { url, useEmojis, style } = result.data;

      // Validate URL is from meinreisebuero24.com
      if (!url.includes("meinreisebuero24.com")) {
        return res.status(400).json({
          message: "Die URL muss von meinreisebuero24.com sein",
        });
      }

      // Cache-Schlüssel generieren
      const cacheKey = `post:${url}:${useEmojis}:${style}`;
      
      // Versuche, aus dem Cache zu laden
      const cachedResponse = cache.get<any>(cacheKey);
      if (cachedResponse) {
        console.log(`Cache hit für URL: ${url}`);
        return res.status(200).json(cachedResponse);
      }
      
      console.log(`Cache miss für URL: ${url}, generiere neuen Post...`);
      
      // Versuche separates Caching für die gescrapten Daten
      const scrapeCacheKey = `scrape:${url}`;
      let hotelData = cache.get<any>(scrapeCacheKey);
      
      if (!hotelData) {
        // Scrape hotel data from the provided URL
        hotelData = await scrapeHotelData(url);
        
        if (!hotelData) {
          return res.status(404).json({
            message: "Konnte keine Informationen von der angegebenen URL extrahieren",
          });
        }
        
        // Cache die Scraping-Ergebnisse mit längerer TTL (24h)
        cache.set(scrapeCacheKey, hotelData, 24 * 60 * 60);
      }

      // Generate WhatsApp post using Gemini AI
      let generatedPost;
      try {
        generatedPost = await generateWhatsAppPost(hotelData, { useEmojis, style });
      } catch (error) {
        console.error("Gemini API Fehler:", error);
        generatedPost = generateDummyPost(hotelData, { useEmojis, style });
      }

      // Prepare features with icons
      const featuresWithIcons = hotelData.features.map((feature: string, index: number) => ({
        icon: hotelData.featureIcons?.[index] || "✓",
        text: feature
      }));

      // Erstelle die Antwort
      const responseData = {
        generatedPost: generatedPost,
        originalPost: generatedPost,
        sourceInfo: {
          hotelName: hotelData.hotelName,
          hotelCategory: hotelData.hotelCategory,
          destination: hotelData.destination,
          featuresWithIcons: featuresWithIcons,
          customSections: [], // Initial leer
          originalUrl: url
        }
      };
      
      // Cache die Antwort mit einer TTL von 6 Stunden
      cache.set(cacheKey, responseData, 6 * 60 * 60);

      // Speichere den Post in der Datenbank
      const [savedPost] = await db.insert(postGenerations).values({
        sourceUrl: url,
        generatedPost: generatedPost,
        originalPost: generatedPost, // Original-Post zum Vergleich speichern
        hotelName: hotelData.hotelName,
        hotelCategory: hotelData.hotelCategory,
        destination: hotelData.destination,
        features: featuresWithIcons,
        customSections: [], // Initial leer
        createdAt: new Date().toISOString()
      }).returning();

      // Return generated post along with extracted source information
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Error generating post:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      // Behandle Rate-Limit-Fehler der Gemini API als 429
      if (errMsg.includes("429") || errMsg.includes("Too Many Requests")) {
        return res.status(429).json({
          message: "API-Quota überschritten. Bitte warte kurz und versuche es erneut.",
        });
      }
      return res.status(500).json({
        message: "Es ist ein Fehler beim Generieren des Posts aufgetreten",
        error: errMsg,
      });
    }
  });

  // Endpoint zum Speichern aktualisierter Post-Informationen
  app.post("/api/posts/:id/update", async (req, res) => {
    try {
      const { id } = req.params;
      const { updatedPost, sourceInfo } = req.body;
      
      // Validiere die Anfrage
      if (!updatedPost || !sourceInfo) {
        return res.status(400).json({
          message: "Ungültige Anfrage: updatedPost und sourceInfo sind erforderlich"
        });
      }
      
      // Suche den Post in der Datenbank
      const [existingPost] = await db
        .select()
        .from(postGenerations)
        .where(eq(postGenerations.id, parseInt(id)));
      
      if (!existingPost) {
        return res.status(404).json({
          message: "Post nicht gefunden"
        });
      }
      
      // Cache-Einträge für die URL invalidieren
      if (existingPost.sourceUrl) {
        // Alle möglichen Cache-Schlüssel für die URL entfernen
        const url = existingPost.sourceUrl;
        console.log(`Invalidiere Cache-Einträge für URL: ${url}`);
        
        // Entferne Scrape-Cache
        cache.delete(`scrape:${url}`);
        
        // Entferne Post-Caches für alle Style- und Emoji-Kombinationen
        ['true', 'false'].forEach(emojis => {
          ['enthusiastic', 'elegant', 'family', 'adventure'].forEach(style => {
            cache.delete(`post:${url}:${emojis}:${style}`);
          });
        });
      }
      
      // Aktualisiere den Post in der Datenbank
      const [updatedPostEntry] = await db
        .update(postGenerations)
        .set({
          generatedPost: updatedPost,
          hotelName: sourceInfo.hotelName,
          hotelCategory: sourceInfo.hotelCategory,
          destination: sourceInfo.destination,
          features: sourceInfo.featuresWithIcons,
          customSections: sourceInfo.customSections
        })
        .where(eq(postGenerations.id, parseInt(id)))
        .returning();
      
      return res.status(200).json({
        message: "Post erfolgreich aktualisiert",
        post: updatedPostEntry
      });
    } catch (error) {
      console.error("Error updating post:", error);
      
      return res.status(500).json({
        message: "Es ist ein Fehler beim Aktualisieren des Posts aufgetreten",
        error: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
    }
  });
  
  // Endpoint zum Hinzufügen eines neuen benutzerdefinierten Abschnitts
  app.post("/api/posts/:id/custom-section", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, items } = req.body;
      
      // Validiere die Anfrage
      if (!title || !items || !Array.isArray(items)) {
        return res.status(400).json({
          message: "Ungültige Anfrage: title und items (Array) sind erforderlich"
        });
      }
      
      // Suche den Post in der Datenbank
      const [existingPost] = await db
        .select()
        .from(postGenerations)
        .where(eq(postGenerations.id, parseInt(id)));
      
      if (!existingPost) {
        return res.status(404).json({
          message: "Post nicht gefunden"
        });
      }
      
      // Cache-Einträge für die URL invalidieren, da sich der Inhalt ändert
      if (existingPost.sourceUrl) {
        // Alle möglichen Cache-Schlüssel für die URL entfernen
        const url = existingPost.sourceUrl;
        console.log(`Invalidiere Cache-Einträge für URL (Custom Section): ${url}`);
        
        // Entferne Post-Caches für alle Style- und Emoji-Kombinationen
        ['true', 'false'].forEach(emojis => {
          ['enthusiastic', 'elegant', 'family', 'adventure'].forEach(style => {
            cache.delete(`post:${url}:${emojis}:${style}`);
          });
        });
      }
      
      // Füge den neuen Abschnitt hinzu
      const currentCustomSections = existingPost.customSections || [];
      const updatedCustomSections = [
        ...currentCustomSections,
        { title, items }
      ];
      
      // Aktualisiere den Post in der Datenbank
      const [updatedPost] = await db
        .update(postGenerations)
        .set({
          customSections: updatedCustomSections
        })
        .where(eq(postGenerations.id, parseInt(id)))
        .returning();
      
      return res.status(200).json({
        message: "Benutzerdefinierter Abschnitt erfolgreich hinzugefügt",
        customSections: updatedPost.customSections
      });
    } catch (error) {
      console.error("Error adding custom section:", error);
      
      return res.status(500).json({
        message: "Es ist ein Fehler beim Hinzufügen des benutzerdefinierten Abschnitts aufgetreten",
        error: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
    }
  });
  
  // Endpoint, um einen Feature-Punkt zu einem bestehenden Abschnitt hinzuzufügen
  app.post("/api/posts/:id/add-feature", async (req, res) => {
    try {
      const { id } = req.params;
      const { sectionIndex, text, icon } = req.body;
      
      // Validiere die Anfrage
      if (text === undefined || (sectionIndex !== undefined && typeof sectionIndex !== 'number')) {
        return res.status(400).json({
          message: "Ungültige Anfrage: text und optional sectionIndex (number) sind erforderlich"
        });
      }
      
      // Suche den Post in der Datenbank
      const [existingPost] = await db
        .select()
        .from(postGenerations)
        .where(eq(postGenerations.id, parseInt(id)));
      
      if (!existingPost) {
        return res.status(404).json({
          message: "Post nicht gefunden"
        });
      }
      
      // Je nachdem, ob es ein Haupt-Feature oder ein Abschnitts-Feature ist
      if (sectionIndex === undefined) {
        // Füge zu den Haupt-Features hinzu
        const currentFeatures = existingPost.features || [];
        const updatedFeatures = [
          ...currentFeatures,
          { text, icon: icon || "✓" }
        ];
        
        // Aktualisiere den Post in der Datenbank
        const [updatedPost] = await db
          .update(postGenerations)
          .set({
            features: updatedFeatures
          })
          .where(eq(postGenerations.id, parseInt(id)))
          .returning();
        
        return res.status(200).json({
          message: "Feature erfolgreich hinzugefügt",
          features: updatedPost.features
        });
      } else {
        // Füge zu einem benutzerdefinierten Abschnitt hinzu
        const currentSections = existingPost.customSections || [];
        
        if (sectionIndex < 0 || sectionIndex >= currentSections.length) {
          return res.status(400).json({
            message: "Ungültiger sectionIndex"
          });
        }
        
        // Deep copy der Sections
        const updatedSections = JSON.parse(JSON.stringify(currentSections));
        updatedSections[sectionIndex].items.push({ text, icon: icon || "✓" });
        
        // Aktualisiere den Post in der Datenbank
        const [updatedPost] = await db
          .update(postGenerations)
          .set({
            customSections: updatedSections
          })
          .where(eq(postGenerations.id, parseInt(id)))
          .returning();
        
        return res.status(200).json({
          message: "Feature zum benutzerdefinierten Abschnitt erfolgreich hinzugefügt",
          customSections: updatedPost.customSections
        });
      }
    } catch (error) {
      console.error("Error adding feature:", error);
      
      return res.status(500).json({
        message: "Es ist ein Fehler beim Hinzufügen des Features aufgetreten",
        error: error instanceof Error ? error.message : "Unbekannter Fehler"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
