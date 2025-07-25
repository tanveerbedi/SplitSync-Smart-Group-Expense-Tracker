
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Bot, Edit, ReceiptText, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expenseCategories, Group, Expense, User } from '@/types';
import { suggestExpenseCategory } from '@/ai/flows/suggest-expense-category';
import { scanReceipt } from '@/ai/flows/scan-receipt';
import { suggestMerchant } from '@/ai/flows/suggest-merchant';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/use-debounce';


type AddExpenseSheetProps = {
    group: Group;
    expenseToEdit?: Expense;
    onSheetClose: () => void;
}

export default function AddExpenseSheet({ group, expenseToEdit, onSheetClose }: AddExpenseSheetProps) {
  const { addExpense, updateExpense, currentUser } = useStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [paidById, setPaidById] = useState(currentUser?.id || '');
  const [category, setCategory] = useState('');
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [isSuggestingMerchant, setIsSuggestingMerchant] = useState(false);
  const [merchantSuggestion, setMerchantSuggestion] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = !!expenseToEdit;
  const debouncedDescription = useDebounce(description, 500);

  useEffect(() => {
    if (group && group.members) {
        setSplitWith(group.members.map(m => m.id));
    }
  }, [group]);

   useEffect(() => {
    if (currentUser && !isEditing) {
        setPaidById(currentUser.id);
    }
  }, [currentUser, isEditing]);


  useEffect(() => {
    if (isEditing && expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(expenseToEdit.amount.toString());
      setDate(new Date(expenseToEdit.paidOn));
      setPaidById(expenseToEdit.paidById);
      setCategory(expenseToEdit.category);
      setSplitWith(expenseToEdit.split.map(s => s.userId));
      setIsOpen(true);
    } else {
        resetForm();
    }
  }, [expenseToEdit, isEditing]);

  useEffect(() => {
    const getMerchantSuggestion = async () => {
        if (debouncedDescription && debouncedDescription.length > 3 && !isEditing) {
            setIsSuggestingMerchant(true);
            try {
                const result = await suggestMerchant({ text: debouncedDescription });
                if (result.merchant && result.merchant.toLowerCase() !== debouncedDescription.toLowerCase()) {
                    setMerchantSuggestion(result.merchant);
                } else {
                    setMerchantSuggestion('');
                }
            } catch (error) {
                console.error("Merchant suggestion failed", error);
                setMerchantSuggestion('');
            } finally {
                setIsSuggestingMerchant(false);
            }
        } else {
            setMerchantSuggestion('');
        }
    };
    getMerchantSuggestion();
  }, [debouncedDescription, isEditing]);

  const handleCategorySuggestion = async () => {
    if (!description) {
      toast({
        title: 'Description needed',
        description: 'Please enter a description to get a category suggestion.',
        variant: 'destructive',
      });
      return;
    }
    setIsSuggestingCategory(true);
    try {
      const result = await suggestExpenseCategory({ description });
      const suggestedCategory = expenseCategories.find(c => c.toLowerCase() === result.category.toLowerCase()) || 'Other';
      setCategory(suggestedCategory);
    } catch (error) {
      console.error('Error suggesting category:', error);
      toast({
        title: 'Suggestion failed',
        description: 'Could not get an AI suggestion at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggestingCategory(false);
    }
  };
  
  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit for images
            toast({
                title: "Image too large",
                description: "Please upload a receipt image smaller than 4MB.",
                variant: "destructive"
            });
            return;
        }
        setIsScanning(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const result = await scanReceipt({ receiptDataUri: reader.result as string });
                setDescription(result.description);
                setAmount(result.amount.toString());
                // The date from AI comes as 'YYYY-MM-DD', parseISO correctly handles this string
                setDate(parseISO(result.date));
                 toast({
                    title: "Receipt Scanned!",
                    description: "Expense details have been filled in for you.",
                });
            } catch (error) {
                 console.error('Error scanning receipt:', error);
                 toast({
                    title: 'Scan failed',
                    description: 'Could not extract details from the receipt. Please enter them manually.',
                    variant: 'destructive',
                });
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset file input to allow re-uploading the same file
    event.target.value = '';
  }


  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(new Date());
    if (currentUser) {
        setPaidById(currentUser.id);
    }
    setCategory('');
    if (group && group.members) {
        setSplitWith(group.members.map(m => m.id));
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        onSheetClose();
        resetForm();
    }
  }

  const handleSplitMemberToggle = (memberId: string) => {
    setSplitWith(prev => 
        prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }

  const handleSelectAllSplits = (select: boolean) => {
    if (select) {
        setSplitWith(group.members.map(m => m.id));
    } else {
        setSplitWith([]);
    }
  }

  const handleAcceptSuggestion = () => {
    if (merchantSuggestion) {
        setDescription(merchantSuggestion);
        setMerchantSuggestion('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!description || !numericAmount || isNaN(numericAmount) || !date || !category) {
      toast({
        title: 'Missing information',
        description: 'Please fill out all fields correctly.',
        variant: 'destructive',
      });
      return;
    }

    if (splitWith.length === 0) {
        toast({
            title: "No members selected",
            description: "You must split the expense with at least one member.",
            variant: "destructive",
        });
        return;
    }
    
    const splitAmount = numericAmount / splitWith.length;
    const newSplit = splitWith.map(memberId => ({
        userId: memberId,
        amount: splitAmount
    }));

    if (isEditing && expenseToEdit) {
        const updatedExpense: Expense = {
            ...expenseToEdit,
            description,
            amount: numericAmount,
            paidById,
            paidOn: date,
            category,
            split: newSplit,
        }
        updateExpense(group.id, updatedExpense);
        toast({
            title: 'Expense Updated!',
            description: `"${description}" has been updated.`
        });
    } else {
        const newExpense: Omit<Expense, 'id' | 'paidOn'> & { paidOn: Date } = {
          description,
          amount: numericAmount,
          paidById,
          paidOn: date,
          groupId: group.id,
          category,
          split: newSplit,
        };
        addExpense(group.id, newExpense);
        toast({
          title: 'Expense Added!',
          description: `"${description}" has been added to the group.`,
        });
    }
    
    handleOpenChange(false);
  };

  if (!currentUser) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {!isEditing && (
        <SheetTrigger asChild>
            <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6">
            <SheetTitle>{isEditing ? 'Edit Expense' : 'Add a new expense'}</SheetTitle>
            <SheetDescription>{isEditing ? 'Update the details of this expense.' : 'Enter the details of the expense and how to split it.'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between overflow-hidden">
          <ScrollArea className="flex-grow">
            <div className="grid gap-4 py-4 px-6">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="description">Description</Label>
                    <input type="file" ref={receiptInputRef} onChange={handleReceiptUpload} accept="image/*" className="hidden" />
                     <Button variant="link" size="sm" type="button" onClick={() => receiptInputRef.current?.click()} disabled={isScanning}>
                        {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
                        Scan Receipt
                     </Button>
                </div>
                <div className="relative">
                    <Input id="description" placeholder="e.g., Dinner, movie tickets" value={description} onChange={(e) => setDescription(e.target.value)} required />
                     {merchantSuggestion && (
                        <div className="absolute top-full left-0 w-full mt-1 p-2 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center animate-in fade-in-50">
                           <div className="flex items-center gap-2">
                             <Wand2 className="h-4 w-4 text-primary" />
                             <p className="text-sm">Did you mean: <span className="font-semibold">{merchantSuggestion}</span>?</p>
                           </div>
                           <Button type="button" size="sm" variant="ghost" onClick={handleAcceptSuggestion}>Use</Button>
                        </div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" placeholder="₹0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <div className="flex gap-2">
                  <Select onValueChange={setCategory} value={category} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={handleCategorySuggestion} disabled={isSuggestingCategory} type="button">
                    <Bot className={cn('h-4 w-4', isSuggestingCategory && 'animate-spin')} />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paid-by">Paid by</Label>
                <Select value={paidById} onValueChange={setPaidById}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {group.members.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.id === currentUser.id ? 'You' : user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />

              <div className="grid gap-2">
                <div className='flex justify-between items-center'>
                    <Label>Split Between</Label>
                    <div className='flex gap-2'>
                        <Button type="button" size="sm" variant="link" onClick={() => handleSelectAllSplits(true)}>Select All</Button>
                        <Button type="button" size="sm" variant="link" onClick={() => handleSelectAllSplits(false)}>Deselect All</Button>
                    </div>
                </div>
                <div className='space-y-2 rounded-md border p-2'>
                    {group.members.map(member => (
                        <div key={member.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                            <Checkbox 
                                id={`split-${member.id}`}
                                checked={splitWith.includes(member.id)}
                                onCheckedChange={() => handleSplitMemberToggle(member.id)}
                            />
                            <Label htmlFor={`split-${member.id}`} className="font-normal flex-1 cursor-pointer">
                                {member.id === currentUser.id ? 'You' : member.name}
                            </Label>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="mt-auto p-6 pt-4 border-t">
            <Button type="submit">{isEditing ? 'Save Changes' : 'Save Expense'}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
