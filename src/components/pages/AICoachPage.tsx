'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Apple,
  Bot,
  Brain,
  CalendarCheck,
  Dumbbell,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
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
  { icon: <Dumbbell className="h-4 w-4" />, text: 'Build my next 7-day training plan with sets, reps, and rest' },
  { icon: <Apple className="h-4 w-4" />, text: 'Create a simple meal plan for my current goal' },
  { icon: <Brain className="h-4 w-4" />, text: 'Review my progress and tell me what to improve this week' },
  { icon: <Heart className="h-4 w-4" />, text: 'Help me train around lower back pain safely' },
];

const coachModes = [
  { id: 'plan', label: 'Plan', icon: CalendarCheck, prompt: 'Act as a training planner. Give a structured weekly plan with progression.' },
  { id: 'form', label: 'Form', icon: Target, prompt: 'Act as a form coach. Give cues, mistakes, regressions, and safety checks.' },
  { id: 'food', label: 'Food', icon: Apple, prompt: 'Act as a nutrition coach. Give calories, macros, timing, and simple meals.' },
  { id: 'boost', label: 'Boost', icon: Zap, prompt: 'Act as a motivation coach. Be direct, practical, and action-focused.' },
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
  const { userWeight, userHeight, userGoal, userLevel, weeklyGoal, workoutLogs } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage(userLevel, userGoal)]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState(coachModes[0]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContextPrompt = () => {
    const completedLogs = workoutLogs.filter((log) => log.completed);
    const recentLogs = workoutLogs.slice(0, 6).map((log) => {
      const exercises = log.exercises.map((exercise) => exercise.exerciseName).join(', ');
      return `${log.date}: ${log.name}, ${log.duration}min, ${exercises || 'training'}, completed: ${Boolean(log.completed)}`;
    });

    return `You are Prime Forge AI Coach, a knowledgeable and encouraging personal fitness trainer and nutrition expert.
User Profile:
- Weight: ${userWeight}kg, Height: ${userHeight}cm
- Fitness Level: ${userLevel}
- Goal: ${userGoal.replace('_', ' ')}
- Weekly training goal: ${weeklyGoal} sessions
- Logged workouts: ${workoutLogs.length} total, ${completedLogs.length} completed
- Recent workout history: ${recentLogs.length ? recentLogs.join(' | ') : 'No workouts logged yet'}
- Active coaching mode: ${mode.label}. ${mode.prompt}

Guidelines:
- Be encouraging but honest and science-based
- Give specific, actionable advice
- Use markdown formatting for readability
- Start with a clear recommendation, then give steps
- Keep responses practical and skimmable
- When giving workouts, specify sets, reps, and rest times
- When giving nutrition advice, mention macros when relevant
- When pain, injury, illness, or medical symptoms are mentioned, recommend professional care and avoid diagnosis
- End with one simple action for the next 24 hours`;
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
    <div className="flex min-h-screen flex-col pb-28 pt-24 lg:pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Sparkles className="h-3 w-3" />
              Smarter personal coaching
            </Badge>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </span>
              AI <span className="gradient-text">Coach</span>
            </h1>
            <p className="ml-[52px] mt-1 max-w-2xl text-muted-foreground">
              Plans, form checks, food strategy, weekly reviews, and motivation based on your profile.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
            {coachModes.map((coachMode) => (
              <button
                key={coachMode.id}
                onClick={() => setMode(coachMode)}
                className={cn(
                  'flex min-h-12 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold uppercase transition-colors',
                  mode.id === coachMode.id
                    ? 'border-primary/50 bg-primary text-primary-foreground'
                    : 'border-border/60 bg-card hover:border-primary/40 hover:text-primary'
                )}
              >
                <coachMode.icon className="h-4 w-4" />
                {coachMode.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="hidden space-y-4 lg:block">
            <Card className="border-border/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase">
                <MessageCircle className="h-4 w-4 text-primary" />
                Coach Memory
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><span className="font-semibold text-foreground">Goal:</span> {userGoal.replace('_', ' ')}</p>
                <p><span className="font-semibold text-foreground">Level:</span> {userLevel}</p>
                <p><span className="font-semibold text-foreground">Workouts:</span> {workoutLogs.length} logged</p>
                <p><span className="font-semibold text-foreground">Weekly target:</span> {weeklyGoal} sessions</p>
              </div>
            </Card>
            <Card className="border-border/50 p-4">
              <div className="mb-3 text-sm font-black uppercase">Ask Faster</div>
              <div className="space-y-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSend(prompt.text)}
                    className="flex w-full items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-left text-xs leading-5 transition-colors hover:border-primary/40 hover:bg-primary/10"
                  >
                    <span className="mt-0.5 text-primary">{prompt.icon}</span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

        <Card className="flex min-h-[620px] flex-1 flex-col border-border/50">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-black uppercase">Prime Coach</p>
                <p className="text-xs text-muted-foreground">{mode.label} mode active</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl" title="Clear chat">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
                        'max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%]',
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
        </div>

        <div className="hidden gap-2 lg:flex">
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

      <div className="fixed inset-x-0 bottom-[5.2rem] z-40 border-t border-border/70 bg-background/95 px-4 py-3 shadow-[0_-14px_38px_oklch(0_0_0_/_0.32)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <Input
            placeholder={`Ask Coach in ${mode.label} mode...`}
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
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
