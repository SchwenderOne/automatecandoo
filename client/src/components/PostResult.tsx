import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { MessageSquareShare } from "lucide-react";
import { useEffect, useState } from "react";

interface PostResultProps {
  postContent: string;
  updatedContent?: string;
  onRegenerateContent?: (content: string) => void;
}

export default function PostResult({ postContent, updatedContent, onRegenerateContent }: PostResultProps) {
  // Der anzuzeigende Inhalt ist entweder der aktualisierte Inhalt (wenn verfügbar) oder der ursprüngliche
  const [displayContent, setDisplayContent] = useState(postContent);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(postContent);
  
  // Wenn sich updatedContent ändert, aktualisiere displayContent
  useEffect(() => {
    const content = updatedContent ?? postContent;
    setDisplayContent(content);
  }, [updatedContent, postContent]);
  // Wenn displayContent sich ändert, initialisiere editContent
  useEffect(() => {
    setEditContent(displayContent);
  }, [displayContent]);

  return (
    <Card className="bg-white rounded-xl shadow-md mb-6">
      <CardHeader className="border-b border-neutral-200 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
            <MessageSquareShare className="text-[#25D366] h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-neutral-800 ml-3">Generierter WhatsApp Post</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); setEditContent(displayContent); }}
                className="text-sm text-neutral-600"
              >Abbrechen</button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setDisplayContent(editContent);
                  onRegenerateContent?.(editContent);
                }}
                className="text-sm font-medium text-primary"
              >Speichern</button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-primary"
            >Bearbeiten</button>
          )}
          <CopyButton text={isEditing ? editContent : displayContent} className="inline-flex items-center text-sm font-medium rounded-lg px-4 py-2 border border-neutral-200 hover:bg-neutral-50">
            Alles kopieren
          </CopyButton>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-64 p-2 border rounded font-mono text-sm whitespace-pre-wrap"
          />
        ) : (
          <pre className="whitespace-pre-line text-neutral-800 font-sans">{displayContent}</pre>
        )}
      </CardContent>
    </Card>
  );
}
