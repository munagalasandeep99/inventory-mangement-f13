
import React, { useEffect, useState, useMemo } from 'react';
import { fetchItems } from '../services/api';
import { InventoryItem, Sale } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SearchIcon } from '../components/Icons';

type EnrichedSale = Sale & {
    itemId: string;
    itemName: string;
    category: string;
};

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-secondary">{value}</p>
    </div>
);

const SalesReportPage: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const fetchedItems = await fetchItems();
                setItems(fetchedItems);
            } catch (err) {
                setError('Failed to fetch sales data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const allSales: EnrichedSale[] = useMemo(() => {
        if (!items) return [];
        return items.flatMap(item =>
            item.salesHistory?.map(sale => ({
                ...sale,
                itemId: item.itemId,
                itemName: item.name,
                category: item.category || 'Uncategorized',
            })) || []
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [items]);

    const filteredSales = useMemo(() => {
        return allSales.filter(sale => 
            sale.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allSales, searchTerm]);
    
    const summaryStats = useMemo(() => {
        const totalRevenue = allSales.reduce((acc, sale) => acc + sale.total, 0);
        const totalUnitsSold = allSales.reduce((acc, sale) => acc + sale.quantitySold, 0);
        const totalTransactions = allSales.length;
        return { totalRevenue, totalUnitsSold, totalTransactions };
    }, [allSales]);

    const salesOverTime = useMemo(() => {
        const salesByDate = allSales.reduce((acc, sale) => {
            const date = new Date(sale.date).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = 0;
            }
            acc[date] += sale.total;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(salesByDate).map(date => ({
            date,
            revenue: salesByDate[date],
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [allSales]);

    const topSellingProducts = useMemo(() => {
        const salesByProduct = allSales.reduce((acc, sale) => {
            if (!acc[sale.itemName]) {
                acc[sale.itemName] = 0;
            }
            acc[sale.itemName] += sale.quantitySold;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(salesByProduct)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [allSales]);

    const categoryPerformance = useMemo(() => {
        const salesByCategory = allSales.reduce((acc, sale) => {
            if (!acc[sale.category]) {
                acc[sale.category] = 0;
            }
            acc[sale.category] += sale.total;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(salesByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [allSales]);

    if (loading) return <div className="text-center p-10 text-gray-600">Loading sales report...</div>;
    if (error) return <div className="text-center p-10 text-red-500 bg-red-50 rounded-lg">{error}</div>;

    const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Sales Report</h1>

            {allSales.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                    <h2 className="text-2xl font-semibold mb-2">No Sales Data Available</h2>
                    <p>Once you start recording sales for your inventory items, your reports will appear here.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Revenue" value={`₹${summaryStats.totalRevenue.toLocaleString('en-IN')}`} />
                        <StatCard title="Total Units Sold" value={summaryStats.totalUnitsSold.toString()} />
                        <StatCard title="Total Transactions" value={summaryStats.totalTransactions.toString()} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-secondary">Revenue Over Time</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-md">
                           <h2 className="text-xl font-semibold mb-4 text-secondary">Top 5 Selling Products</h2>
                           <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topSellingProducts} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={120} />
                                    <Tooltip formatter={(value: number) => `${value} units`} />
                                    <Legend />
                                    <Bar dataKey="quantity" fill="#3b82f6" name="Units Sold" />
                                </BarChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-secondary">Revenue by Category</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={categoryPerformance} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={100} fill="#8884d8" dataKey="value">
                                        {categoryPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                         <h2 className="text-xl font-semibold mb-4 text-secondary">All Transactions</h2>
                         <div className="relative mb-4">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search transactions by product or category..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSales.map(sale => (
                                        <tr key={sale.saleId}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sale.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.itemName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.quantitySold}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{sale.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SalesReportPage;
