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
import { SubCategoryModal } from '@/components/modals/FormModals';
import { SubCategory } from '@/types';
import { Layers } from 'lucide-react';
import { addSubCategory, getCategories } from '@/api/admins';
import { categorySelectOptions, flattenSubsAndThirds } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function SubCategories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: rawCategories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
  });

  const { mainOptions } = categorySelectOptions(rawCategories);
  const { subCategories } = flattenSubsAndThirds(rawCategories);

  const filteredSubCategories = subCategories.filter(
    (sub) =>
      sub.name.toLowerCase().includes(search.toLowerCase()) ||
      (sub.categoryName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const addMutation = useMutation({
    mutationFn: (body: { name: string; description?: string; mainCategory: string }) =>
      addSubCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Sub-category created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create sub-category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleSave = (data: Partial<SubCategory>) => {
    const mainName =
      mainOptions.find((m) => m.id === data.categoryId)?.name ?? data.categoryName;
    if (!mainName || !data.name) {
      toast({ title: 'Select a parent category', variant: 'destructive' });
      return;
    }
    addMutation.mutate({
      name: data.name,
      description: data.description,
      mainCategory: mainName,
    });
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Sub-Categories"
        description="POST /admins/addsubcategory (parent = main category name)"
      >
        <Button onClick={() => setModalOpen(true)} disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          Add Sub-Category
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sub-categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filteredSubCategories.length === 0 ? (
          <EmptyState
            icon={<Layers className="w-8 h-8 text-muted-foreground" />}
            title="No sub-categories found"
            description="Add sub-categories under a main category."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Sub-Category
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubCategories.map((subCategory) => (
                <TableRow key={subCategory.id} className="animate-fade-in">
                  <TableCell className="font-medium">{subCategory.name}</TableCell>
                  <TableCell>{subCategory.categoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{subCategory.slug}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {subCategory.description || '-'}
                  </TableCell>
                  <TableCell>{new Date(subCategory.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <SubCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subCategory={null}
        onSave={handleSave}
        mainCategories={mainOptions}
      />
    </DashboardLayout>
  );
}
