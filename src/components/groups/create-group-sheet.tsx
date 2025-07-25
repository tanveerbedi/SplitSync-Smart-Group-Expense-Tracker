
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, UserPlus, X, Check, Loader2 } from 'lucide-react';
import { Group, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email';
import { ScrollArea } from '../ui/scroll-area';

type MemberToAdd = {
    id: string;
    email: string;
    user?: User;
}

type CreateGroupSheetProps = {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CreateGroupSheet({ children, open, onOpenChange }: CreateGroupSheetProps) {
  const [groupName, setGroupName] = useState('');
  const [membersToAdd, setMembersToAdd] = useState<MemberToAdd[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { addGroup, currentUser, users, addInvitation } = useStore();

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const sheetOpen = isControlled ? open : isOpen;
  const setSheetOpen = isControlled ? onOpenChange : setIsOpen;

  if (!currentUser) return null;

  const handleAddEmail = () => {
    if (currentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail)) {
      if (membersToAdd.some(m => m.email.toLowerCase() === currentEmail.toLowerCase()) || currentUser.email.toLowerCase() === currentEmail.toLowerCase()) {
         toast({ title: "User is already in the list to be added.", variant: "destructive" });
         setCurrentEmail('');
         return;
      }

      const existingUser = users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
      
      setMembersToAdd([...membersToAdd, { id: existingUser ? existingUser.id : currentEmail, email: currentEmail, user: existingUser }]);
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
            return [...prev, { id: user.id, email: user.email, user: user }];
        }
    });
  }

  const handleRemoveMember = (idToRemove: string) => {
    setMembersToAdd(membersToAdd.filter((member) => member.id !== idToRemove));
  };

  const resetForm = () => {
    setGroupName('');
    setMembersToAdd([]);
    setCurrentEmail('');
  };

  const handleOpenChange = (openState: boolean) => {
      setSheetOpen(openState);
      if (!openState) {
          resetForm();
      }
  }
  
  const availableUsers = users.filter(u => u.id !== currentUser.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) {
      toast({
        title: 'Group name required',
        description: 'Please provide a name for your group.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreating(true);

    const newGroupId = `group-${Date.now()}`;
    const newGroup: Group = {
      id: newGroupId,
      name: groupName,
      members: [currentUser], // Only creator is a member initially
      expenses: [],
      payments: [],
      imageUrl: `https://placehold.co/600x400.png`,
      createdAt: new Date(),
    };
    
    addGroup(newGroup);

    toast({
      title: 'Group Created!',
      description: `"${groupName}" has been successfully created.`,
    });

    // Send invitations to all selected members
    if (membersToAdd.length > 0) {
      try {
        const invitationPromises = membersToAdd.map(member => {
            addInvitation({
                email: member.email,
                groupId: newGroupId,
                groupName: newGroup.name,
                inviterId: currentUser.id,
            });
            return sendInvitationEmail({
                email: member.email,
                groupName: newGroup.name,
                inviterName: currentUser.name
            });
        });
        
        await Promise.all(invitationPromises);
        toast({
          title: 'Invitations Sent!',
          description: `Invitations have been sent to ${membersToAdd.length} member(s).`
        });
      } catch (error) {
        console.error("Failed to send invitations:", error);
        toast({
          title: 'Invitation Error',
          description: 'Could not send invitations at this time.',
          variant: 'destructive'
        });
      }
    }
    
    resetForm();
    setIsCreating(false);
    handleOpenChange(false);
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle>Create a new group</SheetTitle>
          <SheetDescription>Give your group a name and invite members to start sharing expenses.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between overflow-hidden">
          <ScrollArea className="flex-grow">
            <div className="grid gap-6 p-6">
              <div className="grid gap-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input id="group-name" placeholder="e.g., Trip to Goa, Roommates" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
              </div>
              
              <Separator />

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
                      <div className="space-y-2 rounded-md border p-2 max-h-40 overflow-y-auto">
                          {membersToAdd.map(member => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                  {member.user ? (
                                      <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                              <AvatarImage src={member.user.avatarUrl} />
                                              <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium">{member.user.name}</span>
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
                  <Label>Add from Your Contacts</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {availableUsers.map(user => {
                          const isAdded = membersToAdd.some(m => m.id === user.id);
                          return (
                               <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleToggleUser(user)}>
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
                                  <Button type="button" variant={isAdded ? "secondary" : "outline"} size="icon" className="h-8 w-8 pointer-events-none">
                                      {isAdded ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                  </Button>
                              </div>
                          )
                      })}
                  </div>
              </div>
             
            </div>
          </ScrollArea>
          <SheetFooter className="mt-auto p-6 pt-4 border-t">
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
