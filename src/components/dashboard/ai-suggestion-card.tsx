'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, PlusCircle, X } from "lucide-react";

type AiSuggestionCardProps = {
    reason: string;
    onDismiss: () => void;
    onCreateGroup: () => void;
};

export default function AiSuggestionCard({ reason, onDismiss, onCreateGroup }: AiSuggestionCardProps) {
    return (
        <Card className="bg-primary/5 border-primary/20 relative animate-in fade-in-50 slide-in-from-top-5 duration-500">
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7"
                onClick={onDismiss}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss suggestion</span>
            </Button>
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-lg">Smart Suggestion</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-balance mb-4">{reason}</p>
                <Button onClick={onCreateGroup}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Group
                </Button>
            </CardContent>
        </Card>
    );
}
