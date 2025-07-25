
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { User, Invitation } from '@/types';

const InvitationItem = ({ invitation, onAccept, onDecline }: { invitation: Invitation, onAccept: (invitationId: string) => void, onDecline: (invitationId: string) => void }) => {
    const { users } = useStore();
    const inviter = users.find(u => u.id === invitation.inviterId);

    if (!inviter) return null;

    return (
         <div className="my-4 flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={inviter.avatarUrl} />
                    <AvatarFallback>{inviter.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{inviter.name}</p>
                    <p className="text-sm text-muted-foreground">
                    has invited you to join{' '}
                    <span className="font-medium text-primary">"{invitation.groupName}"</span>
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => onDecline(invitation.id)}>
                    Decline
                </Button>
                <Button onClick={() => onAccept(invitation.id)}>Accept</Button>
            </div>
        </div>
    )
}

export default function PendingInvitesDialog({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, invitations, acceptInvitation, declineInvitation } = useStore();

  if (!currentUser) return null;

  const userInvitations = invitations.filter(inv => inv.email.toLowerCase() === currentUser.email.toLowerCase());

  const handleAccept = (invitationId: string) => {
    const invitation = userInvitations.find(i => i.id === invitationId);
    if (!invitation) return;

    acceptInvitation(invitationId, currentUser.id);
    toast({
      title: 'Invitation Accepted!',
      description: `You have joined the "${invitation.groupName}" group.`,
    });
    if (userInvitations.length <= 1) {
        setIsOpen(false);
    }
  };

  const handleDecline = (invitationId: string) => {
    declineInvitation(invitationId);
    toast({
      title: 'Invitation Declined',
      variant: 'destructive',
    });
    if (userInvitations.length <= 1) {
        setIsOpen(false);
    }
  };

  if (userInvitations.length === 0) {
      return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You have pending invitations!</DialogTitle>
          <DialogDescription>
            Accept or decline the invitations to join new groups.
          </DialogDescription>
        </DialogHeader>
        {userInvitations.map(invitation => (
            <InvitationItem 
                key={invitation.id}
                invitation={invitation}
                onAccept={handleAccept}
                onDecline={handleDecline}
            />
        ))}
      </DialogContent>
    </Dialog>
  );
}
