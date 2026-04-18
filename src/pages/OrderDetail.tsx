import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/shared/PageComponents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusModal } from '@/components/modals/FormModals';
import { OrderStatus } from '@/types';
import { getAdminOrder, updateAdminOrderStatus, type ApiAdminOrder } from '@/api/admins';
import { getSuperAdminOrder } from '@/api/superadmins';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import { useState } from 'react';

function formatMoney(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function OrderDetail() {
  const { isSuperAdmin } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const qc = useQueryClient();
  const [statusOpen, setStatusOpen] = useState(false);

  const orderQueryKey = isSuperAdmin
    ? (['superadmin', 'order', orderId] as const)
    : (['admin', 'order', orderId] as const);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: orderQueryKey,
    queryFn: async () =>
      isSuperAdmin
        ? (await getSuperAdminOrder(orderId!)).order
        : (await getAdminOrder(orderId!)).order,
    enabled: Boolean(orderId),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      qc.invalidateQueries({ queryKey: ['superadmin', 'order', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['superadmin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast({ title: 'Order status updated' });
      setStatusOpen(false);
    },
    onError: (err) => {
      toast({
        title: err instanceof ApiError ? err.message : 'Failed to update status',
        variant: 'destructive',
      });
    },
  });

  const order = data as ApiAdminOrder | undefined;

  if (!orderId) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted-foreground">Invalid order.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 pl-0" asChild>
          <Link to="/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        <PageHeader
          title={order?.orderNumber ?? 'Order'}
          description={
            isSuperAdmin ? 'GET /superadmins/orders/:orderId (read-only)' : 'GET /admins/orders/:orderId'
          }
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading order…</p>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {error instanceof ApiError ? error.message : 'Failed to load order.'}{' '}
          <Button variant="link" className="h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : order ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={order.status as never} className="capitalize">
              {order.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Placed {new Date(order.createdAt).toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              Updated {new Date(order.updatedAt).toLocaleString()}
            </span>
            {!isSuperAdmin ? (
              <Button type="button" size="sm" onClick={() => setStatusOpen(true)}>
                Update status
              </Button>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{order.userName}</p>
                <p className="text-muted-foreground">{order.userEmail}</p>
                {order.userPhone ? <p className="text-muted-foreground">{order.userPhone}</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {order.shippingAddress ? (
                  <>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </>
                ) : (
                  <p>—</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                {isSuperAdmin ? 'Line items' : 'Line items (your products)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {order.items.map((line, idx) => {
                const img = line.product?.images?.[0];
                const name = line.product?.name ?? 'Product';
                const listPrice = line.product?.price;
                return (
                  <div key={line._id ?? idx}>
                    {idx > 0 ? <Separator className="mb-6" /> : null}
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-24 w-24 shrink-0 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="font-semibold">{name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty {line.quantity} × {formatMoney(line.price)} ={' '}
                          <span className="font-medium text-foreground">
                            {formatMoney(line.price * line.quantity)}
                          </span>
                        </p>
                        {listPrice != null && listPrice !== line.price ? (
                          <p className="text-xs text-muted-foreground">
                            Catalog MRP: {formatMoney(listPrice)}
                          </p>
                        ) : null}
                        {line.bookingAddonLines && line.bookingAddonLines.length > 0 ? (
                          <div className="rounded-md border bg-muted/30 p-3 text-sm">
                            <p className="mb-2 font-medium">Add-ons</p>
                            <ul className="space-y-1">
                              {line.bookingAddonLines.map((a, i) => (
                                <li key={i} className="flex flex-wrap justify-between gap-2">
                                  <span>
                                    <span className="text-muted-foreground">
                                      [{a.sectionName ?? '—'}]
                                    </span>{' '}
                                    {a.addonName ?? '—'}
                                    {a.quantity != null ? ` ×${a.quantity}` : ''}
                                  </span>
                                  {a.lineTotal != null ? (
                                    <span className="font-medium">{formatMoney(a.lineTotal)}</span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isSuperAdmin ? 'Items subtotal' : 'Your lines (subtotal)'}
                </span>
                <span className="font-medium">{formatMoney(order.myTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full order total</span>
                <span className="font-semibold">{formatMoney(order.orderTotal)}</span>
              </div>
              {!isSuperAdmin && order.orderTotal !== order.myTotal ? (
                <p className="text-xs text-muted-foreground">
                  Full order may include other sellers’ products or fees not shown in your lines.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {order && !isSuperAdmin ? (
        <OrderStatusModal
          open={statusOpen}
          onOpenChange={setStatusOpen}
          orderId={String(order.id)}
          currentStatus={order.status as OrderStatus}
          onSave={async (id, status) => {
            await updateMut.mutateAsync({ id, status });
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
