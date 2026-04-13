import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/PageComponents';
import { CategoryBannerSingleField } from '@/components/modals/CategoryBannerSingleField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addHeroBanner, getCategories, getCategoryTree } from '@/api/admins';
import { useAuth } from '@/contexts/AuthContext';
import { categorySelectOptions, thirdCategoryBreadcrumbOptions } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

type TargetKind = 'sub' | 'third';
type Placement = 'hero' | 'festival' | 'kids' | 'occasion';

export default function HeroBanners() {
  const { isVendorAdmin } = useAuth();
  const qc = useQueryClient();
  const [kind, setKind] = useState<TargetKind>('sub');
  const [subName, setSubName] = useState<string>('');
  const [thirdName, setThirdName] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [placement, setPlacement] = useState<Placement>('hero');
  const [sortOrder, setSortOrder] = useState<string>('0');

  const { data: rawCategories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
    enabled: isVendorAdmin,
  });

  const { data: categoryTree = [] } = useQuery({
    queryKey: ['admin', 'category-tree'],
    queryFn: async () => (await getCategoryTree()).categoryTree,
    enabled: isVendorAdmin,
  });

  const { mainOptions, subOptions, thirdOptions } = categorySelectOptions(rawCategories);

  const subSelectItems = useMemo(() => {
    return subOptions.map((s) => {
      const mainLabel = mainOptions.find((m) => m.id === s.categoryId)?.name ?? '—';
      return {
        value: s.name,
        label: `${mainLabel} › ${s.name}`,
      };
    });
  }, [subOptions, mainOptions]);

  const thirdSelectItems = useMemo(
    () => thirdCategoryBreadcrumbOptions(categoryTree),
    [categoryTree]
  );

  const mutation = useMutation({
    mutationFn: (payload: {
      image: File;
      subCategory?: string;
      thirdCategory?: string;
      placement?: Placement;
      sortOrder?: number;
    }) => addHeroBanner(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: data.message ?? 'Hero banner added' });
      setFile(null);
      setSubName('');
      setThirdName('');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to upload banner';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'Choose a banner image', variant: 'destructive' });
      return;
    }
    const sortNum = parseInt(sortOrder, 10);
    const common = {
      placement,
      sortOrder: Number.isFinite(sortNum) ? sortNum : 0,
    };
    if (kind === 'sub') {
      if (!subName) {
        toast({ title: 'Select a sub-category', variant: 'destructive' });
        return;
      }
      mutation.mutate({ image: file, subCategory: subName, ...common });
      return;
    }
    if (!thirdName) {
      toast({ title: 'Select a third sub-category', variant: 'destructive' });
      return;
    }
    mutation.mutate({ image: file, thirdCategory: thirdName, ...common });
  };

  const thirdNamesFromFlat = thirdOptions.map((t) => t.name);
  const hasThirdTargets = thirdSelectItems.length > 0 || thirdNamesFromFlat.length > 0;

  return (
    <DashboardLayout>
      <PageHeader
        title="Home banners"
        description="Upload images for the top hero carousel or for Festival / Kids / Occasion sections. Each banner links to one sub- or third-category (exact name)."
      />

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Upload banner</CardTitle>
          </div>
          <CardDescription>
            Attach the hero image and choose whether it applies to a sub-category or a third
            sub-category. The backend resolves categories by exact name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="banner-placement">Show on page</Label>
                  <Select value={placement} onValueChange={(v) => setPlacement(v as Placement)}>
                    <SelectTrigger id="banner-placement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Top hero carousel</SelectItem>
                      <SelectItem value="festival">Make Every Festival Special</SelectItem>
                      <SelectItem value="kids">Kids Decorations</SelectItem>
                      <SelectItem value="occasion">Make Every Occasion Extra Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-sort">Sort order</Label>
                  <Input
                    id="banner-sort"
                    type="number"
                    min={0}
                    step={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Lower numbers appear first within the same section.</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Link banner to</Label>
                <RadioGroup
                  value={kind}
                  onValueChange={(v) => {
                    setKind(v as TargetKind);
                    setSubName('');
                    setThirdName('');
                  }}
                  className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sub" id="hero-kind-sub" />
                    <Label htmlFor="hero-kind-sub" className="font-normal cursor-pointer">
                      Sub-category
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="third" id="hero-kind-third" />
                    <Label htmlFor="hero-kind-third" className="font-normal cursor-pointer">
                      Third sub-category
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {kind === 'sub' ? (
                <div className="space-y-2">
                  <Label htmlFor="hero-sub">Sub-category</Label>
                  <Select value={subName} onValueChange={setSubName}>
                    <SelectTrigger id="hero-sub">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subSelectItems.map((row) => (
                        <SelectItem key={row.value} value={row.value}>
                          {row.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="hero-third">Third sub-category</Label>
                  <Select value={thirdName} onValueChange={setThirdName}>
                    <SelectTrigger id="hero-third">
                      <SelectValue placeholder="Select third sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {thirdSelectItems.length > 0
                        ? thirdSelectItems.map((row) => (
                            <SelectItem key={row.thirdName} value={row.thirdName}>
                              {row.label}
                            </SelectItem>
                          ))
                        : thirdNamesFromFlat.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {!hasThirdTargets && (
                    <p className="text-xs text-muted-foreground">
                      Add third sub-categories under Categories first.
                    </p>
                  )}
                </div>
              )}

              <CategoryBannerSingleField
                file={file}
                onChange={setFile}
                id="hero-banner-image"
                label="Banner image"
                description="Required — stored for the hero section. Field name: image."
                emptySubtext="Wide ratio works best. PNG, JPG, or WebP."
              />

              <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
                {mutation.isPending ? 'Uploading…' : 'Upload hero banner'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
