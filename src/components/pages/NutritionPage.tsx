'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { mealPlans } from '@/lib/data';
import {
  Utensils, Calculator, Flame, Beef, Wheat, Droplets,
  Apple, Coffee, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

const categoryIcons: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" />,
  lunch: <Sun className="h-4 w-4" />,
  dinner: <Moon className="h-4 w-4" />,
  snack: <Apple className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  breakfast: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  lunch: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  dinner: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  snack: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

const macroColors = {
  protein: 'oklch(0.72 0.19 155)',
  carbs: 'oklch(0.75 0.12 60)',
  fat: 'oklch(0.60 0.15 250)',
};

export function NutritionPage() {
  const { userWeight, userHeight, userGoal } = useAppStore();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('25');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [calcResult, setCalcResult] = useState<{
    bmr: number;
    tdee: number;
    goalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const calculateTDEE = () => {
    const w = userWeight;
    const h = userHeight;
    const a = Number(age);
    const multiplier = activityMultipliers[activityLevel] || 1.55;

    // Mifflin-St Jeor
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const tdee = bmr * multiplier;
    let goalCalories = tdee;

    if (userGoal === 'lose_weight') goalCalories = tdee - 500;
    else if (userGoal === 'gain_muscle') goalCalories = tdee + 300;

    setCalcResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goalCalories: Math.round(goalCalories),
      protein: Math.round(goalCalories * 0.30 / 4),
      carbs: Math.round(goalCalories * 0.45 / 4),
      fat: Math.round(goalCalories * 0.25 / 9),
    });
  };

  const totalMealCalories = mealPlans.reduce((sum, m) => sum + m.calories, 0);

  const macroDistribution = [
    { name: 'Protein', value: 30, fill: macroColors.protein },
    { name: 'Carbs', value: 45, fill: macroColors.carbs },
    { name: 'Fat', value: 25, fill: macroColors.fat },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
            <span className="gradient-text">Nutrition</span>
          </h1>
          <p className="text-muted-foreground mt-1 ml-[52px]">
            Meal plans & calorie tracking
          </p>
        </motion.div>

        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl">
            <TabsTrigger value="meals" className="rounded-lg gap-2">
              <Utensils className="h-4 w-4" />
              Meal Plans
            </TabsTrigger>
            <TabsTrigger value="calculator" className="rounded-lg gap-2">
              <Calculator className="h-4 w-4" />
              Calorie Calculator
            </TabsTrigger>
          </TabsList>

          {/* Meal Plans Tab */}
          <TabsContent value="meals" className="space-y-6">
            {/* Daily Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Calories', value: `${totalMealCalories}`, icon: <Flame className="h-4 w-4" />, color: 'text-orange-500' },
                  { label: 'Protein', value: `${Math.round(mealPlans.reduce((s, m) => s + m.protein, 0) / mealPlans.length)}g avg`, icon: <Beef className="h-4 w-4" />, color: 'text-primary' },
                  { label: 'Carbs', value: `${Math.round(mealPlans.reduce((s, m) => s + m.carbs, 0) / mealPlans.length)}g avg`, icon: <Wheat className="h-4 w-4" />, color: 'text-amber-500' },
                  { label: 'Fat', value: `${Math.round(mealPlans.reduce((s, m) => s + m.fat, 0) / mealPlans.length)}g avg`, icon: <Droplets className="h-4 w-4" />, color: 'text-blue-500' },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', stat.color, 'bg-current/10')}>
                        <div className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-current [&>svg]:stroke-current" style={{ color: 'inherit' }}>
                          {stat.icon}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            {/* Macro Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold mb-4">Recommended Macro Distribution</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-48 w-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {macroDistribution.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'oklch(0.17 0.005 110)',
                              border: '1px solid oklch(1 0 0 / 10%)',
                              borderRadius: '12px',
                              fontSize: 12,
                            }}
                            formatter={(value: number) => `${value}%`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 flex-1">
                      {macroDistribution.map((m) => (
                        <div key={m.name} className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: m.fill }} />
                          <span className="text-sm font-medium w-20">{m.name}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ backgroundColor: m.fill, width: `${m.value}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground w-10 text-right">{m.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Meal Categories */}
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((category, catIdx) => {
              const categoryMeals = mealPlans.filter((m) => m.category === category);
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + catIdx * 0.1 }}
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 capitalize">
                    {categoryIcons[category]}
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categoryMeals.map((meal) => (
                      <Card key={meal.id} className="hover:shadow-md transition-all duration-300 border-border/50 group">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{meal.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{meal.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {meal.calories} cal
                            </Badge>
                          </div>

                          <div className="flex gap-3 mb-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Beef className="h-3 w-3 text-primary" />
                              P: {meal.protein}g
                            </span>
                            <span className="flex items-center gap-1">
                              <Wheat className="h-3 w-3 text-amber-500" />
                              C: {meal.carbs}g
                            </span>
                            <span className="flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-blue-500" />
                              F: {meal.fat}g
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {meal.ingredients.map((ing) => (
                              <Badge key={ing} variant="outline" className="text-[10px] px-1.5 py-0">
                                {ing}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* Calorie Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-2xl mx-auto border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Daily Calorie Calculator
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Calculate your Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor equation.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Gender */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Gender</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['male', 'female'] as const).map((g) => (
                        <Button
                          key={g}
                          variant={gender === g ? 'default' : 'outline'}
                          onClick={() => setGender(g)}
                          className="rounded-xl capitalize h-11"
                        >
                          {g === 'male' ? '♂ Male' : '♀ Female'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Weight & Height */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={userWeight}
                        disabled
                        className="h-11 rounded-xl bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">From your profile</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Age</Label>
                      <Input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="h-11 rounded-xl"
                        placeholder="25"
                      />
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Activity Level</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                        { value: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
                        { value: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
                        { value: 'active', label: 'Very Active', desc: '6-7 days/week' },
                        { value: 'very_active', label: 'Extra Active', desc: 'Physical job/training 2x/day' },
                      ].map((level) => (
                        <Button
                          key={level.value}
                          variant={activityLevel === level.value ? 'default' : 'outline'}
                          onClick={() => setActivityLevel(level.value)}
                          className="rounded-xl h-auto py-2 px-3 flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">{level.label}</span>
                          <span className="text-xs opacity-70">{level.desc}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={calculateTDEE}
                    className="w-full h-12 rounded-xl neon-glow font-semibold gap-2"
                    size="lg"
                  >
                    <Calculator className="h-4 w-4" />
                    Calculate My Needs
                  </Button>

                  {/* Results */}
                  {calcResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <Separator />
                      <h3 className="text-lg font-semibold">Your Results</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                          <p className="text-2xl font-bold">{calcResult.bmr}</p>
                          <p className="text-xs text-muted-foreground">BMR (cal/day)</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                          <p className="text-2xl font-bold">{calcResult.tdee}</p>
                          <p className="text-xs text-muted-foreground">TDEE (cal/day)</p>
                        </div>
                        <div className="col-span-2 p-4 rounded-xl bg-primary/10 text-center border border-primary/20">
                          <p className="text-3xl font-bold text-primary">{calcResult.goalCalories}</p>
                          <p className="text-sm text-muted-foreground">
                            Recommended daily calories for your goal
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Protein', value: `${calcResult.protein}g`, color: 'text-primary', bg: 'bg-primary/10' },
                          { label: 'Carbs', value: `${calcResult.carbs}g`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                          { label: 'Fat', value: `${calcResult.fat}g`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        ].map((macro) => (
                          <div key={macro.label} className={cn('p-3 rounded-xl text-center', macro.bg)}>
                            <p className={cn('text-lg font-bold', macro.color)}>{macro.value}</p>
                            <p className="text-xs text-muted-foreground">{macro.label}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
