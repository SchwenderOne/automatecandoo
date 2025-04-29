import { LightbulbIcon, MessageCircleIcon, CheckIcon } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      <div className="mx-auto w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
        <MessageCircleIcon className="text-primary h-10 w-10" />
      </div>
      <h3 className="font-heading text-xl font-semibold text-neutral-800 mb-2">Noch kein Post generiert</h3>
      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
        Gib die URL eines Reiseangebots ein und klicke auf "Post generieren", um deinen WhatsApp-Post zu erstellen.
      </p>
      <div className="border border-neutral-200 rounded-lg p-5 max-w-sm mx-auto bg-neutral-50">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            <LightbulbIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3 text-left">
            <h4 className="font-medium text-neutral-800">Tipp</h4>
            <p className="text-neutral-600 text-sm">Die Posts folgen einem bewährten Format für maximale Conversion</p>
          </div>
        </div>
        <div className="space-y-2 text-left">
          <div className="flex items-center text-sm text-neutral-700">
            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
            <span>Catchy Headline mit Emojis</span>
          </div>
          <div className="flex items-center text-sm text-neutral-700">
            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
            <span>4-5 Bullet Points mit Features</span>
          </div>
          <div className="flex items-center text-sm text-neutral-700">
            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
            <span>ucandoo Zahlungsreferenz</span>
          </div>
          <div className="flex items-center text-sm text-neutral-700">
            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
            <span>Call-to-Action am Ende</span>
          </div>
        </div>
      </div>
    </div>
  );
}
