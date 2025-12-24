import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePrivy } from "@privy-io/react-auth"
import { useNavigate } from "react-router-dom"
import { Gift, Mail, Shield, Sparkles, ArrowRight, Zap, Users, Globe, AlertCircle } from "lucide-react"

export default function Landing() {
    const { login, authenticated, ready } = usePrivy()
    const navigate = useNavigate()

    // If already authenticated, go to dashboard
    if (authenticated) {
        navigate("/dashboard")
        return null
    }

    // Check if Privy is configured properly
    const privyAppId = import.meta.env.VITE_PRIVY_APP_ID
    const isPrivyConfigured = privyAppId && privyAppId !== "your-privy-app-id-here"

    const handleGetStarted = () => {
        if (isPrivyConfigured) {
            login()
        } else {
            // In dev mode, navigate directly to dashboard for testing
            navigate("/dashboard")
        }
    }

    return (
        <div className="min-h-screen mesh-gradient">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Gift className="h-8 w-8 text-purple-600" />
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            MoveGiftCards
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                        <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
                        <a href="https://docs.movementnetwork.xyz" target="_blank" className="text-gray-600 hover:text-gray-900">Docs</a>
                    </nav>
                    <Button onClick={handleGetStarted} className="bg-purple-600 hover:bg-purple-700">
                        Get Started
                    </Button>
                </div>
            </header>

            {/* Dev Mode Notice */}
            {!isPrivyConfigured && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
                    <div className="container mx-auto flex items-center gap-3 text-yellow-800">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <div className="text-sm">
                            <strong>Development Mode:</strong> Privy not configured.
                            <a href="https://dashboard.privy.io" target="_blank" className="underline ml-1">Get your App ID</a> and add it to <code className="bg-yellow-100 px-1 rounded">.env</code> file.
                            <span className="ml-2 text-yellow-600">Click "Get Started" to preview the dashboard anyway.</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <Sparkles className="h-4 w-4" />
                    Built on Movement Network
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    Send Crypto Gifts <br />
                    <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                        to Anyone, Anywhere
                    </span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Gift MOVE tokens via email, Twitter, or Discord. Recipients claim with just their social login - no wallet needed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" onClick={handleGetStarted} className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
                        <Gift className="mr-2 h-5 w-5" />
                        Start Gifting
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate("/dashboard")}>
                        Preview Dashboard
                    </Button>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-gray-900 text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        <div className="text-center">
                            <div className="text-3xl font-bold">$125K+</div>
                            <div className="text-gray-400">Total Gifted</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">1,284</div>
                            <div className="text-gray-400">Cards Claimed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">567</div>
                            <div className="text-gray-400">Active Cards</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">99.9%</div>
                            <div className="text-gray-400">Uptime</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="features" className="container mx-auto px-4 py-20">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                    Why MoveGiftCards?
                </h2>
                <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                    The simplest way to onboard friends and family to crypto
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Feature 1 - Large */}
                    <Card className="bento-card md:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-purple-100 rounded-2xl">
                                    <Mail className="h-8 w-8 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Send to Any Email</h3>
                                    <p className="text-gray-600 text-lg">
                                        Recipients don't need a wallet. They can claim with just their email, Twitter, or Discord login through Privy.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feature 2 */}
                    <Card className="bento-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-8">
                            <div className="p-4 bg-green-100 rounded-2xl inline-block mb-4">
                                <Shield className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Secure & Private</h3>
                            <p className="text-gray-600">
                                Recipient IDs are hashed on-chain. Only the intended recipient can claim.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Feature 3 */}
                    <Card className="bento-card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                        <CardContent className="p-8">
                            <div className="p-4 bg-orange-100 rounded-2xl inline-block mb-4">
                                <Zap className="h-8 w-8 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Instant Delivery</h3>
                            <p className="text-gray-600">
                                Cards are created on-chain instantly. Recipients get notified immediately.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Feature 4 */}
                    <Card className="bento-card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                        <CardContent className="p-8">
                            <div className="p-4 bg-blue-100 rounded-2xl inline-block mb-4">
                                <Globe className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Multiple Tokens</h3>
                            <p className="text-gray-600">
                                Send MOVE, USDC, or USDT. Recipients always get what you intended.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Feature 5 */}
                    <Card className="bento-card bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
                        <CardContent className="p-8">
                            <div className="p-4 bg-pink-100 rounded-2xl inline-block mb-4">
                                <Users className="h-8 w-8 text-pink-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Bulk Sending</h3>
                            <p className="text-gray-600">
                                Send to multiple recipients at once. Perfect for team rewards or events.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="bg-gray-50 py-20">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        How It Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: 1, title: "Connect", desc: "Sign in with email, Twitter, or Discord via Privy", icon: "🔗" },
                            { step: 2, title: "Create", desc: "Choose token, amount, and add a personal message", icon: "✨" },
                            { step: 3, title: "Send", desc: "Enter recipient's email or social handle", icon: "📨" },
                            { step: 4, title: "Claim", desc: "Recipient logs in and claims their gift!", icon: "🎁" },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="text-5xl mb-4">{item.icon}</div>
                                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <Card className="bento-card gradient-border bg-gradient-to-r from-purple-600 to-indigo-600 text-white max-w-3xl mx-auto">
                    <CardContent className="p-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Send Your First Gift?
                        </h2>
                        <p className="text-purple-100 text-lg mb-8">
                            Join thousands of users spreading crypto joy with MoveGiftCards
                        </p>
                        <Button size="lg" variant="secondary" onClick={handleGetStarted} className="text-lg px-8 py-6">
                            Start Gifting Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Gift className="h-6 w-6 text-purple-400" />
                            <span className="font-bold">MoveGiftCards</span>
                        </div>
                        <div className="flex gap-6 text-gray-400">
                            <a href="#" className="hover:text-white">Twitter</a>
                            <a href="#" className="hover:text-white">Discord</a>
                            <a href="#" className="hover:text-white">GitHub</a>
                            <a href="#" className="hover:text-white">Docs</a>
                        </div>
                        <div className="text-gray-400 text-sm">
                            © 2024 MoveGiftCards. Built on Movement Network.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
