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
  price?: string;
  duration?: string;
}

function cleanPrice(priceText: string): string {
  // Standardize the price format
  const price = priceText
    .replace(/[^\d,.€]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Make sure it has the € symbol and "ab" prefix if missing
  if (!price.includes('ab') && /\d/.test(price)) {
    return `ab ${price.includes('€') ? price : price + ' €'}`;
  }
  
  return price.includes('€') ? price : price + ' €';
}

export async function scrapeHotelData(url: string): Promise<HotelData | null> {
  try {
    // Use a more robust fetch with retries
    let retryCount = 0;
    let response = null;
    
    while (retryCount < 3) {
      try {
        response = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          },
          timeout: 10000, // 10 second timeout
        });
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (retryCount >= 3) throw error; // Re-throw after final retry
        await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
      }
    }

    if (!response || !response.data) {
      throw new Error("Failed to fetch hotel data");
    }

    const $ = cheerio.load(response.data);
    
    // Extract hotel name - clean up any URL parameters that might be in the title
    let hotelName = $('h1.hotel-name').text().trim() || 
                   $('.hotel-title').text().trim() || 
                   $('h1').first().text().trim();
    
    // If we got "B" as the hotel name but "B&B" is in the title, fix it
    if (hotelName === 'B') {
      const pageTitle = $('title').text().trim();
      if (pageTitle.includes('B&B')) {
        // Try to extract the full hotel name from title
        const titleMatch = pageTitle.match(/B&B\s+[\w\s\d]+/i);
        if (titleMatch) {
          hotelName = titleMatch[0].trim();
        } else {
          hotelName = 'B&B Hotel'; // Fallback if we can't extract the full name
        }
      }
    }
    
    // Clean up the hotel name if it contains URL parameters, but preserve B&B
    if (hotelName.includes('?')) {
      hotelName = hotelName.split('?')[0].trim();
    }
    
    // Extract hotel category/stars
    let hotelCategory: string | undefined;
    const starsElement = $('.stars, .hotel-stars, .category');
    
    if (starsElement.length) {
      const starsCount = starsElement.find('.icon-star, .star-icon, [class*="star"]').length;
      if (starsCount > 0) {
        hotelCategory = `${starsCount}-Sterne Hotel`;
      }
    }
    
    // If no stars found, try to find it in text
    if (!hotelCategory) {
      const pageText = $('body').text();
      for (let i = 5; i > 0; i--) {
        if (pageText.includes(`${i} Sterne`) || pageText.includes(`${i} Stern`) || 
            pageText.includes(`${i}-Sterne`) || pageText.includes(`${i}*`)) {
          hotelCategory = `${i}-Sterne Hotel`;
          break;
        }
      }
    }
    
    // Extract price - look for price elements
    let price: string | undefined;
    $('[class*="price"], .price, .total-price, .offer-price, .rate-price, [class*="Price"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.includes('€') && !price) {
        price = text.replace(/[^\d,.€]+/g, ' ').trim();
        return false;
      }
    });
    
    // If still no price, try to find it in the page content
    if (!price) {
      // Look for text with € symbol and numbers
      const priceRegex = /ab\s*(\d+[\.,]?\d*)\s*€|(\d+[\.,]?\d*)\s*€\s*p\.P\./i;
      const bodyText = $('body').text();
      const priceMatch = bodyText.match(priceRegex);
      if (priceMatch) {
        price = `ab ${priceMatch[1] || priceMatch[2]} €`;
      }
    }
    
    // Extract duration
    let duration: string | undefined;
    $('[class*="duration"], .stay-duration, .travel-duration, [class*="Duration"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && (text.includes('Tag') || text.includes('Nacht') || text.includes('Übernacht'))) {
        duration = text;
        return false;
      }
    });
    
    // If still no duration, try to find it in text
    if (!duration) {
      const durationRegex = /(\d+)\s*(?:Tage|Nächte|Übernachtungen|ÜN)/i;
      const bodyText = $('body').text();
      const durationMatch = bodyText.match(durationRegex);
      if (durationMatch) {
        duration = `${durationMatch[1]} Tage`;
      }
    }
    
    // Extract destination - much more carefully now
    let destination = '';
    
    // First try specific destination elements
    $('.destination, .location, .city, [class*="location"], [class*="destination"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && !text.includes(hotelName) && !text.includes('http')) {
        destination = text;
        return false;
      }
    });
    
    // If no destination yet, try breadcrumbs
    if (!destination) {
      $('.breadcrumb, .breadcrumbs, [class*="breadcrumb"]').find('li, span, a').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && 
            !text.toLowerCase().includes('home') && 
            !text.toLowerCase().includes('start') && 
            !text.toLowerCase().includes('hotel') && 
            !text.includes(hotelName)) {
          destination = text;
          return false;
        }
      });
    }
    
    // Last resort: extract from URL
    if (!destination) {
      // Split URL by slashes and look for location parts
      const urlParts = url.split('/');
      for (const part of urlParts) {
        if (part && part.length > 3 && 
            !part.includes('hotel') && 
            !part.includes('meinreisebuero24') && 
            !part.includes('www') && 
            !part.includes('http') && 
            !part.includes('.com') && 
            !part.includes('.de')) {
          destination = part.replace(/-/g, ' ');
          break;
        }
      }
    }
    
    // Format destination - capitalize words and clean up
    if (destination) {
      destination = destination
        .replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase())
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      destination = "Traumdestination";
    }
    
    // Extract quality hotel features - not website navigation elements!
    const features: string[] = [];
    const featureIcons: string[] = [];
    
    // Filter out error messages from page content before extracting features
    const errorMessageEl = $('body').find(':contains("Leider sind zu Ihrer Suche keine passenden Angebote verfügbar")');
    if (errorMessageEl.length > 0) {
      // Remove the error message element to prevent it from being extracted as a feature
      errorMessageEl.remove();
    }
    
    // Keywords that indicate real hotel features vs. website elements
    const hotelFeatureKeywords = [
      'pool', 'strand', 'meer', 'zimmer', 'frühstück', 'restaurant', 'spa', 'wellness',
      'lage', 'zentral', 'aussicht', 'blick', 'view', 'familie', 'kinder', 'suite',
      'design', 'bar', 'terrasse', 'balkon', 'service', 'sport', 'aktivität', 'lounge',
      'fitness', 'massage', 'sauna', 'garten', 'beach', 'zentrum', 'natur', 'luxus'
    ];
    
    // Keywords that indicate it's NOT a hotel feature but website navigation
    const nonFeatureKeywords = [
      'kontakt', 'impressum', 'datenschutz', 'agb', 'login', 'registrieren', 'anmelden',
      'abmelden', 'buchen', 'anfrage', 'suchen', 'telefon', 'e-mail', 'newsletter',
      'konto', 'menü', 'reisebüro', 'finden', 'ucandoo', 'zahlbar', 'reisebüro', 'seite',
      'verlassen', 'neuendorfer', 'straße', 'gmbh', 'persönlich'
    ];
    
    // Helper function to check if text is a likely hotel feature
    const isLikelyHotelFeature = (text: string): boolean => {
      const lowerText = text.toLowerCase();
      
      // Immediately exclude error messages or "no offers available" type content
      if (lowerText.includes("keine angebote") || 
          lowerText.includes("nicht verfügbar") || 
          lowerText.includes("keine ergebnisse") ||
          lowerText.includes("leider") ||
          lowerText.includes("suche") ||
          lowerText.includes("sorry") ||
          lowerText.includes("fehler")) {
        return false;
      }
      
      // Check if it contains hotel feature keywords
      const hasFeatureKeyword = hotelFeatureKeywords.some(keyword => lowerText.includes(keyword));
      
      // Check if it contains non-feature keywords
      const hasNonFeatureKeyword = nonFeatureKeywords.some(keyword => lowerText.includes(keyword));
      
      // Check length is appropriate for a feature (not too short, not too long)
      const hasGoodLength = text.length > 8 && text.length < 70;
      
      // Check for common patterns in non-features (URLs, phone numbers, etc.)
      const isSpecialPattern = lowerText.includes('http') || 
                               lowerText.includes('@') || 
                               lowerText.includes('tel:') ||
                               /^\+?\d[\d\s-]{7,}$/.test(lowerText) || // Phone number pattern
                               lowerText.includes('gmbh') ||
                               lowerText.includes('persönlich') ||
                               lowerText.includes('str.') ||
                               lowerText.includes('straße');
      
      return hasFeatureKeyword && !hasNonFeatureKeyword && hasGoodLength && !isSpecialPattern;
    };
    
    // Look for feature lists
    $('.features li, .amenities li, .hotel-features li, .facility-item, [class*="feature"] li, [class*="amenity"] li, .highlights li')
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && !features.includes(text) && isLikelyHotelFeature(text)) {
          features.push(text);
          
          // Try to extract icon if available or assign based on text content
          const iconEl = $(el).find('i, svg, [class*="icon"]');
          let emoji = '✓';
          
          if (iconEl.length) {
            const iconClass = iconEl.attr('class') || '';
            // Map common icon classes to emoji
            if (iconClass.includes('wifi')) emoji = '📶';
            else if (iconClass.includes('pool')) emoji = '🏊‍♀️';
            else if (iconClass.includes('restaurant') || iconClass.includes('food')) emoji = '🍽️';
            else if (iconClass.includes('bar') || iconClass.includes('drink')) emoji = '🍹';
            else if (iconClass.includes('spa') || iconClass.includes('wellness')) emoji = '💆‍♂️';
            else if (iconClass.includes('gym') || iconClass.includes('fitness')) emoji = '💪';
            else if (iconClass.includes('beach') || iconClass.includes('sand')) emoji = '🏖️';
          } else {
            // Assign emoji based on text content
            const lowerText = text.toLowerCase();
            if (lowerText.includes('wifi') || lowerText.includes('wlan') || lowerText.includes('internet')) emoji = '📶';
            else if (lowerText.includes('pool') || lowerText.includes('schwimm')) emoji = '🏊‍♀️';
            else if (lowerText.includes('restau') || lowerText.includes('essen') || lowerText.includes('frühstück') || 
                    lowerText.includes('dining') || lowerText.includes('buffet')) emoji = '🍽️';
            else if (lowerText.includes('bar') || lowerText.includes('cocktail') || lowerText.includes('getränk')) emoji = '🍹';
            else if (lowerText.includes('spa') || lowerText.includes('wellness') || lowerText.includes('massage')) emoji = '💆‍♂️';
            else if (lowerText.includes('gym') || lowerText.includes('fitness') || lowerText.includes('sport')) emoji = '💪';
            else if (lowerText.includes('strand') || lowerText.includes('beach') || lowerText.includes('meer')) emoji = '🏖️';
            else if (lowerText.includes('zimmer') || lowerText.includes('suite') || lowerText.includes('bett')) emoji = '🛏️';
            else if (lowerText.includes('lage') || lowerText.includes('zentral') || lowerText.includes('location')) emoji = '📍';
            else if (lowerText.includes('blick') || lowerText.includes('aussicht') || lowerText.includes('view')) emoji = '🌇';
            else if (lowerText.includes('familie') || lowerText.includes('kinder') || lowerText.includes('family')) emoji = '👨‍👩‍👧‍👦';
            else if (lowerText.includes('design') || lowerText.includes('stil') || lowerText.includes('modern')) emoji = '🎨';
          }
          
          featureIcons.push(emoji);
        }
      });
    
    // If we couldn't find good feature lists, try to get features from description paragraphs
    if (features.length < 4) {
      $('.description p, .hotel-description p, .about p, [class*="description"] p, [class*="content"] p').each((_, el) => {
        const text = $(el).text().trim();
        
        // Skip very short or very long paragraphs
        if (text && text.length > 20 && text.length < 200) {
          // Split into sentences
          const sentences = text.split(/[.!?]+/);
          
          for (const sentence of sentences) {
            const trimmed = sentence.trim();
            
            if (trimmed && trimmed.length > 15 && trimmed.length < 70 && 
                !features.includes(trimmed) && isLikelyHotelFeature(trimmed)) {
              
              // Assign an emoji based on content
              let emoji = '✓';
              const lowerTrimmed = trimmed.toLowerCase();
              
              if (lowerTrimmed.includes('wifi') || lowerTrimmed.includes('wlan')) emoji = '📶';
              else if (lowerTrimmed.includes('pool')) emoji = '🏊‍♀️';
              else if (lowerTrimmed.includes('restau') || lowerTrimmed.includes('essen') || 
                      lowerTrimmed.includes('frühstück')) emoji = '🍽️';
              else if (lowerTrimmed.includes('bar') || lowerTrimmed.includes('cocktail')) emoji = '🍹';
              else if (lowerTrimmed.includes('spa') || lowerTrimmed.includes('wellness')) emoji = '💆‍♂️';
              else if (lowerTrimmed.includes('gym') || lowerTrimmed.includes('fitness')) emoji = '💪';
              else if (lowerTrimmed.includes('strand') || lowerTrimmed.includes('meer')) emoji = '🏖️';
              else if (lowerTrimmed.includes('zimmer') || lowerTrimmed.includes('suite')) emoji = '🛏️';
              else if (lowerTrimmed.includes('lage') || lowerTrimmed.includes('zentral')) emoji = '📍';
              else if (lowerTrimmed.includes('blick') || lowerTrimmed.includes('aussicht')) emoji = '🌇';
              else if (lowerTrimmed.includes('familie') || lowerTrimmed.includes('kinder')) emoji = '👨‍👩‍👧‍👦';
              else if (lowerTrimmed.includes('design') || lowerTrimmed.includes('stil')) emoji = '🎨';
              
              features.push(trimmed);
              featureIcons.push(emoji);
              
              if (features.length >= 5) break;
            }
          }
          
          if (features.length >= 5) return false;
        }
      });
    }
    
    // Extract amenities (may overlap with features)
    const amenities: string[] = [];
    $('.amenities li, .facilities li, [class*="amenity"] li, [class*="facility"] li')
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && !amenities.includes(text) && isLikelyHotelFeature(text)) {
          amenities.push(text);
        }
      });
    
    // Extract description
    let description: string | undefined;
    $('.hotel-description, .description, [class*="description"], .content p, [class*="about"] p')
      .each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 50 && !text.includes('http')) {
          description = text;
          return false;
        }
      });
    
    // Extract main image URL
    let imageUrl: string | undefined;
    $('.hotel-image img, .carousel img, .gallery img, .slider img, [class*="hotel"] img, .main-image img')
      .each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !src.includes('logo') && !imageUrl) {
          imageUrl = src.startsWith('http') ? src : `https://www.meinreisebuero24.com${src}`;
          return false;
        }
      });
    
    // If features list is too short, try to get more from amenities
    if (features.length < 4 && amenities.length > 0) {
      for (let i = 0; i < amenities.length && features.length < 5; i++) {
        if (!features.includes(amenities[i])) {
          features.push(amenities[i]);
          
          // Assign emojis based on content
          let emoji = '✓';
          const lowerAmenity = amenities[i].toLowerCase();
          
          if (lowerAmenity.includes('wifi') || lowerAmenity.includes('wlan')) emoji = '📶';
          else if (lowerAmenity.includes('pool')) emoji = '🏊‍♀️';
          else if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('essen')) emoji = '🍽️';
          else if (lowerAmenity.includes('bar')) emoji = '🍹';
          else if (lowerAmenity.includes('spa') || lowerAmenity.includes('wellness')) emoji = '💆‍♂️';
          else if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) emoji = '💪';
          else if (lowerAmenity.includes('strand') || lowerAmenity.includes('meer')) emoji = '🏖️';
          
          featureIcons.push(emoji);
        }
      }
    }
    
    // If we still don't have enough features, create some general ones based on hotel category
    if (features.length < 4) {
      const defaultFeatures = [
        {text: `Komfortable Zimmer mit stilvollem Design`, emoji: '🛏️'},
        {text: `Ideale Lage für Ihren ${destination} Aufenthalt`, emoji: '📍'},
        {text: `Hervorragender Service und Komfort`, emoji: '👑'},
        {text: `Entspannung und Erholung garantiert`, emoji: '🧘'}
      ];
      
      for (let i = 0; i < defaultFeatures.length && features.length < 4; i++) {
        if (!features.includes(defaultFeatures[i].text)) {
          features.push(defaultFeatures[i].text);
          featureIcons.push(defaultFeatures[i].emoji);
        }
      }
    }
    
    // Validate the extracted data before returning
    if (!hotelName || hotelName.length < 3) {
      console.warn("Scraped hotel name is invalid:", hotelName);
      return null;
    }
    
    if (!destination || destination === "Traumdestination") {
      // Try harder to find a destination by looking at the URL path
      const urlPath = new URL(url).pathname.split('/');
      const potentialDestinations = urlPath.filter(part => 
        part.length > 3 && 
        !part.includes('.') && 
        !part.includes('hotel') &&
        !part.includes('angebot') &&
        !part.includes('zimmer')
      );
      
      if (potentialDestinations.length > 0) {
        destination = potentialDestinations[0]
          .replace(/-/g, ' ')
          .replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
      }
    }
    
    // If price is found, format it properly
    if (price) {
      price = cleanPrice(price);
    }
    
    // Make sure we have at least some features
    if (features.length === 0) {
      console.warn("No features found for hotel:", hotelName);
      // Add some generic features based on hotel category if available
      if (hotelCategory && hotelCategory.includes('5')) {
        features.push("Luxuriöse Ausstattung");
        features.push("Erstklassiger Service");
        featureIcons.push("✨");
        featureIcons.push("👑");
      } else if (hotelCategory && hotelCategory.includes('4')) {
        features.push("Komfortable Zimmer");
        features.push("Qualitätsservice");
        featureIcons.push("🛏️");
        featureIcons.push("👍");
      }
    }
    
    // Create final limited features arrays
    const finalFeatures = features.slice(0, 5);
    const finalFeatureIcons = featureIcons.slice(0, 5);
    
    // Make sure we have enough icons for all features
    while (finalFeatureIcons.length < finalFeatures.length) {
      finalFeatureIcons.push("✓");
    }
    
    // Log successful extraction
    console.log(`Successfully extracted data for ${hotelName} in ${destination}`);
    
    return {
      hotelName,
      hotelCategory,
      destination,
      features: finalFeatures,
      featureIcons: finalFeatureIcons,
      amenities,
      description,
      imageUrl,
      price,
      duration
    };
  } catch (error: any) { // Type assertion to handle Error properties
    console.error("Error scraping hotel data:", error);
    
    // Retry with a different approach if the error is related to network 
    // or if there's a specific scraping issue
    if (error.message && typeof error.message === 'string' && (
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('status code 4') || 
        error.message.includes('status code 5'))) {
      console.log("Retrying with fallback method...");
      try {
        // Implement fallback scraping logic here
        return null;
      } catch (fallbackError) {
        console.error("Fallback scraping also failed:", fallbackError);
        return null;
      }
    }
    
    return null;
  }
}
