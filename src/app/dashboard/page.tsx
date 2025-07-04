/**
 * Dashboard Page Component
 * Displays customer spending data with interactive charts and filters
 */
"use client";

import {
  Zap,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
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
  ChartTooltip,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Customer } from "@/components/layout/header";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";

// Type definitions for data structures
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
  // Authentication and user context
  const { user, userDetails } = useAuth();

  // State management for customer data and UI
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartError, setChartError] = useState<boolean>(false);
  const [totalSpending, setTotalSpending] = useState<number>(0);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isLoadingTotal, setIsLoadingTotal] = useState<boolean>(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [customerTotalSpent, setCustomerTotalSpent] = useState<number>(0);
  const [customerTokenSpent, setCustomerTokenSpent] = useState<number>(0);
  const [originalChartData, setOriginalChartData] = useState<ChartData[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  // New error states
  const [totalError, setTotalError] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");

  // Options for year and month selection
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatTokenCount = (count: number): string => {
    if (count >= 1_000_000_000) {
      return (count / 1_000_000_000).toFixed(1) + "B";
    } else if (count >= 1_000_000) {
      return (count / 1_000_000).toFixed(1) + "M";
    } else if (count >= 1_000) {
      return (count / 1_000).toFixed(1) + "K";
    } else {
      return count.toLocaleString();
    }
  };

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

  const getColorBasedOnValue = (
    value: number,
    minValue: number,
    maxValue: number
  ) => {
    if (minValue === maxValue) {
      return "hsl(var(--chart-1))";
    }

    const normalizedValue = (value - minValue) / (maxValue - minValue);

    const hue = 223;
    const saturation = 72;
    const minLightness = 35;
    const maxLightness = 75;
    const lightness =
      minLightness + normalizedValue * (maxLightness - minLightness);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const fetchCustomerTokens = async (customerId: string): Promise<boolean> => {
    if (!customerId) return false;

    setIsLoadingTokens(true);
    setTokenError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/total/token/customer/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2 && data[0] === true) {
        const [, tokenArray] = data;
        if (Array.isArray(tokenArray) && tokenArray.length > 0) {
          setCustomerTokenSpent(tokenArray[0].total_tokens || 0);
          return true;
        }
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error fetching customer tokens:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch customer tokens";
      setTokenError(errorMessage);
      setCustomerTokenSpent(0);
      toast.error(`Token fetch failed: ${errorMessage}`);
      return false;
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const fetchCustomerTotal = async (customerId: string): Promise<boolean> => {
    if (!customerId) return false;

    setIsLoadingTotal(true);
    setTotalError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/total/customer/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2 && data[0] === true) {
        const [, totalArray] = data;
        if (Array.isArray(totalArray) && totalArray.length > 0) {
          setCustomerTotalSpent(totalArray[0].total_spent);
          return true;
        }
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error fetching customer total:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch customer total";
      setTotalError(errorMessage);
      setCustomerTotalSpent(0);
      toast.error(`Total fetch failed: ${errorMessage}`);
      return false;
    } finally {
      setIsLoadingTotal(false);
    }
  };

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
    if (!customerId || !year) return false;

    setIsChartLoading(true);
    setChartError(false);

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2 && data[0] === true) {
        const [, spendingArray] = data;
        if (Array.isArray(spendingArray)) {
          const spendingValues = spendingArray.map(
            (item: MonthlySpending) => item.total_spent
          );
          const minSpending = Math.min(...spendingValues);
          const maxSpending = Math.max(...spendingValues);

          const formattedData: ChartData[] = spendingArray.map(
            (item: MonthlySpending) => ({
              month: new Date(item.month + "-01").toLocaleDateString("en-US", {
                month: "short",
              }),
              spending: item.total_spent,
              fill: getColorBasedOnValue(
                item.total_spent,
                minSpending,
                maxSpending
              ),
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
          return true;
        }
      } else {
        throw new Error("No spending data found for this customer");
      }
    } catch (error) {
      console.error("Error fetching customer spending:", error);
      setChartError(true);
      setChartData([]);
      setOriginalChartData([]);
      setTotalSpending(0);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load customer spending data";
      toast.error(`Spending data fetch failed: ${errorMessage}`);
      return false;
    } finally {
      setIsChartLoading(false);
    }
  };

  // Sequential API calling with proper error handling
  const handleCustomerChange = async (customerId: string) => {
    setSelectedCustomer(customerId);
    setChartError(false);
    setTotalError("");
    setTokenError("");

    // Reset data
    setCustomerTotalSpent(0);
    setCustomerTokenSpent(0);
    setChartData([]);
    setOriginalChartData([]);
    setTotalSpending(0);

    if (!customerId) return;

    try {
      // Step 1: Fetch customer total
      const totalSuccess = await fetchCustomerTotal(customerId);

      if (!totalSuccess) {
        toast.error(
          "Failed to fetch customer total. Stopping further requests."
        );
        return;
      }

      // Step 2: Fetch customer tokens (only if total was successful)
      const tokenSuccess = await fetchCustomerTokens(customerId);

      if (!tokenSuccess) {
        toast.error("Failed to fetch customer tokens. Stopping chart request.");
        return;
      }

      // Step 3: Fetch customer spending chart data (only if tokens were successful)
      const spendingSuccess = await fetchCustomerSpending(
        customerId,
        selectedYear
      );

      if (!spendingSuccess) {
        toast.error("Failed to fetch customer spending data.");
        return;
      }

      // All requests successful
      toast.success("Customer data loaded successfully!");
    } catch (error) {
      console.error("Error in sequential API calls:", error);
      toast.error("An unexpected error occurred while loading customer data.");
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setChartError(false);
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
        fill: item.month === month ? item.fill : "hsl(var(--muted))",
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
            <h1 className="text-3xl font-bold tracking-tight capitalize">
              Welcome, {userDetails.user_name}
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your customer data
            </p>
          </>
        )}
      </div>

      <Card className="mb-8">
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="h-24">
              <CardContent className="flex items-center">
                <div className="flex items-center space-x-4 w-full">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <DollarSign className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Cost
                    </p>
                    <div className="text-xl font-bold">
                      {isLoadingTotal ? (
                        <Skeleton className="h-6 w-20" />
                      ) : totalError ? (
                        <span className="text-destructive text-sm">
                          Error loading
                        </span>
                      ) : (
                        `$${customerTotalSpent.toFixed(2)}`
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-24">
              <CardContent className="flex items-center">
                <div className="flex items-center space-x-4 w-full">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Zap className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Tokens
                    </p>
                    <div className="text-xl font-bold">
                      {isLoadingTokens ? (
                        <Skeleton className="h-6 w-20" />
                      ) : tokenError ? (
                        <span className="text-destructive text-sm">
                          Error loading
                        </span>
                      ) : (
                        formatTokenCount(customerTokenSpent)
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                      <span className="text-sm text-muted-foreground">
                        Year
                      </span>
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
                      <span className="text-sm text-muted-foreground">
                        Month
                      </span>
                    </div>
                    <Select
                      value={selectedMonth}
                      onValueChange={handleMonthChange}
                      disabled={
                        isChartLoading || originalChartData.length === 0
                      }
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
                        Please try selecting a different customer or year
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
                        textAnchor={
                          window.innerWidth >= 1024 ? "middle" : "end"
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent valueIcon="$" />}
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
        </>
      )}
    </div>
  );
};

export default Dashboard;
