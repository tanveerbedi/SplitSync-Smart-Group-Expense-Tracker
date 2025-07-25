
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mockBadges, mockGroups, mockUsers, mockNotifications, mockInvitations, mockUserBadges, badgeIconMap, mockMessages } from './mock-data';
import type { Group, Expense, User, Payment, Notification, Invitation, Badge, ChatMessage, Reaction } from '@/types';
import { sendNotificationEmail } from '@/ai/flows/send-notification-email';
import { sendBadgeEmail } from '@/ai/flows/send-badge-email';

interface StoreState {
  groups: Group[];
  users: User[];
  currentUser: User | null;
  notifications: Notification[];
  invitations: Invitation[];
  userBadges: Badge[];
  messages: ChatMessage[];
  setCurrentUser: (user: User | null) => void;
  addUser: (user: Omit<User, 'id' | 'avatarUrl'>) => User;
  updateUserProfile: (userId: string, data: Partial<Pick<User, 'name' | 'email' | 'avatarUrl'>>) => void;
  addExpense: (groupId: string, expense: Omit<Expense, 'id'>) => void;
  updateExpense: (groupId: string, expense: Expense) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  addGroup: (group: Group) => void;
  updateGroupDetails: (groupId: string, details: Partial<Pick<Group, 'name' | 'imageUrl'>>) => void;
  addMembersToGroup: (groupId: string, newMembers: User[]) => void;
  removeMemberFromGroup: (groupId: string, userId: string) => void;
  deleteGroup: (groupId: string) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
  addPayment: (groupId: string, payment: Omit<Payment, 'id'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  addInvitation: (invitation: Omit<Invitation, 'id'>) => void;
  acceptInvitation: (invitationId: string, userId: string) => void;
  declineInvitation: (invitationId: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  toggleReaction: (messageId: string, emoji: string, userId: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
}

const _addBadgeToUser = (badgeId: string) => {
    const { userBadges, addNotification, currentUser } = useStore.getState();
    const hasBadge = userBadges.some(b => b.id === badgeId);
    if (!hasBadge) {
        const badge = mockBadges.find(b => b.id === badgeId);
        if (badge && currentUser) {
            useStore.setState(state => ({
                userBadges: [...state.userBadges, badge]
            }));
             addNotification({ message: `You've earned the "${badge.title}" badge!`, type: 'badge' });
             sendBadgeEmail({
                userName: currentUser.name,
                badgeName: badge.title,
                badgeDescription: badge.description,
             }).catch(err => {
                console.error("Failed to send badge email:", err);
             });
        }
    }
};

const _checkAndAwardBadges = (userId: string) => {
    const { groups, userBadges } = useStore.getState();
    const expensesPaidByUser = groups.flatMap(g => g.expenses).filter(e => e.paidById === userId);
    const userGroups = groups.filter(g => g.members.some(m => m.id === userId));
    const travelGroups = userGroups.filter(g => g.name.toLowerCase().includes('trip') || g.name.toLowerCase().includes('vacation')).length;
    const currentBadgeIds = new Set(userBadges.map(b => b.id));

    // First Timer
    if (expensesPaidByUser.length >= 1 && !currentBadgeIds.has('badge-6')) {
      _addBadgeToUser('badge-6');
    }

    // Expense Addict
    if (expensesPaidByUser.length >= 5 && !currentBadgeIds.has('badge-3')) {
        _addBadgeToUser('badge-3');
    }

    // Socialite
    if (userGroups.length >= 3 && !currentBadgeIds.has('badge-7')) {
        _addBadgeToUser('badge-7');
    }
    
    // Frequent Flyer
    if (travelGroups >= 2 && !currentBadgeIds.has('badge-5')) { // Lowered for demo
        _addBadgeToUser('badge-5');
    }

    // Most Generous - this one is tricky, would need to compare to others in a group.
    // We'll award it to the top payer when analytics are viewed for simplicity.
    // Or, when a payment is made. Let's do it on payment.

    // Quick Settler - awarded when a payment is made.
};


export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      groups: mockGroups,
      users: mockUsers,
      currentUser: null,
      notifications: mockNotifications,
      invitations: mockInvitations,
      userBadges: mockUserBadges,
      messages: mockMessages,
      setCurrentUser: (user) => set({ currentUser: user }),
      addUser: (user) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: user.name,
            email: user.email,
            password: user.password,
            avatarUrl: `https://placehold.co/400x400.png`
        };
        set((state) => ({ 
            users: [...state.users, newUser],
            userBadges: [], // Reset badges for new user
        }));
        
        get().addMessage({
            userId: 'system',
            text: `${newUser.name} just signed up. Welcome!`,
        });
        return newUser;
      },
      updateUserProfile: (userId, data) => 
        set((state) => {
           const newUsers = state.users.map(u => 
            u.id === userId ? { ...u, ...data } : u
          );
          let newCurrentUser = state.currentUser;
          if (newCurrentUser && newCurrentUser.id === userId) {
             newCurrentUser = { ...newCurrentUser, ...data };
             localStorage.setItem('splitsync-user', JSON.stringify(newCurrentUser));
          }
          
          const newGroups = state.groups.map(g => ({
              ...g,
              members: g.members.map(m => m.id === userId ? { ...m, ...data } : m)
          }));

          return { users: newUsers, currentUser: newCurrentUser, groups: newGroups };
        }),
      addExpense: (groupId, expense) => {
        const group = get().groups.find(g => g.id === groupId);
        const payingUser = get().users.find(u => u.id === expense.paidById);
        if (group && payingUser) {
            const inAppMessage = `${payingUser.name} added a new expense "${expense.description}" to ${group.name}.`;
            get().addMessage({
                userId: 'system',
                text: inAppMessage
            });
            get().addNotification({
                message: inAppMessage,
                type: 'message',
                groupId: groupId
            });

            const emailMessage = `A new expense has been logged in the group "${group.name}":
            <br><br>
            <strong>Description:</strong> ${expense.description}<br>
            <strong>Amount:</strong> ₹${(expense as any).amount.toFixed(2)}<br>
            <strong>Paid by:</strong> ${payingUser.name}`;

            sendNotificationEmail({ message: emailMessage, recipientEmail: "tanveer904.be22@chitkara.edu.in" }).catch(err => {
              console.error("Failed to send new expense email:", err);
            });
        }
        set((state) => {
          const newGroups = state.groups.map((group) => {
            if (group.id === groupId) {
              const newExpenseWithDate = {
                  ...expense,
                  id: `exp-${Date.now()}`,
                  paidOn: new Date(expense.paidOn),
              };
              return {
                ...group,
                expenses: [...group.expenses, newExpenseWithDate],
              };
            }
            return group;
          });
          return { groups: newGroups };
        });
        if(payingUser){
            _checkAndAwardBadges(payingUser.id);
        }
      },
      updateExpense: (groupId, updatedExpense) =>
        set((state) => ({
            groups: state.groups.map(g => {
                if (g.id === groupId) {
                    const expenseWithDate = {
                        ...updatedExpense,
                        paidOn: new Date(updatedExpense.paidOn),
                    }
                    return {
                        ...g,
                        expenses: g.expenses.map(e => e.id === updatedExpense.id ? expenseWithDate : e)
                    }
                }
                return g;
            })
        })),
      deleteExpense: (groupId, expenseId) =>
        set((state) => ({
            groups: state.groups.map(g => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        expenses: g.expenses.filter(e => e.id !== expenseId)
                    }
                }
                return g;
            })
        })),
      addGroup: (group) => {
        set((state) => ({
            groups: [...state.groups, group]
        }));
        get().addNotification({
            message: `You created the group "${group.name}".`,
            type: 'message',
            groupId: group.id,
        });
         _addBadgeToUser('badge-4'); // Group Starter badge
      },
      updateGroupDetails: (groupId, details) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, ...details } : group
          ),
        })),
      addMembersToGroup: (groupId, newMembers) => {
        const group = get().groups.find(g => g.id === groupId);
        if (!group) return;

        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id === groupId) {
              const existingMemberIds = new Set(g.members.map(m => m.id));
              const trulyNewMembers = newMembers.filter(nm => !existingMemberIds.has(nm.id));
              if (trulyNewMembers.length > 0) {
                const currentUser = get().currentUser;
                const inviterName = currentUser ? currentUser.name : "Someone";
                const message = `${inviterName} invited ${trulyNewMembers.map(m => m.name).join(', ')} to join "${g.name}".`;
                get().addNotification({
                    message: message,
                    type: 'message',
                    groupId: g.id,
                });
                get().addMessage({ userId: 'system', text: message });
              }
              return {
                ...g,
                members: [...g.members, ...trulyNewMembers],
              };
            }
            return g;
          }),
        }));
      },
      removeMemberFromGroup: (groupId, userId) => {
        const group = get().groups.find(g => g.id === groupId);
        const member = group?.members.find(m => m.id === userId);

        if (group && member) {
            const message = `${member.name} has been removed from "${group.name}".`;
            get().addNotification({
                message: message,
                type: 'message',
                groupId: group.id,
            });
            get().addMessage({ userId: 'system', text: message });
        }
        
        set((state) => ({
          groups: state.groups.map(g => {
            if (g.id === groupId) {
              // This logic is simplified. In a real app, you'd need to rebalance expenses.
              // For this prototype, we just remove the user and their splits.
              const updatedExpenses = g.expenses.map(exp => ({
                  ...exp,
                  split: exp.split.filter(s => s.userId !== userId)
              })).filter(exp => exp.paidById !== userId); // Also remove expenses they paid for

              return { 
                  ...g, 
                  members: g.members.filter(m => m.id !== userId),
                  expenses: updatedExpenses,
              };
            }
            return g;
          }).filter(g => {
              if(g.id === groupId && userId === get().currentUser?.id) {
                  return false;
              }
              return true;
          })
        }));
      },
      deleteGroup: (groupId) => {
        const group = get().groups.find(g => g.id === groupId);
        if (group) {
            const message = `The group "${group.name}" has been permanently deleted.`;
            get().addNotification({
                message: message,
                type: 'message',
            });
             get().addMessage({ userId: 'system', text: message });
        }
        set((state) => ({
          groups: state.groups.filter(g => g.id !== groupId)
        }));
      },
      updateUserPassword: (userId, newPassword) => 
        set((state) => {
          const newUsers = state.users.map(u => 
            u.id === userId ? { ...u, password: newPassword } : u
          );
          const newCurrentUser = state.currentUser && state.currentUser.id === userId
            ? { ...state.currentUser, password: newPassword }
            : state.currentUser;
          
          return { users: newUsers, currentUser: newCurrentUser };
        }),
       addPayment: (groupId, payment) => {
        const fromUser = get().users.find(u => u.id === payment.fromUserId);
        const toUser = get().users.find(u => u.id === payment.toUserId);
        const group = get().groups.find(g => g.id === groupId);

        if (fromUser && toUser && group) {
            const message = `${fromUser.name} paid ₹${payment.amount.toFixed(2)} to ${toUser.name} in "${group.name}".`;
            get().addMessage({ userId: 'system', text: message });
        }
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              const newPayment: Payment = {
                ...payment,
                id: `pay-${Date.now()}`,
              };
              return { ...group, payments: [...group.payments, newPayment] };
            }
            return group;
          }),
        }));
        if (fromUser) {
            _checkAndAwardBadges(fromUser.id);
            _addBadgeToUser('badge-2'); // Quick Settler
        }
       },
      addNotification: (notification) => {
        set((state) => {
            const newNotification: Notification = {
                ...notification,
                id: `notif-${Date.now()}`,
                timestamp: new Date(),
                read: false,
            };
            
            return { notifications: [newNotification, ...state.notifications] };
        });
      },
      addInvitation: (invitation) => {
        set((state) => {
            const newInvitation: Invitation = {
                ...invitation,
                id: `inv-${Date.now()}`,
            };

            const existingInvite = state.invitations.find(i => i.email.toLowerCase() === newInvitation.email.toLowerCase() && i.groupId === newInvitation.groupId);
            if (existingInvite) {
                return {};
            }

            const inviter = state.users.find(u => u.id === newInvitation.inviterId);
            const userIsBeingInvited = newInvitation.email.toLowerCase() === state.currentUser?.email.toLowerCase();

            if (!userIsBeingInvited) {
                 const message = `${inviter?.name || 'Someone'} invited a new member to "${invitation.groupName}".`;
                 get().addNotification({
                    message,
                    type: 'message',
                    groupId: invitation.groupId,
                });
                get().addMessage({ userId: 'system', text: message });
            }

            return { invitations: [...state.invitations, newInvitation] };
        });
      },
      acceptInvitation: (invitationId, userId) => {
        const { invitations, users } = get();
        const invitation = invitations.find(i => i.id === invitationId);
        const user = users.find(u => u.id === userId);

        if (invitation && user) {
            get().addMembersToGroup(invitation.groupId, [user]);
            const message = `${user.name} accepted the invitation to join "${invitation.groupName}".`;
            get().addNotification({
                message,
                type: 'message',
                groupId: invitation.groupId
            });
            get().addMessage({ userId: 'system', text: message });
            set({ invitations: get().invitations.filter(i => i.id !== invitationId) });
            _checkAndAwardBadges(userId);
        }
      },
      declineInvitation: (invitationId) => {
        set({ invitations: get().invitations.filter(i => i.id !== invitationId) });
      },
      addMessage: (message) => {
        const newMessage: ChatMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };

        set((state) => ({ messages: [...state.messages, newMessage] }));
        
        // Handle mentions
        if (message.mentions && message.mentions.length > 0) {
            const { users, currentUser } = get();
            message.mentions.forEach(mentionedId => {
                if (mentionedId !== currentUser?.id) {
                    const mentionedUser = users.find(u => u.id === mentionedId);
                    if (mentionedUser) {
                        const inAppMessage = `${currentUser?.name || 'Someone'} mentioned you in the Chat Room.`;
                        get().addNotification({
                            message: inAppMessage,
                            type: 'message',
                        });
                        
                        const emailMessage = `You were mentioned in the SplitSync Chat Room by ${currentUser?.name || 'Someone'}:<br><br><i>"${message.text}"</i>`;
                        sendNotificationEmail({ 
                            message: emailMessage,
                            recipientEmail: "tanveer904.be22@chitkara.edu.in", // Hardcoded as per request
                            subject: `New mention from ${currentUser?.name || 'Someone'}`
                        }).catch(err => {
                            console.error("Failed to send mention email:", err);
                        });
                    }
                }
            });
        }
      },
      toggleReaction: (messageId, emoji, userId) => {
        set((state) => ({
            messages: state.messages.map(msg => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions ? [...msg.reactions] : [];
                    let reaction = reactions.find(r => r.emoji === emoji);

                    if (reaction) {
                        // User has already reacted with this emoji, so remove their reaction
                        if (reaction.userIds.includes(userId)) {
                            reaction.userIds = reaction.userIds.filter(id => id !== userId);
                            // If no one is left reacting with this emoji, remove the emoji itself
                            if (reaction.userIds.length === 0) {
                                return {
                                    ...msg,
                                    reactions: reactions.filter(r => r.emoji !== emoji)
                                };
                            }
                        } else {
                            // User is adding their reaction
                            reaction.userIds.push(userId);
                        }
                    } else {
                        // First reaction of this type for this message
                        reaction = { emoji, userIds: [userId] };
                        reactions.push(reaction);
                    }
                    return { ...msg, reactions };
                }
                return msg;
            })
        }));
      },
       editMessage: (messageId, newText) => {
        set((state) => ({
            messages: state.messages.map(msg => 
                msg.id === messageId 
                ? { ...msg, text: newText, edited: true } 
                : msg
            )
        }));
      },
      deleteMessage: (messageId) => {
        set((state) => ({
            messages: state.messages.filter(msg => msg.id !== messageId)
        }));
      },
    }),
    {
      name: 'splitsync-storage-v5', 
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
            console.error("An error occurred during storage rehydration", error);
            return;
        }

        if (state) {
            if (state.currentUser) {
              const userFromStorage = localStorage.getItem('splitsync-user');
              if (userFromStorage) {
                state.currentUser = JSON.parse(userFromStorage);
              }
            }
            state.groups.forEach(group => {
                group.createdAt = new Date(group.createdAt);
                group.expenses.forEach(exp => {
                    if (typeof exp.paidOn === 'string') {
                        exp.paidOn = new Date(exp.paidOn)
                    }
                });
                group.payments.forEach(p => {
                    if (typeof p.paidOn === 'string') {
                       p.paidOn = new Date(p.paidOn)
                    }
                });
            });
            state.notifications.forEach(notif => {
                if (typeof notif.timestamp === 'string') {
                    notif.timestamp = new Date(notif.timestamp);
                }
            });
            if (state.messages) {
              state.messages.forEach(msg => {
                  if (typeof msg.timestamp === 'string') {
                      msg.timestamp = new Date(msg.timestamp);
                  }
              });
            }
        }
      },
    }
  )
);
