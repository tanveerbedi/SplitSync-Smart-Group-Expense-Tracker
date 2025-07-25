
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { QrCode, Loader2 } from 'lucide-react';
import type { User } from '@/types';

const MockQRCode = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full p-2 bg-white rounded-md">
        <path fill="#000" d="M0 0h25v25H0zM33 0h8v25h-8zM50 0h25v25H50zM83 0h8v8h-8zM92 0h8v25h-8zM0 33h8v8H0zM17 33h8v8h-8zM33 33h25v8H33zM67 33h8v8h-8zM83 33h8v8h-8zM0 50h25v25H0zM33 50h8v8h-8zM50 50h8v8h-8zM67 50h8v8h-8zM83 50h17v8H83zM0 83h8v17H0zM17 83h8v8h-8zM33 83h8v17h-8zM50 83h25v8H50zM83 83h17v17H83z" />
    </svg>
);


export function PayDialog({ fromUser, toUser, amount, onConfirm }: { fromUser: User, toUser: User, amount: number, onConfirm: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = () => {
    setIsConfirming(true);
    // Simulate payment verification delay
    setTimeout(() => {
      onConfirm();
      setIsConfirming(false);
      setIsOpen(false);
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Pay Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Scan the UPI QR code with your payment app to pay {toUser.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-48 h-48 p-2 border rounded-lg">
                <MockQRCode />
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">Paying To</p>
                <p className="font-semibold">{toUser.name}</p>
                <p className="text-2xl font-bold mt-1">₹{amount.toFixed(2)}</p>
            </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isConfirming}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
