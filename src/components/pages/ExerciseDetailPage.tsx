'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { exercises } from '@/lib/data';
import {
  ArrowLeft, Clock, Flame, Heart, ChevronRight,
  Dumbbell, Target, Lightbulb, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const difficultyColor: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

export function ExerciseDetailPage() {
  const { selectedExerciseId, navigate, favorites, toggleFavorite } = useAppStore();
  const [activeTab, setActiveTab] = useState<'instructions' | 'tips'>('instructions');

  const exercise = exercises.find((e) => e.id === selectedExerciseId);

  if (!exercise) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Exercise not found</h3>
          <Button onClick={() => navigate('workouts')} className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  const isFavorite = favorites.includes(exercise.id);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('workouts')}
            className="mb-6 gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workouts
          </Button>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="relative rounded-2xl overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="aspect-video bg-cover bg-center"
            style={{ backgroundImage: `url('${exercise.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="h-16 w-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg neon-glow"
            >
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            </motion.button>
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex gap-2 mb-2">
                  <Badge className={cn("text-xs border", difficultyColor[exercise.difficulty])}>
                    {exercise.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-black/30 text-white border-none">
                    {exercise.category === 'no-equipment' ? 'No Equipment' : exercise.category === 'home' ? 'Home' : 'Gym'}
                  </Badge>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {exercise.name}
                </h1>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleFavorite(exercise.id)}
                className="rounded-full bg-black/30 border-none hover:bg-black/50 shrink-0"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isFavorite ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { icon: <Clock className="h-5 w-5 text-primary" />, label: 'Duration', value: `${exercise.duration} min` },
            { icon: <Flame className="h-5 w-5 text-primary" />, label: 'Calories', value: `${exercise.calories}` },
            { icon: <Target className="h-5 w-5 text-primary" />, label: 'Target', value: exercise.muscleGroup },
            { icon: <Dumbbell className="h-5 w-5 text-primary" />, label: 'Equipment', value: exercise.equipment },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                {stat.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Description */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-muted-foreground leading-relaxed">
            {exercise.description}
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'instructions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('instructions')}
              className="rounded-xl gap-2"
            >
              <Target className="h-4 w-4" />
              Step-by-Step
            </Button>
            <Button
              variant={activeTab === 'tips' ? 'default' : 'outline'}
              onClick={() => setActiveTab('tips')}
              className="rounded-xl gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Pro Tips
            </Button>
          </div>

          {activeTab === 'instructions' && (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  How to Perform
                </h3>
                <div className="space-y-4">
                  {exercise.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 items-start"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                        {i + 1}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'tips' && (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  {exercise.tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3 items-start p-3 rounded-xl bg-primary/5 border border-primary/10"
                    >
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            onClick={() => navigate('ai-coach')}
            className="flex-1 h-12 rounded-xl gap-2 neon-glow font-semibold"
          >
            Ask AI Coach About This Exercise
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('workouts')}
            className="flex-1 h-12 rounded-xl gap-2 font-semibold"
          >
            Browse More Exercises
          </Button>
        </div>
      </div>
    </div>
  );
}
