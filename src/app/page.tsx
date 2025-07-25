
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { SplitIcon, Users, PieChart, Star, Bot, FileText, Check, Sun, Moon, Computer, CreditCard, Loader2, Menu } from 'lucide-react';
import { SplitSyncLogo } from '@/components/icons';
import Image from "next/image";
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendSupportEmail } from '@/ai/flows/send-support-email';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import AiHelpDialog from '@/components/auth/ai-help-dialog';


const features = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Group Management',
    description: 'Create groups and invite members seamlessly for shared expenses.',
  },
  {
    icon: <SplitIcon className="h-8 w-8 text-primary" />,
    title: 'Flexible Splitting',
    description: 'Support for equal, unequal, percentage, and share-based splits.',
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: 'AI Category Suggestions',
    description: 'Smartly categorize your expenses with AI-powered suggestions.',
  },
  {
    icon: <PieChart className="h-8 w-8 text-primary" />,
    title: 'Insightful Analytics',
    description: 'Visualize spending trends with our detailed analytics dashboard.',
  },
  {
    icon: <Star className="h-8 w-8 text-primary" />,
    title: 'Gamification',
    description: 'Earn badges and achievements for being a responsible group member.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Export Reports',
    description: 'Generate PDF or Excel reports for your expense records.',
  },
];

const MockQRCode = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full p-2 bg-white rounded-md">
        <path fill="#000" d="M0 0h25v25H0zM33 0h8v25h-8zM50 0h25v25H50zM83 0h8v8h-8zM92 0h8v25h-8zM0 33h8v8H0zM17 33h8v8h-8zM33 33h25v8H33zM67 33h8v8h-8zM83 33h8v8h-8zM0 50h25v25H0zM33 50h8v8h-8zM50 50h8v8h-8zM67 50h8v8h-8zM83 50h17v8H83zM0 83h8v17H0zM17 83h8v8h-8zM33 83h8v17h-8zM50 83h25v8H50zM83 83h17v17H83z" />
    </svg>
);


const UpgradeProDialog = ({ children }: { children: React.ReactNode }) => (
    <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /> Upgrade to Pro</DialogTitle>
                <DialogDescription>
                    Choose your preferred payment method to upgrade.
                </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="upi" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upi">UPI / QR Code</TabsTrigger>
                <TabsTrigger value="card">Card Payment</TabsTrigger>
              </TabsList>
              <TabsContent value="upi">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-48 h-48 p-2 border rounded-lg">
                      <MockQRCode />
                  </div>
                  <div className="flex items-baseline justify-center text-center">
                      <div>
                          <p className="text-sm text-muted-foreground">Scan with any UPI app</p>
                          <span className="text-4xl font-bold font-headline">$5</span>
                          <span className="text-muted-foreground">/month</span>
                      </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="card">
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input id="card-number" placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="123" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-center text-center pt-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Amount to Pay</p>
                            <span className="text-4xl font-bold font-headline">$5</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
                 <Link href="/login" className="w-full">
                    <Button className="w-full" size="lg">Login to Activate Pro</Button>
                </Link>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

const ContactSalesDialog = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSending(true);

        const formData = new FormData(e.currentTarget);
        const fromName = formData.get('name') as string;
        const fromEmail = formData.get('email') as string;
        const company = formData.get('company') as string;
        const message = formData.get('message') as string;
        
        const subject = `Sales Inquiry from ${company}`;
        const fullMessage = `
            Name: ${fromName}\n
            Email: ${fromEmail}\n
            Company: ${company}\n
            Message: \n${message}
        `;

        try {
            await sendSupportEmail({
                fromName,
                fromEmail,
                subject,
                message: fullMessage,
            });
            
            toast({
                title: "Inquiry Sent!",
                description: "Our sales team has received your message and will get back to you shortly.",
            });
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to send sales email", error);
            toast({
                title: "Something went wrong",
                description: "Could not send your message. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Contact Sales</DialogTitle>
                    <DialogDescription>
                        Tell us a bit about your organization's needs, and our team will get in touch.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Your Name</Label>
                                <Input id="name" name="name" placeholder="Alex Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Your Email</Label>
                                <Input id="email" name="email" type="email" placeholder="alex@company.com" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name</Label>
                            <Input id="company" name="company" placeholder="Acme Inc." required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="message">How can we help?</Label>
                            <Textarea id="message" name="message" placeholder="Describe your requirements..." rows={4} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>Cancel</Button>
                        <Button type="submit" disabled={isSending}>
                            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSending ? "Sending..." : "Submit Inquiry"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const LegalDialog = ({ triggerText, title, content }: { triggerText: string, title: string, content: React.ReactNode }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="link" className="text-xs text-muted-foreground hover:underline p-0 h-auto">{triggerText}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-6">
                <div className="prose prose-sm dark:prose-invert">
                    {content}
                </div>
            </ScrollArea>
            <DialogFooter>
                <DialogTrigger asChild>
                    <Button>Close</Button>
                </DialogTrigger>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);


const TermsAndConditionsContent = () => (
    <>
        <p>Last updated: July 28, 2025</p>
        <p>Please read these terms and conditions carefully before using Our Service.</p>
        <h2>Interpretation and Definitions</h2>
        <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
        <h2>Acknowledgment</h2>
        <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
        <h2>User Accounts</h2>
        <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>
    </>
);

const PrivacyPolicyContent = () => (
    <>
        <p>Last updated: July 28, 2025</p>
        <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
        <h2>Collecting and Using Your Personal Data</h2>
        <h3>Types of Data Collected</h3>
        <h4>Personal Data</h4>
        <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to: Email address, First name and last name, Usage Data.</p>
    </>
);


export default function LandingPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isLoading, isAuthenticated, router]);
    
    if (isLoading || isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <SplitSyncLogo className="h-8 w-8 text-primary" />
          <span className="ml-3 text-2xl font-bold font-headline">SplitSync</span>
        </Link>
        <nav className="ml-auto hidden md:flex items-center gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Pricing
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Computer className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <Link href="/login" prefetch={false}>
            <Button>Login</Button>
          </Link>
        </nav>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="ml-auto md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <nav className="grid gap-6 text-lg font-medium">
                    <Link href="#" className="flex items-center gap-2 text-lg font-semibold" prefetch={false}>
                        <SplitSyncLogo className="h-6 w-6" />
                        <span>SplitSync</span>
                    </Link>
                    <Link href="#features" className="hover:text-primary" prefetch={false}>Features</Link>
                    <Link href="#pricing" className="hover:text-primary" prefetch={false}>Pricing</Link>
                    <Link href="/login" className="hover:text-primary" prefetch={false}>Login</Link>
                </nav>
            </SheetContent>
        </Sheet>
      </header>
      <main className="flex-1">
        <section className="w-full pt-12 pb-12 md:pt-24 lg:pt-32 lg:pb-32">
          <div className="container px-4 md:px-6 text-center">
            <div className="grid gap-6 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-balance">
                    Effortless Expense Sharing for Modern Groups
                  </h1>
                  <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl text-balance">
                    SplitSync makes it simple to manage and split expenses with friends, family, or teammates. Whether it’s a weekend getaway, a group dinner, or monthly household bills — track contributions, monitor balances, and settle up seamlessly in real time.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row mx-auto">
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-lg font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Get Started Free
                  </Link>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/learn-more">Learn More</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                width="800"
                height="600"
                alt="Hero"
                data-ai-hint="happy friends laughing"
                className="mx-auto overflow-hidden rounded-xl object-cover sm:w-full max-w-4xl shadow-2xl"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 text-primary px-3 py-1 text-sm font-medium">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Settle Up</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-balance">
                  From powerful splitting options to insightful analytics, SplitSync has you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col gap-3 items-start p-6 rounded-lg bg-card shadow-sm hover:shadow-lg transition-shadow hover:-translate-y-1">
                  {feature.icon}
                  <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Simple, Transparent Pricing</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-balance">
                Get started for free. Upgrade for more power and features.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12 items-stretch">
                <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-headline text-2xl">Free</CardTitle>
                        <CardDescription>For individuals and small groups</CardDescription>
                        <div className="text-5xl font-bold font-headline mt-4">$0<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-left flex-grow">
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Up to 3 active groups</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Core splitting features</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> AI category suggestions</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="mt-4">
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col transition-all duration-300 border-2 border-primary shadow-2xl md:-translate-y-4 hover:shadow-primary/40 hover:scale-105">
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="font-headline text-2xl">Pro</CardTitle>
                            <div className="inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">Most Popular</div>
                        </div>
                        <CardDescription>For power users and frequent travelers</CardDescription>
                        <div className="text-5xl font-bold font-headline mt-4">$5<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-left flex-grow">
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited groups</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced analytics</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Data export (PDF/Excel)</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority support</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="mt-4">
                        <UpgradeProDialog>
                            <Button className="w-full">Upgrade to Pro</Button>
                        </UpgradeProDialog>
                    </CardFooter>
                </Card>
                <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-headline text-2xl">Business</CardTitle>
                        <CardDescription>For teams and organizations</CardDescription>
                        <div className="text-5xl font-bold font-headline mt-4">$15<span className="text-lg font-normal text-muted-foreground">/user/mo</span></div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-left flex-grow">
                        <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> All Pro features</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Centralized billing</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Team management</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Calendar integration</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="mt-4">
                        <ContactSalesDialog>
                            <Button className="w-full" variant="outline">Contact Sales</Button>
                        </ContactSalesDialog>
                    </CardFooter>
                </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex items-center justify-between py-6 px-4 md:px-6">
            <div className="flex items-center gap-2">
                <SplitSyncLogo className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">&copy; 2025 SplitSync. All rights reserved.</p>
            </div>
            <nav className="flex gap-4 sm:gap-6">
              <LegalDialog triggerText="Terms of Service" title="Terms of Service" content={<TermsAndConditionsContent />} />
              <LegalDialog triggerText="Privacy Policy" title="Privacy Policy" content={<PrivacyPolicyContent />} />
            </nav>
        </div>
      </footer>
      <AiHelpDialog floating={true} />
    </div>
  );
}
