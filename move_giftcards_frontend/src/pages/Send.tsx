import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"
import { Mail, Twitter, MessageCircle, ArrowLeft, ArrowRight, Check, Copy, Upload, Palette, User, Download } from "lucide-react"
import { toPng } from 'html-to-image';
import { Link } from "react-router-dom"
import { GiftCardPreview, type PreviewSize } from "@/components/GiftCardPreview"
import { ThemeMarketplace } from "@/components/ThemeMarketplace"
import { getThemeById } from "@/lib/themeRegistry"
import { generateEmailHtml } from "@/lib/emailUtils"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutTemplate, Instagram, Twitter as TwitterIcon, Smartphone } from "lucide-react"

const formSchema = z.object({
    recipientType: z.enum(["email", "twitter", "discord"]),
    recipient: z.string().min(1, "Recipient is required"),
    amount: z.string().min(1, "Amount is required"),
    token: z.string().default("MOVE"),
    message: z.string().max(500).optional(),
    expiryDays: z.string().default("30"),
    theme: z.string().default("modern"),
    senderName: z.string().optional(),
    logo: z.any().optional(), // File object
})

type FormData = z.infer<typeof formSchema>

export default function Send() {

    const { user } = usePrivy()
    const [step, setStep] = useState(1)
    const [txHash, setTxHash] = useState("")
    const [marketplaceOpen, setMarketplaceOpen] = useState(false)
    const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
    const [previewSize, setPreviewSize] = useState<PreviewSize>("card")

    const [logoUrl, setLogoUrl] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            recipientType: "email",
            recipient: "",
            amount: "",
            token: "MOVE",
            message: "",
            expiryDays: "30",
            theme: "modern",
            senderName: "",
        },
    })

    // Handle file upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File too large (max 5MB)")
                return
            }
            const url = URL.createObjectURL(file)
            setLogoUrl(url)
            form.setValue("logo", file)
        }
    }

    const watchedValues = form.watch()
    const currentTheme = getThemeById(watchedValues.theme || 'modern')

    // Preview Component Wrapper (to avoid repetition)
    const renderPreview = (size: PreviewSize = "card") => (
        <GiftCardPreview
            amount={watchedValues.amount}
            token={watchedValues.token}
            recipient={watchedValues.recipient}
            senderName={watchedValues.senderName}
            message={watchedValues.message}
            themeId={watchedValues.theme || 'modern'}
            logoUrl={logoUrl}
            size={size}
        />
    )

    const recipientTypes = [
        { value: "email", label: "Email", icon: Mail, desc: "Send to any email address" },
        { value: "twitter", label: "Twitter", icon: Twitter, desc: "Send via @username" },
        { value: "discord", label: "Discord", icon: MessageCircle, desc: "Send via username#1234" },
    ]

    const onSubmit = async (_values: FormData) => {
        if (!user?.wallet?.address) {
            // toast.error("Please connect your wallet first")
            // return
            toast.info("Simulating transaction (Wallet not connected)")
        }

        try {
            toast.loading("Creating gift card on-chain...")

            // Simulate transaction
            await new Promise(r => setTimeout(r, 2000))

            const mockTxHash = "0x" + Math.random().toString(16).slice(2, 18) + "..."
            setTxHash(mockTxHash)

            toast.dismiss()
            toast.success("Gift card created successfully!")
            setStep(4)

        } catch (error) {
            toast.dismiss()
            toast.error("Failed to create gift card")
            console.error(error)
        }
    }

    const getPlaceholder = () => {
        switch (watchedValues.recipientType) {
            case "email": return "friend@example.com"
            case "twitter": return "@username"
            case "discord": return "username#1234"
            default: return ""
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4">
            {/* Theme Marketplace Dialog */}
            <ThemeMarketplace
                open={marketplaceOpen}
                onOpenChange={setMarketplaceOpen}
                currentThemeId={watchedValues.theme || 'modern'}
                onSelectTheme={(id) => form.setValue("theme", id)}
            />

            {/* Progress Bar (Keep existing structure but maybe wider) */}
            <div className="mb-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Step {step} of 4</span>
                    <span className="text-sm text-gray-500">
                        {step === 1 && "Choose Recipient"}
                        {step === 2 && "Enter Details"}
                        {step === 3 && "Preview"}
                        {step === 4 && "Success!"}
                    </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)}>

                    {/* Main Content Grid - Split for steps 2 & 3 */}
                    <div className={`grid lg:grid-cols-12 gap-8`}>

                        {/* Left Column: Form / Steps (5 cols) */}
                        <div className={`space-y-6 ${step > 1 && step < 4 ? "lg:col-span-5" : "lg:col-span-12 max-w-2xl mx-auto w-full"}`}>
                            {/* Step 1: Recipient Type (Same as before) */}
                            {step === 1 && (
                                <Card>
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-2xl">How would you like to send?</CardTitle>
                                        <CardDescription>Choose how your recipient will claim their gift</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="recipientType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                                        >
                                                            {recipientTypes.map((type) => (
                                                                <label
                                                                    key={type.value}
                                                                    className={`bento-card cursor-pointer text-center p-6 ${field.value === type.value
                                                                        ? "ring-2 ring-purple-600 bg-purple-50"
                                                                        : ""
                                                                        }`}
                                                                >
                                                                    <RadioGroupItem value={type.value} className="sr-only" />
                                                                    <div className="p-3 bg-purple-100 rounded-full inline-block mb-3">
                                                                        <type.icon className="h-6 w-6 text-purple-600" />
                                                                    </div>
                                                                    <h3 className="font-bold mb-1">{type.label}</h3>
                                                                    <p className="text-sm text-gray-500">{type.desc}</p>
                                                                </label>
                                                            ))}
                                                        </RadioGroup>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end mt-6">
                                            <Button type="button" onClick={() => setStep(2)}>
                                                Next <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Step 2: Details & Customization (Combined) */}
                            {step === 2 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Design & Details</CardTitle>
                                        <CardDescription>Customize your gift card</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <Tabs defaultValue="details" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                                <TabsTrigger value="details">Details</TabsTrigger>
                                                <TabsTrigger value="design">Design</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="details" className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="recipient"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Recipient {watchedValues.recipientType === "email" ? "Email" : "Username"}</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={getPlaceholder()} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="amount"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Amount</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="10.00" type="number" step="0.01" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="token"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Token</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="MOVE">MOVE</SelectItem>
                                                                        <SelectItem value="USDC">USDC</SelectItem>
                                                                        <SelectItem value="USDT">USDT</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name="message"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Message</FormLabel>
                                                            <FormControl>
                                                                <Textarea placeholder="Happy Birthday! 🎉" {...field} maxLength={120} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </TabsContent>

                                            <TabsContent value="design" className="space-y-6">
                                                {/* Theme Selector */}
                                                <div className="space-y-3">
                                                    <Label className="flex items-center gap-2">Theme</Label>
                                                    <div
                                                        className="relative h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 cursor-pointer overflow-hidden group transition-all"
                                                        onClick={() => setMarketplaceOpen(true)}
                                                    >
                                                        <div className={`absolute inset-0 ${currentTheme.styles.background} opacity-50`} />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                                                            <div className="flex flex-col items-center">
                                                                <Palette className="h-6 w-6 mb-1 text-gray-800" />
                                                                <span className="font-semibold text-sm">Browse Themes</span>
                                                                <span className="text-xs text-gray-600">Current: {currentTheme.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sender Name */}
                                                <FormField
                                                    control={form.control}
                                                    name="senderName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2">
                                                                <User className="h-4 w-4" /> From Name (Optional)
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Grandma" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Logo Upload */}
                                                <div className="space-y-2">
                                                    <Label className="flex items-center gap-2">
                                                        <Upload className="h-4 w-4" /> Company/Personal Logo (Optional)
                                                    </Label>
                                                    <div className="flex gap-4 items-center">
                                                        <Input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleFileChange}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="w-full"
                                                        >
                                                            {logoUrl ? "Change Logo" : "Upload Logo"}
                                                        </Button>
                                                        {logoUrl && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setLogoUrl("")
                                                                    form.setValue("logo", undefined)
                                                                }}
                                                            >
                                                                <span className="text-red-500 font-bold">×</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>

                                        <div className="flex justify-between pt-4">
                                            <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                            </Button>
                                            <Button type="button" onClick={() => setStep(3)}>
                                                Review <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                            }

                            {/* Step 3: Review */}
                            {step === 3 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Review & Send</CardTitle>
                                        <CardDescription>Confirm your details before sending</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Amount</span>
                                                <span className="font-medium">{watchedValues.amount} {watchedValues.token}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Recipient</span>
                                                <span className="font-medium">{watchedValues.recipient}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Fee</span>
                                                <span className="font-medium">{(parseFloat(watchedValues.amount || "0") * 0.005).toFixed(4)} {watchedValues.token} (0.5%)</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-4">
                                            <Button type="button" variant="outline" onClick={() => setStep(2)}>
                                                <ArrowLeft className="mr-2 h-4 w-4" /> Edit
                                            </Button>
                                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full ml-4">
                                                Confirm Transaction 🚀
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Right Column: Preview (7 columns) - Sticky */}
                        {(step === 2 || step === 3) && (
                            <div className="lg:col-span-7">
                                <div className="sticky top-8 space-y-6">
                                    {/* Preview Controls */}
                                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-2 shadow-sm border inline-flex gap-1 mx-auto w-full justify-center">
                                        <Button
                                            type="button"
                                            variant={previewSize === 'card' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPreviewSize('card')}
                                        >
                                            <LayoutTemplate className="h-4 w-4 mr-2" />
                                            Standard
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={previewSize === 'landscape' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPreviewSize('landscape')}
                                        >
                                            <TwitterIcon className="h-4 w-4 mr-2" />
                                            Post
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={previewSize === 'square' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPreviewSize('square')}
                                        >
                                            <Instagram className="h-4 w-4 mr-2" />
                                            Square
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={previewSize === 'story' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setPreviewSize('story')}
                                        >
                                            <Smartphone className="h-4 w-4 mr-2" />
                                            Story
                                        </Button>
                                    </div>

                                    {/* Actual Preview Area */}
                                    <div className="bg-gray-100 dark:bg-zinc-950/50 rounded-2xl p-8 lg:min-h-[600px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800">
                                        {renderPreview(previewSize)}
                                    </div>

                                    <p className="text-center text-xs text-gray-400">
                                        Previewing: {currentTheme.name} • {previewSize} mode
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 4: Success (Full width, no split) */}
                    {step === 4 && (
                        <Card className="text-center max-w-2xl mx-auto">
                            <CardContent className="pt-12 pb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <Check className="h-10 w-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold mb-2">Gift Sent! 🎉</h2>
                                <p className="text-gray-600 mb-8">
                                    Your gift card has been created and the recipient has been notified.
                                </p>

                                {/* Preview Area for Capture */}
                                <div className="mb-8 transform scale-90" id="gift-card-capture">
                                    {renderPreview("card")}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <code className="text-sm">{txHash}</code>
                                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(txHash)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Social Sharing */}
                                <div className="space-y-4 mb-8">
                                    <p className="text-sm font-medium text-gray-500">Share with Recipient</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* X / Twitter */}
                                        <Button
                                            className="bg-black hover:bg-black/90 text-white w-full"
                                            onClick={async () => {
                                                const element = document.getElementById('gift-card-capture');
                                                if (element) {
                                                    try {
                                                        const dataUrl = await toPng(element);
                                                        const link = document.createElement('a');
                                                        link.download = `move-giftcard-${txHash.slice(0, 6)}.png`;
                                                        link.href = dataUrl;
                                                        link.click();

                                                        setTimeout(() => {
                                                            const text = encodeURIComponent("I just sent you a crypto gift card on Move! 🎁✨\n\nClaim it here: ")
                                                            const url = encodeURIComponent(`${window.location.origin}/claim?id=${txHash}`)
                                                            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
                                                            toast.success("Image downloaded! Attach it to your tweet! 📸")
                                                        }, 1000)
                                                    } catch (err) {
                                                        console.error(err)
                                                    }
                                                }
                                            }}
                                        >
                                            <Twitter className="h-4 w-4 mr-2" />
                                            X (Twitter)
                                        </Button>

                                        {/* Discord */}
                                        <Button
                                            className="bg-[#5865F2] hover:bg-[#4752C4] text-white w-full"
                                            onClick={() => {
                                                const text = `I sent you a crypto gift card! 🎁\n\nClaim here: ${window.location.origin}/claim?id=${txHash}`
                                                navigator.clipboard.writeText(text)
                                                toast.success("Copied to clipboard! Paste in Discord 💬")
                                            }}
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Discord
                                        </Button>

                                        {/* Email */}
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setEmailPreviewOpen(true)}
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email
                                        </Button>
                                    </div>

                                    <div className="text-center">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-gray-400"
                                            onClick={async () => {
                                                const element = document.getElementById('gift-card-capture');
                                                if (element) {
                                                    const dataUrl = await toPng(element);
                                                    const link = document.createElement('a');
                                                    link.download = `move-giftcard-${txHash.slice(0, 6)}.png`;
                                                    link.href = dataUrl;
                                                    link.click();
                                                    toast.success("Gift card image saved!")
                                                }
                                            }}
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download Image Only
                                        </Button>
                                    </div>
                                </div>

                                {/* Email Preview Dialog */}
                                <Dialog open={emailPreviewOpen} onOpenChange={setEmailPreviewOpen}>
                                    <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-gray-50 dark:bg-zinc-900 border-none overflow-hidden sm:rounded-2xl">
                                        {/* Header */}
                                        <div className="p-6 pb-4 border-b bg-white dark:bg-zinc-900 flex justify-between items-start z-10">
                                            <div>
                                                <DialogTitle className="text-2xl font-bold">Email Preview</DialogTitle>
                                                <DialogDescription className="mt-1">
                                                    Review how your gift will appear in the recipient's inbox.
                                                </DialogDescription>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => setEmailPreviewOpen(false)} className="-mt-2 -mr-2">
                                                <span className="sr-only">Close</span>
                                                <span className="text-2xl">×</span>
                                            </Button>
                                        </div>

                                        {/* Email Client Simulation Frame */}
                                        <div className="flex-1 bg-gray-100 dark:bg-zinc-950 p-4 sm:p-8 overflow-y-auto">
                                            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800">
                                                {/* Fake Browser/Email Header */}
                                                <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                                    </div>
                                                    <div className="bg-white px-3 py-1 rounded text-xs text-gray-500 border ml-2 flex-1 text-center font-mono">
                                                        Subject: You Received a Gift! 🎁
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="h-[600px] w-full relative group">
                                                    <iframe
                                                        title="Email Preview"
                                                        srcDoc={generateEmailHtml({
                                                            amount: watchedValues.amount,
                                                            token: watchedValues.token,
                                                            recipient: watchedValues.recipient,
                                                            senderName: watchedValues.senderName,
                                                            message: watchedValues.message,
                                                            txHash: txHash,
                                                            claimUrl: `${window.location.origin}/claim?id=${txHash}`
                                                        }, currentTheme)}
                                                        className="w-full h-full"
                                                        style={{ border: 'none' }}
                                                    />

                                                    {/* Device toggle hint (visual only) */}
                                                    <div className="absolute bottom-4 right-4 bg-black/75 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        Responsive HTML
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="p-4 border-t bg-white dark:bg-zinc-900 flex justify-end gap-3 z-10">
                                            <Button variant="outline" onClick={() => setEmailPreviewOpen(false)}>
                                                Back to Edit
                                            </Button>
                                            <Button
                                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                                                onClick={() => {
                                                    toast.success("Email sent successfully! (Simulated)")
                                                    setEmailPreviewOpen(false)
                                                }}
                                            >
                                                Send Email ✉️
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="flex justify-center gap-4 mt-8">
                                    <Button variant="outline" onClick={() => {
                                        setStep(1)
                                        form.reset()
                                        setLogoUrl("")
                                    }}>
                                        Send Another
                                    </Button>
                                    <Button asChild>
                                        <Link to="/dashboard">Go to Dashboard</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>
            </Form>
        </div>
    )
}
