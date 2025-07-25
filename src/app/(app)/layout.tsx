
'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  Home,
  LineChart,
  User,
  PanelLeft,
  LogOut,
  HelpCircle,
  MessageSquare,
  Moon,
  Sun,
  Loader2,
  Computer,
  Check,
  Settings,
  Badge as BadgeIcon,
  LifeBuoy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SplitSyncLogo } from '@/components/icons';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { sendSupportEmail } from '@/ai/flows/send-support-email';
import { useStore } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';
import AiHelpDialog from '@/components/auth/ai-help-dialog';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/analytics', icon: LineChart, label: 'Analytics' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [supportDialogOpen, setSupportDialogOpen] = React.useState(false);
  const [isSendingSupport, setIsSendingSupport] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { groups, notifications, currentUser, invitations } = useStore();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
        if (pathname !== '/login' && pathname !== '/') {
            router.replace('/login');
        }
    }
  }, [isLoading, isAuthenticated, router, pathname]);
  
  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingInvitesCount = invitations.filter(i => i.email.toLowerCase() === currentUser.email.toLowerCase()).length;

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    })
  }

  const isActive = (href: string) => pathname === href;

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSendingSupport(true);
    
    const formData = new FormData(e.currentTarget);
    const subject = formData.get('support-subject') as string;
    const message = formData.get('support-message') as string;

    if (!subject || !message) {
        toast({
            title: "Missing Fields",
            description: "Please fill out both the subject and message.",
            variant: "destructive",
        });
        setIsSendingSupport(false);
        return;
    }

    try {
        await sendSupportEmail({
            fromEmail: currentUser.email,
            fromName: currentUser.name,
            subject,
            message,
        });
        
        toast({
            title: "Message sent!",
            description: "Our support team will get back to you shortly.",
        });
        setSupportDialogOpen(false);
    } catch (error) {
        console.error("Failed to send support email", error);
        toast({
            title: "Something went wrong",
            description: "Could not send your message. Please try again later.",
            variant: "destructive",
        });
    } finally {
        setIsSendingSupport(false);
    }
  }

  const handleNotificationClick = (notifId: string) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    if (notif.type === 'badge') {
        router.push('/profile');
    } else if (notif.groupId) {
        const group = groups.find(g => g.id === notif.groupId);
        if (group) {
            router.push(`/groups/${group.id}`);
        } else {
            router.push('/dashboard');
        }
    } else {
        // This handles general notifications like chat mentions
        router.push('/chat');
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <TooltipProvider>
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="/dashboard"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <SplitSyncLogo className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">SplitSync</span>
            </Link>
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8',
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                   <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 md:h-8 md:w-8"
                    >
                      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">Toggle Theme</TooltipContent>
              </Tooltip>
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

             <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/dashboard"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <SplitSyncLogo className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">SplitSync</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 px-2.5',
                      isActive(item.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/profile"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="relative ml-auto flex-1 md:grow-0">
             {/* Can be a breadcrumb component in the future */}
          </div>
          <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative ml-auto h-8 w-8">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Toggle notifications</span>
                   {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 md:w-96">
                <DropdownMenuLabel>
                  <p className="font-semibold">Notifications</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  {notifications.length > 0 ? notifications.map(notif => (
                    <DropdownMenuItem 
                        key={notif.id} 
                        className={cn("flex items-start gap-3 whitespace-normal", !notif.read && "bg-accent/50")}
                        onClick={() => handleNotificationClick(notif.id)}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {notif.type === 'badge' && <BadgeIcon className="h-4 w-4 text-primary" />}
                        {notif.type === 'message' && <MessageSquare className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-tight text-balance">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.timestamp.toLocaleDateString()}</p>
                      </div>
                    </DropdownMenuItem>
                  )) : (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        You're all caught up!
                    </div>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full ml-2 relative"
                >
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                      <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {pendingInvitesCount > 0 && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                
                <DialogTrigger asChild>
                    <DropdownMenuItem>
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Support</span>
                    </DropdownMenuItem>
                </DialogTrigger>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
                <DialogDescription>
                    Have an issue or a question? Fill out the form below and our team will get back to you.
                </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSupportSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="support-subject">Subject</Label>
                            <Input name="support-subject" id="support-subject" placeholder="e.g., Issue with payment" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="support-message">Message</Label>
                            <Textarea name="support-message" id="support-message" placeholder="Please describe your issue in detail..." rows={5} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSendingSupport}>
                            {isSendingSupport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSendingSupport ? 'Sending...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
        <AiHelpDialog floating={true} />
      </div>
    </div>
  );
}
