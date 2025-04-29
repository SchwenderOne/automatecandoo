import axios from "axios";
import * as cheerio from "cheerio";

interface HotelData {
  hotelName: string;
  hotelCategory?: string;
  destination: string;
  features: string[];
  featureIcons?: string[];
  amenities: string[];
  description?: string;
  imageUrl?: string;
}

export async function scrapeHotelData(url: string): Promise<HotelData | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
      },
    });

    const $ = cheerio.load(response.data);
    
    // Extract hotel name
    const hotelName = $('h1.hotel-name').text().trim() || 
                       $('.hotel-title').text().trim() || 
                       $('h1').first().text().trim();
    
    // Extract hotel category/stars
    let hotelCategory: string | undefined;
    const starsElement = $('.stars, .hotel-stars');
    
    if (starsElement.length) {
      const starsCount = starsElement.find('.icon-star, .star-icon').length || 
                         starsElement.find('[class*="star"]').length;
      if (starsCount > 0) {
        hotelCategory = `${starsCount}-Sterne Hotel`;
      }
    }
    
    // Extract destination
    let destination = $('.hotel-location, .destination, .location').text().trim();
    if (!destination) {
      // Try to find location in breadcrumbs or other elements
      $('.breadcrumb li, .breadcrumbs span, .breadcrumb-item').each((_, el) => {
        const text = $(el).text().trim();
        if (text && !text.includes('Home') && !text.includes('Hotels') && !hotelName.includes(text)) {
          destination = destination ? `${destination}, ${text}` : text;
        }
      });
    }
    
    // If still no destination, try to extract from URL or page content
    if (!destination) {
      const urlParts = url.split('/');
      for (const part of urlParts) {
        if (part !== 'hotel' && part !== 'hotels' && !part.includes('meinreisebuero24') && 
            !part.includes('http') && part.length > 3 && !part.includes('.com')) {
          destination = part.replace(/-/g, ' ');
          break;
        }
      }
    }
    
    // Format destination
    destination = destination.replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase())
                            .replace(/-/g, ' ');
    
    // Extract features
    const features: string[] = [];
    const featureIcons: string[] = [];
    
    // Look for feature lists
    $('.features li, .amenities li, .hotel-features li, .facility-item, [class*="feature"] li, [class*="amenity"] li')
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && !features.includes(text)) {
          features.push(text);
          
          // Try to extract icon if available
          const iconEl = $(el).find('i, svg, [class*="icon"]');
          if (iconEl.length) {
            const iconClass = iconEl.attr('class') || '';
            // Map common icon classes to emoji
            let emoji = '✓';
            if (iconClass.includes('wifi')) emoji = '📶';
            else if (iconClass.includes('pool')) emoji = '🏊';
            else if (iconClass.includes('restaurant')) emoji = '🍽️';
            else if (iconClass.includes('bar')) emoji = '🍹';
            else if (iconClass.includes('spa')) emoji = '💆';
            else if (iconClass.includes('gym')) emoji = '💪';
            else if (iconClass.includes('beach')) emoji = '🏖️';
            featureIcons.push(emoji);
          } else {
            featureIcons.push('✓');
          }
        }
      });
    
    // If no specific features found, look for more general descriptions
    if (features.length === 0) {
      $('p, .description, [class*="description"], [class*="feature"], [class*="amenity"]')
        .each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 15 && text.length < 100 && 
              !text.includes('http') && !text.includes('€')) {
            // Split into sentences or by special characters
            const parts = text.split(/[.;:!?]/);
            for (const part of parts) {
              const trimmedPart = part.trim();
              if (trimmedPart && trimmedPart.length > 10 && !features.includes(trimmedPart)) {
                features.push(trimmedPart);
                featureIcons.push('✓');
                if (features.length >= 5) break;
              }
            }
          }
          if (features.length >= 5) return false;
        });
    }
    
    // Extract amenities (may overlap with features)
    const amenities: string[] = [];
    $('.amenities li, .facilities li, [class*="amenity"] li, [class*="facility"] li')
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && !amenities.includes(text)) {
          amenities.push(text);
        }
      });
    
    // Extract description
    let description: string | undefined;
    $('.hotel-description, .description, [class*="description"]')
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 50) {
          description = text;
          return false;
        }
      });
    
    // Extract main image URL
    let imageUrl: string | undefined;
    $('.hotel-image img, .carousel img, .gallery img, .slider img, [class*="hotel"] img')
      .each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.includes('logo') && !imageUrl) {
          imageUrl = src.startsWith('http') ? src : `https://www.meinreisebuero24.com${src}`;
          return false;
        }
      });
    
    // If features list is too short, try to extract more from the description
    if (features.length < 3 && description) {
      const sentences = description.split(/[.!?]+/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed && trimmed.length > 15 && trimmed.length < 100 && !features.includes(trimmed)) {
          features.push(trimmed);
          featureIcons.push('✓');
          if (features.length >= 5) break;
        }
      }
    }
    
    // Ensure we have destination
    if (!destination && hotelName) {
      destination = "Traumhafte Lage";
    }
    
    // Limit features to top 5
    const limitedFeatures = features.slice(0, 5);
    const limitedFeatureIcons = featureIcons.slice(0, 5);
    
    return {
      hotelName,
      hotelCategory,
      destination,
      features: limitedFeatures,
      featureIcons: limitedFeatureIcons,
      amenities,
      description,
      imageUrl
    };
  } catch (error) {
    console.error("Error scraping hotel data:", error);
    return null;
  }
}
