

'use client';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Users,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GroupDetailClientPage from './client-page';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import InviteMembersDialog from '@/components/groups/invite-members-dialog';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const getGroupImageHint = (name: string) => {
    if (name.toLowerCase().includes('vacation')) return 'vacation beach';
    if (name.toLowerCase().includes('apartment')) return 'apartment interior';
    if (name.toLowerCase().includes('project')) return 'team working';
    return 'group event';
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { groups, updateGroupDetails } = useStore();
  const group = groups.find(g => g.id === groupId);
  const { toast } = useToast();
  const [localImageUrl, setLocalImageUrl] = useState(group?.imageUrl || '');

  useEffect(() => {
    if (group) {
        setLocalImageUrl(group.imageUrl);
    }
  }, [group]);


  if (!group) {
    // You might want to show a loading state here
    // or handle the case where the group is not found after loading
    return notFound();
  }

  const handleDetailsSave = (newName: string, newImageUrl: string) => {
    if (newName.trim() === '') {
        toast({
            title: "Group name cannot be empty",
            variant: 'destructive',
        });
        return;
    }
    updateGroupDetails(group.id, { name: newName, imageUrl: newImageUrl });
    toast({
        title: "Group details updated!",
        description: "Your changes have been saved."
    });
  };

  const handleExport = () => {
    if (!group) return;

    toast({
      title: "Exporting group data...",
      description: "Your CSV file is being generated."
    });

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By'];
    const csvRows = [headers.join(',')];

    group.expenses.forEach(expense => {
      const paidByUser = group.members.find(m => m.id === expense.paidById);
      const row = [
        new Date(expense.paidOn).toLocaleDateString(),
        `"${expense.description.replace(/"/g, '""')}"`, // Handle quotes in description
        expense.category,
        expense.amount.toFixed(2),
        paidByUser ? `"${paidByUser.name}"` : 'Unknown User'
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${group.name.replace(/\s+/g, '_').toLowerCase()}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={localImageUrl}
            alt={group.name}
            width={96}
            height={96}
            key={localImageUrl} // Force re-render on URL change
            data-ai-hint={getGroupImageHint(group.name)}
            className="rounded-lg aspect-square object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold font-headline">{group.name}</h1>
            <div className="flex items-center text-muted-foreground mt-1">
              <Users className="h-4 w-4 mr-2" />
              <span>{group.members.length} members</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <InviteMembersDialog group={group} />
           <Button asChild variant="outline">
              <Link href="/chat">
                <MessageSquare className="h-4 w-4 mr-2" /> Chat Room
              </Link>
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileText className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </header>

      <GroupDetailClientPage 
        group={group}
        localImageUrl={localImageUrl}
        onImageChange={setLocalImageUrl}
        onSave={handleDetailsSave}
      />
    </div>
  );
}
