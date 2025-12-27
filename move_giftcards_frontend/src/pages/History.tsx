import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "react-i18next"
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Filter, Download, TrendingUp } from "lucide-react"

export default function History() {
    const { t } = useTranslation()
    const [filter, setFilter] = useState("all")

    const stats = {
        totalSent: 12,
        totalSentValue: "$1,234",
        totalReceived: 8,
        totalReceivedValue: "$567",
    }

    const transactions = [
        { id: 1, type: "sent", amount: "1.5 MOVE", counterparty: "@alice", status: "claimed", date: "2024-12-28", txHash: "0x1a2b..." },
        { id: 2, type: "received", amount: "10 USDC", counterparty: "@bob", status: "claimed", date: "2024-12-27", txHash: "0x3c4d..." },
        { id: 3, type: "sent", amount: "2.0 MOVE", counterparty: "charlie@email.com", status: "pending", date: "2024-12-25", txHash: "0x5e6f..." },
        { id: 4, type: "received", amount: "5 USDT", counterparty: "@diana", status: "expired", date: "2024-10-15", txHash: "0x7g8h..." },
        { id: 5, type: "sent", amount: "0.5 MOVE", counterparty: "alice@crypto.com", status: "claimed", date: "2024-12-20", txHash: "0x9i0j..." },
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "claimed": return <Badge className="bg-green-100 text-green-700">Claimed</Badge>
            case "pending": return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
            case "expired": return <Badge className="bg-red-100 text-red-700">Expired</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const filteredTransactions = transactions.filter(tx => {
        if (filter === "all") return true
        if (filter === "sent") return tx.type === "sent"
        if (filter === "received") return tx.type === "received"
        return tx.status === filter
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Transaction History</h1>
                    <p className="text-gray-600">View all your gift card transactions</p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bento-card bg-gradient-to-br from-purple-50 to-indigo-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Sent</p>
                                <p className="text-2xl font-bold">{stats.totalSent} Cards</p>
                                <p className="text-sm text-purple-600">{stats.totalSentValue}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <ArrowUpRight className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bento-card bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Received</p>
                                <p className="text-2xl font-bold">{stats.totalReceived} Cards</p>
                                <p className="text-sm text-green-600">{stats.totalReceivedValue}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <ArrowDownLeft className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bento-card bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Net Value</p>
                                <p className="text-2xl font-bold">$1,801</p>
                                <p className="text-sm text-blue-600 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" /> All time
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>All Transactions</CardTitle>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="claimed">Claimed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Counterparty</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {tx.type === "sent" ? (
                                                <div className="p-1.5 bg-purple-100 rounded-full">
                                                    <ArrowUpRight className="h-3 w-3 text-purple-600" />
                                                </div>
                                            ) : (
                                                <div className="p-1.5 bg-green-100 rounded-full">
                                                    <ArrowDownLeft className="h-3 w-3 text-green-600" />
                                                </div>
                                            )}
                                            <span className="font-medium capitalize">{tx.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{tx.amount}</TableCell>
                                    <TableCell>{tx.counterparty}</TableCell>
                                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                    <TableCell className="text-gray-500">{tx.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
