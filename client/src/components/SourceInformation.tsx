import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SourceInfo } from "@/types";

interface SourceInformationProps {
  sourceInfo: SourceInfo;
}

export default function SourceInformation({ sourceInfo }: SourceInformationProps) {
  const { hotelName, hotelCategory, destination, featuresWithIcons, customSections = [], originalUrl } = sourceInfo;

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden">
      <CardHeader className="border-b border-neutral-200 p-4">
        <h3 className="font-heading text-lg font-semibold text-neutral-800">Quellinformationen</h3>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div>
          <p className="text-sm text-neutral-600 font-medium">Hotelname</p>
          <p className="text-neutral-800">{hotelName}</p>
        </div>
        {hotelCategory && (
          <div>
            <p className="text-sm text-neutral-600 font-medium">Kategorie</p>
            <p className="text-neutral-800">{hotelCategory}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-neutral-600 font-medium">Destination</p>
          <p className="text-neutral-800">{destination}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 font-medium">Features</p>
          <ul className="list-disc list-inside">
            {featuresWithIcons.map((feature, index) => (
              <li key={index} className="text-neutral-800">
                {feature.icon} {feature.text}
              </li>
            ))}
          </ul>
        </div>
        {customSections.length > 0 && (
          <div>
            <p className="text-sm text-neutral-600 font-medium">Benutzerdefinierte Abschnitte</p>
            {customSections.map((section, sIndex) => (
              <div key={sIndex}>
                <p className="font-medium text-neutral-800">{section.title}</p>
                <ul className="list-disc list-inside">
                  {section.items.map((item, iIndex) => (
                    <li key={iIndex} className="text-neutral-800">
                      {item.icon} {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div>
          <a href={originalUrl} className="text-primary hover:underline text-sm" target="_blank" rel="noopener noreferrer">
            Originallink
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
