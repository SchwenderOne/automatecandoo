import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { generatePost } from "@/lib/api";
import { generatePostSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { PostGenerationStatus, PostGenerationResponse, SourceInfoUpdate, SourceInfo } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoIcon, LightbulbIcon, WandIcon } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import PostResult from "@/components/PostResult";
import SourceInformation from "@/components/SourceInformation";

type FormValues = z.infer<typeof generatePostSchema>;

export default function Home() {
  const [status, setStatus] = useState<PostGenerationStatus>("idle");
  const [result, setResult] = useState<PostGenerationResponse | null>(null);
  const [updatedPost, setUpdatedPost] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  // Update-Funktion für Quellinformationen
  const handleSourceInfoUpdate = (update: SourceInfoUpdate) => {
    if (!result) return;

    // Kopie der aktuellen Quellinformationen erstellen
    const updatedSourceInfo: SourceInfo = { ...result.sourceInfo };

    // Je nach Feld aktualisieren
    if (update.key === 'hotelName') {
      updatedSourceInfo.hotelName = update.value;
    } else if (update.key === 'hotelCategory') {
      updatedSourceInfo.hotelCategory = update.value;
    } else if (update.key === 'destination') {
      updatedSourceInfo.destination = update.value;
    } else if (update.key === 'feature' && update.index !== undefined) {
      // Feature-Text aktualisieren, aber Icon beibehalten
      const updatedFeatures = [...updatedSourceInfo.featuresWithIcons];
      updatedFeatures[update.index] = {
        ...updatedFeatures[update.index],
        text: update.value
      };
      updatedSourceInfo.featuresWithIcons = updatedFeatures;
    }

    // Aktualisierte Quellinformationen in den Post einfügen
    updateGeneratedPost(updatedSourceInfo);
  };

  // Generiert einen aktualisierten Post basierend auf den geänderten Quellinformationen
  const updateGeneratedPost = (updatedSourceInfo: SourceInfo) => {
    if (!result) return;

    let newPostContent = result.generatedPost;

    // Ersetze den Hotelnamen (mit Vorsicht, um nicht nach Teilwörtern zu ersetzen)
    const originalHotelName = result.sourceInfo.hotelName;
    const newHotelName = updatedSourceInfo.hotelName;
    
    if (originalHotelName !== newHotelName) {
      // Ersetze den Hotelnamen mit Wortgrenzenerkennung
      newPostContent = newPostContent.replace(
        new RegExp(`\\b${originalHotelName}\\b`, 'g'), 
        newHotelName
      );
    }

    // Ersetze die Hotelkategorie
    if (result.sourceInfo.hotelCategory !== updatedSourceInfo.hotelCategory && 
        result.sourceInfo.hotelCategory && updatedSourceInfo.hotelCategory) {
      newPostContent = newPostContent.replace(
        result.sourceInfo.hotelCategory,
        updatedSourceInfo.hotelCategory
      );
    }

    // Ersetze die Destination
    if (result.sourceInfo.destination !== updatedSourceInfo.destination) {
      newPostContent = newPostContent.replace(
        new RegExp(`\\b${result.sourceInfo.destination}\\b`, 'g'),
        updatedSourceInfo.destination
      );
    }

    // Ersetze Features
    updatedSourceInfo.featuresWithIcons.forEach((feature, index) => {
      if (index < result.sourceInfo.featuresWithIcons.length) {
        const originalFeature = result.sourceInfo.featuresWithIcons[index].text;
        
        if (originalFeature !== feature.text) {
          newPostContent = newPostContent.replace(
            originalFeature,
            feature.text
          );
        }
      }
    });

    // Aktualisiere den generierten Post
    setUpdatedPost(newPostContent);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(generatePostSchema),
    defaultValues: {
      url: "",
      useEmojis: true,
      style: "enthusiastic",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: generatePost,
    onMutate: () => {
      setStatus("loading");
    },
    onSuccess: (data) => {
      setResult(data);
      setStatus("success");
    },
    onError: (error) => {
      console.error("Error generating post:", error);
      setStatus("error");
      toast({
        title: "Fehler bei der Generierung",
        description: error instanceof Error ? error.message : "Beim Generieren des Posts ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    mutate(data);
  }

  function validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.host.includes("meinreisebuero24.com");
    } catch (e) {
      return false;
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-8 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-neutral-800">WhatsApp Post Generator</h1>
            <p className="text-neutral-600 mt-1">Erstelle ansprechende Reiseangebote im Handumdrehen</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary text-sm font-medium">
              <LightbulbIcon className="w-4 h-4 mr-1" />
              Powered by Gemini AI
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-heading text-xl font-semibold mb-4 text-neutral-800">Reiseangebot URL</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-neutral-800">URL des Angebots eingeben</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type="url" 
                            placeholder="https://www.meinreisebuero24.com/hotel/..." 
                            className="w-full rounded-lg border pr-10"
                            autoFocus
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <InfoIcon className="h-5 w-5 text-neutral-500" />
                          </div>
                        </div>
                      </FormControl>
                      <p className="text-sm text-neutral-500">Füge eine URL von meinreisebuero24.com ein</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <h3 className="font-medium text-neutral-800 text-sm">Optionen</h3>
                  
                  <FormField
                    control={form.control}
                    name="useEmojis"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            id="useEmojis"
                          />
                        </FormControl>
                        <FormLabel htmlFor="useEmojis" className="text-neutral-800 text-sm cursor-pointer">
                          Emojis verwenden
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-neutral-800 text-sm">Stil des Posts</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Wähle einen Stil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="enthusiastic">Enthusiastisch & lebhaft</SelectItem>
                            <SelectItem value="elegant">Elegant & luxuriös</SelectItem>
                            <SelectItem value="family">Familienfreundlich</SelectItem>
                            <SelectItem value="adventure">Abenteuerlich</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    disabled={isPending}
                  >
                    <WandIcon className="mr-2 h-5 w-5" />
                    {isPending ? "Generiere..." : "Post generieren"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h3 className="font-heading text-lg font-medium mb-3 text-neutral-800">Über dieses Tool</h3>
              <p className="text-neutral-600 text-sm">
                Dieses Tool analysiert Reiseangebote von meinreisebuero24.com und erstellt auf Basis der extrahierten
                Informationen ansprechende WhatsApp-Posts. Die generierten Inhalte folgen dem Format der bereitgestellten Beispiele und können direkt kopiert werden.
              </p>
              <div className="mt-4 flex items-center text-primary text-sm">
                <InfoIcon className="h-4 w-4 mr-2" />
                <span>100% der generierten Informationen stammen aus dem Angebot</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          {status === "idle" && <EmptyState />}
          {status === "loading" && <LoadingState />}
          {status === "success" && result && (
            <>
              <PostResult 
                postContent={result.generatedPost} 
                updatedContent={updatedPost}
              />
              <SourceInformation 
                sourceInfo={result.sourceInfo} 
                onUpdateInfo={handleSourceInfoUpdate} 
              />
            </>
          )}
        </div>
      </div>
      
      <footer className="mt-12 py-6 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-neutral-600 text-sm mb-3 sm:mb-0">WhatsApp Post Generator für Reiseangebote</p>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-neutral-600 hover:text-neutral-800 text-sm">Datenschutz</a>
            <a href="#" className="text-neutral-600 hover:text-neutral-800 text-sm">Impressum</a>
            <a href="#" className="text-neutral-600 hover:text-neutral-800 text-sm">Hilfe</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
