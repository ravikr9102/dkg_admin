import { ReactNode, useEffect, useMemo, useState } from 'react';
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
import {
  AdditionalCategory,
  Category,
  SubCategory,
  ThirdSubCategory,
  Product,
  Blog,
  OrderStatus,
  UserRole,
} from '@/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { CategoryBannerSingleField } from '@/components/modals/CategoryBannerSingleField';
import { VenueImagesField } from '@/components/modals/VenueImagesField';
import { toIdString, type AdditionalCategorySelectOption } from '@/utils/categoryTree';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ImageIcon,
  Layers,
  ListChecks,
  MapPin,
  Package,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { FormSectionCard } from '@/components/product-form/FormSectionCard';
import { ChipListField } from '@/components/product-form/ChipListField';
import {
  CustomizationAddonsPanel,
  type CustomizationSectionFormRow,
} from '@/components/product-form/CustomizationAddonsPanel';
import { ImageDropzoneField, type ProductImageItem } from '@/components/product-form/ImageDropzoneField';
import type { ProductImageSlot } from '@/api/admins';
import { sanitizeMongoNamedRef } from '@/utils/productForm';

function idsEqual(a: string, b: string) {
  return toIdString(a) === toIdString(b);
}

export type { CustomizationSectionFormRow };

/** Saved payload shape for POST /admins/addproducts — nested sections match the Product model. */
export type ProductModalSavePayload = {
  name: string;
  description: string;
  /** MRP / list price (backend field `price`). */
  price: number;
  /** Optional sale price (backend `discountedPrice`); must be less than `price`. */
  discountedPrice?: number;
  featured: boolean;
  categoryId: string;
  subCategoryId: string;
  thirdSubCategoryId: string;
  mainCategoryName: string;
  subCategoryName: string;
  thirdSubCategoryName: string;
  imageSlots: ProductImageSlot[];
  tier: 'standard' | 'premium';
  tags: string[];
  inclusions: string[];
  experiences: string[];
  keyHighlights: string[];
  additionalCategories: string[];
  customizationSections: Array<{
    name: string;
    priority: number;
    addons: { name: string }[];
  }>;
  serviceableAreas: { city: string; districts: string[] }[];
  location: string;
  setupDuration: string;
  teamSize: string;
  advanceBooking: string;
  cancellationPolicy: string;
  youtubeVideoLink: string;
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

// Category Modal (main category — name only; no banner image on backend)
interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSave: (data: Partial<Category>) => void;
}

export function CategoryModal({ open, onOpenChange, category, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');

  // Only sync when editing; keep draft if user closes/reopens Add without saving
  useEffect(() => {
    if (!open || !category) return;
    setName(category.name || '');
  }, [open, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, slug: name.toLowerCase().replace(/\s+/g, '-') });
    onOpenChange(false);
    setName('');
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={category ? 'Edit Category' : 'Add Category'}
      description="Main categories use POST /admins/addcategory (name only)."
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
  onSave: (data: Partial<SubCategory> & { bannerImage?: File | null }) => void;
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !subCategory) return;
    setName(subCategory.name || '');
    setCategoryId(subCategory.categoryId || '');
    setBannerFile(null);
  }, [open, subCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = mainCategories.find(c => c.id === categoryId);
    onSave({
      name,
      categoryId,
      categoryName: category?.name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      bannerImage: bannerFile,
    });
    onOpenChange(false);
    if (!subCategory) {
      setName('');
      setCategoryId('');
      setBannerFile(null);
    }
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
        <CategoryBannerSingleField
          id="sub-category-banner"
          file={bannerFile}
          onChange={setBannerFile}
        />
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
  onSave: (data: Partial<ThirdSubCategory> & { bannerImage?: File | null }) => void;
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const filteredSubCategories = subCategories.filter(sub => sub.categoryId === categoryId);

  useEffect(() => {
    if (!open || !thirdSubCategory) return;
    setName(thirdSubCategory.name || '');
    setCategoryId(thirdSubCategory.categoryId || '');
    setSubCategoryId(thirdSubCategory.subCategoryId || '');
    setBannerFile(null);
  }, [open, thirdSubCategory]);

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
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      bannerImage: bannerFile,
    });
    onOpenChange(false);
    if (!thirdSubCategory) {
      setName('');
      setCategoryId('');
      setSubCategoryId('');
      setBannerFile(null);
    }
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
        <CategoryBannerSingleField
          id="third-category-banner"
          file={bannerFile}
          onChange={setBannerFile}
        />
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

// Additional Category (under third or nested additional)
interface AdditionalCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  additionalCategory?: AdditionalCategory | null;
  onSave: (data: {
    name: string;
    parentName: string;
    parentModel: 'ThirdCategory' | 'AdditionalCategory';
    bannerImage?: File | null;
  }) => void;
  /** Parent = third: options with breadcrumb label, value = third category name */
  thirdOptions: { label: string; thirdName: string }[];
  /** Parent = additional: existing additional category names */
  additionalParentNames: string[];
}

export function AdditionalCategoryModal({
  open,
  onOpenChange,
  additionalCategory,
  onSave,
  thirdOptions,
  additionalParentNames,
}: AdditionalCategoryModalProps) {
  const [parentModel, setParentModel] = useState<'ThirdCategory' | 'AdditionalCategory'>(
    'ThirdCategory'
  );
  const [thirdName, setThirdName] = useState('');
  const [additionalParentName, setAdditionalParentName] = useState('');
  const [name, setName] = useState(additionalCategory?.name || '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !additionalCategory) return;
    setName(additionalCategory.name || '');
    setParentModel(additionalCategory.parentModel);
    if (additionalCategory.parentModel === 'ThirdCategory') {
      setThirdName(additionalCategory.parentName || '');
      setAdditionalParentName('');
    } else {
      setAdditionalParentName(additionalCategory.parentName || '');
      setThirdName('');
    }
    setBannerFile(null);
  }, [open, additionalCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parentName =
      parentModel === 'ThirdCategory' ? thirdName : additionalParentName;
    if (!parentName?.trim() || !name.trim()) {
      toast({ title: 'Select parent and enter a name', variant: 'destructive' });
      return;
    }
    onSave({
      name: name.trim(),
      parentName: parentName.trim(),
      parentModel,
      bannerImage: bannerFile,
    });
    onOpenChange(false);
    if (!additionalCategory) {
      setParentModel('ThirdCategory');
      setThirdName('');
      setAdditionalParentName('');
      setName('');
      setBannerFile(null);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={additionalCategory ? 'Edit Additional Category' : 'Add Additional Category'}
      description="Choose where it lives in the tree, then name it."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Parent type</Label>
          <Select
            value={parentModel}
            onValueChange={(v) =>
              setParentModel(v as 'ThirdCategory' | 'AdditionalCategory')
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Parent type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ThirdCategory">Third sub-category</SelectItem>
              <SelectItem value="AdditionalCategory">Additional category (nested)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {parentModel === 'ThirdCategory' ? (
          <div className="space-y-2">
            <Label>Third sub-category</Label>
            <Select value={thirdName} onValueChange={setThirdName} required>
              <SelectTrigger>
                <SelectValue placeholder="Select third sub-category" />
              </SelectTrigger>
              <SelectContent>
                {thirdOptions.map((o) => (
                  <SelectItem key={`${o.thirdName}-${o.label}`} value={o.thirdName}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Parent additional category</Label>
            <Select
              value={additionalParentName}
              onValueChange={setAdditionalParentName}
              required
              disabled={additionalParentNames.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    additionalParentNames.length === 0
                      ? 'Create one under a third category first'
                      : 'Select parent'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {additionalParentNames.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="addcat-name">Name</Label>
          <Input
            id="addcat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Additional category name"
            required
          />
        </div>
        <CategoryBannerSingleField
          id="additional-category-banner"
          file={bannerFile}
          onChange={setBannerFile}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">
            {additionalCategory ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

type ProductFormFields = {
  name: string;
  description: string;
  price: string;
  /** Sale price optional; empty = no discount */
  discountedPrice: string;
  categoryId: string;
  subCategoryId: string;
  thirdSubCategoryId: string;
  featured: boolean;
  tier: string;
  imageItems: ProductImageItem[];
  tags: string[];
  additionalCategories: string[];
  customizationSections: CustomizationSectionFormRow[];
  serviceableAreas: { city: string; districts: string[] }[];
  location: string;
  setupDuration: string;
  teamSize: string;
  advanceBooking: string;
  cancellationPolicy: string;
  youtubeVideoLink: string;
  inclusions: string[];
  experiences: string[];
  keyHighlights: string[];
};

function emptyProductForm(): ProductFormFields {
  return {
    name: '',
    description: '',
    price: '',
    discountedPrice: '',
    categoryId: '',
    subCategoryId: '',
    thirdSubCategoryId: '',
    featured: false,
    tier: 'standard',
    imageItems: [],
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
  /** From GET /admins/category-tree — used for additional category dropdowns. */
  additionalCategoryOptions: AdditionalCategorySelectOption[];
}

export function ProductModal({
  open,
  onOpenChange,
  product,
  onSave,
  mainCategories,
  subCategories,
  thirdSubCategories,
  additionalCategoryOptions,
}: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormFields>(() => emptyProductForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [additionalSelectKey, setAdditionalSelectKey] = useState(0);

  const filteredSubCategories = subCategories.filter((sub) =>
    idsEqual(sub.categoryId, formData.categoryId)
  );
  const filteredThirdSub = thirdSubCategories.filter((third) =>
    idsEqual(third.subCategoryId, formData.subCategoryId)
  );

  const selectedThirdCategoryName = thirdSubCategories.find((t) =>
    idsEqual(t.id, formData.thirdSubCategoryId)
  )?.name;

  const additionalOptionsForThird = useMemo(() => {
    if (!selectedThirdCategoryName) return [];
    return additionalCategoryOptions.filter((o) => o.thirdName === selectedThirdCategoryName);
  }, [additionalCategoryOptions, selectedThirdCategoryName]);

  const additionalCategoriesAvailableToAdd = useMemo(
    () =>
      additionalOptionsForThird.filter((o) => !formData.additionalCategories.includes(o.name)),
    [additionalOptionsForThird, formData.additionalCategories]
  );

  const additionalLabelByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of additionalCategoryOptions) {
      m.set(o.name, o.label);
    }
    return m;
  }, [additionalCategoryOptions]);

  // Add flow: keep draft when dialog closes/reopens. View/edit: sync from `product` when set.
  useEffect(() => {
    if (!open || !product) return;
    setFormData({
      ...emptyProductForm(),
      name: product.name ?? '',
      description: product.description ?? '',
      price: product.price != null ? String(product.price) : '',
      discountedPrice: '',
      categoryId: product.categoryId ? toIdString(product.categoryId) : '',
      subCategoryId: product.subCategoryId ? toIdString(product.subCategoryId) : '',
      thirdSubCategoryId: product.thirdSubCategoryId ? toIdString(product.thirdSubCategoryId) : '',
      featured: Boolean(product.featured),
      imageItems: Array.isArray(product.images)
        ? product.images.map((url, i) => ({
            id: `existing-url-${i}-${String(url).slice(0, 24)}`,
            kind: 'url' as const,
            url,
          }))
        : [],
    });
    setFieldErrors({});
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
      errors.price = 'Enter a valid MRP / list price greater than 0.';
    }
    let discountedPriceNum: number | undefined;
    const discTrim = formData.discountedPrice.trim();
    if (discTrim) {
      const d = parseFloat(discTrim);
      if (Number.isNaN(d) || d <= 0) {
        errors.discountedPrice = 'Enter a valid sale price or leave blank.';
      } else if (Number.isNaN(priceNum) || priceNum <= 0) {
        errors.discountedPrice = 'Enter a valid MRP before setting a sale price.';
      } else if (d > priceNum) {
        errors.discountedPrice = 'Sale price cannot be greater than MRP.';
      } else if (d === priceNum) {
        errors.discountedPrice = 'Sale price must be less than MRP.';
      } else {
        discountedPriceNum = d;
      }
    }
    if (formData.imageItems.length === 0) {
      errors.images = 'Add at least one image (upload or URL).';
    } else {
      for (const item of formData.imageItems) {
        if (item.kind === 'url') {
          try {
            const parsed = new URL(item.url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              errors.images = 'Each image URL must use http or https.';
              break;
            }
          } catch {
            errors.images = 'One or more image URLs are invalid.';
            break;
          }
        }
      }
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

    const customizationSections = formData.customizationSections
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        priority: Number.isFinite(s.priority) ? s.priority : 0,
        addons: s.addons
          .map((a) => ({ name: a.name.trim() }))
          .filter((a) => a.name.length > 0),
      }));

    const imageSlots: ProductImageSlot[] = formData.imageItems.map((item) =>
      item.kind === 'url' ? { kind: 'url', url: item.url } : { kind: 'file', file: item.file }
    );

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: priceNum,
      ...(discountedPriceNum != null ? { discountedPrice: discountedPriceNum } : {}),
      featured: formData.featured,
      categoryId: formData.categoryId,
      subCategoryId: formData.subCategoryId,
      thirdSubCategoryId: formData.thirdSubCategoryId,
      mainCategoryName: category.name,
      subCategoryName: subCategory.name,
      thirdSubCategoryName: thirdSub.name,
      imageSlots,
      tier: formData.tier === 'premium' ? 'premium' : 'standard',
      tags: formData.tags,
      inclusions: formData.inclusions,
      experiences: formData.experiences,
      keyHighlights: formData.keyHighlights,
      additionalCategories: formData.additionalCategories,
      customizationSections,
      serviceableAreas,
      location: formData.location.trim(),
      setupDuration: formData.setupDuration.trim(),
      teamSize: formData.teamSize.trim(),
      advanceBooking: formData.advanceBooking.trim(),
      cancellationPolicy: formData.cancellationPolicy.trim(),
      youtubeVideoLink: formData.youtubeVideoLink.trim(),
    });
    onOpenChange(false);
    if (!product) {
      setFormData(emptyProductForm());
      setFieldErrors({});
    }
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
          : 'All fields map to POST /admins/addproducts (JSON or multipart when images are uploaded). Names must exist in Mongo (additional categories, sections, addons).'
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
              <Label htmlFor="prod-price">MRP / list price (₹)</Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                min={0}
                value={formData.price}
                onChange={(e) => {
                  const nextPrice = e.target.value;
                  setFormData({ ...formData, price: nextPrice });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    const p = parseFloat(nextPrice);
                    const disc = formData.discountedPrice.trim();
                    if (disc && !Number.isNaN(p) && p > 0) {
                      const d = parseFloat(disc);
                      if (!Number.isNaN(d) && d > 0 && d >= p) {
                        next.discountedPrice = 'Sale price must be less than MRP.';
                      } else {
                        delete next.discountedPrice;
                      }
                    }
                    return next;
                  });
                }}
                placeholder="0.00"
                disabled={dis}
                className={cn(fieldErrors.price && 'border-destructive')}
              />
              {fieldErrors.price ? <p className="text-sm text-destructive">{fieldErrors.price}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-sale-price">Sale price (₹) — optional</Label>
              <Input
                id="prod-sale-price"
                type="number"
                step="0.01"
                min={0}
                max={
                  formData.price.trim() && !Number.isNaN(parseFloat(formData.price))
                    ? parseFloat(formData.price)
                    : undefined
                }
                value={formData.discountedPrice}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, discountedPrice: v });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    const p = parseFloat(formData.price);
                    const d = parseFloat(v.trim());
                    if (v.trim() && !Number.isNaN(d) && d > 0 && !Number.isNaN(p) && p > 0 && d >= p) {
                      next.discountedPrice = 'Sale price must be less than MRP.';
                    } else if (v.trim() && !Number.isNaN(d) && d <= 0) {
                      next.discountedPrice = 'Enter a valid sale price or leave blank.';
                    } else {
                      delete next.discountedPrice;
                    }
                    return next;
                  });
                }}
                placeholder="Leave blank if not discounted"
                disabled={dis}
                className={cn(fieldErrors.discountedPrice && 'border-destructive')}
              />
              <p className="text-xs text-muted-foreground">
                Cannot exceed MRP. Sent to API as <code className="text-xs">discountedPrice</code>.
              </p>
              {fieldErrors.discountedPrice ? (
                <p className="text-sm text-destructive">{fieldErrors.discountedPrice}</p>
              ) : null}
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
            <div className="sm:col-span-2 space-y-2">
              <div>
                <Label>Additional categories</Label>
                <p className="text-xs text-muted-foreground">
                  Optional — pick from the category tree under the selected third-level category (same source as
                  Additional Category List).
                </p>
              </div>
              {!selectedThirdCategoryName ? (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Select main, sub, and third-level category first.
                </p>
              ) : additionalOptionsForThird.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No additional categories exist under &quot;{selectedThirdCategoryName}&quot;. Create them under{' '}
                  <span className="font-medium">Additional Category</span> in the sidebar.
                </p>
              ) : (
                <>
                  <Select
                    key={additionalSelectKey}
                    disabled={dis || additionalCategoriesAvailableToAdd.length === 0}
                    onValueChange={(name) => {
                      if (!name || formData.additionalCategories.includes(name)) return;
                      setFormData((prev) => ({
                        ...prev,
                        additionalCategories: [...prev.additionalCategories, name],
                      }));
                      setAdditionalSelectKey((k) => k + 1);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          additionalCategoriesAvailableToAdd.length
                            ? 'Add additional category…'
                            : 'All matching categories added'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {additionalCategoriesAvailableToAdd.map((o) => (
                        <SelectItem key={o.name} value={o.name}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.additionalCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.additionalCategories.map((name) => (
                        <Badge
                          key={name}
                          variant="secondary"
                          className="max-w-full gap-1 py-1 pl-2 pr-1 font-normal"
                          title={additionalLabelByName.get(name) ?? name}
                        >
                          <span className="truncate">{name}</span>
                          <button
                            type="button"
                            disabled={dis}
                            className="rounded-sm p-0.5 hover:bg-muted-foreground/20 disabled:opacity-50"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                additionalCategories: prev.additionalCategories.filter((n) => n !== name),
                              }))
                            }
                            aria-label={`Remove ${name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </FormSectionCard>

        <CustomizationAddonsPanel
          sections={formData.customizationSections}
          onSectionsChange={(next) => setFormData({ ...formData, customizationSections: next })}
          sanitize={sanitizeMongoNamedRef}
          onReject={chipReject}
          disabled={dis}
        />

        <FormSectionCard
          title="Images"
          description="Upload files or paste HTTPS URLs — multiple images supported (same as POST /admins/addproducts multipart)."
          icon={ImageIcon}
        >
          <ImageDropzoneField
            items={formData.imageItems}
            onChange={(next) => setFormData({ ...formData, imageItems: next })}
            disabled={dis}
            error={fieldErrors.images}
          />
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
  onSave: (orderId: string, status: OrderStatus) => void | Promise<void>;
}

export function OrderStatusModal({ open, onOpenChange, orderId, currentStatus, onSave }: OrderStatusModalProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setStatus(currentStatus);
  }, [open, currentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Promise.resolve(onSave(orderId, status));
      onOpenChange(false);
    } catch {
      /* parent shows toast */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Update Order Status"
      description="Change the status of this order (same values as the backend order model)."
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
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update Status'}
          </Button>
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
export type BlogSavePayload = Partial<Blog> & { coverFile?: File | null };

interface BlogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog?: Blog | null;
  onSave: (data: BlogSavePayload) => void;
}

export function BlogModal({ open, onOpenChange, blog, onSave }: BlogModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
    tags: '',
    category: 'Matrimony',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setFormData({
      title: blog?.title || '',
      excerpt: blog?.excerpt || '',
      content: blog?.content || '',
      status: blog?.status || 'draft',
      tags: blog?.tags?.join(', ') || '',
      category: blog?.category || 'Matrimony',
    });
    setCoverFile(null);
  }, [open, blog?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.excerpt.length > 300) {
      toast({ title: 'Excerpt must be 300 characters or less', variant: 'destructive' });
      return;
    }
    if (!blog && !coverFile) {
      toast({ title: 'Featured image is required', variant: 'destructive' });
      return;
    }
    onSave({
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      status: formData.status,
      category: formData.category,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      coverFile: coverFile ?? undefined,
    });
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
        <CategoryBannerSingleField
          id="blog-featured-image"
          file={coverFile}
          onChange={setCoverFile}
          label={
            <>
              Featured image {!blog && <span className="text-destructive">*</span>}
            </>
          }
          description={
            blog
              ? 'Upload a new file to replace the current featured image, or leave unchanged.'
              : 'Required for new posts. PNG, JPG, or WebP — drag & drop or browse.'
          }
          emptySubtext="Wide hero-style images work well on the guest blog (e.g. 1200×630)."
          remotePreviewUrl={!coverFile && blog?.coverImage ? blog.coverImage : null}
          remotePreviewCaption="Saved featured image"
        />
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g. Matrimony, Weddings"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Excerpt (max 300)</Label>
          <Textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Short description for listings and SEO"
            rows={2}
            maxLength={300}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Blog body (paragraphs separated by blank lines; optional lines starting with ### for subheadings on the website)"
            rows={8}
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

// Venue Modal (create only — no edit/delete in admin UI)
export type VenueSavePayload = {
  name: string;
  description: string;
  address: string;
  lat?: string;
  lng?: string;
  startingPrice: string;
  typesOfVenues?: string;
  facilities?: string;
  accessibilityFeatures?: string;
  restrictions?: string;
  inHouseDecor?: boolean;
  advanceBookingWeeks?: string;
  capacityMin?: string;
  capacityMax?: string;
  imageFiles: File[];
};

interface VenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: VenueSavePayload) => void;
}

export function VenueModal({ open, onOpenChange, onSave }: VenueModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    startingPrice: '',
    typesOfVenues: '',
    facilities: '',
    accessibilityFeatures: '',
    restrictions: '',
    inHouseDecor: false,
    advanceBookingWeeks: '',
    capacityMin: '',
    capacityMax: '',
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    setFormData({
      name: '',
      description: '',
      address: '',
      lat: '',
      lng: '',
      startingPrice: '',
      typesOfVenues: '',
      facilities: '',
      accessibilityFeatures: '',
      restrictions: '',
      inHouseDecor: false,
      advanceBookingWeeks: '',
      capacityMin: '',
      capacityMax: '',
    });
    setImageFiles([]);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      description: formData.description,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      startingPrice: formData.startingPrice,
      typesOfVenues: formData.typesOfVenues,
      facilities: formData.facilities,
      accessibilityFeatures: formData.accessibilityFeatures,
      restrictions: formData.restrictions,
      inHouseDecor: formData.inHouseDecor,
      advanceBookingWeeks: formData.advanceBookingWeeks,
      capacityMin: formData.capacityMin,
      capacityMax: formData.capacityMax,
      imageFiles,
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Venue"
      contentClassName="max-w-3xl w-[min(100vw-1.5rem,48rem)]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Venue name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full address"
            rows={2}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Latitude (optional)</Label>
            <Input
              value={formData.lat}
              onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
              placeholder="28.6139"
            />
          </div>
          <div className="space-y-2">
            <Label>Longitude (optional)</Label>
            <Input
              value={formData.lng}
              onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
              placeholder="77.2090"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Starting price (₹)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={formData.startingPrice}
            onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What makes this venue special"
            rows={4}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Venue types</Label>
            <Input
              value={formData.typesOfVenues}
              onChange={(e) => setFormData({ ...formData, typesOfVenues: e.target.value })}
              placeholder="Banquet, Garden, Rooftop"
            />
          </div>
          <div className="space-y-2">
            <Label>Facilities</Label>
            <Input
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder="Parking, Catering, Valet"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Accessibility features</Label>
            <Input
              value={formData.accessibilityFeatures}
              onChange={(e) =>
                setFormData({ ...formData, accessibilityFeatures: e.target.value })
              }
              placeholder="Wheelchair access, Elevator, …"
            />
            <p className="text-xs text-muted-foreground">Comma-separated, same as guest detail.</p>
          </div>
          <div className="space-y-2">
            <Label>Restrictions</Label>
            <Input
              value={formData.restrictions}
              onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
              placeholder="No fireworks, Noise curfew, …"
            />
            <p className="text-xs text-muted-foreground">Comma-separated.</p>
          </div>
        </div>
        <div className="rounded-md border border-border/60 p-4 space-y-3">
          <Label className="text-base">Other information</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="venue-in-house-decor"
              checked={formData.inHouseDecor}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, inHouseDecor: checked === true })
              }
            />
            <Label htmlFor="venue-in-house-decor" className="font-normal cursor-pointer">
              In-house decorating allowed
            </Label>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="venue-advance-weeks">Advance booking (weeks, optional)</Label>
            <Input
              id="venue-advance-weeks"
              type="number"
              min={0}
              step={1}
              value={formData.advanceBookingWeeks}
              onChange={(e) =>
                setFormData({ ...formData, advanceBookingWeeks: e.target.value })
              }
              placeholder="e.g. 4"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Capacity min (optional)</Label>
            <Input
              type="number"
              min={0}
              value={formData.capacityMin}
              onChange={(e) => setFormData({ ...formData, capacityMin: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Capacity max (optional)</Label>
            <Input
              type="number"
              min={0}
              value={formData.capacityMax}
              onChange={(e) => setFormData({ ...formData, capacityMax: e.target.value })}
            />
          </div>
        </div>
        <VenueImagesField files={imageFiles} onChange={setImageFiles} maxFiles={10} id="venue-images-upload" />
        <DialogFooter className="pt-2 border-t border-border/60 mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Create Venue</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
