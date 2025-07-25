
'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import type { User } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MentionPickerProps {
    query: string;
    onSelect: (user: User) => void;
}

export default function MentionPicker({ query, onSelect }: MentionPickerProps) {
    const { users, currentUser } = useStore();
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [active, setActive] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const lastAt = query.lastIndexOf('@');
        if (lastAt === -1 || query.endsWith(' ')) {
            setActive(false);
            return;
        }

        const mentionQuery = query.substring(lastAt + 1).toLowerCase();
        
        if (mentionQuery.includes(']')) { // Don't show if mention is already completed
            setActive(false);
            return;
        }
        
        setActive(true);

        const filteredUsers = users.filter(u => 
            u.id !== currentUser?.id &&
            u.name.toLowerCase().startsWith(mentionQuery)
        );

        setSuggestions(filteredUsers);
        setActiveIndex(0);

    }, [query, users, currentUser]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!active || suggestions.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                onSelect(suggestions[activeIndex]);
                setActive(false);
            } else if (e.key === 'Escape') {
                setActive(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [active, suggestions, activeIndex, onSelect]);
    
    if (!active || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="absolute bottom-full mb-1 w-full max-w-sm bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
            {suggestions.map((user, index) => (
                <div
                    key={user.id}
                    onClick={() => onSelect(user)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                        "flex items-center gap-2 p-2 cursor-pointer hover:bg-accent",
                        index === activeIndex && "bg-accent"
                    )}
                >
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{user.name}</span>
                </div>
            ))}
        </div>
    );
}
