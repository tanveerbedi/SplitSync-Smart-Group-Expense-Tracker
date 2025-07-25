
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { TrendingUp, FolderSymlink, Bot, Sparkles, Trophy } from 'lucide-react';
import { summarizeExpenses } from '@/ai/flows/summarize-expenses';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import { Button } from '@/components/ui/button';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

const chartConfig = {
  value: {
    label: 'Amount',
  },
} satisfies ChartConfig;


const AiSummaryCard = ({ group, summary, setSummary, isLoading, onGenerate }: { group: any; summary: string; setSummary: (s: string) => void; isLoading: boolean; onGenerate: () => void; }) => (
    <Card className="bg-primary/5 border-primary/20 flex flex-col">
        <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
            <div className="p-2 bg-primary/10 rounded-full">
                <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-lg">Spending Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-center items-start">
            {isLoading ? (
                <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ) : summary ? (
                 <p className="text-muted-foreground text-balance">{summary}</p>
            ) : (
                <div className="space-y-3">
                    <p className="text-muted-foreground">Click the button to generate an AI-powered summary of this group's spending habits.</p>
                    <Button onClick={onGenerate} disabled={isLoading || !group}>
                        <Bot className="mr-2 h-4 w-4" />
                        Generate Summary
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
);

const LeaderboardCard = ({ leaders }: { leaders: { type: string; user: User | undefined; value: string }[] }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-primary" /> Group Leaders</CardTitle>
            <CardDescription>Top contributors in the group.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {leaders.map((leader, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={leader.user?.avatarUrl} />
                            <AvatarFallback>{leader.user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{leader.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{leader.type}</p>
                        </div>
                    </div>
                    <p className="font-bold text-lg">{leader.value}</p>
                </div>
            ))}
        </CardContent>
    </Card>
);


export default function AnalyticsPage() {
  const { groups, currentUser } = useStore();
  
  const userGroups = useMemo(() => {
    if (!currentUser) return [];
    return groups.filter(g => g.members.some(m => m.id === currentUser.id));
  }, [groups, currentUser]);
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(userGroups[0]?.id);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    if (!selectedGroupId && userGroups.length > 0) {
        setSelectedGroupId(userGroups[0].id);
    }
    // Reset summary when group changes
    setAiSummary('');
  }, [userGroups, selectedGroupId]);

  const selectedGroup = useMemo(() => userGroups.find(g => g.id === selectedGroupId), [selectedGroupId, userGroups]);
  const totalSpend = useMemo(() => selectedGroup?.expenses.reduce((acc, exp) => acc + exp.amount, 0) || 0, [selectedGroup]);

  const spendingByCategory = useMemo(() => {
    if (!selectedGroup) return [];
    const categoryMap: { [key: string]: number } = {};
    selectedGroup.expenses.forEach(expense => {
      categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [selectedGroup]);

  const memberContributions = useMemo(() => {
    if (!selectedGroup) return [];
    const contributionMap: { [key: string]: number } = {};
    selectedGroup.members.forEach(member => {
        contributionMap[member.id] = 0;
    });
    selectedGroup.expenses.forEach(expense => {
      contributionMap[expense.paidById] = (contributionMap[expense.paidById] || 0) + expense.amount;
    });
    return Object.entries(contributionMap).map(([userId, value]) => ({
      name: selectedGroup.members.find(m => m.id === userId)?.name || 'Unknown',
      value
    }));
  }, [selectedGroup]);

  const groupLeaders = useMemo(() => {
      if (!selectedGroup) return [];
      
      const memberStats = selectedGroup.members.map(member => {
          const totalPaid = selectedGroup.expenses
              .filter(e => e.paidById === member.id)
              .reduce((sum, e) => sum + e.amount, 0);
          const expenseCount = selectedGroup.expenses.filter(e => e.paidById === member.id).length;
          return { user: member, totalPaid, expenseCount };
      });
      
      const mostGenerous = [...memberStats].sort((a, b) => b.totalPaid - a.totalPaid)[0];
      const topContributor = [...memberStats].sort((a, b) => b.expenseCount - a.expenseCount)[0];
      
      return [
          { type: 'Most Generous', user: mostGenerous?.user, value: `₹${mostGenerous?.totalPaid.toFixed(2)}` },
          { type: 'Top Contributor', user: topContributor?.user, value: `${topContributor?.expenseCount} items` },
      ];

  }, [selectedGroup]);
  
  const handleGenerateSummary = useCallback(async () => {
    if (!selectedGroup) return;

    setIsSummaryLoading(true);
    setAiSummary('');
    try {
        const expenseData = selectedGroup.expenses.map(e => ({
            description: e.description,
            amount: e.amount,
            category: e.category,
        }));

        const result = await summarizeExpenses({
            groupName: selectedGroup.name,
            expenses: expenseData,
        });
        setAiSummary(result.summary);
    } catch (error) {
        console.error("Failed to get AI summary:", error);
        setAiSummary("Could not generate a summary at this time.");
    } finally {
        setIsSummaryLoading(false);
    }
  }, [selectedGroup]);

  if (userGroups.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <FolderSymlink className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold font-headline">No Groups to Analyze</h2>
              <p className="text-muted-foreground">You need to be in a group with expenses to see analytics.</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Analytics</h1>
          <p className="text-muted-foreground">Visualize your group spending habits.</p>
        </div>
        <div className="w-64">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {userGroups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedGroup ? (
         <div className="flex flex-col items-center justify-center h-[60vh] text-center">
             <p className="text-muted-foreground">Please select a group to view analytics.</p>
         </div>
      ) : (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalSpend.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            total expenses for {selectedGroup.name}
                        </p>
                    </CardContent>
                </Card>
                <AiSummaryCard 
                    group={selectedGroup}
                    summary={aiSummary} 
                    setSummary={setAiSummary}
                    isLoading={isSummaryLoading} 
                    onGenerate={handleGenerateSummary}
                />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Member Contributions</CardTitle>
                        <CardDescription>Who is paying for the expenses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                            <BarChart data={memberContributions}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                <Bar dataKey="value" fill="var(--color-primary)" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <LeaderboardCard leaders={groupLeaders} />
            </div>
             <div className="grid gap-8 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Spending by Category</CardTitle>
                        <CardDescription>How the group's money is being spent.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                            <PieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie
                                data={spendingByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {spendingByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </>
      )}
    </div>
  );
}
