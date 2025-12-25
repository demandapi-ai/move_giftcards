import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Gift, Download, Activity, DollarSign, Clock, TrendingUp, Plus,
    ArrowUpRight, ArrowDownLeft, Wallet, Sparkles, Users, AlertCircle,
    ChevronRight, ExternalLink, Copy
} from "lucide-react"
import { Link } from "react-router-dom"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"

export default function Dashboard() {
    const { user } = usePrivy()

    // Mock data - would come from contract in real implementation
    const walletData = {
        address: user?.wallet?.address || "0xdAa2...bAC6",
        balances: [
            { token: "MOVE", amount: "5.2", usd: "$52.00", change: "+12.5%" },
            { token: "USDC", amount: "150.00", usd: "$150.00", change: "0.0%" },
            { token: "USDT", amount: "25.50", usd: "$25.50", change: "0.0%" },
        ],
        totalUsd: "$227.50"
    }

    const stats = {
        totalSent: 15,
        totalSentValue: "$1,234",
        totalReceived: 8,
        totalReceivedValue: "$567",
        pending: 3,
        claimed: 12,
        successRate: 85
    }

    const sentCards = [
        { id: 1, amount: "1.5", token: "MOVE", recipient: "@alice", recipientType: "twitter", status: "pending", date: "2h ago", message: "Happy Birthday! 🎂" },
        { id: 2, amount: "10", token: "USDC", recipient: "john@example.com", recipientType: "email", status: "claimed", date: "5h ago", message: "Thanks for your help!" },
        { id: 3, amount: "2", token: "MOVE", recipient: "@bob", recipientType: "twitter", status: "pending", date: "1d ago", message: "" },
        { id: 4, amount: "5", token: "USDT", recipient: "sarah#1234", recipientType: "discord", status: "expired", date: "3d ago", message: "Welcome!" },
        { id: 5, amount: "0.5", token: "MOVE", recipient: "alice@crypto.com", recipientType: "email", status: "claimed", date: "1w ago", message: "" },
    ]

    const claimableCards = [
        { id: 101, amount: "5.0", token: "MOVE", from: "@charlie", message: "Great work on the project! 🚀", expiresIn: "25 days" },
        { id: 102, amount: "25", token: "USDC", from: "team@movement.xyz", message: "Welcome to Movement!", expiresIn: "58 days" },
    ]

    const recentActivity = [
        { id: 1, action: "sent", amount: "1.5 MOVE", counterparty: "@alice", time: "2 hours ago", txHash: "0x1a2b..." },
        { id: 2, action: "claimed", amount: "2 MOVE", counterparty: "@bob", time: "5 hours ago", txHash: "0x3c4d..." },
        { id: 3, action: "received", amount: "10 USDC", counterparty: "@charlie", time: "1 day ago", txHash: "0x5e6f..." },
        { id: 4, action: "sent", amount: "5 USDT", counterparty: "sarah#1234", time: "3 days ago", txHash: "0x7g8h..." },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case "claimed": return "bg-green-100 text-green-700 border-green-200"
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200"
            case "expired": return "bg-red-100 text-red-700 border-red-200"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const copyAddress = () => {
        navigator.clipboard.writeText(walletData.address)
        toast.success("Address copied!")
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header with Gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-6 md:p-8 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-yellow-300" />
                            <span className="text-sm text-purple-200">MoveGiftCards Dashboard</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">
                            Welcome back! 👋
                        </h1>
                        <div className="flex items-center gap-2 text-purple-100">
                            <span className="truncate max-w-[200px]">
                                {user?.email?.address || user?.twitter?.username || walletData.address}
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-purple-200 hover:text-white hover:bg-white/10" onClick={copyAddress}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="secondary" size="lg" className="shadow-lg">
                            <Link to="/send">
                                <Plus className="mr-2 h-5 w-5" />
                                Send Gift
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                            <Link to="/claim">
                                <Download className="mr-2 h-5 w-5" />
                                Claim
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Overview - Bento Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Wallet Balance Card - Larger */}
                <Card className="bento-card md:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Balance</CardTitle>
                            <Wallet className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900 mb-4">{walletData.totalUsd}</div>
                        <div className="space-y-2">
                            {walletData.balances.map((bal) => (
                                <div key={bal.token} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                            {bal.token[0]}
                                        </div>
                                        <span className="font-medium">{bal.amount} {bal.token}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">{bal.usd}</span>
                                        <span className={`text-xs ${bal.change.startsWith('+') ? 'text-green-600' : 'text-gray-400'}`}>
                                            {bal.change}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Cards */}
                <Card className="bento-card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-gray-500 mt-1">Cards waiting to be claimed</p>
                        <Link to="/history" className="text-xs text-yellow-600 hover:underline flex items-center gap-1 mt-2">
                            View all <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardContent>
                </Card>

                {/* Success Rate */}
                <Card className="bento-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
                        <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.successRate}%</div>
                        <Progress value={stats.successRate} className="mt-2 h-2" />
                        <p className="text-xs text-gray-500 mt-2">{stats.claimed} of {stats.totalSent} claimed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Claimable Cards Alert */}
            {claimableCards.length > 0 && (
                <Card className="bento-card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Gift className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-800">You have {claimableCards.length} gifts to claim! 🎁</h3>
                                <p className="text-sm text-green-600">
                                    {claimableCards[0].amount} {claimableCards[0].token} from {claimableCards[0].from} and more...
                                </p>
                            </div>
                            <Button asChild className="bg-green-600 hover:bg-green-700">
                                <Link to="/claim">
                                    Claim Now <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Sent Gift Cards - Bento Grid */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Your Sent Gift Cards</CardTitle>
                            <CardDescription>Track the status of gifts you've sent</CardDescription>
                        </div>
                        <Link to="/history" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                            View All <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sentCards.slice(0, 5).map((card) => (
                                <div key={card.id} className="bento-card group cursor-pointer">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                                            <Gift className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <Badge variant="outline" className={getStatusColor(card.status)}>
                                            {card.status}
                                        </Badge>
                                    </div>
                                    <div className="text-xl font-bold mb-1">{card.amount} {card.token}</div>
                                    <div className="text-sm text-gray-600 truncate">{card.recipient}</div>
                                    {card.message && (
                                        <div className="text-xs text-gray-400 mt-2 truncate italic">"{card.message}"</div>
                                    )}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                        <span className="text-xs text-gray-400">{card.date}</span>
                                        <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            ))}

                            {/* Create New Card */}
                            <Link to="/send" className="bento-card flex flex-col items-center justify-center border-dashed border-2 hover:border-purple-400 hover:bg-purple-50 transition-all min-h-[160px] group">
                                <div className="p-3 bg-purple-100 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="h-6 w-6 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-purple-600">Send New Gift</span>
                                <span className="text-xs text-gray-400 mt-1">via Email, Twitter, or Discord</span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Activity</CardTitle>
                            <Button variant="ghost" size="sm" className="text-purple-600">
                                See all
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className={`p-2 rounded-full flex-shrink-0 ${item.action === "sent" ? "bg-purple-100" :
                                        item.action === "claimed" ? "bg-green-100" : "bg-blue-100"
                                    }`}>
                                    {item.action === "sent" && <ArrowUpRight className="h-4 w-4 text-purple-600" />}
                                    {item.action === "claimed" && <Download className="h-4 w-4 text-green-600" />}
                                    {item.action === "received" && <ArrowDownLeft className="h-4 w-4 text-blue-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight">
                                        {item.action === "sent" && <>Sent <span className="text-purple-600 font-bold">{item.amount}</span> to {item.counterparty}</>}
                                        {item.action === "claimed" && <><span className="text-green-600">{item.counterparty}</span> claimed {item.amount}</>}
                                        {item.action === "received" && <>Received <span className="text-blue-600 font-bold">{item.amount}</span> from {item.counterparty}</>}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-400">{item.time}</span>
                                        <span className="text-xs text-gray-300">•</span>
                                        <span className="text-xs text-gray-400 group-hover:text-purple-600 transition-colors">{item.txHash}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bento-card">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <ArrowUpRight className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalSent}</p>
                            <p className="text-xs text-gray-500">Total Sent</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bento-card">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalReceived}</p>
                            <p className="text-xs text-gray-500">Total Received</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bento-card">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">23</p>
                            <p className="text-xs text-gray-500">Unique Recipients</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bento-card">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.totalSentValue}</p>
                            <p className="text-xs text-gray-500">Total Value Sent</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Large Buttons */}
            <div className="grid gap-4 md:grid-cols-2">
                <Button asChild size="lg" className="h-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg">
                    <Link to="/send" className="flex flex-col items-center gap-1">
                        <Gift className="h-6 w-6" />
                        <span className="text-lg font-bold">Send a Gift Card</span>
                        <span className="text-xs text-purple-200">Email, Twitter, or Discord</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-20 hover:bg-gray-50">
                    <Link to="/claim" className="flex flex-col items-center gap-1">
                        <Download className="h-6 w-6 text-purple-600" />
                        <span className="text-lg font-bold">Claim a Gift</span>
                        <span className="text-xs text-gray-500">{claimableCards.length} pending gifts</span>
                    </Link>
                </Button>
            </div>
        </div>
    )
}
