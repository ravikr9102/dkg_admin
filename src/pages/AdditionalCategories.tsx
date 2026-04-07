import { useMemo, useState } from 'react';
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
import { AdditionalCategoryModal } from '@/components/modals/FormModals';
import { GitBranch } from 'lucide-react';
import { createAdditionalCategory, getCategoryTree } from '@/api/admins';
import {
  flattenAdditionalCategoriesFromTree,
  thirdCategoryBreadcrumbOptions,
} from '@/utils/categoryTree';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function AdditionalCategories() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: treeData, isLoading } = useQuery({
    queryKey: ['admin', 'category-tree'],
    queryFn: async () => (await getCategoryTree()).categoryTree,
  });

  const tree = treeData ?? [];
  const rows = useMemo(() => flattenAdditionalCategoriesFromTree(tree), [tree]);
  const thirdOptions = useMemo(() => thirdCategoryBreadcrumbOptions(tree), [tree]);
  const additionalParentNames = useMemo(
    () => Array.from(new Set(rows.map((r) => r.name))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filtered = rows.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.mainCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.subCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.thirdCategoryName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      item.parentName.toLowerCase().includes(search.toLowerCase())
  );

  const addMutation = useMutation({
    mutationFn: createAdditionalCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'category-tree'] });
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({ title: 'Additional category created' });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to create additional category';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleSave = (data: {
    name: string;
    parentName: string;
    parentModel: 'ThirdCategory' | 'AdditionalCategory';
    bannerImage?: File | null;
  }) => {
    addMutation.mutate(data);
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Additional Categories"
        description="POST /admins/create-additional-category (parent = third or additional category name)"
      >
        <Button
          onClick={() => setModalOpen(true)}
          disabled={addMutation.isPending || thirdOptions.length === 0}
        >
          <Plus className="w-4 h-4" />
          Add Additional Category
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search additional categories..."
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
            title={rows.length === 0 ? 'No additional categories yet' : 'No additional categories found'}
            description={
              thirdOptions.length === 0
                ? 'Add third sub-categories first, then create additional categories under them.'
                : 'Add categories under a third sub-category or nest under another additional category.'
            }
            action={
              <Button
                onClick={() => setModalOpen(true)}
                disabled={thirdOptions.length === 0}
              >
                <Plus className="w-4 h-4" />
                Add Additional Category
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
                <TableHead>Third</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="animate-fade-in">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.mainCategoryName}</TableCell>
                  <TableCell>{item.subCategoryName}</TableCell>
                  <TableCell>{item.thirdCategoryName}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-xs block">
                      {item.parentModel}
                    </span>
                    {item.parentName}
                  </TableCell>
                  <TableCell>{item.level}</TableCell>
                  <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <AdditionalCategoryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        additionalCategory={null}
        onSave={handleSave}
        thirdOptions={thirdOptions}
        additionalParentNames={additionalParentNames}
      />
    </DashboardLayout>
  );
}
