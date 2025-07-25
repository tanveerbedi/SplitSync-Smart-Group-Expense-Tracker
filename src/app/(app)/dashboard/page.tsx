
'use client';
import { Mail, Users } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import CreateGroupSheet from '@/components/groups/create-group-sheet';
import PendingInvitesDialog from '@/components/dashboard/pending-invites-dialog';
import { BalanceCard, GroupCard } from '@/components/dashboard/dashboard-cards';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
    const { groups, currentUser, invitations } = useStore();
    const [showCreateGroupSheet, setShowCreateGroupSheet] = useState(false);
    
    const userGroups = useMemo(() => {
        if (!currentUser) return [];
        return groups.filter(g => g.members.some(m => m.id === currentUser.id));
    }, [groups, currentUser]);
    
    if (!currentUser) {
        return null; // or a loading spinner
    }
    
    const pendingInvitesCount = invitations.filter(i => i.email.toLowerCase() === currentUser.email.toLowerCase()).length;

    return (
        <div className="flex flex-col gap-8">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
                     <p className="text-muted-foreground">Here's a summary of your groups and balances.</p>
                </div>
                <CreateGroupSheet 
                    open={showCreateGroupSheet} 
                    onOpenChange={setShowCreateGroupSheet}
                >
                    <Button size="lg">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New Group
                    </Button>
                </CreateGroupSheet>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/analytics">
                    <BalanceCard groups={userGroups} userId={currentUser.id} />
                </Link>
                <Link href="#groups">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{userGroups.length}</div>
                            <p className="text-xs text-muted-foreground">Number of active groups</p>
                        </CardContent>
                    </Card>
                </Link>
                <PendingInvitesDialog>
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingInvitesCount}</div>
                            <p className="text-xs text-muted-foreground">Invitations to join new groups</p>
                        </CardContent>
                    </Card>
                </PendingInvitesDialog>
            </div>

            <div id="groups">
                <h2 className="text-2xl font-bold font-headline mb-4">Your Groups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {userGroups.map(group => <GroupCard key={group.id} group={group} currentUserId={currentUser.id}/>)}
                </div>
                 {userGroups.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground col-span-full">
                        <p className="text-lg">You're not in any groups yet.</p>
                        <p>Create a group to get started!</p>
                    </div>
                 )}
            </div>
        </div>
    );
}
