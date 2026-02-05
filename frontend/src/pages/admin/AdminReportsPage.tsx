import { useState } from 'react';
import {
  useAdminDailySales,
  useAdminWeeklySales,
  useAdminOrdersByStatus,
} from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, TrendingUp, PieChart } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminReportsPage() {
  const [dailyDays, setDailyDays] = useState(7);
  const [weeklyWeeks, setWeeklyWeeks] = useState(4);

  const { data: dailySales, isLoading: dailyLoading } = useAdminDailySales(dailyDays);
  const { data: weeklySales, isLoading: weeklyLoading } = useAdminWeeklySales(weeklyWeeks);
  const { data: ordersByStatus, isLoading: statusLoading } = useAdminOrdersByStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">Sales and order analytics</p>
      </div>

      {/* Daily Sales Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Sales Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Days:</Label>
            <Select value={dailyDays.toString()} onValueChange={(v) => setDailyDays(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {dailyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : dailySales && dailySales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell>
                      {new Date(day.date).toLocaleDateString('en-NG', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">{day.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(day.totalSales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Sales Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Sales Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Weeks:</Label>
            <Select value={weeklyWeeks.toString()} onValueChange={(v) => setWeeklyWeeks(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
                <SelectItem value="12">12 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {weeklyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : weeklySales && weeklySales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week Starting</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklySales.map((week) => (
                  <TableRow key={week.weekStart}>
                    <TableCell>
                      {new Date(week.weekStart).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">{week.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(week.totalSales)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No sales data available</p>
          )}
        </CardContent>
      </Card>

      {/* Orders by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Orders by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : ordersByStatus && ordersByStatus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ordersByStatus.map((item) => (
                <div
                  key={item.status}
                  className={`p-4 rounded-lg ${statusColors[item.status] || 'bg-gray-100'}`}
                >
                  <p className="text-lg font-bold capitalize">{item.status}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.orderCount}</span> orders
                    </p>
                    <p className="text-sm font-semibold">
                      {formatPrice(item.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No order data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
