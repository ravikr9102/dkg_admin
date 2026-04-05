import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MoreHorizontal, Star, Gem } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductModal, type ProductModalSavePayload } from '@/components/modals/FormModals';
import { Product } from '@/types';
import { Package } from 'lucide-react';
import {
  addProduct,
  getAdminProducts,
  getCategories,
  toggleProductFeatured,
  toggleProductTier,
} from '@/api/admins';
import { categorySelectOptions } from '@/utils/categoryTree';
import { apiProductToProduct } from '@/utils/mapEntity';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: rawCategories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
  });

  const { mainOptions, subOptions, thirdOptions } = categorySelectOptions(rawCategories);

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => (await getAdminProducts()).products,
  });

  const products: Product[] = useMemo(
    () => rawProducts.map((p) => apiProductToProduct(p)),
    [rawProducts]
  );

  const addMutation = useMutation({
    mutationFn: (body: Parameters<typeof addProduct>[0]) => addProduct(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Product created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create product';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const toggleFeaturedMut = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      toggleProductFeatured(id, isFeatured),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Featured updated' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Update failed';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const toggleTierMut = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: 'standard' | 'premium' }) =>
      toggleProductTier(id, tier),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Tier updated' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Update failed';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const filtered = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.categoryName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSave = (data: ProductModalSavePayload) => {
    addMutation.mutate({
      name: data.name,
      description: data.description,
      price: data.price,
      mainCategory: data.mainCategoryName,
      subCategory: data.subCategoryName,
      thirdCategory: data.thirdSubCategoryName,
      images: data.images,
      isFeatured: data.featured,
      tier: data.tier,
      tags: data.tags,
      additionalCategories: data.additionalCategories.length
        ? data.additionalCategories
        : undefined,
      customizationSections: data.customizationSections.length
        ? data.customizationSections
        : undefined,
      serviceableAreas: data.serviceableAreas.length ? data.serviceableAreas : undefined,
      location: data.location || undefined,
      setupDuration: data.setupDuration || undefined,
      teamSize: data.teamSize || undefined,
      advanceBooking: data.advanceBooking || undefined,
      cancellationPolicy: data.cancellationPolicy || undefined,
      youtubeVideoLink: data.youtubeVideoLink || undefined,
      addons: data.addons.length ? data.addons : undefined,
      inclusions: data.inclusions.length ? data.inclusions : undefined,
      experiences: data.experiences.length ? data.experiences : undefined,
      keyHighlights: data.keyHighlights.length ? data.keyHighlights : undefined,
    });
  };

  const categoryNames = useMemo(
    () => ['all', ...mainOptions.map((m) => m.name)],
    [mainOptions]
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Products"
        description="GET /admins/products · POST /admins/addproducts · toggles for featured & tier"
      >
        <Button onClick={() => setModalOpen(true)} disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categoryNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name === 'all' ? 'All categories' : name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-muted-foreground" />}
            title="No products found"
            description="Create categories down to third level, then add a product."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub</TableHead>
                <TableHead>Third</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tier / Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const raw = rawProducts.find((p) => String(p._id) === product.id);
                const tier = raw && typeof raw.tier === 'string' ? raw.tier : 'standard';
                const featured = Boolean(raw?.isFeatured);
                return (
                  <TableRow key={product.id} className="animate-fade-in">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>{product.subCategoryName}</TableCell>
                    <TableCell>{product.thirdSubCategoryName || '-'}</TableCell>
                    <TableCell className="font-semibold">${product.price}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="w-fit capitalize">
                          {tier}
                        </Badge>
                        {featured && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Star className="w-3 h-3" /> Featured
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toggleFeaturedMut.mutate({
                                id: product.id,
                                isFeatured: !featured,
                              })
                            }
                          >
                            <Star className="w-4 h-4 mr-2" />
                            {featured ? 'Unfeature' : 'Mark featured'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleTierMut.mutate({
                                id: product.id,
                                tier: tier === 'premium' ? 'standard' : 'premium',
                              })
                            }
                          >
                            <Gem className="w-4 h-4 mr-2" />
                            Set tier to {tier === 'premium' ? 'standard' : 'premium'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={null}
        onSave={handleSave}
        mainCategories={mainOptions}
        subCategories={subOptions}
        thirdSubCategories={thirdOptions}
      />
    </DashboardLayout>
  );
}
