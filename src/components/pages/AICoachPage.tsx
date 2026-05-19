'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Apple,
  Bot,
  Brain,
  CalendarCheck,
  Camera,
  Dumbbell,
  FileVideo,
  Heart,
  ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
  Upload,
  Volume2,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type MediaAttachment = {
  name: string;
  type: string;
  size: number;
  previewUrl: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

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
  const [media, setMedia] = useState<MediaAttachment | null>(null);
  const [coachMemory, setCoachMemory] = useState('');
  const [memoryDraft, setMemoryDraft] = useState('');
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedMemory = window.localStorage.getItem('prime-forge-coach-memory') || '';
    setCoachMemory(savedMemory);
    setMemoryDraft(savedMemory);
  }, []);

  useEffect(() => {
    return () => {
      if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
    };
  }, [media]);

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
- Saved coach memory: ${coachMemory || 'No extra notes saved yet'}

Guidelines:
- Be encouraging but honest and science-based
- Give specific, actionable advice
- Use markdown formatting for readability
- Start with a clear recommendation, then give steps
- Keep responses practical and skimmable
- When giving workouts, specify sets, reps, and rest times
- When giving nutrition advice, mention macros when relevant
- If the user uploads image or video context, provide careful form feedback, likely issues, safety cues, and ask for missing visual details instead of pretending certainty
- When pain, injury, illness, or medical symptoms are mentioned, recommend professional care and avoid diagnosis
- End with one simple action for the next 24 hours`;
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl);
    setMedia({
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      previewUrl: URL.createObjectURL(file),
    });
    setMode(coachModes.find((coachMode) => coachMode.id === 'form') || coachModes[0]);
  };

  const buildMediaPrompt = (attachment: MediaAttachment) => {
    const kind = attachment.type.startsWith('video') ? 'short training video' : 'training image';
    return `\n\nUploaded ${kind}: ${attachment.name} (${Math.round(attachment.size / 1024)}KB). Analyze my exercise performance from this media context. Give form cues, likely mistakes to check, safety notes, and one next-rep correction. If you need more visual detail, ask for the exact angle, exercise, and rep count.`;
  };

  const saveMemory = () => {
    const nextMemory = memoryDraft.trim();
    setCoachMemory(nextMemory);
    window.localStorage.setItem('prime-forge-coach-memory', nextMemory);
  };

  const startVoiceInput = () => {
    const recognitionConstructor = (window as typeof window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    }).SpeechRecognition || (window as typeof window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }).webkitSpeechRecognition;

    if (!recognitionConstructor) {
      setInput((value) => value || 'Voice input is not available in this browser.');
      return;
    }

    const recognition = new recognitionConstructor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput((value) => `${value ? `${value} ` : ''}${transcript}`);
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const speakLastCoachMessage = () => {
    const lastCoachMessage = [...messages].reverse().find((message) => message.role === 'assistant');
    if (!lastCoachMessage || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastCoachMessage.content.replace(/[#*_`>-]/g, ' '));
    utterance.rate = 0.95;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (text?: string) => {
    const message = `${text || input.trim()}${media ? buildMediaPrompt(media) : ''}`.trim();
    if (!message || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (media) {
      URL.revokeObjectURL(media.previewUrl);
      setMedia(null);
    }
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
    <div className="flex min-h-screen flex-col pb-48 pt-24 lg:pb-16">
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
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:ml-[52px] sm:text-base">
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

        <Card className="mb-4 border-border/50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-black uppercase">Form analysis upload</p>
                <p className="text-sm text-muted-foreground">
                  Add a short image or video, then ask for cues. The coach will combine it with your progress memory.
                </p>
              </div>
            </div>
            <div className="grid w-full gap-2 min-[420px]:grid-cols-3 lg:flex lg:w-auto lg:flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full rounded-lg gap-2 lg:w-auto">
                <Upload className="h-4 w-4" />
                Upload media
              </Button>
              <Button variant="outline" onClick={startVoiceInput} className="w-full rounded-lg gap-2 lg:w-auto">
                <Mic className={cn('h-4 w-4', listening && 'text-primary')} />
                {listening ? 'Listening' : 'Voice note'}
              </Button>
              <Button variant="outline" onClick={speakLastCoachMessage} className="w-full rounded-lg gap-2 lg:w-auto">
                <Volume2 className="h-4 w-4" />
                Read feedback
              </Button>
            </div>
          </div>
          {media && (
            <div className="mt-4 grid gap-3 rounded-lg border bg-muted/25 p-3 sm:grid-cols-[160px_1fr_auto] sm:items-center">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-background">
                {media.type.startsWith('video') ? (
                  <video src={media.previewUrl} className="h-full w-full object-cover" muted controls />
                ) : (
                  <img src={media.previewUrl} alt="Uploaded form check" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {media.type.startsWith('video') ? <FileVideo className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                  {media.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask for a form check, depth review, bar path notes, posture cues, or rep-by-rep feedback.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMedia(null)} className="rounded-lg">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

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
              <div className="mt-4 space-y-2">
                <Textarea
                  value={memoryDraft}
                  onChange={(event) => setMemoryDraft(event.target.value)}
                  placeholder="Remember injuries, cues, PRs, or preferences..."
                  className="min-h-24 resize-none rounded-lg text-xs"
                />
                <Button onClick={saveMemory} size="sm" className="w-full rounded-lg">
                  Save Memory
                </Button>
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

        <Card className="flex min-h-[58svh] flex-1 flex-col overflow-hidden border-border/50 sm:min-h-[620px]">
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
                    className={cn('flex min-w-0 gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[calc(100%-2.75rem)] overflow-hidden break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%]',
                        msg.role === 'user'
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-muted'
                      )}
                    >
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h2 className="mb-3 text-base font-black leading-snug">{children}</h2>,
                          h2: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-black leading-snug first:mt-0">{children}</h3>,
                          h3: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-black leading-snug first:mt-0">{children}</h4>,
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-black">{children}</strong>,
                          ul: ({ children }) => <ul className="my-3 space-y-2 pl-0">{children}</ul>,
                          ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5">{children}</ol>,
                          li: ({ children }) => (
                            <li className="relative list-none pl-4 before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:-translate-y-1/2 before:rounded-full before:bg-primary">
                              {children}
                            </li>
                          ),
                          hr: () => <div className="my-4 h-px bg-border/70" />,
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-xl border border-border/70 bg-background/40">
                              <table className="min-w-full text-left text-xs">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-primary/10 text-primary">{children}</thead>,
                          th: ({ children }) => <th className="whitespace-nowrap px-3 py-2 font-black">{children}</th>,
                          td: ({ children }) => <td className="border-t border-border/60 px-3 py-2 align-top">{children}</td>,
                          code: ({ children }) => (
                            <code className="rounded bg-background/60 px-1.5 py-0.5 text-[0.92em]">{children}</code>
                          ),
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
            disabled={(!input.trim() && !media) || isLoading}
            className="h-12 w-12 shrink-0 rounded-xl neon-glow"
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(5.2rem+env(safe-area-inset-bottom))] z-40 border-t border-border/70 bg-background/95 px-3 py-3 shadow-[0_-14px_38px_oklch(0_0_0_/_0.32)] backdrop-blur-xl sm:px-4 lg:hidden">
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
            disabled={(!input.trim() && !media) || isLoading}
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
