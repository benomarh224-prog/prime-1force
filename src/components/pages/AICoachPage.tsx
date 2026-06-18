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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FutureShell, GlassPanel } from '@/components/future/FutureUI';

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

const CHAT_STORAGE_KEY = 'prime-forge-coach-chat';
const MAX_STORED_MESSAGES = 40;
const MAX_MESSAGES_SENT_TO_API = 24;

function createWelcomeMessage(level: string, goal: string): Message {
  return {
    id: 'welcome',
    role: 'assistant',
    content: `Hey, I'm your PrimeForge AI Coach. I can help with training plans, nutrition, recovery, exercise technique, and practical fitness decisions.\n\nProfile context: **${level}** level, goal: **${goal.replace('_', ' ')}**.\n\nAsk me what you want to improve and I will give you a specific plan instead of generic advice.`,
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
    const savedChat = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!savedChat) return;

    try {
      const parsed = JSON.parse(savedChat) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
      const restored = parsed
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .filter((message) => typeof message.content === 'string' && message.content.trim())
        .slice(-MAX_STORED_MESSAGES)
        .map((message) => ({
          ...message,
          timestamp: new Date(message.timestamp),
        }));

      if (restored.length > 0) setMessages(restored);
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
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

    return `You are PrimeForge AI Coach, an expert personal trainer, nutrition coach, and fitness mentor.
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
- Provide personalized workout advice, nutrition guidance, recovery recommendations, and exercise technique corrections
- Always ask for missing information when necessary
- Give specific sets, reps, rest periods, progression advice, and safety recommendations
- Avoid generic answers
- Use markdown formatting for readability
- Start with a clear recommendation, then give steps
- Keep responses practical and skimmable
- Use the previous chat history and keep context between questions
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
    const historyForApi = messages
      .slice(-MAX_MESSAGES_SENT_TO_API)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'assistant', content: buildContextPrompt() },
            ...historyForApi,
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
    const welcome = createWelcomeMessage(userLevel, userGoal);
    setMessages([welcome]);
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([welcome]));
  };

  return (
    <FutureShell className="min-h-screen">
      <div className="relative z-10 flex h-[100svh] min-h-0 w-full flex-col px-3 pb-3 pt-[4.75rem] sm:px-5 lg:px-8 lg:pb-6 lg:pt-20">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-3">
          <motion.header
            className="shrink-0"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-2 gap-1.5 border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
                  <Sparkles className="h-3 w-3" />
                  AI Coach
                </Badge>
                <h1 className="holo-text truncate text-2xl font-black tracking-tight sm:text-3xl">
                  Prime Coach
                </h1>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-lg gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <Button variant="outline" onClick={startVoiceInput} className="rounded-lg gap-2">
                  <Mic className={cn('h-4 w-4', listening && 'text-primary')} />
                  {listening ? 'Listening' : 'Voice'}
                </Button>
                <Button variant="outline" onClick={speakLastCoachMessage} className="rounded-lg gap-2">
                  <Volume2 className="h-4 w-4" />
                  Read
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {coachModes.map((coachMode) => (
                <button
                  key={coachMode.id}
                  type="button"
                  onClick={() => setMode(coachMode)}
                  className={cn(
                    'flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-black uppercase transition-colors sm:h-11 sm:gap-2 sm:text-xs',
                    mode.id === coachMode.id
                      ? 'border-cyan-200/40 bg-cyan-200/15 text-cyan-50'
                      : 'border-white/10 bg-white/[0.045] text-white/64 hover:border-cyan-200/30 hover:text-cyan-100'
                  )}
                >
                  <coachMode.icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">{coachMode.label}</span>
                </button>
              ))}
            </div>
          </motion.header>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="hidden"
          />

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="hidden min-h-0 space-y-3 lg:block">
              <GlassPanel className="p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Memory
                </div>
                <div className="space-y-2 text-sm text-white/56">
                  <p><span className="font-semibold text-foreground">Goal:</span> {userGoal.replace('_', ' ')}</p>
                  <p><span className="font-semibold text-foreground">Level:</span> {userLevel}</p>
                  <p><span className="font-semibold text-foreground">Workouts:</span> {workoutLogs.length}</p>
                  <p><span className="font-semibold text-foreground">Target:</span> {weeklyGoal}/week</p>
                </div>
                <Textarea
                  value={memoryDraft}
                  onChange={(event) => setMemoryDraft(event.target.value)}
                  placeholder="Injuries, preferences, PRs..."
                  className="mt-4 min-h-24 resize-none rounded-lg text-xs"
                />
                <Button onClick={saveMemory} size="sm" className="mt-2 w-full rounded-lg">
                  Save Memory
                </Button>
              </GlassPanel>

              <GlassPanel className="p-4">
                <div className="mb-3 text-sm font-black uppercase">Ask Faster</div>
                <div className="space-y-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt.text}
                      type="button"
                      onClick={() => handleSend(prompt.text)}
                      className="flex w-full items-start gap-2 rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left text-xs leading-5 text-white/68 transition-colors hover:border-cyan-200/30 hover:bg-cyan-200/10 hover:text-cyan-50"
                    >
                      <span className="mt-0.5 text-cyan-100">{prompt.icon}</span>
                      <span>{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </GlassPanel>
            </aside>

            <GlassPanel className="flex min-h-0 flex-col overflow-hidden p-0" intensity="strong">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="future-icon-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Bot className="h-4 w-4 text-cyan-100" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase">Chat</p>
                    <p className="truncate text-xs text-white/48">{mode.label} mode</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="rounded-lg sm:hidden" aria-label="Upload media">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={startVoiceInput} className="rounded-lg sm:hidden" aria-label="Voice input">
                    <Mic className={cn('h-4 w-4', listening && 'text-primary')} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-lg" aria-label="Clear chat">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="min-h-0 flex-1 p-3 sm:p-4" ref={scrollRef}>
                <div className="space-y-4 pb-2">
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn('flex min-w-0 gap-2 sm:gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[calc(100%-2.5rem)] overflow-hidden break-words rounded-2xl px-3.5 py-3 text-sm leading-relaxed sm:max-w-[78%] sm:px-4',
                            msg.role === 'user'
                              ? 'rounded-br-md border border-orange-200/20 bg-orange-300/16 text-white'
                              : 'rounded-bl-md border border-cyan-200/14 bg-cyan-200/10 text-white'
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
                      <div className="rounded-2xl rounded-bl-md border border-cyan-200/14 bg-cyan-200/10 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-cyan-100/80">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Thinking...
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {media && (
                <div className="shrink-0 border-t border-white/10 px-3 py-2 sm:px-4">
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-2">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-background">
                      {media.type.startsWith('video') ? (
                        <video src={media.previewUrl} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={media.previewUrl} alt="Uploaded form check" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-xs font-semibold">
                        {media.type.startsWith('video') ? <FileVideo className="h-3.5 w-3.5 text-primary" /> : <ImageIcon className="h-3.5 w-3.5 text-primary" />}
                        {media.name}
                      </p>
                      <p className="text-[11px] text-white/44">Attached to your next message</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setMedia(null)} className="h-8 w-8 rounded-lg">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {messages.length <= 2 && (
                <div className="hidden shrink-0 px-3 pb-2 sm:block sm:px-4">
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt.text}
                        type="button"
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

              <form
                className="shrink-0 border-t border-white/10 bg-background/90 px-3 py-3 sm:px-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <div className="flex min-w-0 gap-2">
                  <Input
                    placeholder="Ask Coach anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-12 min-w-0 flex-1 rounded-lg bg-card"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={(!input.trim() && !media) || isLoading}
                    className="h-12 w-12 shrink-0 rounded-lg neon-glow"
                    size="icon"
                    aria-label="Send message"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </GlassPanel>
          </div>
        </div>
      </div>
    </FutureShell>
  );
}
