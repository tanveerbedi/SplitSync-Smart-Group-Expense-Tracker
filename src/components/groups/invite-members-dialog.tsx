
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, X, Loader2, Check } from 'lucide-react';
import { Group, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email';
import { Separator } from '../ui/separator';

type MemberToAdd = {
    id: string;
    email: string;
    user?: User;
}

export default function InviteMembersDialog({ group }: { group: Group }) {
  const [membersToAdd, setMembersToAdd] = useState<MemberToAdd[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const { addInvitation, users, currentUser } = useStore();

  if (!currentUser) return null;

  const handleAddEmail = () => {
    if (currentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      if (
        group.members.some(m => m.email.toLowerCase() === currentEmail.toLowerCase()) ||
        membersToAdd.some(m => m.email.toLowerCase() === currentEmail.toLowerCase())
      ) {
         toast({ title: "User is already in the group or invite list.", variant: "destructive" });
         setCurrentEmail('');
         return;
      }

      const existingUser = users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
      
      setMembersToAdd([...membersToAdd, { id: existingUser?.id || currentEmail, email: currentEmail, user: existingUser }]);
      setCurrentEmail('');
    } else {
        toast({ title: 'Invalid email address.', description: 'Please enter a valid email address.', variant: 'destructive'})
    }
  };

  const handleToggleUser = (user: User) => {
    setMembersToAdd(prev => {
        const isAlreadyAdded = prev.some(member => member.id === user.id);
        if(isAlreadyAdded) {
            return prev.filter(member => member.id !== user.id);
        } else {
            return [...prev, { id: user.id, email: user.email, user }];
        }
    });
  }

  const handleRemoveMember = (idToRemove: string) => {
    setMembersToAdd(membersToAdd.filter((member) => member.id !== idToRemove));
  };

  const resetForm = () => {
    setMembersToAdd([]);
    setCurrentEmail('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (membersToAdd.length === 0) {
      toast({
        title: 'No members to invite',
        description: 'Please add at least one person.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsInviting(true);

    try {
        const invitationPromises = membersToAdd.map(member => {
            addInvitation({
                email: member.email,
                groupId: group.id,
                groupName: group.name,
                inviterId: currentUser.id,
            });
            return sendInvitationEmail({
                email: member.email,
                groupName: group.name,
                inviterName: currentUser.name
            });
        });
        await Promise.all(invitationPromises);
        
        toast({
          title: 'Invitations Sent!',
          description: `${membersToAdd.length} member(s) have been invited to "${group.name}".`
        });

    } catch (error) {
        console.error("Failed to send invitations:", error);
        toast({
          title: 'Invitation Error',
          description: 'Could not send one or more invitations.',
          variant: 'destructive'
        });
    }
    
    resetForm();
    setIsInviting(false);
    setIsOpen(false);
  };
  
  const availableUsers = users.filter(u => !group.members.some(gm => gm.id === u.id));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members to {group.name}</DialogTitle>
          <DialogDescription>Add new members to this group by email or from your existing contacts.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
                <Label htmlFor="invite-email">Invite New Members by Email</Label>
                <div className="flex gap-2">
                    <Input id="invite-email" type="email" placeholder="friend@example.com" value={currentEmail} onChange={(e) => setCurrentEmail(e.target.value)} />
                    <Button type="button" variant="outline" onClick={handleAddEmail}>Add</Button>
                </div>
            </div>
            
            {(membersToAdd.length > 0) && (
                 <div className="grid gap-2">
                    <Label>Members to Add</Label>
                    <div className="space-y-2 rounded-md border p-2 max-h-24 overflow-y-auto">
                        {membersToAdd.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                {member.user ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={member.user.avatarUrl} />
                                            <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{member.user.name}</span>
                                        <span className="text-sm text-muted-foreground">({member.email})</span>
                                    </div>
                                ) : (
                                    <span className="text-sm">{member.email}</span>
                                )}
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveMember(member.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
            
            <Separator />

            <div className="grid gap-2">
                <Label>Add Existing Users</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {availableUsers.map(user => {
                        const isAdded = membersToAdd.some(m => m.id === user.id);
                        return (
                             <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleToggleUser(user)}>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Button type="button" variant={isAdded ? "secondary" : "outline"} size="icon" className="h-8 w-8">
                                    {isAdded ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                </Button>
                            </div>
                        )
                    })}
                     {availableUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">All your contacts are already in this group.</p>
                     )}
                </div>
            </div>

          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isInviting || membersToAdd.length === 0}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isInviting ? 'Inviting...' : `Invite ${membersToAdd.length} Member(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
