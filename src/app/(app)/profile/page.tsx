
'use client';

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { type Badge } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { Upload, Trash2, X, Save, Award, Sparkles, Edit, User, Shield } from "lucide-react";
import { badgeIconMap, mockBadges } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { suggestNextBadge } from "@/ai/flows/suggest-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BadgeCard = ({ badge, isFaded = false }: { badge: Badge, isFaded?: boolean }) => {
    const Icon = badge.icon;
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-card hover:bg-muted/50 transition-all duration-300 hover:-translate-y-1",
                        isFaded && "opacity-40"
                    )}>
                        <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                            <Icon className="h-8 w-8" />
                        </div>
                        <p className="font-semibold text-sm">{badge.title}</p>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{badge.description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

const AiBadgeSuggestionCard = () => {
    const { currentUser, userBadges, groups } = useStore();
    const [suggestion, setSuggestion] = useState('');
    const [badgeToSuggest, setBadgeToSuggest] = useState<Badge | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (!currentUser) return;
            setIsLoading(true);
            try {
                const totalExpensesCreated = groups.flatMap(g => g.expenses).filter(e => e.paidById === currentUser.id).length;
                const totalAmountPaid = groups.flatMap(g => g.expenses).filter(e => e.paidById === currentUser.id).reduce((sum, e) => sum + e.amount, 0);
                const groupCount = groups.filter(g => g.members.some(m => m.id === currentUser.id)).length;

                const result = await suggestNextBadge({
                    userName: currentUser.name,
                    existingBadges: userBadges.map(b => b.title),
                    availableBadges: mockBadges.map(b => b.title),
                    totalExpensesCreated,
                    totalAmountPaid,
                    groupCount
                });
                
                setSuggestion(result.suggestion);
                const suggested = mockBadges.find(b => b.title === result.badgeToSuggest);
                if (suggested) {
                    const fullBadge = { ...suggested, icon: badgeIconMap[suggested.id] || Award };
                    setBadgeToSuggest(fullBadge);
                }

            } catch (error) {
                console.error("Failed to fetch badge suggestion", error);
                setSuggestion("Could not load a smart suggestion right now.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestion();
    }, [currentUser, userBadges, groups]);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }
    
    if (!suggestion || !badgeToSuggest) {
        return null;
    }

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex-row items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-base">Aim for Your Next Badge!</CardTitle>
                    <CardDescription className="text-balance">{suggestion}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <BadgeCard badge={badgeToSuggest} isFaded />
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
    const { currentUser, updateUserPassword, updateUserProfile, userBadges } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    
    // State for profile fields
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

    // State for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setAvatarUrl(currentUser.avatarUrl);
        }
    }, [currentUser]);

    const handleCancel = () => {
        if (currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setAvatarUrl(currentUser.avatarUrl);
        }
        setIsEditing(false);
    }
    
    const handleSaveChanges = () => {
        if (!currentUser) return;
        updateUserProfile(currentUser.id, { name, email, avatarUrl });
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });
        setIsEditing(false);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
             if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    title: "Image too large",
                    description: "Please upload an image smaller than 2MB.",
                    variant: "destructive"
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveImage = () => {
        setAvatarUrl(`https://placehold.co/400x400.png`);
    }

    const handleUpdatePassword = () => {
        if (!currentUser) return;
        if (!currentPassword || !newPassword) {
            toast({
                title: "Missing Fields",
                description: "Please enter both your current and new password.",
                variant: "destructive",
            });
            return;
        }

        if (currentPassword !== currentUser.password) {
            toast({
                title: "Incorrect Password",
                description: "The current password you entered is incorrect.",
                variant: "destructive",
            });
            return;
        }

        updateUserPassword(currentUser.id, newPassword);

        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
        setCurrentPassword('');
        setNewPassword('');
    };

    if (!currentUser) {
        return <div>Loading profile...</div>;
    }
    
    const linkedUserBadges = userBadges.map(badge => ({
        ...badge,
        icon: badgeIconMap[badge.id] || Award, // Fallback icon
    }));

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader className="items-center text-center p-6">
                        <div className="relative mb-4">
                            <Avatar className="h-28 w-28 ring-2 ring-offset-4 ring-offset-background ring-primary">
                                <AvatarImage src={avatarUrl} key={avatarUrl} />
                                <AvatarFallback className="text-4xl">{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <div className="absolute -bottom-2 -right-2 flex gap-1">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                        accept="image/*"
                                        className="hidden" 
                                    />
                                    <Button size="icon" variant="outline" className="h-8 w-8 rounded-full bg-background" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={handleRemoveImage}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        <CardTitle className="text-2xl font-headline">{name}</CardTitle>
                        <CardDescription>{email}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 p-6 pt-0">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button className="w-full" variant="outline" onClick={handleCancel}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button className="w-full" onClick={handleSaveChanges}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-full" onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Tabs defaultValue="account">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="account"><User className="mr-2 h-4 w-4" /> Account</TabsTrigger>
                        <TabsTrigger value="badges"><Award className="mr-2 h-4 w-4" /> Badges</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Settings</CardTitle>
                                <CardDescription>Update your personal information and password.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} readOnly={!isEditing} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!isEditing} />
                                </div>
                                
                                <Separator />
                                
                                <h3 className="text-lg font-medium flex items-center"><Shield className="mr-2 h-5 w-5"/> Change Password</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"/>
                                </div>
                                <Button onClick={handleUpdatePassword}>Update Password</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="badges">
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Achievements</CardTitle>
                                <CardDescription>Badges you've collected across all your groups.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <AiBadgeSuggestionCard />
                                {linkedUserBadges.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {linkedUserBadges.map(badge => (
                                            <BadgeCard key={badge.id} badge={badge} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                                        <Award className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">No Badges Yet</h3>
                                        <p className="text-muted-foreground">Start participating in groups to earn your first badge!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
