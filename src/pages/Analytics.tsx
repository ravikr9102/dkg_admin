import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, StatCard, DataTableWrapper } from '@/components/shared/PageComponents';
import { mockAnalytics } from '@/data/mockData';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  AreaChart,
  Area,
} from 'recharts';

const CHART_COLORS = ['hsl(239, 84%, 67%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

export default function Analytics() {
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
      value: mockAnalytics.totalProducts.toLocaleString(),
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
        title="Analytics"
        description="Platform performance metrics and insights"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <DataTableWrapper className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Monthly revenue over time</p>
            </div>
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +{mockAnalytics.revenueGrowth}%
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalytics.salesTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(239, 84%, 67%)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataTableWrapper>

        {/* Orders Trend */}
        <DataTableWrapper className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Orders Statistics</h3>
              <p className="text-sm text-muted-foreground">Monthly orders over time</p>
            </div>
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +{mockAnalytics.ordersGrowth}%
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.salesTrend}>
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
                <Bar dataKey="orders" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataTableWrapper>

        {/* Orders by Status */}
        <DataTableWrapper className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">Orders by Status</h3>
            <p className="text-sm text-muted-foreground">Distribution of order statuses</p>
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="50%" height="100%">
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
                >
                  {mockAnalytics.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {mockAnalytics.ordersByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </DataTableWrapper>

        {/* User Growth */}
        <DataTableWrapper className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">User Growth</h3>
              <p className="text-sm text-muted-foreground">Total registered users over time</p>
            </div>
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <ArrowUpRight className="w-4 h-4" />
              +3.8%
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAnalytics.userGrowth}>
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
                  dataKey="users"
                  stroke="hsl(199, 89%, 48%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(199, 89%, 48%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DataTableWrapper>
      </div>

      {/* Top Products */}
      <DataTableWrapper className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Top Performing Products</h3>
          <p className="text-sm text-muted-foreground">Best selling products by revenue</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {mockAnalytics.topProducts.map((product, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {index + 1}
                </span>
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <p className="font-medium text-sm mb-1 line-clamp-2">{product.name}</p>
              <p className="text-2xl font-bold text-success">${product.revenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{product.sales} sales</p>
            </div>
          ))}
        </div>
      </DataTableWrapper>
    </DashboardLayout>
  );
}
