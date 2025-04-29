import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HotelIcon, MapPinIcon, ListChecksIcon, InfoIcon, StarIcon, CheckCircleIcon } from "lucide-react";
import { SourceInfo } from "@/types";

interface SourceInformationProps {
  sourceInfo: SourceInfo;
}

export default function SourceInformation({ sourceInfo }: SourceInformationProps) {
  const { hotelName, hotelCategory, destination, featuresWithIcons, originalUrl } = sourceInfo;

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden">
      <CardHeader className="border-b border-neutral-200 p-4">
        <h3 className="font-heading text-lg font-semibold text-neutral-800">Quellinformationen</h3>
      </CardHeader>
      
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
            <HotelIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-neutral-800 text-sm">Hoteldetails</h4>
            <p className="text-neutral-800">{hotelName}</p>
            {hotelCategory && (
              <div className="mt-1 flex items-center">
                <div className="flex">
                  {Array.from({ length: parseInt(hotelCategory.charAt(0)) || 0 }).map((_, i) => (
                    <StarIcon key={i} className="text-amber-400 h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm text-neutral-600">{hotelCategory}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
            <MapPinIcon className="h-5 w-5 text-teal-600" />
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-neutral-800 text-sm">Destination</h4>
            <p className="text-neutral-800">{destination}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ListChecksIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-neutral-800 text-sm">Hauptmerkmale</h4>
            <ul className="mt-1 space-y-1">
              {featuresWithIcons.map((feature, index) => (
                <li key={index} className="flex items-center text-neutral-800">
                  <CheckCircleIcon className="text-teal-600 h-4 w-4 mr-2" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <InfoIcon className="h-5 w-5 text-neutral-600" />
          </div>
          <div className="ml-3">
            <h4 className="font-medium text-neutral-800 text-sm">Quelldaten</h4>
            <p className="text-sm text-neutral-600">Alle Informationen wurden präzise aus dem angegebenen Reiseangebot extrahiert.</p>
            <a 
              href={originalUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              Original-URL öffnen
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
