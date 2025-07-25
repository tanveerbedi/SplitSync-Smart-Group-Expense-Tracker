
import type { LucideIcon } from "lucide-react";

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  password?: string; // Add optional password field
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  paidOn: Date;
  groupId: string;
  category: string;
  split: {
    userId: string;
    amount: number;
  }[];
  receiptUrl?: string;
};

export type Payment = {
  id:string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  paidOn: Date;
  groupId: string;
};

export type Group = {
  id: string;
  name: string;
  members: User[];
  expenses: Expense[];
  payments: Payment[];
  imageUrl: string;
  createdAt: Date;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Notification = {
    id: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'message' | 'badge';
    groupId?: string; // Optional group ID for navigation
}

export type Invitation = {
    id: string;
    email: string;
    groupId: string;
    groupName: string;
    inviterId: string;
}

export type Reaction = {
    emoji: string;
    userIds: string[];
};

export type ChatMessage = {
    id: string;
    text: string;
    userId: string; // 'system' for automated messages, 'assistant' for AI
    timestamp: Date;
    reactions?: Reaction[];
    mentions?: string[]; // Array of mentioned user IDs
    edited?: boolean;
    imageUrl?: string | null;
    imageFileName?: string | null;
};


export const expenseCategories = [
  "Groceries",
  "Dining",
  "Transport",
  "Entertainment",
  "Utilities",
  "Rent",
  "Shopping",
  "Travel",
  "Health",
  "Other",
];
