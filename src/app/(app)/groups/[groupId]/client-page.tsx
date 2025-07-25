

'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  PlusCircle,
  Settings,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Trash2,
  LogOut,
  Upload,
  MoreVertical,
  Edit,
  Sparkles,
  Bot,
  X,
} from 'lucide-react';
import { mockUsers } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Expense, Group, Payment, User } from '@/types';
import AddExpenseSheet from '@/components/groups/add-expense-sheet';
import SettleUpCard from '@/components/groups/settle-up-card';
import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { suggestSettlement } from '@/ai/flows/suggest-settlement';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';


const ExpenseItem = ({ expense, paidBy, onEdit, onDelete }: { expense: Expense; paidBy?: string; onEdit: () => void; onDelete: () => void }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="grid gap-1 flex-1">
      <p className="font-semibold">{expense.description}</p>
      <p className="text-sm text-muted-foreground">
        Paid by {paidBy || 'Unknown'} on {new Date(expense.paidOn).toLocaleDateString()}
      </p>
    </div>
    <div className="font-medium text-right">
      <p>₹{expense.amount.toFixed(2)}</p>
      <p className="text-xs text-muted-foreground">{expense.category}</p>
    </div>
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
            </DropdownMenuItem>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                        <span className="text-destructive">Delete</span>
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete the expense "{expense.description}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

const AiSettlementSuggestion = ({ group, currentUserId }: { group: Group, currentUserId: string }) => {
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const debts = useMemo(() => {
    const balances: { [key: string]: number } = {};
    group.members.forEach(m => balances[m.id] = 0);

    group.expenses.forEach(expense => {
      expense.split.forEach(split => {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
      });
      balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount;
    });

    group.payments.forEach(payment => {
        balances[payment.fromUserId] += payment.amount;
        balances[payment.toUserId] -= payment.amount;
    });

    return Object.entries(balances)
      .filter(([userId, amount]) => userId !== currentUserId && amount < 0)
      .map(([userId, amount]) => ({
        owedTo: group.members.find(m => m.id === userId)?.name || 'Unknown',
        amount: Math.abs(amount)
      }));
  }, [group, currentUserId]);
  
  useEffect(() => {
    const fetchSuggestion = async () => {
        const currentUser = group.members.find(m => m.id === currentUserId);
        if (!currentUser || debts.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const result = await suggestSettlement({ userName: currentUser.name, debts });
            setSuggestion(result.suggestion);
        } catch (error) {
            console.error("Failed to get settlement suggestion:", error);
            // Don't show an error, just fail silently.
        } finally {
            setIsLoading(false);
        }
    };
    fetchSuggestion();
  }, [debts, currentUserId, group]);

  if (!isVisible || isLoading || !suggestion) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 relative mb-6">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setIsVisible(false)}>
            <X className="h-4 w-4"/>
        </Button>
        <CardHeader className="flex-row items-center gap-4 pb-2">
            <div className="p-2 bg-primary/10 rounded-full">
                <Bot className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-headline text-lg">Quick Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-balance">{suggestion}</p>
        </CardContent>
    </Card>
  )
};

const BalanceView = ({ group, currentUserId }: { group: Group, currentUserId: string }) => {
  const balances: { [key: string]: number } = {};
  group.members.forEach(m => balances[m.id] = 0);

  group.expenses.forEach(expense => {
    expense.split.forEach(split => {
      balances[split.userId] = (balances[split.userId] || 0) - split.amount;
    });
    balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount;
  });

  group.payments.forEach(payment => {
      balances[payment.fromUserId] += payment.amount;
      balances[payment.toUserId] -= payment.amount;
  });

  const yourBalance = balances[currentUserId] || 0;

  return (
    <div className="space-y-6">
      <AiSettlementSuggestion group={group} currentUserId={currentUserId} />
      <Card>
        <CardHeader>
          <CardTitle>Group Balances</CardTitle>
          <CardDescription>A summary of who owes whom.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Your total balance</p>
              <p className={`text-2xl font-bold ${yourBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yourBalance >= 0 ? `+ ₹${yourBalance.toFixed(2)}` : `- ₹${Math.abs(yourBalance).toFixed(2)}`}
              </p>
            </div>
            <SettleUpCard balances={balances} members={group.members} currentUserId={currentUserId} groupId={group.id} />
          </div>
          <Separator />
          <ul className="space-y-2">
            {group.members
              .filter(m => m.id !== currentUserId)
              .map(member => {
                let netFlow = 0;
                group.expenses.forEach(exp => {
                  const yourShare = exp.split.find(s => s.userId === currentUserId)?.amount || 0;
                  const theirShare = exp.split.find(s => s.userId === member.id)?.amount || 0;
                  if (exp.paidById === currentUserId) netFlow += theirShare;
                  if (exp.paidById === member.id) netFlow -= yourShare;
                });
                group.payments.forEach(p => {
                  if (p.fromUserId === currentUserId && p.toUserId === member.id) netFlow -= p.amount;
                  if (p.fromUserId === member.id && p.toUserId === currentUserId) netFlow += p.amount;
                });

                if (Math.abs(netFlow) < 0.01) return null;

                return (
                  <li key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{netFlow > 0 ? `${member.name} owes you` : `You owe ${member.name}`}</span>
                    </div>
                    <span className={netFlow > 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{Math.abs(netFlow).toFixed(2)}
                    </span>
                  </li>
                );
              })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};


export default function GroupDetailClientPage({ group, localImageUrl, onImageChange, onSave }: { group: Group, localImageUrl: string, onImageChange: (url: string) => void, onSave: (name: string, imageUrl: string) => void }) {
    const { removeMemberFromGroup, deleteGroup, deleteExpense, currentUser } = useStore();
    const router = useRouter();
    const [groupName, setGroupName] = useState(group.name);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
    const { toast } = useToast();

    useEffect(() => {
        setGroupName(group.name);
    }, [group.name]);

    if (!currentUser) {
        return null;
    }

    const sortedExpenses = useMemo(() => {
        return [...group.expenses].sort((a,b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime());
    }, [group.expenses]);

    const getUserById = (id: string) => mockUsers.find(u => u.id === id);
    
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    title: "Image too large",
                    description: "Please upload an image smaller than 2MB to avoid storage issues.",
                    variant: "destructive"
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const newUrl = reader.result as string;
                onImageChange(newUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        onSave(groupName, localImageUrl);
    };

    const handleLeaveGroup = () => {
        removeMemberFromGroup(group.id, currentUser.id);
        toast({
            title: `You have left "${group.name}".`,
        });
        router.push('/dashboard');
    };
    
    const handleRemoveMember = (member: User) => {
        removeMemberFromGroup(group.id, member.id);
        toast({
            title: "Member removed",
            description: `${member.name} has been removed from the group.`
        });
    }

    const handleDeleteExpense = (expenseId: string) => {
        deleteExpense(group.id, expenseId);
        toast({
            title: "Expense deleted",
            description: "The expense has been removed from the group.",
            variant: "destructive"
        })
    }

    const handleDeleteGroup = () => {
        deleteGroup(group.id);
        toast({
            title: `Group "${group.name}" has been deleted.`,
            variant: 'destructive',
        });
        router.push('/dashboard');
    };

    return (
        <Tabs defaultValue="expenses">
            <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <AddExpenseSheet group={group} expenseToEdit={editingExpense} onSheetClose={() => setEditingExpense(undefined)} />
            </div>

            <TabsContent value="expenses" className="mt-4">
            <Card>
                <CardHeader>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>A log of all transactions within the group.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="divide-y">
                    {sortedExpenses.map(expense => (
                        <ExpenseItem 
                            key={expense.id} 
                            expense={expense} 
                            paidBy={getUserById(expense.paidById)?.name} 
                            onEdit={() => setEditingExpense(expense)}
                            onDelete={() => handleDeleteExpense(expense.id)}
                        />
                    ))}
                    {group.expenses.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No expenses yet.</p>
                            <p>Click "Add Expense" to get started!</p>
                        </div>
                    )}
                </div>
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="balances" className="mt-4">
              <BalanceView group={group} currentUserId={currentUser.id} />
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <div className="grid gap-8">
                  <Card>
                      <CardHeader>
                          <CardTitle>Group Information</CardTitle>
                          <CardDescription>Update your group's details.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <div className="space-y-2">
                              <Label>Group Image</Label>
                              <div className="flex items-center gap-4">
                                <Image 
                                    src={localImageUrl}
                                    alt="Group image"
                                    width={80}
                                    height={80}
                                    className="rounded-lg aspect-square object-cover"
                                />
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    accept="image/*"
                                    className="hidden" 
                                />
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Image
                                </Button>
                              </div>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="group-name">Group Name</Label>
                              <Input 
                                id="group-name" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                              />
                          </div>
                          <Button onClick={handleSaveChanges}>Save Changes</Button>
                      </CardContent>
                  </Card>

                  <Card>
                      <CardHeader>
                          <CardTitle>Members</CardTitle>
                          <CardDescription>View all members of this group.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          {group.members.map(member => (
                              <div key={member.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <Avatar>
                                          <AvatarImage src={member.avatarUrl} />
                                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <p className="font-medium">{member.name}</p>
                                          <p className="text-xs text-muted-foreground">{member.email}</p>
                                      </div>
                                  </div>
                                  {member.id !== currentUser.id && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm">Remove</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will remove {member.name} from the group. They will no longer have access to its expenses. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveMember(member)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                              </div>
                          ))}
                      </CardContent>
                  </Card>

                  <Card>
                      <CardHeader>
                          <CardTitle>Danger Zone</CardTitle>
                          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                                      <div>
                                          <h4 className="font-semibold">Leave Group</h4>
                                          <p className="text-sm text-muted-foreground">You will be removed from this group.</p>
                                      </div>
                                      <Button variant="outline">
                                          <LogOut className="mr-2 h-4 w-4" />
                                          Leave
                                      </Button>
                                  </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          You will be removed from "{group.name}" and will no longer have access to its expenses. This action cannot be undone.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive hover:bg-destructive/90">Leave Group</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                                      <div>
                                          <h4 className="font-semibold">Delete Group</h4>
                                          <p className="text-sm text-muted-foreground">This will permanently delete the group for everyone.</p>
                                      </div>
                                      <Button variant="destructive">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Group
                                      </Button>
                                  </div>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the "{group.name}" group and all of its data for all members.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90">Delete Group</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </CardContent>
                  </Card>
              </div>
            </TabsContent>
      </Tabs>
    )
}
