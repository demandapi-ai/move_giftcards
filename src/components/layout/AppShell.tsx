import { Outlet, Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { usePrivy } from "@privy-io/react-auth"
import { useTranslation } from "react-i18next"
import { Moon, Sun, Languages, Gift, LayoutDashboard, Send, Download, History, LogOut, Menu } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/send", label: "Send Gift", icon: Send },
    { href: "/claim", label: "Claim", icon: Download },
    { href: "/history", label: "History", icon: History },
]

export function AppShell() {
    const { logout, user } = usePrivy()
    const { i18n } = useTranslation()
    const { theme, setTheme } = useTheme()
    const location = useLocation()

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
    const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en')

    const NavLinks = ({ onClick }: { onClick?: () => void }) => (
        <>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClick}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-purple-50 hover:text-purple-600",
                        location.pathname === item.href ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-600"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
        </>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-white p-4">
                <Link to="/dashboard" className="flex items-center gap-2 px-2 mb-8">
                    <Gift className="h-8 w-8 text-purple-600" />
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        MoveGiftCards
                    </span>
                </Link>

                <nav className="flex-1 space-y-1">
                    <NavLinks />
                </nav>

                <div className="border-t pt-4 space-y-2">
                    <div className="px-2 py-2 text-sm text-gray-500 truncate">
                        {user?.email?.address || user?.twitter?.username || "Connected"}
                    </div>
                    <div className="flex items-center justify-between px-2">
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleLanguage}>
                            <Languages className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
                        <LogOut className="mr-2 h-5 w-5" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b bg-white p-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-4">
                        <Link to="/dashboard" className="flex items-center gap-2 mb-8">
                            <Gift className="h-8 w-8 text-purple-600" />
                            <span className="text-xl font-bold">MoveGiftCards</span>
                        </Link>
                        <nav className="space-y-1"><NavLinks /></nav>
                        <div className="border-t pt-4 mt-8">
                            <Button variant="ghost" className="w-full justify-start text-red-600" onClick={logout}>
                                <LogOut className="mr-2 h-5 w-5" /> Logout
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>

                <Link to="/dashboard" className="flex items-center gap-2">
                    <Gift className="h-6 w-6 text-purple-600" />
                    <span className="font-bold">MoveGiftCards</span>
                </Link>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen">
                <div className="container mx-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
