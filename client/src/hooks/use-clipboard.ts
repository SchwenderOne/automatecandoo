import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function useClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        toast({
          title: "Fehler beim Kopieren",
          description: "Clipboard API ist nicht verfügbar",
          variant: "destructive",
        });
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        
        toast({
          title: "Kopiert!",
          description: "Der Text wurde in die Zwischenablage kopiert.",
        });
        
        setTimeout(() => {
          setIsCopied(false);
        }, timeout);
        
        return true;
      } catch (error) {
        console.error("Failed to copy:", error);
        toast({
          title: "Fehler beim Kopieren",
          description: "Der Text konnte nicht kopiert werden.",
          variant: "destructive",
        });
        return false;
      }
    },
    [timeout, toast]
  );

  return { isCopied, copy };
}
