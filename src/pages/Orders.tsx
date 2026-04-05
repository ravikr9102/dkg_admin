import { useState } from 'react';
import { Search, MoreHorizontal, Eye, Edit } from 'lucide-react';
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
import { mockOrders } from '@/data/mockData';
import { OrderStatusModal } from '@/components/modals/FormModals';
import { Order, OrderStatus } from '@/types';
import { ShoppingCart } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState(mockOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusModal, setStatusModal] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });

  const filtered = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.userName.toLowerCase().includes(search.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
    ));
  };

  const getStatusCount = (status: OrderStatus) => orders.filter(o => o.status === status).length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Orders"
        description="Manage customer orders and track fulfillment"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((status) => (
          <div
            key={status}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              statusFilter === status 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <Badge variant={status as any} className="capitalize mb-2">
              {status}
            </Badge>
            <p className="text-2xl font-bold">{getStatusCount(status)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTableWrapper>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-8 h-8 text-muted-foreground" />}
            title="No orders found"
            description="No orders match your search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} className="animate-fade-in">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.userName}</p>
                      <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.productName}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-muted-foreground">
                          +{order.items.length - 2} more
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${order.total.toLocaleString()}</TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant={order.status as any} className="capitalize">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
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
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusModal({ open: true, order })}>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Status
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

      {/* Status Modal */}
      {statusModal.order && (
        <OrderStatusModal
          open={statusModal.open}
          onOpenChange={(open) => setStatusModal({ ...statusModal, open })}
          orderId={statusModal.order.id}
          currentStatus={statusModal.order.status}
          onSave={handleStatusChange}
        />
      )}
    </DashboardLayout>
  );
}
