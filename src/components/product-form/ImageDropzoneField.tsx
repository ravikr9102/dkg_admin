import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

type ImageDropzoneFieldProps = {
  images: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  error?: string;
};

/** Image list for products — **HTTP/HTTPS URLs only** (no file upload). */
export function ImageDropzoneField({ images, onChange, disabled, error }: ImageDropzoneFieldProps) {
  const [urlDraft, setUrlDraft] = useState('');
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        toast({ title: 'Invalid URL', description: 'Use http or https image URLs only.', variant: 'destructive' });
        return;
      }
    } catch {
      toast({ title: 'Invalid URL', description: 'Enter a valid link.', variant: 'destructive' });
      return;
    }
    if (imagesRef.current.includes(u)) {
      setUrlDraft('');
      return;
    }
    onChange([...imagesRef.current, u]);
    setUrlDraft('');
  };

  const removeAt = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">Product images</Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add one or more direct image URLs (<code className="text-xs">http://</code> or{' '}
          <code className="text-xs">https://</code>). They are sent in the <code className="text-xs">images</code>{' '}
          array. No file upload.
        </p>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="image-url-input" className="text-xs text-muted-foreground flex items-center gap-1">
            <Link2 className="h-3 w-3" />
            Image URL
          </Label>
          <Input
            id="image-url-input"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://cdn.example.com/photo.jpg"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
          />
        </div>
        <Button type="button" variant="secondary" disabled={disabled || !urlDraft.trim()} onClick={addUrl}>
          Add URL
        </Button>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((src, idx) => (
            <li
              key={`${idx}-${src.slice(0, 48)}`}
              className="relative group aspect-square rounded-lg border bg-muted/20 overflow-hidden"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              {!disabled ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-8 w-8 opacity-90"
                  onClick={() => removeAt(idx)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ImagePlus className="h-3.5 w-3.5" />
          No image URLs yet — add at least one.
        </p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
