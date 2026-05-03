'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { exercises } from '@/lib/data';
import {
  Search, SlidersHorizontal, Dumbbell, Home, Clock,
  Flame, Heart, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', label: 'All', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'gym', label: 'Gym', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { id: 'no-equipment', label: 'No Equipment', icon: <Clock className="h-4 w-4" /> },
] as const;

const difficulties = ['all', 'beginner', 'intermediate', 'advanced'] as const;

const difficultyColor: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

export function WorkoutsPage() {
  const { setExerciseId, favorites, toggleFavorite, navigate } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = exercises.filter((ex) => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    const matchDifficulty = selectedDifficulty === 'all' || ex.difficulty === selectedDifficulty;
    return matchSearch && matchCategory && matchDifficulty;
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
  };

  const hasActiveFilters = search || selectedCategory !== 'all' || selectedDifficulty !== 'all';

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Workout <span className="gradient-text">Library</span>
          </h1>
          <p className="text-muted-foreground">
            Browse {exercises.length}+ exercises with step-by-step guides
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises by name or muscle group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-card"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 rounded-xl gap-2",
                showFilters && "bg-primary/10 text-primary border-primary/20"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "rounded-lg gap-2 shrink-0 transition-all",
                  selectedCategory === cat.id && "neon-glow"
                )}
              >
                {cat.icon}
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Difficulty Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
                  {difficulties.map((d) => (
                    <Button
                      key={d}
                      variant={selectedDifficulty === d ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDifficulty(d)}
                      className="rounded-lg capitalize"
                    >
                      {d}
                    </Button>
                  ))}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="rounded-lg text-muted-foreground gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
        </p>

        {/* Exercise Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((exercise, i) => (
              <motion.div
                key={exercise.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50">
                  <div
                    className="relative aspect-video bg-cover bg-center"
                    style={{ backgroundImage: `url('${exercise.image}')` }}
                    onClick={() => setExerciseId(exercise.id)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={cn("text-xs border", difficultyColor[exercise.difficulty])}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(exercise.id);
                      }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors",
                          favorites.includes(exercise.id)
                            ? "fill-red-500 text-red-500"
                            : "text-white"
                        )}
                      />
                    </button>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-semibold text-white text-sm leading-tight drop-shadow-lg">
                        {exercise.name}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="p-4" onClick={() => setExerciseId(exercise.id)}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exercise.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5" />
                          {exercise.calories} cal
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {exercise.muscleGroup}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
