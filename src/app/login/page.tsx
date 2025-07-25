
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SplitSyncLogo } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "@/ai/flows/send-password-reset-email";
import { sendVerificationEmail } from "@/ai/flows/send-verification-email";
import AiHelpDialog from "@/components/auth/ai-help-dialog";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const { users, addUser } = useStore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [view, setView] = useState('login'); // 'login', 'forgot_password', or 'signup'
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        
        const userToLogin = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (userToLogin && userToLogin.password === password) {
            login(userToLogin); // Pass user to login function
        } else {
            toast({
                title: "Invalid Credentials",
                description: "Please check your email and password.",
                variant: "destructive"
            });
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email || !password) {
             toast({ title: "All fields are required.", variant: "destructive" });
             return;
        }

        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

        if (userExists) {
            toast({
                title: "Account already exists",
                description: "An account with this email already exists. Please login instead.",
                variant: "destructive"
            });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const newUser = addUser({
                name,
                email,
                password
            });
            
            // Send verification email on sign up
            await sendVerificationEmail({ name: newUser.name, email: newUser.email });
    
            toast({
                title: "Account Created!",
                description: "We've sent a verification link to your email. Please check your inbox.",
            });
            
            // Don't log in automatically, require verification (in a real app)
            // For this prototype, we'll just switch to the login view.
            setView('login');
            setEmail(email);
            setPassword('');
            setName('');

        } catch (error) {
            console.error(error);
            toast({
                title: "Something went wrong",
                description: "Could not create your account. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail({ email });
            toast({
                title: 'Password Reset Email Sent',
                description: `If an account with ${email} exists, you will receive a password reset link shortly.`
            });
            setView('login');
            setEmail('');
        } catch (error) {
            console.error(error);
            toast({
                title: 'Something went wrong',
                description: 'Could not send the password reset email. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const renderContent = () => {
        switch (view) {
            case 'signup':
                return (
                    <>
                        <form onSubmit={handleSignUp}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? 'Creating...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
                            <Button variant="link" className="underline p-0 h-auto" onClick={() => setView('login')}>
                                Login
                            </Button>
                        </div>
                    </>
                );
            case 'forgot_password':
                 return (
                    <>
                        <form onSubmit={handleForgotPassword}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="reset-email">Email</Label>
                                    <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </div>
                        </form>
                        <Button
                            type="button"
                            variant="link"
                            className="w-full mt-4"
                            onClick={() => setView('login')}
                        >
                        Back to Login
                        </Button>
                    </>
                 );
            case 'login':
            default:
                return (
                <>
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="ml-auto inline-block text-sm underline p-0 h-auto"
                                    onClick={() => setView('forgot_password')}
                                >
                                    Forgot your password?
                                </Button>
                                </div>
                                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </div>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Button variant="link" className="underline p-0 h-auto" onClick={() => setView('signup')}>
                            Sign up
                        </Button>
                    </div>
                </>
            );
        }
    };
    
    const getTitle = () => {
        switch(view) {
            case 'signup': return 'Create a new account';
            case 'forgot_password': return 'Reset your password';
            case 'login':
            default:
                return 'Enter your email below to login';
        }
    }

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-1 xl:min-h-[800px] relative">
      <div className="flex flex-col items-center justify-center py-12 min-h-screen bg-muted/40">
        <Card className="w-full max-w-md mx-4">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <SplitSyncLogo className="h-8 w-8 text-primary" />
                    <CardTitle className="text-3xl font-headline">SplitSync</CardTitle>
                </div>
            <CardDescription>
                {getTitle()}
            </CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
         <footer className="mt-8 text-center text-xs text-muted-foreground">
            &copy; 2025 SplitSync. All rights reserved.
        </footer>
      </div>
      <AiHelpDialog floating={true} />
    </div>
  );
}
