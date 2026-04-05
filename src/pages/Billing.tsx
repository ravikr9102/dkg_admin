import { useState } from 'react';
import { Search, Download, Send, MoreHorizontal, Eye, FileText } from 'lucide-react';
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
import { mockInvoices } from '@/data/mockData';
import { Invoice } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function Billing() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      invoice.userName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = (invoice: Invoice) => {
    toast({
      title: 'Downloading Invoice',
      description: `Invoice ${invoice.invoiceNumber} is being downloaded.`,
    });
  };

  const handleSendInvoice = (invoice: Invoice) => {
    toast({
      title: 'Invoice Sent',
      description: `Invoice ${invoice.invoiceNumber} has been sent to ${invoice.userEmail}.`,
    });
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
  const overdueRevenue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  return (
    <DashboardLayout>
      <PageHeader
        title="Billing System"
        description="Manage invoices and billing for your orders"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-6 rounded-xl bg-success/10 border border-success/20">
          <p className="text-sm font-medium text-success mb-1">Paid Invoices</p>
          <p className="text-2xl font-bold text-success">${totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'paid').length} invoices
          </p>
        </div>
        <div className="p-6 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-sm font-medium text-warning mb-1">Pending Invoices</p>
          <p className="text-2xl font-bold text-warning">${pendingRevenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'pending').length} invoices
          </p>
        </div>
        <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-medium text-destructive mb-1">Overdue Invoices</p>
          <p className="text-2xl font-bold text-destructive">${overdueRevenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.filter(i => i.status === 'overdue').length} invoices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTableWrapper>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-muted-foreground" />}
            title="No invoices found"
            description="No invoices match your search criteria."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((invoice) => (
                <TableRow key={invoice.id} className="animate-fade-in">
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.userName}</p>
                      <p className="text-sm text-muted-foreground">{invoice.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">${invoice.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status as any} className="capitalize">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
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
                          View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                          <Send className="w-4 h-4 mr-2" />
                          Send to Customer
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
    </DashboardLayout>
  );
}
