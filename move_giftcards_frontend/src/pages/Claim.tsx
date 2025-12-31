import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "sonner"
import { Gift, ArrowRight, Clock, AlertTriangle, Search, Filter } from "lucide-react"
import { Link } from "react-router-dom"

export default function Claim() {
    const { t } = useTranslation()
    const [claiming, setClaiming] = useState<number | null>(null)
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")

    const claimableCards = [
        { id: 1, amount: "1.5 MOVE", from: "@alice", fromEmail: "alice@crypto.com", message: "Thanks for your help! 🙏", expiresIn: "25 days", createdAt: "2 days ago", type: "email", urgent: false },
        { id: 2, amount: "10.0 USDC", from: "@bob", fromEmail: "bob@example.com", message: "Happy Birthday! 🎉", expiresIn: "58 days", createdAt: "5 hours ago", type: "twitter", urgent: false },
        { id: 3, amount: "2.0 MOVE", from: "@charlie", fromEmail: "charlie#1234", message: "Welcome to Movement! 🚀", expiresIn: "3 days", createdAt: "1 month ago", type: "discord", urgent: true },
    ]

    const filteredCards = claimableCards.filter(card => {
        if (filter !== "all" && card.type !== filter) return false
        if (search && !card.from.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const handleClaim = async (id: number) => {
        setClaiming(id)
        try {
            toast.loading("Verifying identity...")
            await new Promise(r => setTimeout(r, 1000))
            toast.dismiss()
            toast.loading("Claiming gift on-chain...")
            await new Promise(r => setTimeout(r, 1500))
            toast.dismiss()
            toast.success("Gift claimed successfully! 🎉")
        } catch (error) {
            toast.dismiss()
            toast.error("Failed to claim gift")
        } finally {
            setClaiming(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Claim Your Gifts 🎁</h1>
                    <p className="text-gray-600">You have {claimableCards.length} pending gift cards waiting!</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by sender..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {filteredCards.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium mb-2">No gifts found</h3>
                            <p className="text-gray-500">{search || filter !== "all" ? "Try adjusting your filters" : "You don't have any pending gifts"}</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredCards.map((card) => (
                        <Card key={card.id} className={`bento-card ${card.urgent ? "ring-2 ring-orange-400" : ""}`}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-purple-100 rounded-full">
                                            <Gift className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl font-bold">{card.amount}</span>
                                                {card.urgent && (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                                        <AlertTriangle className="h-3 w-3 mr-1" /> Expiring Soon
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-600">From: <span className="font-medium">{card.from}</span> ({card.fromEmail})</p>
                                            {card.message && <p className="text-gray-500 mt-2 italic">"{card.message}"</p>}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expires in {card.expiresIn}</span>
                                                <span>Created {card.createdAt}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button size="lg" className="bg-purple-600 hover:bg-purple-700 min-w-[120px]" onClick={() => handleClaim(card.id)} disabled={claiming === card.id}>
                                        {claiming === card.id ? "Claiming..." : <>Claim <ArrowRight className="ml-2 h-4 w-4" /></>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Have a Gift ID?</CardTitle>
                    <CardDescription>Enter the ID from your email or message to claim</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input placeholder="Enter Gift ID (e.g. 12345)" className="flex-1" />
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                            <Link to="/claim/redeem">
                                Lookup <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
