import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
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
import { BlogModal, DeleteModal } from '@/components/modals/FormModals';
import { Blog } from '@/types';
import { FileText } from 'lucide-react';
import {
  createBlog,
  deleteBlog,
  getAdminBlogs,
  updateBlog,
} from '@/api/admins';
import { apiBlogToBlog } from '@/utils/mapEntity';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

export default function Blogs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Blog | null }>({
    open: false,
    item: null,
  });

  const { data: rawBlogs = [], isLoading } = useQuery({
    queryKey: ['admin', 'blogs'],
    queryFn: async () => (await getAdminBlogs()).blogs,
  });

  const blogs: Blog[] = rawBlogs.map((b) => apiBlogToBlog(b));

  const createMut = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blogs'] });
      toast({ title: 'Blog created' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create blog';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateBlog>[1];
    }) => updateBlog(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blogs'] });
      toast({ title: 'Blog updated' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to update';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blogs'] });
      toast({ title: 'Blog deleted' });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const filtered = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (data: Partial<Blog>) => {
    const published = data.status === 'published';
    const tags = data.tags ?? [];
    if (editBlog) {
      updateMut.mutate({
        id: editBlog.id,
        body: {
          title: data.title,
          content: data.content,
          tags,
          published,
        },
      });
    } else {
      createMut.mutate({
        title: data.title!,
        content: data.content!,
        tags,
        published,
      });
    }
    setEditBlog(null);
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteModal.item) {
      deleteMut.mutate(deleteModal.item.id);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditBlog(blog);
    setModalOpen(true);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Blogs"
        description="GET/POST /admins/blogs · PUT /admins/edit-blog/:id · DELETE /admins/delete-blog/:id"
      >
        <Button
          onClick={() => {
            setEditBlog(null);
            setModalOpen(true);
          }}
          disabled={createMut.isPending}
        >
          <Plus className="w-4 h-4" />
          Add Blog
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
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
            icon={<FileText className="w-8 h-8 text-muted-foreground" />}
            title="No blogs found"
            description="Create a blog post."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Blog
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((blog) => (
                <TableRow key={blog.id} className="animate-fade-in">
                  <TableCell>
                    <div>
                      <p className="font-medium">{blog.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {blog.excerpt}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{blog.author}</TableCell>
                  <TableCell>
                    <Badge variant={blog.status as 'draft' | 'published'} className="capitalize">
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {blog.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {blog.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{blog.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(blog.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(blog.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(blog)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View / Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(blog)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteModal({ open: true, item: blog })}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableWrapper>

      <BlogModal
        key={editBlog?.id ?? 'new'}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditBlog(null);
        }}
        blog={editBlog}
        onSave={handleSave}
      />

      <DeleteModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}
        title="Delete Blog"
        description={`Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
