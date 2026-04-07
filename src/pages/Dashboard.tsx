import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Plus,
  Eye,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard, DataTableWrapper } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/contexts/AuthContext';
import { mockOrders, mockAnalytics } from '@/data/mockData';
import {
  ProductModal,
  OrderStatusModal,
  type ProductModalSavePayload,
} from '@/components/modals/FormModals';
import { OrderStatus } from '@/types';
import { addProduct, getAdminProducts, getCategories } from '@/api/admins';
import { categorySelectOptions } from '@/utils/categoryTree';
import { apiProductToProduct } from '@/utils/mapEntity';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['hsl(239, 84%, 67%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [orderStatusModal, setOrderStatusModal] = useState<{ open: boolean; orderId: string; status: OrderStatus }>({
    open: false,
    orderId: '',
    status: 'pending',
  });
  const [orders, setOrders] = useState(mockOrders);

  const { data: rawCategories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await getCategories()).categories,
  });
  const { mainOptions, subOptions, thirdOptions } = categorySelectOptions(rawCategories);

  const { data: rawProducts = [] } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => (await getAdminProducts()).products,
  });

  const products = useMemo(
    () => rawProducts.map((p) => apiProductToProduct(p)),
    [rawProducts]
  );

  const addProductMut = useMutation({
    mutationFn: (body: Parameters<typeof addProduct>[0]) => addProduct(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({ title: 'Product created' });
      setProductModalOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to create product';
      toast({ title: msg, variant: 'destructive' });
    },
  });

  const handleSaveProduct = (data: ProductModalSavePayload) => {
    addProductMut.mutate({
      name: data.name,
      description: data.description,
      price: data.price,
      ...(data.discountedPrice != null
        ? { discountedPrice: data.discountedPrice }
        : {}),
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
      inclusions: data.inclusions.length ? data.inclusions : ['—'],
      experiences: data.experiences.length ? data.experiences : ['—'],
      keyHighlights: data.keyHighlights.length ? data.keyHighlights : ['—'],
    });
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
    ));
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${mockAnalytics.totalRevenue.toLocaleString()}`,
      change: mockAnalytics.revenueGrowth,
      trend: 'up' as const,
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      title: 'Total Orders',
      value: mockAnalytics.totalOrders.toLocaleString(),
      change: mockAnalytics.ordersGrowth,
      trend: 'up' as const,
      icon: <ShoppingCart className="w-6 h-6" />,
    },
    {
      title: 'Total Products',
      value: products.length.toLocaleString(),
      change: 5.2,
      trend: 'up' as const,
      icon: <Package className="w-6 h-6" />,
    },
    {
      title: 'Total Users',
      value: mockAnalytics.totalUsers.toLocaleString(),
      change: 3.8,
      trend: 'up' as const,
      icon: <Users className="w-6 h-6" />,
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}!`}
        description={`Here's what's happening with your store today.`}
      >
        <Button onClick={() => setProductModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Orders Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((order) => (
                <TableRow key={order.id} className="animate-fade-in">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.userName}</p>
                      <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.items.length} item(s)</TableCell>
                  <TableCell className="font-semibold">${order.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={order.status as any} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setOrderStatusModal({ 
                            open: true, 
                            orderId: order.id, 
                            status: order.status 
                          })}
                        >
                          Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableWrapper>
      </div>

      <>
          {/* Products Table */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Products Overview</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <DataTableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub-Category</TableHead>
                    <TableHead>Third Sub-Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.slice(0, 5).map((product) => (
                    <TableRow key={product.id} className="animate-fade-in">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images[0] && (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.categoryName}</TableCell>
                      <TableCell>{product.subCategoryName}</TableCell>
                      <TableCell>{product.thirdSubCategoryName || '-'}</TableCell>
                      <TableCell className="font-semibold">${product.price}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant={product.status as any} className="capitalize">
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableWrapper>
          </div>

          {/* Analytics Charts (mock — no admin analytics API yet) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Trend */}
            <DataTableWrapper className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockAnalytics.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(239, 84%, 67%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(239, 84%, 67%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DataTableWrapper>

            {/* Orders by Status */}
            <DataTableWrapper className="p-6">
              <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockAnalytics.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {mockAnalytics.ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataTableWrapper>

            {/* User Growth */}
            <DataTableWrapper className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockAnalytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="users" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DataTableWrapper>

            {/* Top Products */}
            <DataTableWrapper className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Products</h3>
              <div className="space-y-4">
                {mockAnalytics.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                      </div>
                    </div>
                    <p className="font-semibold text-success">${product.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </DataTableWrapper>
          </div>
      </>

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={null}
        onSave={handleSaveProduct}
        mainCategories={mainOptions}
        subCategories={subOptions}
        thirdSubCategories={thirdOptions}
      />

      <OrderStatusModal
        open={orderStatusModal.open}
        onOpenChange={(open) => setOrderStatusModal({ ...orderStatusModal, open })}
        orderId={orderStatusModal.orderId}
        currentStatus={orderStatusModal.status}
        onSave={handleUpdateOrderStatus}
      />
    </DashboardLayout>
  );
}
