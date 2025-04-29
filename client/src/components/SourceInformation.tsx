import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  HotelIcon, MapPinIcon, ListChecksIcon, InfoIcon, StarIcon, 
  CheckCircleIcon, Edit2Icon, CheckIcon, PlusCircleIcon, 
  ListIcon, PlusIcon, SettingsIcon, XIcon
} from "lucide-react";
import { SourceInfo, SourceInfoUpdate, CustomSection } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SourceInformationProps {
  sourceInfo: SourceInfo;
  onUpdateInfo?: (update: SourceInfoUpdate) => void;
}

export default function SourceInformation({ sourceInfo, onUpdateInfo }: SourceInformationProps) {
  const { hotelName, hotelCategory, destination, featuresWithIcons, customSections = [], originalUrl } = sourceInfo;

  // States für Editing-Modus und temporäre Werte
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [tempIcon, setTempIcon] = useState("✓");
  const [tempTitle, setTempTitle] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  
  // States für Dialoge
  const [isNewFeatureDialogOpen, setIsNewFeatureDialogOpen] = useState(false);
  const [isNewSectionDialogOpen, setIsNewSectionDialogOpen] = useState(false);
  const [isNewSectionItemDialogOpen, setIsNewSectionItemDialogOpen] = useState(false);

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
    } else if (editingField === 'customSection' && editingIndex !== null) {
      onUpdateInfo({
        key: 'customSection',
        value: tempValue,
        index: editingIndex
      });
    } else if (editingField === 'customSectionItem' && editingIndex !== null && editingSectionIndex !== null) {
      onUpdateInfo({
        key: 'customSectionItem',
        value: tempValue,
        index: editingIndex,
        sectionIndex: editingSectionIndex
      });
    } else if (editingField === 'hotelName' || editingField === 'hotelCategory' || editingField === 'destination') {
      onUpdateInfo({
        key: editingField,
        value: tempValue
      });
    }
    
    setEditingField(null);
    setEditingIndex(null);
    setEditingSectionIndex(null);
  };

  // Abbrechen der Bearbeitung
  const cancelEditing = () => {
    setEditingField(null);
    setEditingIndex(null);
    setEditingSectionIndex(null);
  };
  
  // Fügt ein neues Feature hinzu
  const addNewFeature = () => {
    if (!onUpdateInfo || !tempValue) return;
    
    onUpdateInfo({
      key: 'newFeature',
      value: tempValue,
      icon: tempIcon
    });
    
    setTempValue("");
    setTempIcon("✓");
    setIsNewFeatureDialogOpen(false);
  };
  
  // Fügt einen neuen benutzerdefinierten Abschnitt hinzu
  const addNewSection = () => {
    if (!onUpdateInfo || !tempTitle) return;
    
    onUpdateInfo({
      key: 'newCustomSection',
      value: tempTitle
    });
    
    setTempTitle("");
    setIsNewSectionDialogOpen(false);
  };
  
  // Fügt ein neues Item zu einem benutzerdefinierten Abschnitt hinzu
  const addNewSectionItem = () => {
    if (!onUpdateInfo || !tempValue || editingSectionIndex === null) return;
    
    onUpdateInfo({
      key: 'customSectionItem',
      value: tempValue,
      sectionIndex: editingSectionIndex,
      icon: tempIcon
    });
    
    setTempValue("");
    setTempIcon("✓");
    setIsNewSectionItemDialogOpen(false);
    setEditingSectionIndex(null);
  };

  return (
    <>
      {/* Dialog zum Hinzufügen eines neuen Features */}
      <Dialog open={isNewFeatureDialogOpen} onOpenChange={setIsNewFeatureDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neues Merkmal hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie ein neues Merkmal zu den Hauptmerkmalen hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="icon" className="text-sm font-medium">Icon</label>
              <Input 
                id="icon"
                placeholder="✓"
                value={tempIcon}
                onChange={(e) => setTempIcon(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Verwenden Sie ein Emoji oder ein Symbol als Icon
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="text" className="text-sm font-medium">Merkmaltext</label>
              <Input 
                id="text"
                placeholder="Beschreiben Sie das Merkmal"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFeatureDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={addNewFeature} disabled={!tempValue}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog zum Hinzufügen eines neuen benutzerdefinierten Abschnitts */}
      <Dialog open={isNewSectionDialogOpen} onOpenChange={setIsNewSectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neuen Abschnitt hinzufügen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen benutzerdefinierten Abschnitt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Abschnittstitel</label>
              <Input 
                id="title"
                placeholder="z.B. Zimmerausstattung"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSectionDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={addNewSection} disabled={!tempTitle}>Abschnitt erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog zum Hinzufügen eines neuen Elements zu einem benutzerdefinierten Abschnitt */}
      <Dialog open={isNewSectionItemDialogOpen} onOpenChange={setIsNewSectionItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neues Element hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie ein neues Element zum ausgewählten Abschnitt hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="item-icon" className="text-sm font-medium">Icon</label>
              <Input 
                id="item-icon"
                placeholder="✓"
                value={tempIcon}
                onChange={(e) => setTempIcon(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Verwenden Sie ein Emoji oder ein Symbol als Icon
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="item-text" className="text-sm font-medium">Elementtext</label>
              <Input 
                id="item-text"
                placeholder="Beschreiben Sie das Element"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewSectionItemDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={addNewSectionItem} disabled={!tempValue}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-neutral-800 text-sm">Hauptmerkmale</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setTempValue("");
                  setTempIcon("✓");
                  setIsNewFeatureDialogOpen(true);
                }}
                className="text-xs py-1 h-auto"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Merkmal hinzufügen
              </Button>
            </div>
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
                      <span className="mr-2 flex-shrink-0">{feature.icon}</span>
                      <span>{feature.text}</span>
                      <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500 flex-shrink-0" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Benutzerdefinierte Abschnitte */}
        {customSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="flex items-start">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <SettingsIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3 flex-grow">
              <div className="flex justify-between items-center">
                {editingField === 'customSection' && editingIndex === sectionIndex ? (
                  <div className="flex items-center">
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
                  <h4 
                    className="font-medium text-neutral-800 text-sm group cursor-pointer flex items-center" 
                    onClick={() => {
                      startEditing('customSection', section.title, sectionIndex);
                    }}
                  >
                    {section.title}
                    <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500" />
                  </h4>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setTempValue("");
                    setTempIcon("✓");
                    setEditingSectionIndex(sectionIndex);
                    setIsNewSectionItemDialogOpen(true);
                  }}
                  className="text-xs py-1 h-auto"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Element hinzufügen
                </Button>
              </div>
              
              <ul className="mt-1 space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-neutral-800">
                    {editingField === 'customSectionItem' && editingIndex === itemIndex && editingSectionIndex === sectionIndex ? (
                      <div className="flex items-center">
                        <span className="mr-2 flex-shrink-0">{item.icon}</span>
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
                        onClick={() => {
                          startEditing('customSectionItem', item.text, itemIndex);
                          setEditingSectionIndex(sectionIndex);
                        }}
                      >
                        <span className="mr-2 flex-shrink-0">{item.icon}</span>
                        <span>{item.text}</span>
                        <Edit2Icon className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 text-neutral-500 flex-shrink-0" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        
        {/* Button zum Hinzufügen eines neuen benutzerdefinierten Abschnitts */}
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            className="flex items-center text-sm"
            onClick={() => {
              setTempTitle("");
              setIsNewSectionDialogOpen(true);
            }}
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Neuen Abschnitt hinzufügen
          </Button>
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
    </>
  );
}
