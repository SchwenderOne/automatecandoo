import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { MessageSquareShare } from "lucide-react";

interface PostResultProps {
  postContent: string;
}

export default function PostResult({ postContent }: PostResultProps) {
  return (
    <Card className="bg-white rounded-xl shadow-md mb-6">
      <CardHeader className="border-b border-neutral-200 p-4 flex flex-row justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
            <MessageSquareShare className="text-[#25D366] h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-neutral-800 ml-3">Generierter WhatsApp Post</h3>
        </div>
        <CopyButton text={postContent} className="inline-flex items-center text-sm font-medium rounded-lg px-4 py-2 border border-neutral-200 hover:bg-neutral-50">
          Alles kopieren
        </CopyButton>
      </CardHeader>
      
      <CardContent className="p-6">
        <pre className="whitespace-pre-line text-neutral-800 font-sans">{postContent}</pre>
      </CardContent>
    </Card>
  );
}
