import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { CheckIcon, CopyIcon } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function CopyButton({ 
  text, 
  className, 
  variant = "outline", 
  size = "default", 
  children 
}: CopyButtonProps) {
  const { isCopied, copy } = useClipboard();

  const handleCopy = () => {
    copy(text);
  };

  return (
    <Button 
      onClick={handleCopy} 
      variant={variant} 
      size={size}
      className={className}
    >
      {isCopied ? (
        <>
          <CheckIcon className="h-4 w-4 mr-2" />
          Kopiert!
        </>
      ) : (
        <>
          <CopyIcon className="h-4 w-4 mr-2" />
          {children || "Kopieren"}
        </>
      )}
    </Button>
  );
}
