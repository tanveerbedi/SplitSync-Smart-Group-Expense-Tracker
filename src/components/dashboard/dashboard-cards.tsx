
'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { type Group } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export const BalanceCard = ({ groups, userId }: { groups: Group[]; userId: string }) => {
    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    groups.forEach(group => {
        let groupBalance = 0;
        group.expenses.forEach(expense => {
            if (expense.paidById === userId) {
                groupBalance += expense.amount;
            }
            const userSplit = expense.split.find(s => s.userId === userId);
            if (userSplit) {
                groupBalance -= userSplit.amount;
            }
        });
        group.payments.forEach(payment => {
            if (payment.fromUserId === userId) {
                groupBalance -= payment.amount;
            }
            if (payment.toUserId === userId) {
                groupBalance += payment.amount;
            }
        });

        if (groupBalance > 0) {
            totalOwedToYou += groupBalance;
        } else {
            totalYouOwe += Math.abs(groupBalance);
        }
    });

    const netBalance = totalOwedToYou - totalYouOwe;

    return (
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Net Balance</CardTitle>
                <span className={netBalance >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {netBalance >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </span>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netBalance >= 0 ? `+₹${netBalance.toFixed(2)}` : `-₹${Math.abs(netBalance).toFixed(2)}`}
                </div>
                <p className="text-xs text-muted-foreground">
                    Across all of your groups
                </p>
            </CardContent>
        </Card>
    );
};


export const GroupCard = ({ group, currentUserId }: { group: Group, currentUserId: string }) => {
    const totalExpenses = group.expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const userExpenses = group.expenses
        .filter(exp => exp.paidById === currentUserId)
        .reduce((acc, exp) => acc + exp.amount, 0);
    
    const userShare = group.expenses.reduce((acc, exp) => {
        const share = exp.split.find(s => s.userId === currentUserId)?.amount || 0;
        return acc + share;
    }, 0);

    const userContributionPercentage = totalExpenses > 0 ? (userExpenses / totalExpenses) * 100 : 0;
    const balance = userExpenses - userShare;

    return (
        <Link href={`/groups/${group.id}`} passHref>
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader className="relative h-40 p-0 overflow-hidden rounded-t-lg">
                    <Image
                        src={group.imageUrl}
                        alt={group.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        data-ai-hint="group event"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                        <CardTitle className="text-lg font-bold text-white font-headline">{group.name}</CardTitle>
                        <CardDescription className="text-sm text-white/90">{group.members.length} members</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-baseline mb-2">
                             <span className="text-xs text-muted-foreground">Your Balance</span>
                             <span className={`text-lg font-bold ${balance > 0 ? 'text-green-600' : (balance < 0 ? 'text-red-600' : 'text-foreground')}`}>
                                {balance > 0 ? `+₹${balance.toFixed(2)}` : (balance < 0 ? `-₹${Math.abs(balance).toFixed(2)}` : `₹0.00`)}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Your Contribution</span>
                                <span>{userContributionPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={userContributionPercentage} className="h-2" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                         <div className="flex -space-x-2 overflow-hidden">
                            <TooltipProvider>
                            {group.members.slice(0, 5).map(member => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-7 w-7 border-2 border-background">
                                            <AvatarImage src={member.avatarUrl} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{member.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            </TooltipProvider>
                         </div>
                        {group.members.length > 5 && (
                            <div className="text-xs text-muted-foreground">+{group.members.length - 5} more</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
