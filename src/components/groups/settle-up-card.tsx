
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { ArrowRight, Wallet, CheckCircle } from 'lucide-react';
import { Payment, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { PayDialog } from './pay-dialog';

interface Balance {
  [userId: string]: number;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
}

function simplifyDebts(balances: Balance): Transaction[] {
  const transactions: Transaction[] = [];
  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < 0)
    .map(([user, amount]) => ({ user, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > 0)
    .map(([user, amount]) => ({ user, amount }))
    .sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
        transactions.push({
            from: debtor.user,
            to: creditor.user,
            amount: amount,
        });

        debtor.amount -= amount;
        creditor.amount -= amount;
    }

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
}

export default function SettleUpCard({
  balances,
  members,
  currentUserId,
  groupId,
}: {
  balances: Balance;
  members: User[];
  currentUserId: string;
  groupId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [settledTransactions, setSettledTransactions] = useState<Set<string>>(new Set());
  const transactions = simplifyDebts(balances);
  const { addPayment } = useStore();
  const { toast } = useToast();

  const getUserById = (id: string) => members.find(m => m.id === id);

  const handleRecordPayment = (fromUserId: string, toUserId: string, amount: number, transactionId: string) => {
      const newPayment: Omit<Payment, 'id'> = {
          fromUserId,
          toUserId,
          amount,
          paidOn: new Date(),
          groupId,
      };
      addPayment(groupId, newPayment);
      setSettledTransactions(prev => new Set(prev).add(transactionId));
      toast({
          title: "Payment Recorded",
          description: `Your payment of ₹${amount.toFixed(2)} to ${getUserById(toUserId)?.name} has been recorded.`,
      });
  };

  const isAllSettled = transactions.every(t => settledTransactions.has(`${t.from}-${t.to}`));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={transactions.length === 0}>
            <Wallet className="mr-2 h-4 w-4" /> {transactions.length === 0 ? 'All Settled Up' : 'Settle Up'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settle Up</DialogTitle>
          <DialogDescription>
            The simplest way to clear all debts. Record payments after you've made them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            {transactions.length > 0 ? (
              transactions.map((t, index) => {
                const fromUser = getUserById(t.from);
                const toUser = getUserById(t.to);
                const transactionId = `${t.from}-${t.to}`;
                const isSettled = settledTransactions.has(transactionId);
                if (!fromUser || !toUser) return null;

                const isCurrentUserFrom = t.from === currentUserId;
                
                if (isSettled) {
                   return null;
                }

                return (
                  <div
                    key={transactionId}
                    className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg"
                  >
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-center flex-col">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={fromUser.avatarUrl} />
                                  <AvatarFallback>{fromUser.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{isCurrentUserFrom ? 'You' : fromUser.name}</span>
                          </div>
                          <div className="flex flex-col items-center">
                              <span className="text-sm text-muted-foreground">Owes</span>
                              <span className="text-lg font-bold">₹{t.amount.toFixed(2)}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                           <div className="flex items-center gap-3 text-center flex-col">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={toUser.avatarUrl} />
                                  <AvatarFallback>{toUser.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{!isCurrentUserFrom && t.to === currentUserId ? 'You' : toUser.name}</span>
                          </div>
                      </div>
                      {isCurrentUserFrom && (
                           <PayDialog 
                             fromUser={fromUser}
                             toUser={toUser}
                             amount={t.amount}
                             onConfirm={() => handleRecordPayment(t.from, t.to, t.amount, transactionId)}
                           />
                      )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="font-semibold text-lg">Everyone is settled up!</p>
              </div>
            )}
            {isAllSettled && transactions.length > 0 && (
                 <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-2">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                      <p className="font-semibold text-lg">Everyone is settled up!</p>
                </div>
            )}
        </div>
        <DialogClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
