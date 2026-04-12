import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, DataTableWrapper, EmptyState } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryModal } from '@/components/modals/FormModals';
import { Category } from '@/types';
import { FolderTree } from 'lucide-react';
import { addMainCategory, getCategories } from '@/api/admins';
import { useAuth } from '@/contexts/AuthContext';
import { mainCategoriesToRows } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function Categories() {
  const { isVendorAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: rawCategories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
    enabled: isVendorAdmin,
  });

  const categories: Category[] = mainCategoriesToRows(rawCategories);

  const addMutation = useMutation({
    mutationFn: (body: { name: string }) => addMainCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Category created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Partial<Category>) => {
    addMutation.mutate({ name: data.name! });
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Categories"
        description="Main categories from DKGPro (GET /admins/categories · POST /admins/addcategory)"
      >
        <Button onClick={() => setModalOpen(true)} disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="w-8 h-8 text-muted-foreground" />}
            title="No categories found"
            description="Create a main category to use it when adding products."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="animate-fade-in">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {category.description || '-'}
                  </TableCell>
                  <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(category.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <CategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        category={null}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}
