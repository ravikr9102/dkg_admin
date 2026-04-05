import { ReactNode, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Category, SubCategory, ThirdSubCategory, Product, Blog, OrderStatus, UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toIdString } from '@/utils/categoryTree';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  Boxes,
  ImageIcon,
  Layers,
  ListChecks,
  MapPin,
  Package,
  Trash2,
  Wrench,
} from 'lucide-react';
import { FormSectionCard } from '@/components/product-form/FormSectionCard';
import { ChipListField } from '@/components/product-form/ChipListField';
import { ImageDropzoneField } from '@/components/product-form/ImageDropzoneField';
import { sanitizeMongoNamedRef } from '@/utils/productForm';

function idsEqual(a: string, b: string) {
  return toIdString(a) === toIdString(b);
}

export type ProductAddonForm = { name: string; isDefault: boolean };

export type ProductModalSavePayload = {
  name: string;
  description: string;
  price: number;
  featured: boolean;
  categoryId: string;
  subCategoryId: string;
  thirdSubCategoryId: string;
  mainCategoryName: string;
  subCategoryName: string;
  thirdSubCategoryName: string;
  images: string[];
  tier: 'standard' | 'premium';
  tags: string[];
  inclusions: string[];
  experiences: string[];
  keyHighlights: string[];
  additionalCategories: string[];
  customizationSections: string[];
  serviceableAreas: { city: string; districts: string[] }[];
  location: string;
  setupDuration: string;
  teamSize: string;
  advanceBooking: string;
  cancellationPolicy: string;
  youtubeVideoLink: string;
  addons: ProductAddonForm[];
};

export type CategoryOption = { id: string; name: string };
export type SubCategoryOption = { id: string; name: string; categoryId: string };
export type ThirdSubCategoryOption = {
  id: string;
  name: string;
  subCategoryId: string;
  categoryId: string;
};

// Generic Modal Wrapper
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  contentClassName,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-lg max-h-[90vh] overflow-y-auto',
          contentClassName
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Category Modal
interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSave: (data: Partial<Category>) => void;
}

export function CategoryModal({ open, onOpenChange, category, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, slug: name.toLowerCase().replace(/\s+/g, '-') });
    onOpenChange(false);
    setName('');
    setDescription('');
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={category ? 'Edit Category' : 'Add Category'}
      description="Manage your product categories"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Category description"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{category ? 'Save Changes' : 'Create Category'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

// Sub-Category Modal
interface SubCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subCategory?: SubCategory | null;
  onSave: (data: Partial<SubCategory>) => void;
  mainCategories: CategoryOption[];
}

export function SubCategoryModal({
  open,
  onOpenChange,
  subCategory,
  onSave,
  mainCategories,
}: SubCategoryModalProps) {
  const [name, setName] = useState(subCategory?.name || '');
  const [categoryId, setCategoryId] = useState(subCategory?.categoryId || '');
  const [description, setDescription] = useState(subCategory?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = mainCategories.find(c => c.id === categoryId);
    onSave({
      name,
      categoryId,
      categoryName: category?.name,
      description,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={subCategory ? 'Edit Sub-Category' : 'Add Sub-Category'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">Parent Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sub-category name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{subCategory ? 'Save Changes' : 'Create'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

// Third Sub-Category Modal
interface ThirdSubCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thirdSubCategory?: ThirdSubCategory | null;
  onSave: (data: Partial<ThirdSubCategory>) => void;
  mainCategories: CategoryOption[];
  subCategories: SubCategoryOption[];
}

export function ThirdSubCategoryModal({
  open,
  onOpenChange,
  thirdSubCategory,
  onSave,
  mainCategories,
  subCategories,
}: ThirdSubCategoryModalProps) {
  const [name, setName] = useState(thirdSubCategory?.name || '');
  const [categoryId, setCategoryId] = useState(thirdSubCategory?.categoryId || '');
  const [subCategoryId, setSubCategoryId] = useState(thirdSubCategory?.subCategoryId || '');
  const [description, setDescription] = useState(thirdSubCategory?.description || '');

  const filteredSubCategories = subCategories.filter(sub => sub.categoryId === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = mainCategories.find(c => c.id === categoryId);
    const subCategory = subCategories.find(s => s.id === subCategoryId);
    onSave({
      name,
      categoryId,
      categoryName: category?.name,
      subCategoryId,
      subCategoryName: subCategory?.name,
      description,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={thirdSubCategory ? 'Edit Third Sub-Category' : 'Add Third Sub-Category'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setSubCategoryId(''); }} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {mainCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sub-Category</Label>
          <Select value={subCategoryId} onValueChange={setSubCategoryId} required disabled={!categoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select sub-category" />
            </SelectTrigger>
            <SelectContent>
              {filteredSubCategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Third sub-category name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{thirdSubCategory ? 'Save Changes' : 'Create'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

type ProductFormFields = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  subCategoryId: string;
  thirdSubCategoryId: string;
  featured: boolean;
  tier: string;
  images: string[];
  tags: string[];
  additionalCategories: string[];
  customizationSections: string[];
  serviceableAreas: { city: string; districts: string[] }[];
  location: string;
  setupDuration: string;
  teamSize: string;
  advanceBooking: string;
  cancellationPolicy: string;
  youtubeVideoLink: string;
  addons: ProductAddonForm[];
  inclusions: string[];
  experiences: string[];
  keyHighlights: string[];
};

function emptyProductForm(): ProductFormFields {
  return {
    name: '',
    description: '',
    price: '',
    categoryId: '',
    subCategoryId: '',
    thirdSubCategoryId: '',
    featured: false,
    tier: 'standard',
    images: [],
    tags: [],
    additionalCategories: [],
    customizationSections: [],
    serviceableAreas: [],
    location: '',
    setupDuration: '',
    teamSize: '',
    advanceBooking: '',
    cancellationPolicy: '',
    youtubeVideoLink: '',
    addons: [],
    inclusions: [],
    experiences: [],
    keyHighlights: [],
  };
}

// Product Modal
interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (data: ProductModalSavePayload) => void;
  mainCategories: CategoryOption[];
  subCategories: SubCategoryOption[];
  thirdSubCategories: ThirdSubCategoryOption[];
}

export function ProductModal({
  open,
  onOpenChange,
  product,
  onSave,
  mainCategories,
  subCategories,
  thirdSubCategories,
}: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormFields>(() => emptyProductForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const filteredSubCategories = subCategories.filter((sub) =>
    idsEqual(sub.categoryId, formData.categoryId)
  );
  const filteredThirdSub = thirdSubCategories.filter((third) =>
    idsEqual(third.subCategoryId, formData.subCategoryId)
  );

  useEffect(() => {
    if (!open) return;
    if (!product) {
      setFormData(emptyProductForm());
    }
  }, [open, product]);

  const chipReject = (msg: string) => toast({ title: msg, variant: 'destructive' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (product) {
      toast({ title: 'Editing products is not available for admin API', variant: 'destructive' });
      return;
    }
    if (!mainCategories.length) {
      toast({
        title: 'Categories are still loading. Wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required.';
    if (!formData.description.trim()) errors.description = 'Description is required.';
    const priceNum = parseFloat(formData.price);
    if (!formData.price.trim() || Number.isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Enter a valid price greater than 0.';
    }
    if (formData.images.length === 0) {
      errors.images = 'Add at least one image URL (https recommended).';
    }
    if (!formData.categoryId?.trim()) errors.categoryId = 'Select a main category.';

    if (formData.categoryId?.trim() && !formData.subCategoryId?.trim()) {
      if (filteredSubCategories.length === 0) {
        toast({
          title:
            'No sub-categories exist for this main category. Add one under Sub-Categories first.',
          variant: 'destructive',
        });
        return;
      }
      errors.subCategoryId = 'Select a sub-category.';
    }

    if (formData.subCategoryId?.trim() && !formData.thirdSubCategoryId?.trim()) {
      if (filteredThirdSub.length === 0) {
        toast({
          title:
            'No third-level categories exist for this sub-category. Add one under Third Sub-Categories first.',
          variant: 'destructive',
        });
        return;
      }
      errors.thirdSubCategoryId = 'Select a third-level category.';
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      toast({ title: 'Fix the highlighted fields', variant: 'destructive' });
      return;
    }

    const category = mainCategories.find((c) => idsEqual(c.id, formData.categoryId));
    const subCategory = subCategories.find((s) => idsEqual(s.id, formData.subCategoryId));
    const thirdSub = thirdSubCategories.find((t) => idsEqual(t.id, formData.thirdSubCategoryId));
    if (!category || !subCategory || !thirdSub) {
      toast({
        title:
          'Could not match category selection to the list from the server. Refresh the page and try again.',
        variant: 'destructive',
      });
      return;
    }

    const serviceableAreas = formData.serviceableAreas
      .map((a) => ({
        city: a.city.trim(),
        districts: a.districts.filter((d) => d.trim()).map((d) => d.trim()),
      }))
      .filter((a) => a.city.length > 0);

    const addons = formData.addons
      .map((a) => ({ name: a.name.trim(), isDefault: a.isDefault }))
      .filter((a) => a.name.length > 0);

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: priceNum,
      featured: formData.featured,
      categoryId: formData.categoryId,
      subCategoryId: formData.subCategoryId,
      thirdSubCategoryId: formData.thirdSubCategoryId,
      mainCategoryName: category.name,
      subCategoryName: subCategory.name,
      thirdSubCategoryName: thirdSub.name,
      images: formData.images,
      tier: formData.tier === 'premium' ? 'premium' : 'standard',
      tags: formData.tags,
      inclusions: formData.inclusions,
      experiences: formData.experiences,
      keyHighlights: formData.keyHighlights,
      additionalCategories: formData.additionalCategories,
      customizationSections: formData.customizationSections,
      serviceableAreas,
      location: formData.location.trim(),
      setupDuration: formData.setupDuration.trim(),
      teamSize: formData.teamSize.trim(),
      advanceBooking: formData.advanceBooking.trim(),
      cancellationPolicy: formData.cancellationPolicy.trim(),
      youtubeVideoLink: formData.youtubeVideoLink.trim(),
      addons,
    });
    onOpenChange(false);
  };

  const dis = !!product;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={product ? 'View Product' : 'Add Product'}
      description={
        product
          ? 'Product editing uses the super-admin API in the backend.'
          : 'All fields map to POST /admins/addproducts. Names must exist in Mongo (additional categories, sections, addons).'
      }
      contentClassName="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSectionCard
          title="Product info"
          description="Name, description, pricing, and visibility."
          icon={Package}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="prod-name">Product name</Label>
              <Input
                id="prod-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Premium rooftop dinner for two"
                disabled={dis}
                className={cn(fieldErrors.name && 'border-destructive')}
              />
              {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Full product description for listings"
                rows={4}
                disabled={dis}
                className={cn(fieldErrors.description && 'border-destructive')}
              />
              {fieldErrors.description ? (
                <p className="text-sm text-destructive">{fieldErrors.description}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-price">Price</Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                min={0}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                disabled={dis}
                className={cn(fieldErrors.price && 'border-destructive')}
              />
              {fieldErrors.price ? <p className="text-sm text-destructive">{fieldErrors.price}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(val) => setFormData({ ...formData, tier: val })}
                disabled={dis}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(c) => setFormData({ ...formData, featured: c === true })}
                disabled={dis}
              />
              <div>
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured product
                </Label>
                <p className="text-xs text-muted-foreground">Maps to isFeatured in the API.</p>
              </div>
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Categories"
          description="Main → sub → third must exist in the database. Optional refs must match document names."
          icon={Layers}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Main category</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    categoryId: val,
                    subCategoryId: '',
                    thirdSubCategoryId: '',
                  })
                }
                disabled={dis}
              >
                <SelectTrigger className={cn(fieldErrors.categoryId && 'border-destructive')}>
                  <SelectValue placeholder="Select main" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.categoryId ? (
                <p className="text-sm text-destructive">{fieldErrors.categoryId}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Sub-category</Label>
              <Select
                value={formData.subCategoryId || undefined}
                onValueChange={(val) =>
                  setFormData({ ...formData, subCategoryId: val, thirdSubCategoryId: '' })
                }
                disabled={!formData.categoryId || dis || filteredSubCategories.length === 0}
              >
                <SelectTrigger className={cn(fieldErrors.subCategoryId && 'border-destructive')}>
                  <SelectValue
                    placeholder={
                      !formData.categoryId
                        ? 'Select main first'
                        : filteredSubCategories.length === 0
                          ? 'No sub-categories'
                          : 'Select sub-category'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.subCategoryId ? (
                <p className="text-sm text-destructive">{fieldErrors.subCategoryId}</p>
              ) : null}
              {formData.categoryId && filteredSubCategories.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Add sub-categories from <span className="font-medium">Sub-Categories</span>.
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Third-level category</Label>
              <Select
                value={formData.thirdSubCategoryId || undefined}
                onValueChange={(val) => setFormData({ ...formData, thirdSubCategoryId: val })}
                disabled={!formData.subCategoryId || dis || filteredThirdSub.length === 0}
              >
                <SelectTrigger className={cn(fieldErrors.thirdSubCategoryId && 'border-destructive')}>
                  <SelectValue
                    placeholder={
                      !formData.subCategoryId
                        ? 'Select sub-category first'
                        : filteredThirdSub.length === 0
                          ? 'No third-level rows'
                          : 'Select third-level category'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredThirdSub.map((third) => (
                    <SelectItem key={third.id} value={third.id}>
                      {third.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.thirdSubCategoryId ? (
                <p className="text-sm text-destructive">{fieldErrors.thirdSubCategoryId}</p>
              ) : null}
              {formData.subCategoryId && filteredThirdSub.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Create a third-level row under <span className="font-medium">Third Sub-Categories</span>.
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <ChipListField
                label="Additional categories"
                description="Exact names as stored in Mongo (optional)."
                placeholder="e.g. Outdoor"
                values={formData.additionalCategories}
                onChange={(next) => setFormData({ ...formData, additionalCategories: next })}
                sanitize={sanitizeMongoNamedRef}
                onReject={chipReject}
                disabled={dis}
              />
            </div>
            <div className="sm:col-span-2">
              <ChipListField
                label="Customization sections"
                description="Exact CustomizationSection names from your DB (optional)."
                placeholder="e.g. Recommended"
                values={formData.customizationSections}
                onChange={(next) => setFormData({ ...formData, customizationSections: next })}
                sanitize={sanitizeMongoNamedRef}
                onReject={chipReject}
                disabled={dis}
              />
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard title="Images" description="Direct image links only (http or https)." icon={ImageIcon}>
          <ImageDropzoneField
            images={formData.images}
            onChange={(next) => setFormData({ ...formData, images: next })}
            disabled={dis}
            error={fieldErrors.images}
          />
        </FormSectionCard>

        <FormSectionCard
          title="Addons"
          description="Must match Addon documents by name. Toggle default selection per row."
          icon={Boxes}
        >
          <div className="space-y-3">
            {formData.addons.map((addon, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Addon name</Label>
                  <Input
                    value={addon.name}
                    onChange={(e) => {
                      const next = [...formData.addons];
                      next[idx] = { ...next[idx], name: e.target.value };
                      setFormData({ ...formData, addons: next });
                    }}
                    placeholder="Addon name (DB match)"
                    disabled={dis}
                  />
                </div>
                <div className="flex items-center gap-2 sm:pb-2">
                  <Checkbox
                    id={`addon-def-${idx}`}
                    checked={addon.isDefault}
                    onCheckedChange={(c) => {
                      const next = [...formData.addons];
                      next[idx] = { ...next[idx], isDefault: c === true };
                      setFormData({ ...formData, addons: next });
                    }}
                    disabled={dis}
                  />
                  <Label htmlFor={`addon-def-${idx}`} className="text-sm cursor-pointer">
                    Default
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  disabled={dis}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      addons: formData.addons.filter((_, i) => i !== idx),
                    })
                  }
                  aria-label="Remove addon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={dis}
              onClick={() =>
                setFormData({
                  ...formData,
                  addons: [...formData.addons, { name: '', isDefault: false }],
                })
              }
            >
              + Add another addon
            </Button>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Service details"
          description="Operations, policy, video link, and cities you serve."
          icon={Wrench}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="loc">Location</Label>
              <Input
                id="loc"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Primary location label"
                disabled={dis}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup">Setup duration</Label>
              <Input
                id="setup"
                value={formData.setupDuration}
                onChange={(e) => setFormData({ ...formData, setupDuration: e.target.value })}
                placeholder="e.g. 2 hours"
                disabled={dis}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team size</Label>
              <Input
                id="team"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                placeholder="e.g. 3 staff"
                disabled={dis}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="advance">Advance booking</Label>
              <Input
                id="advance"
                value={formData.advanceBooking}
                onChange={(e) => setFormData({ ...formData, advanceBooking: e.target.value })}
                placeholder="e.g. 48 hours notice"
                disabled={dis}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cancel">Cancellation policy</Label>
              <Textarea
                id="cancel"
                value={formData.cancellationPolicy}
                onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                placeholder="Policy text"
                rows={3}
                disabled={dis}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="yt">YouTube video</Label>
              <Input
                id="yt"
                value={formData.youtubeVideoLink}
                onChange={(e) => setFormData({ ...formData, youtubeVideoLink: e.target.value })}
                placeholder="https://www.youtube.com/..."
                disabled={dis}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              Serviceable areas
            </div>
            <p className="text-xs text-muted-foreground">
              Add cities and districts; empty rows are omitted on save.
            </p>
            {formData.serviceableAreas.map((area, idx) => (
              <Card key={idx} className="border-dashed p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Area {idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={dis}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        serviceableAreas: formData.serviceableAreas.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={area.city}
                    onChange={(e) => {
                      const next = [...formData.serviceableAreas];
                      next[idx] = { ...next[idx], city: e.target.value };
                      setFormData({ ...formData, serviceableAreas: next });
                    }}
                    placeholder="e.g. Mumbai"
                    disabled={dis}
                  />
                </div>
                <ChipListField
                  label="Districts"
                  description="Add each district as a chip."
                  placeholder="District name"
                  values={area.districts}
                  onChange={(districts) => {
                    const next = [...formData.serviceableAreas];
                    next[idx] = { ...next[idx], districts };
                    setFormData({ ...formData, serviceableAreas: next });
                  }}
                  disabled={dis}
                />
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={dis}
              onClick={() =>
                setFormData({
                  ...formData,
                  serviceableAreas: [...formData.serviceableAreas, { city: '', districts: [] }],
                })
              }
            >
              + Add service area
            </Button>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Highlights & tags"
          description="Build lists as chips; sent as string arrays on the product payload."
          icon={ListChecks}
        >
          <ChipListField
            label="Inclusions"
            description="What is included in the package."
            placeholder="e.g. Welcome drinks"
            values={formData.inclusions}
            onChange={(next) => setFormData({ ...formData, inclusions: next })}
            disabled={dis}
          />
          <ChipListField
            label="Experiences"
            description="Signature experiences or activities."
            placeholder="e.g. Live music"
            values={formData.experiences}
            onChange={(next) => setFormData({ ...formData, experiences: next })}
            disabled={dis}
          />
          <ChipListField
            label="Key highlights"
            description="Bullet highlights for marketing copy."
            placeholder="e.g. Sea view seating"
            values={formData.keyHighlights}
            onChange={(next) => setFormData({ ...formData, keyHighlights: next })}
            disabled={dis}
          />
          <ChipListField
            label="Tags"
            description="Search/filter tags (comma-style chips)."
            placeholder="e.g. wedding"
            values={formData.tags}
            onChange={(next) => setFormData({ ...formData, tags: next })}
            disabled={dis}
          />
        </FormSectionCard>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {product ? 'Close' : 'Cancel'}
          </Button>
          {!product && <Button type="submit">Create Product</Button>}
        </DialogFooter>
      </form>
    </Modal>
  );
}

// Order Status Modal
interface OrderStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentStatus: OrderStatus;
  onSave: (orderId: string, status: OrderStatus) => void;
}

export function OrderStatusModal({ open, onOpenChange, orderId, currentStatus, onSave }: OrderStatusModalProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(orderId, status);
    toast({ title: 'Order status updated' });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Update Order Status"
      description="Change the status of this order"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(val) => setStatus(val as OrderStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Update Status</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

// User Role Modal (Super-Admin only)
interface UserRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentRole: UserRole;
  onSave: (userId: string, role: UserRole) => void;
}

export function UserRoleModal({ open, onOpenChange, userId, userName, currentRole, onSave }: UserRoleModalProps) {
  const [role, setRole] = useState<UserRole>(currentRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(userId, role);
    toast({ title: 'User role updated' });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Change User Role"
      description={`Update role for ${userName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guest">Guest</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super-admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Update Role</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

// Delete Confirmation Modal
interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function DeleteModal({ open, onOpenChange, title, description, onConfirm }: DeleteModalProps) {
  const handleConfirm = () => {
    onConfirm();
    toast({ title: 'Deleted successfully', variant: 'destructive' });
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={handleConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </Modal>
  );
}

// Blog Modal
interface BlogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog?: Blog | null;
  onSave: (data: Partial<Blog>) => void;
}

export function BlogModal({ open, onOpenChange, blog, onSave }: BlogModalProps) {
  const [formData, setFormData] = useState({
    title: blog?.title || '',
    excerpt: blog?.excerpt || '',
    content: blog?.content || '',
    status: blog?.status || 'draft',
    tags: blog?.tags?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
      author: 'Admin',
    });
    toast({ title: blog ? 'Blog updated' : 'Blog created' });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={blog ? 'Edit Blog' : 'Add Blog'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Blog title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Excerpt</Label>
          <Textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Short description"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Blog content"
            rows={4}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val as 'draft' | 'published' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="tag1, tag2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">{blog ? 'Save Changes' : 'Create Blog'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
