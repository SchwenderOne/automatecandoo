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
  // Entferne alle nicht relevanten Zeichen (außer Zahlen, Kommas, Punkte und €-Symbol)
  let price = priceText
    .replace(/[^\d,.€]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Überprüfe, ob wir überhaupt eine Zahl haben
  if (!/\d/.test(price)) {
    return price; // Keine Zahl gefunden, gib den bereinigten Text zurück
  }
  
  // Normalisiere das Zahlenformat für deutsche Preise (1.234,56 €)
  // 1. Wenn wir ein Format wie 1234.56 haben, wandle es zu 1234,56 um
  if (price.includes('.') && !price.includes(',')) {
    const parts = price.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Sieht aus wie ein Dezimalpunkt
      price = parts[0] + ',' + parts[1];
    } else {
      // Tausender-Trennzeichen - entfernen
      price = price.replace(/\./g, '');
    }
  }
  
  // 2. Füge Tausender-Trennzeichen hinzu, wenn nötig
  if (price.includes(',')) {
    const parts = price.split(',');
    if (parts[0].length > 3) {
      // Zahlen mit mehr als 3 Stellen vor dem Komma
      const wholePart = parts[0];
      let formattedWholePart = '';
      for (let i = wholePart.length - 1, count = 0; i >= 0; i--, count++) {
        if (count > 0 && count % 3 === 0) {
          formattedWholePart = '.' + formattedWholePart;
        }
        formattedWholePart = wholePart[i] + formattedWholePart;
      }
      price = formattedWholePart + ',' + parts[1];
    }
  }
  
  // Stelle sicher, dass das €-Symbol korrekt formatiert ist
  price = price.includes('€') ? price : price + ' €';
  
  // Füge "ab" hinzu, wenn es nicht vorhanden ist (typisch für Hotelpreise)
  return price.toLowerCase().includes('ab') ? price : `ab ${price}`;
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
    
    // Extract price - look for price elements with multiple strategies
    let price: string | undefined;
    
    // Strategie 1: Suche nach speziellen Preis-Elementen
    $('[class*="price"], .price, .total-price, .offer-price, .rate-price, [class*="Price"], [class*="preis"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.includes('€') && /\d/.test(text) && !price) {
        price = cleanPrice(text);
        return false;
      }
    });
    
    // Strategie 2: Suche nach Preismustern im gesamten Text
    if (!price) {
      // Verschiedene Preismuster abdecken
      const priceRegexPatterns = [
        /ab\s*(\d+[\.,]?\d*)\s*€/i,                  // ab 799 €
        /(\d+[\.,]?\d*)\s*€\s*p\.P\./i,               // 799 € p.P.
        /preis\s*:?\s*(\d+[\.,]?\d*)\s*€/i,          // Preis: 799 €
        /(\d+[\.,]?\d*)\s*€\s*pro\s*Person/i,        // 799 € pro Person
        /(\d+[\.,]?\d*)\s*€\s*(\/|pro)\s*Nacht/i,    // 799 € pro Nacht oder 799 € / Nacht
        /(\d+[\.,]?\d*)\s*€\s*(\/|pro)\s*Zimmer/i    // 799 € pro Zimmer oder 799 € / Zimmer
      ];
      
      const bodyText = $('body').text();
      
      for (const regex of priceRegexPatterns) {
        const priceMatch = bodyText.match(regex);
        if (priceMatch && priceMatch[1]) {
          // Versuche, einen kompletten Preis zu extrahieren
          const priceText = priceMatch[0].trim();
          price = cleanPrice(priceText);
          break;
        }
      }
    }
    
    // Strategie 3: Intelligente Analyse von kurzen Text-Blöcken mit €-Symbol
    if (!price) {
      // Suche nach kurzen Text-Elementen, die das €-Symbol und Zahlen enthalten
      $('p, div, span').each((_, el) => {
        const text = $(el).text().trim();
        // Nur kurze Texte betrachten, die wahrscheinlich nur Preisangaben sind
        if (text && text.length < 50 && text.includes('€') && /\d/.test(text) && !price) {
          // Prüfe, ob dieser Text relevanter erscheint als reine Navigations- oder UI-Elemente
          if (!text.toLowerCase().includes('suchen') && 
              !text.toLowerCase().includes('buchen') && 
              !text.toLowerCase().includes('anmelden')) {
            price = cleanPrice(text);
            return false;
          }
        }
      });
    }
    
    // Wenn immer noch kein Preis gefunden wurde, aber ein Preis im Text erwähnt wird
    if (!price) {
      // Suche nach einer beliebigen Zahl gefolgt von €
      const simpleRegex = /(\d+[\.,]?\d*)\s*€/;
      const bodyText = $('body').text();
      const simpleMatch = bodyText.match(simpleRegex);
      if (simpleMatch && simpleMatch[1]) {
        price = cleanPrice(`${simpleMatch[1]} €`);
      }
    }
    
    // Extract duration - verbesserte Strategie
    let duration: string | undefined;
    
    // Strategie 1: Suche nach speziellen Dauer-Elementen
    $('[class*="duration"], .stay-duration, .travel-duration, [class*="Duration"], [class*="dauer"], [class*="aufenthalt"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && 
          (text.includes('Tag') || text.includes('Nacht') || text.includes('Übernacht') || text.includes('ÜN')) && 
          /\d/.test(text)) {
        duration = text
          .replace(/\s+/g, ' ')  // Normalisiere Whitespace
          .replace(/(\d+)\s*x/i, '$1')  // "3x Übernachtungen" -> "3 Übernachtungen"
          .trim();
        return false;
      }
    });
    
    // Strategie 2: Suche nach Dauermustern im Text mit verschiedenen Varianten
    if (!duration) {
      const durationPatterns = [
        /(\d+)\s*(?:Tage|Nächte|Übernachtungen|ÜN|Nacht)/i,
        /(?:Aufenthalt|Dauer)\s*:?\s*(\d+)\s*(?:Tage|Nächte|Übernachtungen|Tag|Nacht)/i,
        /(\d+)[-\s]Tages[-\s]Reise/i,
        /(\d+)[-\s]Tage[-\s]Angebot/i
      ];
      
      const bodyText = $('body').text();
      
      for (const pattern of durationPatterns) {
        const match = bodyText.match(pattern);
        if (match && match[1]) {
          const days = parseInt(match[1], 10);
          if (days > 0 && days < 31) { // Plausibilitätsprüfung
            // Bestimme die richtige Einheit basierend auf dem gefundenen Text
            let unit = 'Tage';
            if (match[0].toLowerCase().includes('nacht') || match[0].toLowerCase().includes('übernacht') || match[0].toLowerCase().includes('ün')) {
              unit = days === 1 ? 'Nacht' : 'Nächte';
            }
            
            duration = `${days} ${unit}`;
            break;
          }
        }
      }
    }
    
    // Strategie 3: Suche nach An- und Abreisedatum und berechne Differenz
    if (!duration) {
      // Suche nach An- und Abreisedatum im Format DD.MM.YYYY oder YYYY-MM-DD
      const dateRegex = /(?:Anreise|Check-in)[:;\s]+(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2}).*?(?:Abreise|Check-out)[:;\s]+(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})/i;
      const bodyText = $('body').text();
      const dateMatch = bodyText.match(dateRegex);
      
      if (dateMatch && dateMatch[1] && dateMatch[2]) {
        try {
          // Parse the dates
          let startDate, endDate;
          
          if (dateMatch[1].includes('.')) {
            // DD.MM.YYYY Format
            const [day, month, year] = dateMatch[1].split('.').map(Number);
            startDate = new Date(year, month - 1, day);
            
            const [endDay, endMonth, endYear] = dateMatch[2].split('.').map(Number);
            endDate = new Date(endYear, endMonth - 1, endDay);
          } else {
            // YYYY-MM-DD Format
            startDate = new Date(dateMatch[1]);
            endDate = new Date(dateMatch[2]);
          }
          
          // Calculate difference in days
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0 && diffDays < 31) { // Plausibilitätsprüfung
            duration = `${diffDays} ${diffDays === 1 ? 'Tag' : 'Tage'}`;
          }
        } catch (error) {
          console.error("Error parsing dates:", error);
          // Continue with other strategies
        }
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
        // Fallback: Versuche mit einem anderen User-Agent
        const response = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
            "Accept": "text/html,application/xhtml+xml,application/xml",
            "Accept-Language": "de-DE,de;q=0.9",
          },
          timeout: 15000, // Längerer Timeout für Fallback
        });
        
        if (!response || !response.data) {
          throw new Error("Fallback request failed: No data received");
        }
        
        // Sehr einfacher Fallback-Parser für absolute Mindestinformationen
        const $ = cheerio.load(response.data);
        
        // Extrahiere Hotel-Name (mindestens)
        const hotelName = $('h1').first().text().trim() || 
                         $('title').text().split('|')[0].trim() || 
                         "Hotel";
        
        // Versuche, die Destination zu extrahieren
        let destination = "";
        // Aus URL extrahieren als Fallback
        const urlParts = url.split('/');
        for (const part of urlParts) {
          if (part && part.length > 3 && 
              !part.includes('hotel') && 
              !part.includes('meinreisebuero') && 
              !part.includes('www') && 
              !part.includes('http') && 
              !part.includes('.com') && 
              !part.includes('.de')) {
            destination = part.replace(/-/g, ' ');
            break;
          }
        }
        
        // Formatiere Destination
        destination = destination
          ? destination.charAt(0).toUpperCase() + destination.slice(1).toLowerCase()
          : "Reiseziel";
          
        // Extrahiere mindestens 2 grundlegende Features aus dem Text
        const features: string[] = [];
        const bodyText = $('body').text();
        
        // Suche nach bekannten Feature-Keyworks
        const featureKeywords = ['pool', 'strand', 'meer', 'frühstück', 'restaurant', 'spa', 'wellness',
                             'zentral', 'aussicht', 'blick', 'kinder', 'suite', 'bar'];
                             
        for (const keyword of featureKeywords) {
          // Finde Sätze, die das Keyword enthalten
          const regex = new RegExp(`[^.!?]*${keyword}[^.!?]*[.!?]`, 'i');
          const match = bodyText.match(regex);
          
          if (match && match[0] && match[0].length > 10 && match[0].length < 100) {
            // Bereinige und kürze den Feature-Text
            const feature = match[0].trim()
              .replace(/^[^a-zA-Z0-9äöüÄÖÜß]+/, '') // Entferne führende Nicht-Buchstaben
              .replace(/\s+/g, ' '); // Normalisiere Leerzeichen
              
            if (!features.includes(feature)) {
              features.push(feature);
            }
            
            if (features.length >= 3) break;
          }
        }
        
        // Wenn wir nicht genug Features gefunden haben, füge generische hinzu
        if (features.length < 2) {
          if (!features.includes("Komfortable Zimmer")) {
            features.push("Komfortable Zimmer");
          }
          if (!features.includes("Zentrale Lage")) {
            features.push("Zentrale Lage");
          }
        }
        
        // Generiere passende Icons
        const featureIcons = features.map(feature => {
          const lowerFeature = feature.toLowerCase();
          if (lowerFeature.includes('pool')) return '🏊‍♀️';
          if (lowerFeature.includes('strand') || lowerFeature.includes('meer')) return '🏖️';
          if (lowerFeature.includes('frühstück') || lowerFeature.includes('restaurant')) return '🍽️';
          if (lowerFeature.includes('spa') || lowerFeature.includes('wellness')) return '💆‍♂️';
          if (lowerFeature.includes('lage') || lowerFeature.includes('zentral')) return '📍';
          if (lowerFeature.includes('aussicht') || lowerFeature.includes('blick')) return '🌇';
          if (lowerFeature.includes('zimmer')) return '🛏️';
          return '✓';
        });
        
        console.log(`Fallback extraction successful for ${hotelName}`);
        
        return {
          hotelName,
          hotelCategory: undefined,
          destination,
          features,
          featureIcons,
          amenities: [],
          description: undefined,
          imageUrl: undefined,
          price: undefined,
          duration: undefined
        };
      } catch (fallbackError) {
        console.error("Fallback scraping also failed:", fallbackError);
        return null;
      }
    }
    
    return null;
  }
}
