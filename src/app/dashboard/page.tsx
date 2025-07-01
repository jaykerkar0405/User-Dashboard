"use client";

import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Card,
  CardTitle,
  CardFooter,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Customer } from "@/components/layout/header";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";
import {
  Users,
  TrendingUp,
  CalendarDays,
  CalendarClock,
  AlertCircle,
} from "lucide-react";

type MonthlySpending = {
  month: string;
  total_spent: number;
  customer_id: number;
};

type ChartData = {
  fill: string;
  month: string;
  spending: number;
  isSelected: boolean;
};

const Dashboard = () => {
  const { user, userDetails } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalSpending, setTotalSpending] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [originalChartData, setOriginalChartData] = useState<ChartData[]>([]);
  const [chartError, setChartError] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "Jan", label: "January" },
    { value: "Feb", label: "February" },
    { value: "Mar", label: "March" },
    { value: "Apr", label: "April" },
    { value: "May", label: "May" },
    { value: "Jun", label: "June" },
    { value: "Jul", label: "July" },
    { value: "Aug", label: "August" },
    { value: "Sep", label: "September" },
    { value: "Oct", label: "October" },
    { value: "Nov", label: "November" },
    { value: "Dec", label: "December" },
  ];

  const chartConfig = {
    spending: {
      label: "Total Spent",
    },
  } satisfies ChartConfig;

  const fetchCustomers = async () => {
    setIsLoading(true);

    const fetchPromise = async (): Promise<Customer[]> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/list/customers`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2 && data[0] === true) {
        const [, customerArray] = data;
        if (Array.isArray(customerArray)) {
          return customerArray as Customer[];
        }
      }

      throw new Error("Invalid response format");
    };

    try {
      toast.promise(fetchPromise(), {
        loading: "Loading customers...",
        error: "Failed to load customers",
        success: "Customers loaded successfully!",
      });

      const customerData = await fetchPromise();
      setCustomers(customerData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerSpending = async (customerId: string, year: string) => {
    if (!customerId || !year) return;

    setIsChartLoading(true);
    setChartError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/total/customer/${customerId}/month/every/${year}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customer spending data");
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2 && data[0] === true) {
        const [, spendingArray] = data;
        if (Array.isArray(spendingArray)) {
          const formattedData: ChartData[] = spendingArray.map(
            (item: MonthlySpending, index: number) => ({
              month: new Date(item.month + "-01").toLocaleDateString("en-US", {
                month: "short",
              }),
              spending: item.total_spent,
              fill: `var(--chart-${(index % 5) + 1})`,
              isSelected: false,
            })
          );

          const total = spendingArray.reduce(
            (sum: number, item: MonthlySpending) => sum + item.total_spent,
            0
          );

          setOriginalChartData(formattedData);
          setChartData(formattedData);
          setTotalSpending(total);
          setSelectedMonth("all");
        }
      } else {
        throw new Error("No spending data found for this customer");
      }
    } catch (error) {
      console.error("Error fetching customer spending:", error);
      setChartError("Failed to load spending data for this customer");
      setChartData([]);
      setOriginalChartData([]);
      setTotalSpending(0);
      toast.error("Failed to load customer spending data");
    } finally {
      setIsChartLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    setChartError("");
    fetchCustomerSpending(customerId, selectedYear);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setChartError("");
    if (selectedCustomer) {
      fetchCustomerSpending(selectedCustomer, year);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);

    if (month === "all") {
      const updatedData = originalChartData.map((item) => ({
        ...item,
        isSelected: false,
        fill: `var(--chart-${(originalChartData.indexOf(item) % 5) + 1})`,
      }));
      setChartData(updatedData);

      const total = originalChartData.reduce(
        (sum, item) => sum + item.spending,
        0
      );
      setTotalSpending(total);
    } else {
      const updatedData = originalChartData.map((item) => ({
        ...item,
        isSelected: item.month === month,
        fill:
          item.month === month
            ? `var(--chart-${(originalChartData.indexOf(item) % 5) + 1})`
            : "hsl(var(--muted))",
      }));
      setChartData(updatedData);

      const selectedMonthData = originalChartData.find(
        (item) => item.month === month
      );
      setTotalSpending(selectedMonthData ? selectedMonthData.spending : 0);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      fetchCustomers();
    }
  }, [user?.user_id]);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 min-h-[82vh]">
      <div className="space-y-2">
        {!userDetails ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {userDetails.user_name}
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your customer data
            </p>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5" />
              Customer Selection
            </div>
            <div className="text-sm font-normal text-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `Total: ${customers.length}`
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            {!isLoading && customers.length != 0 && (
              <>
                <label className="text-sm font-medium">Select Customer</label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedCustomer}
                    disabled={customers.length === 0}
                    onValueChange={handleCustomerChange}
                  >
                    <SelectTrigger className="mt-2 w-full lg:w-1/2">
                      <SelectValue placeholder="Choose a customer..." />
                    </SelectTrigger>

                    <SelectContent>
                      {customers
                        .filter((c) => c.customer_id)
                        .sort((a, b) => a.customer_id - b.customer_id)
                        .map((customer) => (
                          <SelectItem
                            key={customer.customer_id}
                            value={customer.customer_id.toString()}
                          >
                            Customer #{customer.customer_id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}

            {!isLoading && customers.length === 0 && (
              <div className="text-center py-8 text-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <CardTitle className="text-lg sm:text-xl">
                  Monthly Spending - Customer #{selectedCustomer}
                </CardTitle>
                <CardDescription className="text-sm">
                  {selectedMonth === "all"
                    ? `Total spending by month for ${selectedYear}`
                    : `Spending for ${
                        monthOptions.find((m) => m.value === selectedMonth)
                          ?.label
                      } ${selectedYear}`}
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Year</span>
                  </div>
                  <Select
                    value={selectedYear}
                    disabled={isChartLoading}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Month</span>
                  </div>
                  <Select
                    value={selectedMonth}
                    onValueChange={handleMonthChange}
                    disabled={isChartLoading || originalChartData.length === 0}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-2 sm:px-6">
            {isChartLoading ? (
              <Skeleton className="h-48 sm:h-64 w-full" />
            ) : chartError ? (
              <div className="h-48 sm:h-64 w-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Unable to load data</p>
                    <p className="text-xs text-muted-foreground">
                      {chartError}
                    </p>
                  </div>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-48 sm:h-64 w-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No spending data available
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <ChartContainer
                  config={chartConfig}
                  className="h-48 sm:h-64 w-full"
                >
                  <BarChart
                    data={chartData}
                    accessibilityLayer
                    margin={{
                      top: 10,
                      left: 10,
                      right: 10,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      interval={0}
                      fontSize={12}
                      dataKey="month"
                      tickMargin={10}
                      tickLine={false}
                      axisLine={false}
                      angle={window.innerWidth >= 1024 ? 0 : -45}
                      height={window.innerWidth >= 1024 ? 40 : 60}
                      textAnchor={window.innerWidth >= 1024 ? "middle" : "end"}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      radius={8}
                      strokeWidth={2}
                      dataKey="spending"
                      activeBar={({ ...props }) => {
                        return (
                          <Rectangle
                            {...props}
                            fillOpacity={0.8}
                            strokeDasharray={4}
                            strokeDashoffset={4}
                            stroke={props.payload.fill}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col items-start gap-2 text-sm px-2 sm:px-6">
            <div className="flex gap-2 leading-none font-medium">
              {isChartLoading ? (
                <>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : chartError || chartData.length === 0 ? (
                <span className="text-muted-foreground">
                  No data to display
                </span>
              ) : (
                <>
                  <span className="break-words">
                    {selectedMonth === "all"
                      ? `Total spending: $${totalSpending.toFixed(2)}`
                      : `${
                          monthOptions.find((m) => m.value === selectedMonth)
                            ?.label
                        } spending: $${totalSpending.toFixed(2)}`}
                  </span>
                  <TrendingUp className="size-4 flex-shrink-0" />
                </>
              )}
            </div>

            <div className="text-muted-foreground leading-none text-xs sm:text-sm">
              {chartError || chartData.length === 0
                ? "Please select a different customer or year"
                : selectedMonth === "all"
                ? `Showing monthly spending data for ${selectedYear}`
                : `Showing ${
                    monthOptions.find((m) => m.value === selectedMonth)?.label
                  } ${selectedYear} data`}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
