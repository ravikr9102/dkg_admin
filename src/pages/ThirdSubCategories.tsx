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
import { ThirdSubCategoryModal } from '@/components/modals/FormModals';
import { ThirdSubCategory } from '@/types';
import { GitBranch } from 'lucide-react';
import { addThirdCategory, getCategories } from '@/api/admins';
import { categorySelectOptions, flattenSubsAndThirds } from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function ThirdSubCategories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: rawCategories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
  });

  const { mainOptions, subOptions } = categorySelectOptions(rawCategories);
  const { thirdSubCategories } = flattenSubsAndThirds(rawCategories);

  const filtered = thirdSubCategories.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.categoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.subCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const addMutation = useMutation({
    mutationFn: (body: { name: string; description?: string; subCategory: string }) =>
      addThirdCategory(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Third sub-category created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create third sub-category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleSave = (data: Partial<ThirdSubCategory>) => {
    const subName =
      subOptions.find((s) => s.id === data.subCategoryId)?.name ?? data.subCategoryName;
    if (!subName || !data.name) {
      toast({ title: 'Select sub-category and name', variant: 'destructive' });
      return;
    }
    addMutation.mutate({
      name: data.name,
      description: data.description,
      subCategory: subName,
    });
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Third Sub-Categories"
        description="POST /admins/addthirdcategory (parent = sub-category name)"
      >
        <Button onClick={() => setModalOpen(true)} disabled={addMutation.isPending}>
          <Plus className="w-4 h-4" />
          Add Third Sub-Category
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search third sub-categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTableWrapper>
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<GitBranch className="w-8 h-8 text-muted-foreground" />}
            title="No third sub-categories found"
            description="Add third-level categories for product creation."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Third Sub-Category
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub-Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="animate-fade-in">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.categoryName}</TableCell>
                  <TableCell>{item.subCategoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <ThirdSubCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        thirdSubCategory={null}
        onSave={handleSave}
        mainCategories={mainOptions}
        subCategories={subOptions}
      />
    </DashboardLayout>
  );
}
