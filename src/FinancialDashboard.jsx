/**
 * FINANCIAL DASHBOARD - PRODUCTION GRADE
 * Architecture:
 * - Single file component architecture
 * - React Context + useReducer for global state
 * - Custom hooks for logic separation: useTransactions, useFilters, useInsights
 * - Radix UI for accessible primitives (Tabs, Dialog, Select, Dropdown, Switch, Tooltip)
 * - Tailwind CSS for modern, high-fidelity styling
 * - Recharts for editorial-grade financial visualizations
 * - Date-fns for reliable date formatting
 */

import React, { 
  useState, 
  useReducer, 
  useContext, 
  useMemo, 
  useCallback, 
  useEffect, 
  createContext 
} from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  MoreHorizontal, 
  LayoutDashboard, 
  PieChart, 
  Receipt, 
  Zap, 
  Shield, 
  Eye, 
  Moon, 
  Sun,
  MoreVertical,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  FileJson,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Target,
  Clock,
  TrendingDown,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { 
  format, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  parseISO, 
  getMonth, 
  getYear,
  eachMonthOfInterval,
  isSameMonth,
  startOfYear,
  endOfYear,
  subDays
} from 'date-fns';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Label } from "@radix-ui/react-label";

// --- UTILITIES ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

// --- TYPES & CATEGORIES ---
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Utilities', 'Rent', 'Education', 'Travel', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

// --- BASE UI COMPONENTS (SHADCN STYLE) ---
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
);

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Badge = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success: "border-transparent bg-emerald-500/10 text-emerald-500",
    warning: "border-transparent bg-rose-500/10 text-rose-500",
  };
  return <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />;
};

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

// Simple dialog, dropdown etc. will be used directly from Radix but simplified.

// --- STATE MANAGEMENT ---
const DashboardContext = createContext();

const initialState = {
  transactions: [],
  filters: {
    search: '',
    category: 'All',
    type: 'All',
    dateRange: 'All Time',
    sortBy: 'date',
    sortOrder: 'desc'
  },
  role: 'admin',
  theme: 'dark',
  isLoading: true
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'TOGGLE_THEME':
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      return { ...state, theme: newTheme };
    case 'HYDRATE':
      return { ...state, ...action.payload, isLoading: false };
    default:
      return state;
  }
}

// --- MOCK DATA ---
const generateMockData = () => {
  const transactions = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() > 0.7;
    let type = isIncome ? 'income' : 'expense';
    let category = isIncome 
      ? INCOME_CATEGORIES[Math.floor(Math.random() * INCOME_CATEGORIES.length)]
      : EXPENSE_CATEGORIES[Math.floor(Math.random() * EXPENSE_CATEGORIES.length)];
    
    // Spread across 6 months
    const date = subDays(now, Math.floor(Math.random() * 180));
    const dayOfMonth = date.getDate();
    
    let amount = type === 'income' 
      ? Math.floor(Math.random() * 5000) + 1000 
      : Math.floor(Math.random() * 200) + 20;

    // Fixed salary on 1st/30th
    let description = `${category} ${i % 5 === 0 ? "subscription" : "payment"}`;
    if (dayOfMonth === 1 && Math.random() > 0.5) {
      amount = 4500;
      type = 'income';
      category = 'Salary';
      description = 'Monthly Salary Credit';
    }

    if (category === 'Rent') amount = 1200;
    if (category === 'Utilities') amount = Math.floor(Math.random() * 100) + 100;

    transactions.push({
      id: crypto.randomUUID(),
      date: date.toISOString(),
      description,
      amount,
      type,
      category,
      note: i % 10 === 0 ? "Auto-generated note for clarity." : ""
    });
  }
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// --- CUSTOM HOOKS ---
const useTransactions = () => {
  const { state, dispatch } = useContext(DashboardContext);
  
  const filteredTransactions = useMemo(() => {
    let result = [...state.transactions];
    const { search, category, type, dateRange, sortBy, sortOrder } = state.filters;
    
    if (search) {
      result = result.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    }
    if (category !== 'All') {
      result = result.filter(t => t.category === category);
    }
    if (type !== 'All') {
      result = result.filter(t => t.type === type.toLowerCase());
    }
    
    const now = new Date();
    if (dateRange === 'This Month') {
      result = result.filter(t => isSameMonth(parseISO(t.date), now));
    } else if (dateRange === 'Last Month') {
      result = result.filter(t => isSameMonth(parseISO(t.date), subMonths(now, 1)));
    } else if (dateRange === 'Last 3 Months') {
      const threeMonthsAgo = subMonths(now, 3);
      result = result.filter(t => parseISO(t.date) >= threeMonthsAgo);
    }
    
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
    
    return result;
  }, [state.transactions, state.filters]);

  return { filteredTransactions };
};

const useInsights = () => {
  const { state } = useContext(DashboardContext);
  const transactions = state.transactions;
  const now = new Date();
  
  const thisMonthExpenses = useMemo(() => 
    transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), now))
  , [transactions]);

  const lastMonthExpenses = useMemo(() => 
    transactions.filter(t => t.type === 'expense' && isSameMonth(parseISO(t.date), subMonths(now, 1)))
  , [transactions]);

  const highestSpending = useMemo(() => {
    const categories = {};
    thisMonthExpenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) return { category: 'None', amount: 0, percent: 0 };
    const total = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    return { 
      category: sorted[0][0], 
      amount: sorted[0][1], 
      percent: (sorted[0][1] / total) * 100 
    };
  }, [thisMonthExpenses]);

  const biggestExpense = useMemo(() => {
    const sorted = [...transactions].filter(t => t.type === 'expense').sort((a, b) => b.amount - a.amount);
    return sorted[0] || null;
  }, [transactions]);

  const bestIncomeMonth = useMemo(() => {
    const months = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      const key = format(parseISO(t.date), 'MMMM yyyy');
      months[key] = (months[key] || 0) + t.amount;
    });
    const sorted = Object.entries(months).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }, [transactions]);

  const frequentCategory = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : null;
  }, [transactions]);

  return { highestSpending, biggestExpense, bestIncomeMonth, frequentCategory, thisMonthExpenses, lastMonthExpenses };
};

// --- SUB-COMPONENTS ---

const SummaryCards = () => {
  const { state } = useContext(DashboardContext);
  const now = new Date();
  
  const currentMonth = useMemo(() => 
    state.transactions.filter(t => isSameMonth(parseISO(t.date), now))
  , [state.transactions]);
  
  const lastMonth = useMemo(() => 
    state.transactions.filter(t => isSameMonth(parseISO(t.date), subMonths(now, 1)))
  , [state.transactions]);

  const calculateStats = (txs) => {
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const curr = calculateStats(currentMonth);
  const prev = calculateStats(lastMonth);

  const getChange = (c, p) => p === 0 ? 0 : ((c - p) / p) * 100;
  const savingsRate = curr.income > 0 ? (curr.balance / curr.income) * 100 : 0;

  const totalBalance = state.transactions.reduce((sum, t) => 
    sum + (t.type === 'income' ? t.amount : -t.amount), 0
  );

  const CardItem = ({ title, value, change, icon: Icon, isCurrency = true, prefix = "" }) => (
    <Card className="p-6 transition-all hover:ring-1 hover:ring-primary/20 bg-muted/30 border-muted-foreground/10 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-background border group-hover:border-primary/30 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center text-xs font-mono", change >= 0 ? "text-emerald-500" : "text-rose-500")}>
            {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
        <h2 className="text-3xl font-mono font-bold tracking-tight">
          {isCurrency ? formatCurrency(value) : (prefix + value.toFixed(1) + "%")}
        </h2>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardItem title="Total Balance" value={totalBalance} icon={DollarSign} />
      <CardItem title="Total Income" value={curr.income} change={getChange(curr.income, prev.income)} icon={ArrowUpRight} />
      <CardItem title="Total Expenses" value={curr.expense} change={getChange(curr.expense, prev.expense)} icon={ArrowDownRight} />
      <CardItem title="Savings Rate" value={savingsRate} isCurrency={false} icon={Percent} />
    </div>
  );
};

const ChartsSection = () => {
  const { state } = useContext(DashboardContext);
  const { thisMonthExpenses } = useInsights();
  
  const chartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });
    
    let runningBalance = state.transactions
      .filter(t => parseISO(t.date) < subMonths(new Date(), 5))
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    return months.map(m => {
      const monthTxs = state.transactions.filter(t => isSameMonth(parseISO(t.date), m));
      const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      runningBalance += (income - expense);
      return {
        name: format(m, 'MMM'),
        income,
        expense,
        balance: runningBalance
      };
    });
  }, [state.transactions]);

  const pieData = useMemo(() => {
    const cats = {};
    thisMonthExpenses.forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [thisMonthExpenses]);

  const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <Card className="lg:col-span-2 p-6 bg-muted/20">
        <CardTitle className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" /> Balance Trend (6 Months)
        </CardTitle>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <RTooltip 
                contentStyle={{ backgroundColor: '#1e1e26', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: '#10b981', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6 bg-muted/20">
        <CardTitle className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center">
          <PieChart className="w-4 h-4 mr-2" /> Category Breakdown
        </CardTitle>
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <RTooltip 
                 contentStyle={{ backgroundColor: '#1e1e26', border: '1px solid #27272a', borderRadius: '8px' }}
              />
              <Legend verticalAlign="bottom" align="center" />
            </RPieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground uppercase">Total</span>
            <span className="text-xl font-bold font-mono">
              {formatCurrency(pieData.reduce((sum, d) => sum + d.value, 0))}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted/20">
        <CardTitle className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center">
          <Receipt className="w-4 h-4 mr-2" /> Income vs Expenses
        </CardTitle>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <RTooltip 
                contentStyle={{ backgroundColor: '#1e1e26', border: '1px solid #27272a', borderRadius: '8px' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

// --- DATA PERSISTENCE ---
const STORAGE_KEY = 'financial_dashboard_state';

const saveToLocal = (state) => {
  const data = {
    transactions: state.transactions,
    role: state.role,
    theme: state.theme
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadFromLocal = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

// --- TOAST NOTIFICATION ---
const useToast = () => {
  const [toasts, setToasts] = useState([]);
  
  const toast = useCallback(({ title, description, variant = 'default' }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return { toast, toasts };
};

const ToastContainer = ({ toasts }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map(t => (
      <div key={t.id} className={cn(
        "px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-right-full flex items-center justify-between min-w-[300px]",
        t.variant === 'destructive' ? "bg-rose-950 border-rose-500 text-rose-100" : "bg-zinc-900 border-emerald-500/50 text-emerald-50"
      )}>
        <div>
          <p className="font-bold text-sm">{t.title}</p>
          {t.description && <p className="text-xs opacity-80">{t.description}</p>}
        </div>
        <button onClick={() => {}} className="ml-4 opacity-50 hover:opacity-100">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// --- MAIN TRANS ACTION FORM ---
const TransactionModal = ({ open, onClose, editingTransaction }) => {
  const { state, dispatch } = useContext(DashboardContext);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    type: 'expense',
    category: EXPENSE_CATEGORIES[0],
    note: ''
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ...editingTransaction,
        date: format(parseISO(editingTransaction.date), 'yyyy-MM-dd'),
        amount: editingTransaction.amount.toString()
      });
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        amount: '',
        type: 'expense',
        category: EXPENSE_CATEGORIES[0],
        note: ''
      });
    }
  }, [editingTransaction, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
    };
    
    if (editingTransaction) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { ...payload, id: editingTransaction.id } });
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: { ...payload, id: crypto.randomUUID() } });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-[#16161c] border-zinc-800 animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{editingTransaction ? "Edit Transaction" : "New Transaction"}</CardTitle>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <XCircle className="w-5 h-5" />
            </button>
          </CardHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Type</Label>
                <div className="flex bg-muted/50 p-1 rounded-md">
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'income', category: INCOME_CATEGORIES[0]})}
                    className={cn("flex-1 px-3 py-1.5 text-xs rounded transition-all", formData.type === 'income' ? "bg-primary text-black font-semibold" : "text-muted-foreground")}
                  >Income</button>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'expense', category: EXPENSE_CATEGORIES[0]})}
                    className={cn("flex-1 px-3 py-1.5 text-xs rounded transition-all", formData.type === 'expense' ? "bg-destructive text-white font-semibold" : "text-muted-foreground")}
                  >Expense</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Date</Label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  required 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="bg-muted/30 border-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Description</Label>
              <Input 
                placeholder="Where did it go/come from?" 
                value={formData.description} 
                required 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="bg-muted/30 border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.amount} 
                    required 
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="pl-9 bg-muted/30 border-zinc-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Category</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-zinc-800 bg-muted/30 text-sm focus:ring-2 focus:ring-ring"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Note (Optional)</Label>
              <textarea 
                className="w-full p-3 rounded-md border border-zinc-800 bg-muted/30 text-sm h-20"
                value={formData.note}
                onChange={e => setFormData({...formData, note: e.target.value})}
              />
            </div>
          </div>
          <div className="p-6 border-t border-zinc-800 flex gap-3">
             <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
             <Button type="submit" className="flex-1 font-bold">
               {editingTransaction ? "Save Changes" : "Confirm"}
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- TABLE COMPONENTS ---
const TransactionTable = () => {
  const { state, dispatch } = useContext(DashboardContext);
  const { filteredTransactions } = useTransactions();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const currentData = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => setCurrentPage(1), [state.filters]);

  const handleExport = (format) => {
    if (format === 'csv') {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Note'];
      const rows = filteredTransactions.map(t => [
        format(parseISO(t.date), 'yyyy-MM-dd'),
        t.description,
        t.category,
        t.type,
        t.amount,
        t.note || ''
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString()}.csv`;
      a.click();
    } else {
      const blob = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString()}.json`;
      a.click();
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold font-mono tracking-tight flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary" /> Recent History
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          {state.role === 'admin' && (
             <div className="relative group">
               <Button variant="outline" size="sm" className="bg-muted/20">
                 <Download className="w-4 h-4 mr-2" /> Export
               </Button>
               <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 min-w-[120px]">
                 <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center">
                   <FileSpreadsheet className="w-3 h-3 mr-2" /> CSV
                 </button>
                 <button onClick={() => handleExport('json')} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center">
                   <FileJson className="w-3 h-3 mr-2" /> JSON
                 </button>
               </div>
             </div>
          )}
          {state.role === 'admin' && (
            <Button size="sm" onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Transaction
            </Button>
          )}
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-muted/20 rounded-xl border border-muted-foreground/10">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search descriptions..." 
            className="pl-9 bg-background/50" 
            value={state.filters.search}
            onChange={e => dispatch({ type: 'SET_FILTERS', payload: { search: e.target.value } })}
          />
        </div>
        <select 
          className="h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
          value={state.filters.category}
          onChange={e => dispatch({ type: 'SET_FILTERS', payload: { category: e.target.value } })}
        >
          <option value="All">All Categories</option>
          <optgroup label="Income">
            {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Expense">
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
        <select 
          className="h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
          value={state.filters.type}
          onChange={e => dispatch({ type: 'SET_FILTERS', payload: { type: e.target.value } })}
        >
          <option value="All">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <select 
          className="h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
          value={state.filters.dateRange}
          onChange={e => dispatch({ type: 'SET_FILTERS', payload: { dateRange: e.target.value } })}
        >
          <option value="All Time">All Time</option>
          <option value="This Month">This Month</option>
          <option value="Last Month">Last Month</option>
          <option value="Last 3 Months">Last 3 Months</option>
        </select>
        <div className="flex gap-2">
            <select 
              className="flex-1 h-10 px-3 rounded-md border border-input bg-background/50 text-sm"
              value={state.filters.sortBy}
              onChange={e => dispatch({ type: 'SET_FILTERS', payload: { sortBy: e.target.value } })}
            >
              <option value="date">Sort By Date</option>
              <option value="amount">Sort By Amount</option>
              <option value="category">Sort By Category</option>
            </select>
            <Button 
               variant="outline" 
               size="icon" 
               className="h-10 w-10 shrink-0"
               onClick={() => dispatch({ type: 'SET_FILTERS', payload: { sortOrder: state.filters.sortOrder === 'asc' ? 'desc' : 'asc' } })}
            >
               <TrendingDown className={cn("w-4 h-4 transition-transform", state.filters.sortOrder === 'asc' ? "rotate-180" : "rotate-0")} />
            </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-muted-foreground/10">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-center">Category</th>
              <th className="px-6 py-4 text-center">Type</th>
              <th className="px-6 py-4 text-right">Amount</th>
              {state.role === 'admin' && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {currentData.length > 0 ? currentData.map(t => (
              <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                <td className="px-6 py-4 font-mono text-muted-foreground whitespace-nowrap">
                  {format(parseISO(t.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{t.description}</div>
                  {t.note && <div className="text-[10px] text-muted-foreground italic mt-0.5">{t.note}</div>}
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] uppercase">
                    {t.category}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                   <div className={cn(
                     "inline-flex items-center text-[10px] uppercase font-bold",
                     t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                   )}>
                     {t.type === 'income' ? <Plus className="w-2.5 h-2.5 mr-1" /> : <div className="w-2.5 h-0.5 bg-current mr-1 rounded" />}
                     {t.type}
                   </div>
                </td>
                <td className={cn(
                  "px-6 py-4 text-right font-mono font-bold",
                  t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                )}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                {state.role === 'admin' && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTransaction(t); setIsModalOpen(true); }}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-400" onClick={() => {
                        if(confirm("Confirm deletion of this record?")) {
                          dispatch({ type: 'DELETE_TRANSACTION', payload: t.id });
                        }
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={state.role === 'admin' ? 6 : 5} className="px-6 py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Zap className="w-10 h-10 opacity-10 mb-4" />
                    <p className="tracking-widest uppercase text-xs">No records matching your search filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-mono">{Math.min(currentData.length, ITEMS_PER_PAGE)}</span> of <span className="font-mono">{filteredTransactions.length}</span> entries
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="h-8"
          ><ChevronLeft className="w-4 h-4" /></Button>
          <div className="flex items-center px-4 text-xs font-mono uppercase bg-muted/20 rounded border border-zinc-800">
            Page {currentPage} / {totalPages || 1}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="h-8"
          ><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <TransactionModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingTransaction={editingTransaction} 
      />
    </div>
  );
};

// --- INSIGHTS COMPONENTS ---
const InsightsGrid = () => {
  const { highestSpending, biggestExpense, bestIncomeMonth, frequentCategory, thisMonthExpenses, lastMonthExpenses } = useInsights();
  const { filteredTransactions } = useTransactions();
  
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalSavings = filteredTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const savingsProgress = Math.max(0, Math.min(100, (totalSavings / (totalIncome * 0.2)) * 100));

  const InsightCard = ({ icon: Icon, title, metric, context, accent = "emerald" }) => (
    <Card className={cn("p-6 relative overflow-hidden border-l-4 transition-all hover:translate-y-[-2px]", 
      accent === "emerald" ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-violet-500 bg-violet-500/5")}>
      <Icon className="absolute top-2 right-2 w-12 h-12 opacity-5" />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className={cn("p-1.5 rounded bg-background border", accent === "emerald" ? "border-emerald-500/20 text-emerald-500" : "border-violet-500/20 text-violet-500")}>
             <Icon className="w-4 h-4" />
           </div>
           <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</h3>
        </div>
        <div>
          <p className="text-2xl font-bold font-mono">{metric}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{context}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      <InsightCard 
        icon={TrendingUp}
        title="Highest Spending"
        metric={highestSpending.category}
        context={`${formatCurrency(highestSpending.amount)} spent this month. That's ${highestSpending.percent.toFixed(1)}% of your total expenses.`}
      />
      <InsightCard 
        icon={Calendar}
        title="Monthly Comparison"
        metric="Trend Analysis"
        accent="violet"
        context={`You've spent ${thisMonthExpenses.length > lastMonthExpenses.length ? 'more' : 'less'} frequently this month compared to last month.`}
      />
       <InsightCard 
        icon={Receipt}
        title="Biggest Expense"
        metric={biggestExpense ? formatCurrency(biggestExpense.amount) : "$0"}
        context={biggestExpense ? `${biggestExpense.description} on ${format(parseISO(biggestExpense.date), 'MMM dd')}` : 'No expenses recorded yet.'}
      />
      <InsightCard 
        icon={ArrowUpRight}
        title="Best Income Month"
        accent="violet"
        metric={bestIncomeMonth ? bestIncomeMonth.name : "N/A"}
        context={bestIncomeMonth ? `Highest monthly earnings recorded: ${formatCurrency(bestIncomeMonth.amount)}` : 'Keep tracking to see insights.'}
      />
      <Card className="p-6 border-l-4 border-l-emerald-500 bg-emerald-500/5 lg:col-span-1">
        <Target className="absolute top-2 right-2 w-12 h-12 opacity-5 text-emerald-500" />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="p-1.5 rounded bg-background border border-emerald-500/20 text-emerald-500">
               <Target className="w-4 h-4" />
             </div>
             <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Savings Goal Tracker</h3>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-end">
                <p className="text-2xl font-bold font-mono">{savingsProgress.toFixed(1)}%</p>
                <p className="text-[10px] uppercase text-muted-foreground">Target: 20% Income</p>
             </div>
             <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-emerald-500/20">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${savingsProgress}%` }} 
                />
             </div>
             <p className="text-xs text-muted-foreground">You have saved {formatCurrency(totalSavings)} out of targeted {formatCurrency(totalIncome * 0.2)}</p>
          </div>
        </div>
      </Card>
      <InsightCard 
        icon={Zap}
        accent="violet"
        title="Frequent Patterns"
        metric={frequentCategory ? frequentCategory.name : "None"}
        context={`${frequentCategory ? frequentCategory.count : 0} transactions detected in this category across your history.`}
      />
    </div>
  );
};

// --- MAIN LAYOUT COMPONENT ---
const FinancialDashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { toast, toasts } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // App Initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = loadFromLocal();
      if (stored && stored.transactions.length > 0) {
        dispatch({ type: 'HYDRATE', payload: stored });
      } else {
        const mock = generateMockData();
        dispatch({ type: 'SET_TRANSACTIONS', payload: mock });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 800); // 800ms fake delay for premium feel
    return () => clearTimeout(timer);
  }, []);

  // Sync with LocalStorage
  useEffect(() => {
    if (!state.isLoading) saveToLocal(state);
  }, [state]);

  // Handle Role Change
  const handleRoleChange = (newRole) => {
    dispatch({ type: 'SET_ROLE', payload: newRole });
    toast({
      title: `Environment: ${newRole.toUpperCase()}`,
      description: `Switching context to ${newRole} mode.`
    });
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl space-y-8 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
            <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-800 rounded-xl" />)}
          </div>
          <div className="h-96 bg-zinc-800 rounded-xl w-full" />
        </div>
        <p className="mt-8 text-zinc-600 font-mono text-xs uppercase tracking-widest animate-bounce">
          Decrypting Financial Ledger...
        </p>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      <div className={cn("min-h-screen transition-colors duration-500", state.theme === 'dark' ? "bg-[#0f0f13] text-white" : "bg-slate-50 text-slate-900")}>
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 w-full border-b backdrop-blur bg-background/80 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black">
                 <Shield className="w-6 h-6" />
               </div>
               <div>
                  <h1 className="text-lg font-bold font-mono tracking-tighter leading-tight uppercase">ZORVYN <span className="text-primary">CORE</span></h1>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em]">Quantum Ledger v4.2</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center p-1 bg-muted/50 border rounded-lg">
                <Button 
                  size="sm" 
                  variant={state.role === 'viewer' ? "secondary" : "ghost"} 
                  className={cn("h-7 px-3 text-[10px] font-bold uppercase", state.role === 'viewer' && "bg-background shadow-sm")}
                  onClick={() => handleRoleChange('viewer')}
                >
                  <Eye className="w-3 h-3 mr-1.5" />
                  Viewer
                </Button>
                <Button 
                   size="sm" 
                   variant={state.role === 'admin' ? "secondary" : "ghost"} 
                   className={cn("h-7 px-3 text-[10px] font-bold uppercase", state.role === 'admin' && "bg-background shadow-sm")}
                   onClick={() => handleRoleChange('admin')}
                >
                  <Shield className="w-3 h-3 mr-1.5" />
                  Admin
                </Button>
              </div>

              <div className="h-8 w-px bg-zinc-800" />
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                className="rounded-full hover:bg-muted"
              >
                {state.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Badge variant={state.role === 'admin' ? "success" : "outline"} className="hidden lg:flex px-3 py-1 font-mono uppercase text-[10px] tracking-widest border-zinc-700">
                {state.role} MODE
              </Badge>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
           {/* TABS NAVIGATION */}
           <div className="flex items-center justify-between mb-8 border-b border-zinc-800">
             <div className="flex gap-8 overflow-x-auto pb-0 invisible-scrollbar">
                {[
                  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
                  { id: "transactions", label: "Ledger", icon: Receipt },
                  { id: "insights", label: "Intelligence", icon: Zap }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative",
                      activeTab === tab.id 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute inset-0 bg-primary/5 rounded-t-lg" />}
                  </button>
                ))}
             </div>
             <div className="hidden lg:block text-xs font-mono text-muted-foreground uppercase opacity-50">
               Last Sync: {format(new Date(), 'HH:mm:ss')}
             </div>
           </div>

           {/* CONTENT LAYOUT */}
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                   <SummaryCards />
                   <ChartsSection />
                </div>
              )}

              {activeTab === 'transactions' && (
                <TransactionTable />
              )}

              {activeTab === 'insights' && (
                 <InsightsGrid />
              )}
           </div>
        </main>

        <footer className="border-t border-zinc-800 mt-20 py-10 px-6">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-6 opacity-40">
                 <p className="text-[10px] font-mono uppercase tracking-[0.2em]">&copy; 2026 ZORVYN FINTECH SOLUTIONS</p>
                 <div className="h-4 w-px bg-zinc-700" />
                 <p className="text-[10px] font-mono uppercase tracking-[0.2em]">ENCRYPTED TRANSACTIONAL LAYER</p>
              </div>
              <div className="flex gap-4">
                 {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-primary/20" />)}
              </div>
           </div>
        </footer>

        <ToastContainer toasts={toasts} />
      </div>
    </DashboardContext.Provider>
  );
};

export default FinancialDashboard;
