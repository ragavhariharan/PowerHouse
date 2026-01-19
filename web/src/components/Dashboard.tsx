import { CreditCard, Zap, Leaf, TrendingUp, Loader2 } from "lucide-react";
import { EnergyProfile, ExtractedBillData } from "@/lib/types";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

interface DashboardProps {
    data: {
        extractedData: ExtractedBillData;
        profile: EnergyProfile;
    };
    onReset: () => void;
}

export default function Dashboard({ data, onReset }: DashboardProps) {
    const { extractedData, profile } = data;

    const stats = [
        {
            label: "Monthly Cost",
            value: `$${profile.projectedMonthlyCost.toFixed(2)}`,
            icon: CreditCard,
            color: "text-accent-primary"
        },
        {
            label: "Daily Avg",
            value: `${profile.averageDailyConsumption} kWh`,
            icon: Zap,
            color: "text-yellow-400"
        },
        {
            label: "Carbon Footprint",
            value: `${profile.carbonFootprintKg} kg`,
            icon: Leaf,
            color: "text-green-400"
        },
        {
            label: "Efficiency Score",
            value: `${profile.efficiencyScore}/100`,
            icon: TrendingUp,
            color: "text-blue-400"
        }
    ];

    // Mock chart data for consumption trend
    const chartData = [
        { name: "Previous", kwh: profile.averageDailyConsumption * 30 * 0.9 }, // Mock
        { name: "Current", kwh: data.extractedData.consumptionKwh || 0 },
    ];

    // Mock pie data for cost breakdown
    const cost = profile.projectedMonthlyCost;
    const pieData = [
        { name: "Generation", value: cost * 0.45, color: "#00F0FF" },
        { name: "Delivery", value: cost * 0.40, color: "#7000FF" },
        { name: "Taxes & Fees", value: cost * 0.15, color: "#FF0055" },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto p-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Energy Profile
                    </h2>
                    <p className="text-text-secondary">Analysis based on {extractedData.billingDate || "latest bill"}</p>
                </div>
                <button onClick={onReset} className="text-sm border border-glass-border px-4 py-2 rounded-full hover:bg-white/5 transition-colors">
                    Upload New Bill
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-panel p-6 flex items-start justify-between hover:bg-white/5 transition-colors">
                        <div>
                            <p className="text-text-secondary text-sm mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Consumption Chart */}
                <div className="lg:col-span-2 glass-panel p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-xl font-bold mb-6">Consumption Trend</h3>
                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#00F0FF" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#52525b"
                                    tick={{ fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    tick={{ fill: '#71717a' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(21, 25, 33, 0.9)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '8px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="kwh" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Cost Breakdown & Insights */}
                <div className="space-y-8">
                    {/* Cost Breakdown Pie */}
                    <div className="glass-panel p-6 min-h-[300px] flex flex-col">
                        <h3 className="text-xl font-bold mb-4">Cost Breakdown</h3>
                        <div className="flex-1 min-h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
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
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(21, 25, 33, 0.9)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        formatter={(value: any) => [`$${(Number(value) || 0).toFixed(2)}`, 'Cost']}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Insights Panel */}
                    <div className="glass-panel p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-accent-secondary" />
                            AI Insights
                        </h3>
                        <div className="space-y-3">
                            {profile.insights.length > 0 ? (
                                profile.insights.map((insight, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-text-secondary">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Analyzing consumption patterns...</p>
                                </div>
                            )}

                            {/* Hardcoded sample insight for demo if empty */}
                            {profile.insights.length === 0 && (
                                <div className="p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/20">
                                    <p className="text-sm text-accent-primary">
                                        <strong>Tip:</strong> Your daily consumption is {profile.averageDailyConsumption > 20 ? "high" : "optimal"}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


