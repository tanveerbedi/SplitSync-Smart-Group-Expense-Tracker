import { User, Group, Expense, Payment, Badge, Notification, Invitation, ChatMessage } from "@/types";
import { Coins, Award, Zap, Shield, Rocket, Sparkles, LucideIcon, UserPlus, PartyPopper } from "lucide-react";

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Tanveer', email: 'tsbedi2604@gmail.com', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop', password: 'password' },
  { id: 'user-2', name: 'Sargun', email: 'sargun@example.com', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop', password: 'password' },
  { id: 'user-3', name: 'Robin', email: 'robin@example.com', avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1980&auto=format&fit=crop', password: 'password' },
  { id: 'user-4', name: 'Nimrat', email: 'nimrat@example.com', avatarUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=2070&auto=format&fit=crop', password: 'password' },
  { id: 'user-5', name: 'Priya Sharma', email: 'priya@example.com', avatarUrl: 'https://images.unsplash.com/photo-1599425444315-978a3560377a?q=80&w=1964&auto=format&fit=crop', password: 'password' },
  { id: 'user-6', name: 'Rohan Mehta', email: 'rohan@example.com', avatarUrl: 'https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=1974&auto=format&fit=crop', password: 'password' },
  { id: 'user-7', name: 'Anjali Gupta', email: 'anjali@example.com', avatarUrl: 'https://images.unsplash.com/photo-1598122354326-83a321946323?q=80&w=1974&auto=format&fit=crop', password: 'password' },
];

export const mockCurrentUser: User = mockUsers[0];

const mockExpensesGroup1: Expense[] = [
  {
    id: 'exp-1',
    description: 'Grocery Shopping at Main St Market',
    amount: 120.50,
    paidById: 'user-2',
    paidOn: new Date('2024-07-15'),
    groupId: 'group-1',
    category: 'Groceries',
    split: [
      { userId: 'user-1', amount: 30.125 },
      { userId: 'user-2', amount: 30.125 },
      { userId: 'user-3', amount: 30.125 },
      { userId: 'user-4', amount: 30.125 },
    ]
  },
  {
    id: 'exp-2',
    description: 'Dinner at The Italian Place',
    amount: 80.00,
    paidById: 'user-1',
    paidOn: new Date('2024-07-16'),
    groupId: 'group-1',
    category: 'Dining',
    split: [
      { userId: 'user-1', amount: 20.00 },
      { userId: 'user-2', amount: 20.00 },
      { userId: 'user-3', amount: 20.00 },
      { userId: 'user-4', amount: 20.00 },
    ]
  },
   {
    id: 'exp-3',
    description: 'Movie Tickets for "Space Odyssey"',
    amount: 50.00,
    paidById: 'user-3',
    paidOn: new Date('2024-07-18'),
    groupId: 'group-1',
    category: 'Entertainment',
    split: [
      { userId: 'user-1', amount: 12.50 },
      { userId: 'user-2', amount: 12.50 },
      { userId: 'user-3', amount: 12.50 },
      { userId: 'user-4', amount: 12.50 },
    ]
  },
  {
    id: 'exp-6',
    description: 'Surfing lessons',
    amount: 200.00,
    paidById: 'user-1',
    paidOn: new Date('2024-07-19'),
    groupId: 'group-1',
    category: 'Entertainment',
    split: [
      { userId: 'user-1', amount: 50.00 },
      { userId: 'user-2', amount: 50.00 },
      { userId: 'user-3', amount: 50.00 },
      { userId: 'user-4', amount: 50.00 },
    ]
  },
  {
    id: 'exp-9',
    description: 'Cab fare',
    amount: 100.00,
    paidById: 'user-2',
    paidOn: new Date('2024-07-20'),
    groupId: 'group-1',
    category: 'Transport',
    split: [
        { userId: 'user-1', amount: 25.00 },
        { userId: 'user-2', amount: 25.00 },
        { userId: 'user-3', amount: 25.00 },
        { userId: 'user-4', amount: 25.00 },
    ]
  },
];

const mockPaymentsGroup1: Payment[] = [
    {
        id: 'pay-1',
        fromUserId: 'user-4',
        toUserId: 'user-2',
        amount: 20,
        paidOn: new Date('2024-07-20'),
        groupId: 'group-1'
    }
];

const mockExpensesGroup2: Expense[] = [
   {
    id: 'exp-4',
    description: 'Monthly Rent',
    amount: 1600.00,
    paidById: 'user-1',
    paidOn: new Date('2024-07-01'),
    groupId: 'group-2',
    category: 'Rent',
    split: [
      { userId: 'user-1', amount: 800.00 },
      { userId: 'user-2', amount: 800.00 },
    ]
  },
  {
    id: 'exp-5',
    description: 'Electricity Bill',
    amount: 75.00,
    paidById: 'user-2',
    paidOn: new Date('2024-07-10'),
    groupId: 'group-2',
    category: 'Utilities',
    split: [
      { userId: 'user-1', amount: 37.50 },
      { userId: 'user-2', amount: 37.50 },
    ]
  }
];

const mockExpensesGroup4: Expense[] = [
    {
        id: 'exp-7',
        description: 'Villa rental',
        amount: 3000,
        paidById: 'user-1',
        paidOn: new Date('2024-08-01'),
        groupId: 'group-4',
        category: 'Travel',
        split: [
            { userId: 'user-1', amount: 1000 },
            { userId: 'user-3', amount: 1000 },
            { userId: 'user-4', amount: 1000 },
        ]
    },
    {
        id: 'exp-8',
        description: 'Scooter rental',
        amount: 150,
        paidById: 'user-3',
        paidOn: new Date('2024-08-02'),
        groupId: 'group-4',
        category: 'Transport',
        split: [
            { userId: 'user-1', amount: 50 },
            { userId: 'user-3', amount: 50 },
            { userId: 'user-4', amount: 50 },
        ]
    }
]

export const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Trip to Goa',
    members: mockUsers.slice(0, 4), // First 4 users
    expenses: mockExpensesGroup1,
    payments: mockPaymentsGroup1,
    imageUrl: 'https://images.unsplash.com/photo-1563492752-16757135549f?q=80&w=2070&auto=format&fit=crop',
    createdAt: new Date('2024-07-10'),
  },
  {
    id: 'group-2',
    name: 'Apartment Mates',
    members: [mockUsers[0], mockUsers[1]],
    expenses: mockExpensesGroup2,
    payments: [],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop',
    createdAt: new Date('2024-01-01'),
  },
   {
    id: 'group-3',
    name: 'Weekend Project Team',
    members: [mockUsers[0], mockUsers[2], mockUsers[3]],
    expenses: [],
    payments: [],
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop',
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'group-4',
    name: 'Vacation in Bali',
    members: [mockUsers[0], mockUsers[2], mockUsers[3]],
    expenses: mockExpensesGroup4,
    payments: [],
    imageUrl: 'https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=2070&auto=format&fit=crop',
    createdAt: new Date('2024-08-01'),
  }
];

export const mockBadges: Badge[] = [
  { id: 'badge-1', title: 'Most Generous', description: 'Paid the most in a group.', icon: Award },
  { id: 'badge-2', title: 'Quick Settler', description: 'Settled up a debt.', icon: Zap },
  { id: 'badge-3', title: 'Expense Addict', description: 'Added over 5 expenses.', icon: Coins },
  { id: 'badge-4', title: 'Group Starter', description: 'Created your first group.', icon: PartyPopper },
  { id: 'badge-5', title: 'Frequent Flyer', description: 'Part of 3+ travel groups.', icon: Rocket },
  { id: 'badge-6', title: 'First Timer', description: 'Added your first expense!', icon: Sparkles },
  { id: 'badge-7', title: 'Socialite', description: 'Joined 3+ groups.', icon: UserPlus },
];

export const badgeIconMap: { [key: string]: LucideIcon } = {
  'badge-1': Award,
  'badge-2': Zap,
  'badge-3': Coins,
  'badge-4': PartyPopper,
  'badge-5': Rocket,
  'badge-6': Sparkles,
  'badge-7': UserPlus,
};


export const mockUserBadges = [
    mockBadges[5] // "First Timer" badge
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-4',
    message: 'Nimrat invited you to join "Cottage Weekend".',
    timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
    read: false,
    type: 'message',
    groupId: 'group-3',
  },
  {
    id: 'notif-1',
    message: 'Robin added a new expense "Dinner at The Italian Place" to Apartment Mates.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    type: 'message',
    groupId: 'group-2',
  },
  {
    id: 'notif-2',
    message: 'You unlocked the "First Timer" badge! Congratulations!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    type: 'badge',
  },
  {
    id: 'notif-3',
    message: 'A new member, Nimrat, joined your "Trip to Goa" group.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    type: 'message',
    groupId: 'group-1',
  },
];


export const mockInvitations: Invitation[] = [
    {
        id: 'inv-3',
        email: 'tsbedi2604@gmail.com',
        groupId: 'group-3',
        groupName: 'Cottage Weekend',
        inviterId: 'user-4' // from Nimrat
    },
    {
        id: 'inv-2',
        email: 'tsbedi2604@gmail.com',
        groupId: 'group-5', // This group doesn't exist yet, which is okay for an invite
        groupName: 'Book Club',
        inviterId: 'user-2' // Invited by Sargun
    }
];

export const mockMessages: ChatMessage[] = [
    {
        id: 'msg-1',
        text: 'Hey everyone! Excited for the Goa trip! 🌴',
        userId: 'user-2', // Sargun
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: 'msg-2',
        text: 'Me too! Can\'t wait. I\'ve already started packing.',
        userId: 'user-4', // Nimrat
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    },
    {
        id: 'msg-3',
        text: 'Welcome to SplitSync! This is the general chat room where you can talk to anyone on the platform.',
        userId: 'user-1', // Tanveer
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
];
