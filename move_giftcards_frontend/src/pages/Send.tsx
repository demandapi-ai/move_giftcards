import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { usePrivy } from "@privy-io/react-auth"
import { toast } from "sonner"
import { Mail, Twitter, MessageCircle, ArrowLeft, ArrowRight, Check, Gift, Copy, Share2 } from "lucide-react"
import { Link } from "react-router-dom"

const formSchema = z.object({
    recipientType: z.enum(["email", "twitter", "discord"]),
    recipient: z.string().min(1, "Recipient is required"),
    amount: z.string().min(1, "Amount is required"),
    token: z.string().default("MOVE"),
    message: z.string().max(500).optional(),
    expiryDays: z.string().default("30"),
})

type FormData = z.infer<typeof formSchema>

export default function Send() {

    const { user } = usePrivy()
    const [step, setStep] = useState(1)
    const [txHash, setTxHash] = useState("")

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            recipientType: "email",
            recipient: "",
            amount: "",
            token: "MOVE",
            message: "",
            expiryDays: "30",
        },
    })

    const watchedValues = form.watch()

    const recipientTypes = [
        { value: "email", label: "Email", icon: Mail, desc: "Send to any email address" },
        { value: "twitter", label: "Twitter", icon: Twitter, desc: "Send via @username" },
        { value: "discord", label: "Discord", icon: MessageCircle, desc: "Send via username#1234" },
    ]

    const onSubmit = async (_values: FormData) => {
        if (!user?.wallet?.address) {
            toast.error("Please connect your wallet first")
            return
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
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
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

                    {/* Step 1: Recipient Type */}
                    {step === 1 && (
                        <Card>
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">How would you like to send?</CardTitle>
                                <CardDescription>Choose how your recipient will claim their gift</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control as any}
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

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gift Card Details</CardTitle>
                                <CardDescription>Enter the recipient and amount</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control as any}
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
                                        control={form.control as any}
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
                                        control={form.control as any}
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
                                    control={form.control as any}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Personal Message (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Happy Birthday! 🎉" {...field} maxLength={500} />
                                            </FormControl>
                                            <p className="text-xs text-gray-500 text-right">
                                                {(field.value?.length || 0)}/500
                                            </p>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control as any}
                                    name="expiryDays"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expires In</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    className="flex gap-4"
                                                >
                                                    {["30", "60", "90"].map((days) => (
                                                        <label
                                                            key={days}
                                                            className={`flex-1 text-center p-3 rounded-lg border cursor-pointer transition-colors ${field.value === days
                                                                ? "bg-purple-50 border-purple-600"
                                                                : "hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            <RadioGroupItem value={days} className="sr-only" />
                                                            <span className="font-medium">{days} days</span>
                                                        </label>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-between pt-4">
                                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button type="button" onClick={() => setStep(3)}>
                                        Preview <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Preview */}
                    {step === 3 && (
                        <Card>
                            <CardHeader className="text-center">
                                <CardTitle>Preview Your Gift Card</CardTitle>
                                <CardDescription>Make sure everything looks right</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Card Preview */}
                                <div className="max-w-sm mx-auto my-8">
                                    <div className="bento-card bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-8 text-center">
                                        <Gift className="h-12 w-12 mx-auto mb-4 opacity-80" />
                                        <div className="text-4xl font-bold mb-2">
                                            {watchedValues.amount || "0"} {watchedValues.token}
                                        </div>
                                        <div className="text-purple-100 mb-4">
                                            To: {watchedValues.recipient || "recipient"}
                                        </div>
                                        {watchedValues.message && (
                                            <div className="bg-white/10 rounded-lg p-3 text-sm">
                                                "{watchedValues.message}"
                                            </div>
                                        )}
                                        <div className="text-xs text-purple-200 mt-4">
                                            Expires in {watchedValues.expiryDays} days
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
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
                                        <span className="text-gray-500">Via</span>
                                        <span className="font-medium capitalize">{watchedValues.recipientType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Expires</span>
                                        <span className="font-medium">{watchedValues.expiryDays} days</span>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6">
                                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                        Confirm & Send 🚀
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <Card className="text-center">
                            <CardContent className="pt-12 pb-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                                    <Check className="h-10 w-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold mb-2">Gift Sent! 🎉</h2>
                                <p className="text-gray-600 mb-6">
                                    Your gift card has been created and the recipient has been notified.
                                </p>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <code className="text-sm">{txHash}</code>
                                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(txHash)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <p className="text-sm text-gray-500">Share with recipient:</p>
                                    <div className="flex justify-center gap-3">
                                        <Button variant="outline" size="sm">
                                            <Mail className="mr-2 h-4 w-4" /> Email
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Twitter className="mr-2 h-4 w-4" /> Twitter
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Share2 className="mr-2 h-4 w-4" /> Copy Link
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 mt-8">
                                    <Button variant="outline" onClick={() => {
                                        setStep(1)
                                        form.reset()
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
