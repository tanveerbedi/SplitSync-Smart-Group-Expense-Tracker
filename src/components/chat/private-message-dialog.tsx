
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationEmail } from '@/ai/flows/send-notification-email';
import { Loader2, Send } from 'lucide-react';

interface PrivateMessageDialogProps {
  recipient: User;
  currentUser: User;
  children: React.ReactNode;
}

export default function PrivateMessageDialog({ recipient, currentUser, children }: PrivateMessageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: 'Message cannot be empty.', variant: 'destructive' });
      return;
    }
    setIsSending(true);

    try {
      const emailContent = `
        You have a new private message from <strong>${currentUser.name}</strong> on SplitSync:
        <div style="background-color: #f9f9f9; border-left: 4px solid #6a33d2; padding: 15px; margin: 20px 0; white-space: pre-wrap;">
          <p>${message}</p>
        </div>
        You can reply to this message directly from your email to reply to ${currentUser.name}.
      `;
      // We can't actually handle email replies, but this makes it feel more real.

      await sendNotificationEmail({
        // Overriding the default recipient
        recipientEmail: recipient.email,
        subject: `New Private Message from ${currentUser.name}`,
        message: emailContent,
        replyTo: currentUser.email,
      });

      toast({
        title: 'Message Sent!',
        description: `Your private message has been sent to ${recipient.name}.`,
      });

      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to send private message email:', error);
      toast({
        title: 'Error Sending Message',
        description: 'Could not send your message at this time. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (recipient.id === currentUser.id) {
    return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipient.avatarUrl} />
              <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>Message {recipient.name}</DialogTitle>
              <DialogDescription>
                This message will be sent privately to {recipient.name}'s email.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="private-message" className="sr-only">
            Message
          </Label>
          <Textarea
            id="private-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Type your message to ${recipient.name}...`}
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
