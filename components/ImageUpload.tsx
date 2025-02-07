import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant?: 'avatar' | 'default';
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
  variant = 'default',
  className
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.includes('image')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      if (data.success) {
        onChange(data.data.url);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [onChange, toast]);

  if (variant === 'avatar') {
    return (
      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id="avatar-upload"
        />
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 group">
          {value ? (
            <Image
              src={value}
              alt="Avatar"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-background/50">
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer text-white text-sm font-medium hover:underline"
            >
              Change {label}
            </label>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id="image-upload"
      />
      <div className={cn(
        "relative min-h-[200px] rounded-xl border-2 border-dashed border-primary/20",
        "hover:border-primary/50 transition-colors",
        "flex flex-col items-center justify-center p-4",
        value ? "aspect-auto" : "aspect-video"
      )}>
        {value ? (
          <div className="relative w-full h-full min-h-[200px] group">
            <Image
              src={value}
              alt={label}
              fill
              className="object-contain rounded-lg"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <label
                htmlFor="image-upload"
                className="cursor-pointer"
              >
                <Button variant="outline" className="text-white border-white hover:bg-white/20">
                  <Upload className="w-4 h-4 mr-2" />
                  Change {label}
                </Button>
              </label>
            </div>
          </div>
        ) : (
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <ImagePlus className="w-8 h-8 text-primary" />
            </div>
            <Button variant="outline" className="bg-primary/10 border-primary/30">
              <Upload className="w-4 h-4 mr-2" />
              Upload {label}
            </Button>
          </label>
        )}
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading...
        </div>
      )}
    </div>
  );
};

export default ImageUpload;