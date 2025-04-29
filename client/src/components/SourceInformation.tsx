import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HotelIcon, MapPinIcon, ListChecksIcon, InfoIcon, StarIcon, CheckCircleIcon, Edit2Icon, CheckIcon } from "lucide-react";
import { SourceInfo, SourceInfoUpdate } from "@/types";
import { Input } from "@/components/ui/input";

interface SourceInformationProps {
  sourceInfo: SourceInfo;
  onUpdateInfo?: (update: SourceInfoUpdate) => void;
}

export default function SourceInformation({ sourceInfo, onUpdateInfo }: SourceInformationProps) {
  const { hotelName, hotelCategory, destination, featuresWithIcons, originalUrl } = sourceInfo;

  // States für Editing-Modus und temporäre Werte
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Startet das Bearbeiten eines Felds
  const startEditing = (field: string, value: string, index?: number) => {
    setEditingField(field);
    setTempValue(value);
    if (index !== undefined) {
      setEditingIndex(index);
    }
  };

  // Speichert die Änderungen und beendet den Bearbeitungsmodus
  const saveChanges = () => {
    if (!onUpdateInfo || !editingField) return;
    
    if (editingField === 'feature' && editingIndex !== null) {
      onUpdateInfo({
        key: 'feature',
        value: tempValue,
        index: editingIndex
      });
    } else if (editingField === 'hotelName' || editingField === 'hotelCategory' || editingField === 'destination') {
      onUpdateInfo({
        key: editingField,
        value: tempValue
      });
    }
    
    setEditingField(null);
    setEditingIndex(null);
  };

  // Abbrechen der Bearbeitung
  const cancelEditing = () => {
    setEditingField(null);
    setEditingIndex(null);
  };

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden">
      <CardHeader className="border-b border-neutral-200 p-4 flex flex-row justify-between items-center">
        <h3 className="font-heading text-lg font-semibold text-neutral-800">Quellinformationen</h3>
        <div className="text-sm text-primary">Klicken Sie auf die Informationen, um sie zu bearbeiten</div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
            <HotelIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3 flex-grow">
            <h4 className="font-medium text-neutral-800 text-sm">Hoteldetails</h4>
            
            {editingField === 'hotelName' ? (
              <div className="flex items-center mt-1">
                <Input 
                  value={tempValue} 
                  onChange={(e) => setTempValue(e.target.value)} 
                  className="py-1 text-sm"
                  autoFocus
                />
                <button onClick={saveChanges} className="ml-2 text-green-600 hover:text-green-800">
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button onClick={cancelEditing} className="ml-2 text-red-600 hover:text-red-800">
                  ✕
                </button>
              </div>
            ) : (
              <div 
                className="text-neutral-800 flex items-center group cursor-pointer" 
                onClick={() => startEditing('hotelName', hotelName)}
              >
                <p>{hotelName}</p>
                <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500" />
              </div>
            )}
            
            {hotelCategory && (
              editingField === 'hotelCategory' ? (
                <div className="flex items-center mt-1">
                  <Input 
                    value={tempValue} 
                    onChange={(e) => setTempValue(e.target.value)} 
                    className="py-1 text-sm"
                    autoFocus
                  />
                  <button onClick={saveChanges} className="ml-2 text-green-600 hover:text-green-800">
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button onClick={cancelEditing} className="ml-2 text-red-600 hover:text-red-800">
                    ✕
                  </button>
                </div>
              ) : (
                <div 
                  className="mt-1 flex items-center group cursor-pointer" 
                  onClick={() => startEditing('hotelCategory', hotelCategory)}
                >
                  <div className="flex">
                    {Array.from({ length: parseInt(hotelCategory.charAt(0)) || 0 }).map((_, i) => (
                      <StarIcon key={i} className="text-amber-400 h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-neutral-600">{hotelCategory}</span>
                  <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500" />
                </div>
              )
            )}
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
            <MapPinIcon className="h-5 w-5 text-teal-600" />
          </div>
          <div className="ml-3 flex-grow">
            <h4 className="font-medium text-neutral-800 text-sm">Destination</h4>
            
            {editingField === 'destination' ? (
              <div className="flex items-center mt-1">
                <Input 
                  value={tempValue} 
                  onChange={(e) => setTempValue(e.target.value)} 
                  className="py-1 text-sm"
                  autoFocus
                />
                <button onClick={saveChanges} className="ml-2 text-green-600 hover:text-green-800">
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button onClick={cancelEditing} className="ml-2 text-red-600 hover:text-red-800">
                  ✕
                </button>
              </div>
            ) : (
              <div 
                className="text-neutral-800 flex items-center group cursor-pointer" 
                onClick={() => startEditing('destination', destination)}
              >
                <p>{destination}</p>
                <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ListChecksIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="ml-3 flex-grow">
            <h4 className="font-medium text-neutral-800 text-sm">Hauptmerkmale</h4>
            <ul className="mt-1 space-y-1">
              {featuresWithIcons.map((feature, index) => (
                <li key={index} className="text-neutral-800">
                  {editingField === 'feature' && editingIndex === index ? (
                    <div className="flex items-center">
                      <CheckCircleIcon className="text-teal-600 h-4 w-4 mr-2 flex-shrink-0" />
                      <Input 
                        value={tempValue} 
                        onChange={(e) => setTempValue(e.target.value)} 
                        className="py-1 text-sm"
                        autoFocus
                      />
                      <button onClick={saveChanges} className="ml-2 text-green-600 hover:text-green-800 flex-shrink-0">
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEditing} className="ml-2 text-red-600 hover:text-red-800 flex-shrink-0">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center group cursor-pointer" 
                      onClick={() => startEditing('feature', feature.text, index)}
                    >
                      <CheckCircleIcon className="text-teal-600 h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{feature.text}</span>
                      <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500 flex-shrink-0" />
                    </div>
                  )}
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
