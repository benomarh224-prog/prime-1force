'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Apple, Bot, Brain, Dumbbell, Heart, Loader2, Send, Sparkles, Trash2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickPrompts = [
  { icon: <Dumbbell className="h-4 w-4" />, text: 'Create a 4-week workout plan for beginners' },
  { icon: <Apple className="h-4 w-4" />, text: 'What should I eat before and after a workout?' },
  { icon: <Brain className="h-4 w-4" />, text: 'How do I stay motivated on tough days?' },
  { icon: <Heart className="h-4 w-4" />, text: 'Best exercises for lower back pain relief' },
];

function createWelcomeMessage(level: string, goal: string): Message {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hey, I'm your Prime Forge coach. I can help with personalized workout plans, nutrition advice, training tips, form guidance, and motivation.\n\nBased on your profile, you are at an **${level}** level with a goal to **${goal.replace('_', ' ')}**. How can I help you today?`,
    timestamp: new Date(),
  };
}

export function AICoachPage() {
  const { userWeight, userHeight, userGoal, userLevel } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage(userLevel, userGoal)]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContextPrompt = () => {
    return `You are Prime Forge AI Coach, a knowledgeable and encouraging personal fitness trainer and nutrition expert.
User Profile:
- Weight: ${userWeight}kg, Height: ${userHeight}cm
- Fitness Level: ${userLevel}
- Goal: ${userGoal.replace('_', ' ')}

Guidelines:
- Be encouraging but honest and science-based
- Give specific, actionable advice
- Use markdown formatting for readability
- Keep responses concise
- When giving workouts, specify sets, reps, and rest times
- When giving nutrition advice, mention macros when relevant
- Include a brief motivational note`;
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'assistant', content: buildContextPrompt() },
            ...messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
          ],
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to get response');

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I am having trouble connecting right now. Try again in a moment, or ask for a basic plan and I will help with a local coaching response.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chat cleared. I am ready for a new fitness question.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 pt-24">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Sparkles className="h-3 w-3" />
              Personal coaching
            </Badge>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </span>
              AI <span className="gradient-text">Coach</span>
            </h1>
            <p className="ml-[52px] mt-1 text-muted-foreground">Workout, nutrition, and motivation support</p>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl" title="Clear chat">
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>

        <Card className="mb-4 flex min-h-0 flex-1 flex-col border-border/50">
          <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-muted'
                      )}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-4">{children}</ul>,
                          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-4">{children}</ol>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {messages.length <= 2 && (
            <div className="px-4 pb-3 sm:px-6">
              <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Quick suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10"
                  >
                    {prompt.icon}
                    {prompt.text.length > 40 ? `${prompt.text.slice(0, 40)}...` : prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI Coach anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="h-12 flex-1 rounded-xl bg-card"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 shrink-0 rounded-xl neon-glow"
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
