
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot } from "lucide-react";

export default function AiSuggestionCardSkeleton() {
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <Skeleton className="h-10 w-36 mt-4" />
            </CardContent>
        </Card>
    );
}
