'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import {
  Send, Bot, User, Sparkles, Trash2,
  Loader2, Dumbbell, Apple, Brain, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickPrompts = [
  { icon: <Dumbbell className="h-4 w-4" />, text: 'Create a 4-week workout plan for beginners', category: 'workout' },
  { icon: <Apple className="h-4 w-4" />, text: 'What should I eat before and after a workout?', category: 'nutrition' },
  { icon: <Brain className="h-4 w-4" />, text: 'How to stay motivated on tough days?', category: 'motivation' },
  { icon: <Heart className="h-4 w-4" />, text: 'Best exercises for lower back pain relief', category: 'advice' },
];

export function AICoachPage() {
  const { userWeight, userHeight, userGoal, userLevel } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey! 👋 I'm your AI Fitness Coach. I'm here to help you with:\n\n• **Personalized workout plans** tailored to your goals\n• **Nutrition advice** for optimal performance\n• **Training tips** and form guidance\n• **Motivation** to keep you going\n\nBased on your profile, I can see you're at an **${userLevel}** level with a goal to **${userGoal.replace('_', ' ')}**. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
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
- Use markdown formatting for better readability
- Keep responses concise (3-5 paragraphs max)
- When giving workouts, specify sets, reps, and rest times
- When giving nutrition advice, mention macros when relevant
- Add relevant emojis to make it engaging
- Always include a brief motivational note`;
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

      if (data.success) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I\'m having trouble connecting right now. Please try again in a moment. In the meantime, feel free to explore our workout library!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Chat cleared! 🔄 I'm ready for new questions. How can I help you with your fitness journey?`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col">
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 flex flex-col flex-1">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              AI <span className="gradient-text">Coach</span>
            </h1>
            <p className="text-muted-foreground mt-1 ml-[52px]">
              Your personal fitness advisor
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="rounded-xl"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col mb-4 min-h-0 border-border/50">
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
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words [&>strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mt-1">
                        {msg.content}
                      </div>
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 items-start"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 sm:px-6 pb-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors"
                  >
                    {prompt.icon}
                    {prompt.text.length > 40 ? prompt.text.slice(0, 40) + '...' : prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask your AI Coach anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="h-12 rounded-xl bg-card flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl shrink-0 neon-glow"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
