import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { generatePostSchema } from "@shared/schema";
import { scrapeHotelData } from "./services/scraper";
import { generateWhatsAppPost } from "./services/gemini";

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

      // Scrape hotel data from the provided URL
      const hotelData = await scrapeHotelData(url);
      
      if (!hotelData) {
        return res.status(404).json({
          message: "Konnte keine Informationen von der angegebenen URL extrahieren",
        });
      }

      // Generate WhatsApp post using Gemini AI
      const generatedPost = await generateWhatsAppPost(hotelData, {
        useEmojis,
        style,
      });

      // Return generated post along with extracted source information
      return res.status(200).json({
        generatedPost: generatedPost,
        sourceInfo: {
          hotelName: hotelData.hotelName,
          hotelCategory: hotelData.hotelCategory,
          destination: hotelData.destination,
          featuresWithIcons: hotelData.features.map((feature, index) => ({
            icon: hotelData.featureIcons?.[index] || "✓",
            text: feature
          })),
          originalUrl: url
        }
      });
    } catch (error) {
      console.error("Error generating post:", error);
      
      return res.status(500).json({
        message: "Es ist ein Fehler beim Generieren des Posts aufgetreten",
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
