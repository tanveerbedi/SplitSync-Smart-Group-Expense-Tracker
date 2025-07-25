
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LifeBuoy, Bot, User, SendHorizonal, Loader2, Volume2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { assistant } from '@/ai/flows/assistant';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type HelpMessage = {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    audioUrl?: string;
    isLoadingAudio?: boolean;
}

interface AiHelpDialogProps {
  children?: React.ReactNode;
  floating?: boolean;
}

export default function AiHelpDialog({ children, floating = false }: AiHelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && messages.length === 0) {
        setMessages([{ id: 'init', text: "Hello! I'm the SplitSync AI assistant. How can I help you today? You can ask me about the app's features, pricing, or how to get started.", sender: 'assistant' }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: HelpMessage = { id: `user-${Date.now()}`, text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
        const result = await assistant({
            message: input,
            // Provide a simplified context since there is no logged-in user
            users: [],
            groups: [],
            currentUserId: 'public-user',
        });
        
        const assistantMessage: HelpMessage = { 
            id: `asst-${Date.now()}`, 
            text: result.response, 
            sender: 'assistant',
            isLoadingAudio: true,
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Fetch audio in the background
        const audioResult = await textToSpeech({ text: result.response });
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, audioUrl: audioResult.audioDataUri, isLoadingAudio: false } : m));

    } catch (error) {
        console.error("AI assistant error:", error);
        const errorMessage: HelpMessage = { id: `err-${Date.now()}`, text: "Sorry, I'm having trouble connecting. Please try again later.", sender: 'assistant' };
        setMessages(prev => [...prev, errorMessage]);
        toast({ title: 'Assistant Error', description: 'Could not get a response.', variant: 'destructive' });
    } finally {
        setIsThinking(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }
  };

  const trigger = children ?? (
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(floating && "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center")}
                      >
                        <LifeBuoy className="h-7 w-7" />
                        <span className="sr-only">Need Help?</span>
                      </Button>
                  </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                  <p>Need Help?</p>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <DialogContent className="sm:max-w-md p-0 flex flex-col h-[70vh] max-h-[600px]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-primary" />
            AI Assistant
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === 'user' && 'flex-row-reverse')}>
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0", msg.sender === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                {msg.sender === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                            </div>
                            <div className={cn("rounded-lg px-4 py-2 max-w-xs relative", msg.sender === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.sender === 'assistant' && (
                                    <div className="absolute top-1 -right-10">
                                        {msg.isLoadingAudio ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : msg.audioUrl ? (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => playAudio(msg.audioUrl!)}>
                                                <Volume2 className="h-4 w-4" />
                                            </Button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex items-start gap-3">
                             <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
                                <Bot size={20} />
                            </div>
                            <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input 
                placeholder="Ask a question..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isThinking && handleSend()}
                disabled={isThinking}
            />
            <Button size="icon" onClick={handleSend} disabled={isThinking}>
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <audio ref={audioRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
