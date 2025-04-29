/**
 * Ein einfaches In-Memory-Cache-System für die Anwendung
 * Speichert Daten mit einer TTL (Time-to-Live) Dauer
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private storage: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Speichert einen Wert im Cache mit einer bestimmten Lebensdauer
   * @param key - Der Cache-Schlüssel
   * @param data - Die zu speichernden Daten
   * @param ttlSeconds - Lebensdauer in Sekunden (Standard: 3600 = 1 Stunde)
   * @returns Cache-Instanz für Method Chaining
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): Cache {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.storage.set(key, { data, expiresAt });
    return this;
  }
  
  /**
   * Holt einen Wert aus dem Cache
   * @param key - Der Cache-Schlüssel
   * @returns Die gespeicherten Daten oder null, wenn nicht vorhanden oder abgelaufen
   */
  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    
    // Wenn der Eintrag nicht existiert oder abgelaufen ist
    if (!entry || entry.expiresAt < Date.now()) {
      if (entry) {
        // Wenn abgelaufen, entferne den Eintrag
        this.delete(key);
      }
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Prüft, ob ein Schlüssel im Cache vorhanden und nicht abgelaufen ist
   * @param key - Der Cache-Schlüssel
   * @returns True wenn der Schlüssel vorhanden und gültig ist, sonst false
   */
  has(key: string): boolean {
    const entry = this.storage.get(key);
    
    if (!entry) {
      return false;
    }
    
    const valid = entry.expiresAt >= Date.now();
    
    if (!valid) {
      // Wenn abgelaufen, entferne den Eintrag
      this.delete(key);
    }
    
    return valid;
  }
  
  /**
   * Löscht einen Eintrag aus dem Cache
   * @param key - Der Cache-Schlüssel
   * @returns True wenn ein Eintrag gelöscht wurde, sonst false
   */
  delete(key: string): boolean {
    const result = this.storage.delete(key);
    return result === true;
  }
  
  /**
   * Leert den gesamten Cache
   */
  clear(): void {
    this.storage.clear();
  }
  
  /**
   * Entfernt abgelaufene Einträge aus dem Cache
   * @returns Anzahl der entfernten Einträge
   */
  prune(): number {
    const now = Date.now();
    let count = 0;
    
    // Verwende Array.from, um Iterator-Probleme zu vermeiden
    Array.from(this.storage.entries()).forEach(([key, entry]) => {
      if (entry.expiresAt < now) {
        this.storage.delete(key);
        count++;
      }
    });
    
    return count;
  }
  
  /**
   * Gibt die Anzahl der Einträge im Cache zurück
   */
  get size(): number {
    return this.storage.size;
  }
}

// Exportiere eine einzelne Cache-Instanz für die gesamte Anwendung
export const cache = new Cache();

// Regelmäßiges Aufräumen des Caches (alle 15 Minuten)
setInterval(() => {
  const prunedCount = cache.prune();
  if (prunedCount > 0) {
    console.log(`Cache: ${prunedCount} abgelaufene Einträge entfernt. Verbleibende Einträge: ${cache.size}`);
  }
}, 15 * 60 * 1000);