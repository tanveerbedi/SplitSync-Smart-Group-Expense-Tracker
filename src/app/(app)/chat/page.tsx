
'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendHorizonal, MessageSquare, Mic, Smile, Bot, User as UserIcon, Loader2, MoreVertical, Edit, Trash2, Paperclip, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage, User, expenseCategories } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import MentionPicker from '@/components/chat/mention-picker';
import { useToast } from '@/hooks/use-toast';
import { assistant } from '@/ai/flows/assistant';
import PrivateMessageDialog from '@/components/chat/private-message-dialog';
import { chatWithAssistant } from '@/ai/flows/chat-with-assistant';

const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EDIT_TIME_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

const ReactionPill = ({ reaction, messageId }: { reaction: { emoji: string; userIds: string[] }, messageId: string }) => {
    const { currentUser, users, toggleReaction } = useStore();
    if (!currentUser) return null;

    const hasReacted = reaction.userIds.includes(currentUser.id);
    const userNames = reaction.userIds.map(id => users.find(u => u.id === id)?.name || 'Someone').join(', ');

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    onClick={() => toggleReaction(messageId, reaction.emoji, currentUser.id)}
                    className={cn(
                        "rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border transition-colors",
                        hasReacted ? "bg-primary/20 border-primary" : "bg-muted border-transparent hover:border-border"
                    )}
                >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.userIds.length}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="p-2 text-sm w-auto">
                {userNames} reacted with {reaction.emoji}
            </PopoverContent>
        </Popover>
    )
}

const MessageItem = ({ message, isCurrentUser }: { message: ChatMessage, isCurrentUser: boolean }) => {
    const { users, currentUser, toggleReaction, deleteMessage, editMessage } = useStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text);
    const { toast } = useToast();

    if (message.userId === 'system' || message.userId === 'assistant') {
        return (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground my-2">
                <Bot className="h-4 w-4" />
                <p>{message.text}</p>
                 <p className="opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        )
    }

    const sender = users.find(u => u.id === message.userId);

    if (!sender || !currentUser) return null;

    const handleEditSave = () => {
        if (editText.trim() === message.text.trim()) {
            setIsEditing(false);
            return;
        }
        if (editText.trim() || message.imageUrl) {
            editMessage(message.id, editText.trim());
            setIsEditing(false);
        } else {
            toast({ title: "Message can't be empty", variant: "destructive" });
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditText(message.text);
        }
    }

    const highlightMentions = (text: string) => {
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        return text.split(mentionRegex).map((part, index) => {
            if (index % 3 === 1) { // This is the name part
                const mentionedId = text.match(mentionRegex)?.[Math.floor((index - 1) / 3)].replace(mentionRegex, '$2');
                return (
                    <span key={index} className={cn("font-semibold rounded px-1", mentionedId === currentUser.id ? "bg-primary/20 text-primary" : "bg-muted-foreground/20")}>
                        @{part}
                    </span>
                );
            }
            if(index % 3 === 2) return null; // This is the ID part, so we skip it
            return part;
        }).filter(Boolean);
    };

    const canEdit = new Date().getTime() - new Date(message.timestamp).getTime() < EDIT_TIME_LIMIT_MS;

    return (
        <div className={cn("flex items-start gap-3 group", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
             <PrivateMessageDialog recipient={sender} currentUser={currentUser}>
                <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={sender.avatarUrl} />
                    <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </PrivateMessageDialog>
            <div className={cn(
                "max-w-xs md:max-w-md rounded-lg px-4 py-2 relative", 
                isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                 <div className="absolute -top-3 h-6 w-6 rounded-full bg-background border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         style={isCurrentUser ? { right: '3rem' } : { left: '1rem' }}>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center justify-center w-full h-full">
                                <Smile className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-1 w-auto">
                            <div className="flex gap-1">
                                {availableReactions.map(emoji => (
                                    <button key={emoji} onClick={() => toggleReaction(message.id, emoji, currentUser.id)}
                                    className="text-lg p-1 rounded-md hover:bg-accent transition-colors">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                
                {isCurrentUser && (
                    <div className="absolute -top-3 h-6 w-6 rounded-full bg-background border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                         style={{ right: '1rem' }}>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center justify-center w-full h-full">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem disabled={!canEdit || !!message.imageUrl} onSelect={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete this message for everyone. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteMessage(message.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                         </DropdownMenu>
                    </div>
                )}

                <p className="font-semibold text-sm">{sender.name}</p>
                {isEditing ? (
                    <div className="mt-2">
                        <Input 
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-8 bg-background/80"
                        />
                         <div className="text-xs mt-1">
                            Press Esc to <button className="underline" onClick={() => setIsEditing(false)}>cancel</button> or Enter to <button className="underline" onClick={handleEditSave}>save</button>.
                        </div>
                    </div>
                ) : (
                    <>
                        {message.imageUrl && (
                             <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                                <Image 
                                    src={message.imageUrl} 
                                    alt="Shared image" 
                                    width={200}
                                    height={200}
                                    className="rounded-md object-cover w-full h-auto"
                                />
                             </a>
                        )}
                        {message.text && <p className="whitespace-pre-wrap mt-1">{highlightMentions(message.text)}</p>}
                    </>
                )}
                <div className={cn("text-xs opacity-70 mt-1 flex items-center", isCurrentUser ? "text-right" : "text-left")}>
                     {message.edited && <span className="mr-1">(edited)</span>}
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {message.reactions && message.reactions.length > 0 && (
                     <div className="absolute -bottom-3 flex gap-1" style={isCurrentUser ? { right: '0.5rem' } : { left: '0.5rem' }}>
                        {message.reactions.map(r => <ReactionPill key={r.emoji} reaction={r} messageId={message.id} />)}
                     </div>
                )}
            </div>
        </div>
    )
}

export default function ChatPage() {
    const { messages, addMessage, currentUser, users, groups, addExpense } = useStore();
    const [newMessage, setNewMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFileName, setImageFileName] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);
    
     useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setNewMessage(prev => prev + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                toast({
                    title: "Voice Error",
                    description: `Speech recognition service error: ${event.error}. Please check your connection or browser permissions.`,
                    variant: "destructive",
                });
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            }
        }
    }, [toast]);

    const handleVoiceCommand = () => {
        if (recognitionRef.current && !isListening) {
            recognitionRef.current.start();
            setIsListening(true);
        } else if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((newMessage.trim() === '' && !imagePreview) || !currentUser) return;
        
        const messageToSend = newMessage;
        addMessage({ text: messageToSend, userId: currentUser.id });
       

        setNewMessage('');
        setImagePreview(null);
        setImageFileName(null);

        if (messageToSend.startsWith('/')) {
            setIsThinking(true);
            try {
                const userGroups = groups.filter(g => g.members.some(m => m.id === currentUser.id));

                const result = await assistant({
                    message: messageToSend,
                    users: users.map(u => ({ id: u.id, name: u.name })),
                    groups: userGroups.map(g => ({ id: g.id, name: g.name })),
                    currentUserId: currentUser.id,
                });
                
                let assistantResponseText = '';

                if (result.toolCall) {
                    const { name, input } = result.toolCall;
                    if (name === 'addExpenseTool') {
                        const group = groups.find(g => g.id === input.groupId);
                        const paidBy = users.find(u => u.id === input.paidById);

                        if(group && paidBy) {
                            const splitAmount = input.amount / group.members.length;
                            const split = group.members.map((member: User) => ({
                                userId: member.id,
                                amount: splitAmount
                            }));

                            addExpense(input.groupId, {
                                description: input.description || 'General Expense',
                                amount: input.amount,
                                paidById: input.paidById,
                                paidOn: new Date(),
                                groupId: input.groupId,
                                category: expenseCategories.includes('Other') ? 'Other' : expenseCategories[0], 
                                split,
                            });
                             const descriptionText = input.description ? ` for "${input.description}"` : '';
                             assistantResponseText = `OK. I've added a ₹${input.amount} expense${descriptionText} to the "${group.name}" group. It was paid by ${paidBy.name}.`;
                        } else {
                             assistantResponseText = "Sorry, I couldn't find the group or user to add the expense.";
                        }
                    } else if (result.response) {
                        assistantResponseText = result.response;
                    } else if (result.toolCall) {
                        assistantResponseText = "I've processed that for you.";
                    }
                } else if (result.response && result.response.trim() !== '') {
                    assistantResponseText = result.response;
                } else {
                    // This is not a command, so treat it as a general chat question for the other AI
                    const chatResponse = await chatWithAssistant({
                        message: messageToSend,
                        currentUserName: currentUser.name,
                    });
                    assistantResponseText = chatResponse.response;
                }

                 if (assistantResponseText) {
                    addMessage({
                        text: assistantResponseText,
                        userId: 'assistant'
                    });
                }

            } catch (error) {
                console.error("AI assistant error:", error);
                addMessage({
                    text: "Sorry, I couldn't process that command.",
                    userId: 'assistant'
                });
            } finally {
                setIsThinking(false);
            }
        } else {
            const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
            const mentions = [...messageToSend.matchAll(mentionRegex)].map(match => match[2]);
            
            addMessage({
                text: messageToSend,
                userId: currentUser.id,
                mentions,
                imageUrl: imagePreview,
                imageFileName: imageFileName,
            });
        }
    }
    
    const handleUserMention = (user: User) => {
        setNewMessage(prev => {
            const lastAt = prev.lastIndexOf('@');
            const start = prev.substring(0, lastAt);
            return `${start}@[${user.name}](${user.id}) `;
        });
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    title: "Image too large",
                    description: "Please upload an image smaller than 2MB.",
                    variant: "destructive"
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setImageFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <header className="mb-2">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <MessageSquare className="h-8 w-8" />
                    Chat Room
                </h1>
                <p className="text-muted-foreground">A place to chat with everyone on SplitSync.</p>
            </header>
            
            <div 
              className="flex-1 flex flex-col bg-card border rounded-lg overflow-hidden relative"
            >
                <div 
                    className="absolute inset-0 w-full h-full bg-muted/20 opacity-40 dark:opacity-20"
                    style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.12\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        backgroundSize: '40px 40px',
                    }}
                />
                <ScrollArea className="flex-1 p-6 z-10" ref={scrollAreaRef}>
                    <div className="space-y-8">
                        {messages.map(message => (
                            <MessageItem key={message.id} message={message} isCurrentUser={currentUser.id === message.userId} />
                        ))}
                         {isThinking && (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="bg-muted px-4 py-2 rounded-lg flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Assistant is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 bg-background border-t z-10">
                     {imagePreview && (
                        <div className="relative mb-2 p-2 border rounded-lg max-w-xs">
                            <Image src={imagePreview} alt="Image preview" width={80} height={80} className="rounded-md" />
                            <p className="text-xs text-muted-foreground truncate mt-1">{imageFileName}</p>
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setImagePreview(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <Button type="button" size="icon" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={currentUser.avatarUrl} />
                            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="relative flex-1">
                             <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message or command..."
                                autoComplete="off"
                                disabled={isThinking}
                            />
                            <MentionPicker 
                                query={newMessage}
                                onSelect={handleUserMention}
                            />
                        </div>
                        {recognitionRef.current && (
                            <Button type="button" size="icon" variant={isListening ? 'destructive' : 'outline'} onClick={handleVoiceCommand} disabled={isThinking}>
                                <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
                            </Button>
                        )}
                        <Button type="submit" size="icon" disabled={isThinking || (!newMessage.trim() && !imagePreview)}>
                            <SendHorizonal className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}
