export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: 'gym' | 'home' | 'no-equipment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroup: string;
  equipment: string;
  duration: number;
  calories: number;
  image: string;
  steps: string[];
  tips: string[];
}

export interface MealPlan {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  ingredients: string[];
  image?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
}

export interface MachineGuide {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image: string;
  setup: string;
  steps: string[];
  commonMistakes: string[];
  proTip: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  daysPerWeek: number;
  goal: string;
  image: string;
  highlights: string[];
  schedule: { day: string; focus: string; exercises: string[] }[];
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: 'protein' | 'carbs' | 'fruits' | 'vegetables' | 'dairy' | 'fats' | 'beverages' | 'snacks';
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export const foodDatabase: FoodItem[] = [
  // Proteins
  { id: 'chicken-breast', name: 'Chicken Breast', emoji: '🍗', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'salmon', name: 'Salmon Fillet', emoji: '🐟', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'eggs', name: 'Whole Eggs', emoji: '🥚', category: 'protein', servingSize: '2 large', servingGrams: 100, calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: 'egg-whites', name: 'Egg Whites', emoji: '🥚', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { id: 'lean-beef', name: 'Lean Ground Beef', emoji: '🥩', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 250, protein: 26, carbs: 0, fat: 17 },
  { id: 'steak', name: 'Sirloin Steak', emoji: '🥩', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 206, protein: 26, carbs: 0, fat: 11 },
  { id: 'turkey', name: 'Turkey Breast', emoji: '🦃', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 135, protein: 30, carbs: 0, fat: 1 },
  { id: 'tuna', name: 'Canned Tuna', emoji: '🐟', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 116, protein: 26, carbs: 0, fat: 1 },
  { id: 'shrimp', name: 'Shrimp', emoji: '🦐', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 85, protein: 20, carbs: 0.2, fat: 0.5 },
  { id: 'tofu', name: 'Tofu (Firm)', emoji: '🧈', category: 'protein', servingSize: '100g', servingGrams: 100, calories: 144, protein: 17, carbs: 3.5, fat: 8 },
  { id: 'whey-protein', name: 'Whey Protein', emoji: '🥤', category: 'protein', servingSize: '1 scoop (30g)', servingGrams: 30, calories: 120, protein: 24, carbs: 3, fat: 1 },
  { id: 'greek-yogurt', name: 'Greek Yogurt', emoji: '🥛', category: 'dairy', servingSize: '170g', servingGrams: 170, calories: 100, protein: 17, carbs: 6, fat: 0.7 },

  // Carbs / Grains
  { id: 'white-rice', name: 'White Rice (cooked)', emoji: '🍚', category: 'carbs', servingSize: '100g', servingGrams: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'brown-rice', name: 'Brown Rice (cooked)', emoji: '🍚', category: 'carbs', servingSize: '100g', servingGrams: 100, calories: 112, protein: 2.3, carbs: 24, fat: 0.8 },
  { id: 'oats', name: 'Rolled Oats', emoji: '🥣', category: 'carbs', servingSize: '40g', servingGrams: 40, calories: 150, protein: 5, carbs: 27, fat: 2.5 },
  { id: 'pasta', name: 'Pasta (cooked)', emoji: '🍝', category: 'carbs', servingSize: '100g', servingGrams: 100, calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { id: 'sweet-potato', name: 'Sweet Potato', emoji: '🍠', category: 'carbs', servingSize: '100g', servingGrams: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { id: 'quinoa', name: 'Quinoa (cooked)', emoji: '🌾', category: 'carbs', servingSize: '100g', servingGrams: 100, calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { id: 'bread-whole', name: 'Whole Wheat Bread', emoji: '🍞', category: 'carbs', servingSize: '1 slice (30g)', servingGrams: 30, calories: 80, protein: 4, carbs: 14, fat: 1.1 },
  { id: 'bagel', name: 'Plain Bagel', emoji: '🥯', category: 'carbs', servingSize: '1 medium', servingGrams: 105, calories: 245, protein: 9, carbs: 48, fat: 1.5 },
  { id: 'couscous', name: 'Couscous (cooked)', emoji: '🌾', category: 'carbs', servingSize: '100g', servingGrams: 100, calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },

  // Fruits
  { id: 'banana', name: 'Banana', emoji: '🍌', category: 'fruits', servingSize: '1 medium', servingGrams: 118, calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: 'apple', name: 'Apple', emoji: '🍎', category: 'fruits', servingSize: '1 medium', servingGrams: 182, calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: 'blueberries', name: 'Blueberries', emoji: '🫐', category: 'fruits', servingSize: '100g', servingGrams: 100, calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { id: 'strawberries', name: 'Strawberries', emoji: '🍓', category: 'fruits', servingSize: '100g', servingGrams: 100, calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'orange', name: 'Orange', emoji: '🍊', category: 'fruits', servingSize: '1 medium', servingGrams: 131, calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', category: 'fats', servingSize: '100g', servingGrams: 100, calories: 160, protein: 2, carbs: 9, fat: 15 },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', category: 'fruits', servingSize: '100g', servingGrams: 100, calories: 67, protein: 0.6, carbs: 17, fat: 0.4 },

  // Vegetables
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'vegetables', servingSize: '100g', servingGrams: 100, calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'vegetables', servingSize: '100g', servingGrams: 100, calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 'tomato', name: 'Tomato', emoji: '🍅', category: 'vegetables', servingSize: '1 medium', servingGrams: 123, calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2 },
  { id: 'mixed-salad', name: 'Mixed Salad', emoji: '🥗', category: 'vegetables', servingSize: '100g', servingGrams: 100, calories: 15, protein: 1.3, carbs: 2.5, fat: 0.2 },
  { id: 'bell-pepper', name: 'Bell Pepper', emoji: '🫑', category: 'vegetables', servingSize: '1 medium', servingGrams: 119, calories: 31, protein: 1, carbs: 6, fat: 0.3 },

  // Dairy
  { id: 'whole-milk', name: 'Whole Milk', emoji: '🥛', category: 'dairy', servingSize: '250ml', servingGrams: 250, calories: 150, protein: 8, carbs: 12, fat: 8 },
  { id: 'skim-milk', name: 'Skim Milk', emoji: '🥛', category: 'dairy', servingSize: '250ml', servingGrams: 250, calories: 83, protein: 8.3, carbs: 12, fat: 0.2 },
  { id: 'cheddar', name: 'Cheddar Cheese', emoji: '🧀', category: 'dairy', servingSize: '30g', servingGrams: 30, calories: 120, protein: 7, carbs: 0.4, fat: 10 },
  { id: 'cottage-cheese', name: 'Cottage Cheese', emoji: '🧀', category: 'dairy', servingSize: '100g', servingGrams: 100, calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { id: 'butter', name: 'Butter', emoji: '🧈', category: 'fats', servingSize: '1 tbsp (14g)', servingGrams: 14, calories: 100, protein: 0.1, carbs: 0, fat: 11 },

  // Fats & Nuts
  { id: 'almonds', name: 'Almonds', emoji: '🥜', category: 'fats', servingSize: '30g', servingGrams: 30, calories: 170, protein: 6, carbs: 6, fat: 15 },
  { id: 'peanut-butter', name: 'Peanut Butter', emoji: '🥜', category: 'fats', servingSize: '2 tbsp (32g)', servingGrams: 32, calories: 190, protein: 7, carbs: 6, fat: 16 },
  { id: 'walnuts', name: 'Walnuts', emoji: '🌰', category: 'fats', servingSize: '30g', servingGrams: 30, calories: 200, protein: 5, carbs: 4, fat: 20 },
  { id: 'olive-oil', name: 'Olive Oil', emoji: '🫒', category: 'fats', servingSize: '1 tbsp (14ml)', servingGrams: 14, calories: 120, protein: 0, carbs: 0, fat: 14 },

  // Beverages
  { id: 'orange-juice', name: 'Orange Juice', emoji: '🧃', category: 'beverages', servingSize: '250ml', servingGrams: 250, calories: 112, protein: 1.7, carbs: 26, fat: 0.5 },
  { id: 'protein-shake', name: 'Protein Shake', emoji: '🥤', category: 'beverages', servingSize: '350ml', servingGrams: 350, calories: 220, protein: 35, carbs: 15, fat: 3 },
  { id: 'coffee-latte', name: 'Latte', emoji: '☕', category: 'beverages', servingSize: '350ml', servingGrams: 350, calories: 190, protein: 10, carbs: 18, fat: 7 },

  // Snacks & Treats
  { id: 'dark-chocolate', name: 'Dark Chocolate (70%)', emoji: '🍫', category: 'snacks', servingSize: '30g', servingGrams: 30, calories: 170, protein: 2.2, carbs: 13, fat: 12 },
  { id: 'protein-bar', name: 'Protein Bar', emoji: '🍫', category: 'snacks', servingSize: '1 bar (60g)', servingGrams: 60, calories: 220, protein: 20, carbs: 22, fat: 8 },
  { id: 'popcorn', name: 'Air-Popped Popcorn', emoji: '🍿', category: 'snacks', servingSize: '30g', servingGrams: 30, calories: 115, protein: 3.5, carbs: 22, fat: 1.5 },
  { id: 'granola', name: 'Granola', emoji: '🥣', category: 'snacks', servingSize: '40g', servingGrams: 40, calories: 180, protein: 4, carbs: 29, fat: 6 },
  { id: 'honey', name: 'Honey', emoji: '🍯', category: 'snacks', servingSize: '1 tbsp (21g)', servingGrams: 21, calories: 64, protein: 0.1, carbs: 17, fat: 0 },
];

export const exercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Barbell Bench Press',
    description: 'The ultimate chest builder. Lie flat on a bench, unrack the barbell, lower it to your mid-chest, and press back up explosively. This compound movement targets your chest, shoulders, and triceps.',
    category: 'gym',
    difficulty: 'intermediate',
    muscleGroup: 'Chest',
    equipment: 'Barbell, Bench',
    duration: 10,
    calories: 85,
    image: '/images/workout-strength.png',
    steps: [
      'Lie flat on a bench with your feet firmly on the ground',
      'Grip the barbell slightly wider than shoulder-width apart',
      'Unrack the bar and hold it directly above your chest with arms extended',
      'Lower the bar slowly to your mid-chest, keeping elbows at 45 degrees',
      'Pause briefly at the bottom, then press the bar back up to the starting position',
      'Lock out your arms at the top without hyperextending your elbows',
      'Repeat for the desired number of repetitions'
    ],
    tips: [
      'Keep your shoulder blades retracted and depressed throughout the movement',
      'Maintain a slight arch in your lower back for better pressing mechanics',
      'Control the eccentric (lowering) phase for 2-3 seconds',
      'Breathe in on the way down, breathe out on the way up'
    ]
  },
  {
    id: 'bicep-curl',
    name: 'Dumbbell Bicep Curl',
    description: 'A classic isolation exercise that builds impressive biceps. Stand with dumbbells at your sides and curl them up while keeping your elbows pinned to your torso.',
    category: 'gym',
    difficulty: 'beginner',
    muscleGroup: 'Biceps',
    equipment: 'Dumbbells',
    duration: 8,
    calories: 45,
    image: '/images/exercise-bicep.png',
    steps: [
      'Stand with feet shoulder-width apart holding dumbbells at your sides',
      'Keep your elbows close to your torso and palms facing forward',
      'Curl the weight up by flexing at the elbow',
      'Squeeze your biceps at the top of the movement',
      'Slowly lower the dumbbells back to the starting position',
      'Repeat for the desired number of repetitions'
    ],
    tips: [
      'Avoid swinging your body to generate momentum',
      'Keep your wrists straight throughout the movement',
      'Focus on the mind-muscle connection with your biceps',
      'Try a slight forward lean to isolate the biceps more'
    ]
  },
  {
    id: 'barbell-squat',
    name: 'Barbell Back Squat',
    description: 'The king of leg exercises. Squats build massive lower body strength and power while engaging your core and back. Master this movement for overall athletic development.',
    category: 'gym',
    difficulty: 'intermediate',
    muscleGroup: 'Legs',
    equipment: 'Barbell, Squat Rack',
    duration: 12,
    calories: 120,
    image: '/images/exercise-squat.png',
    steps: [
      'Position the bar on your upper traps, gripping it just outside your shoulders',
      'Unrack the bar and step back with feet shoulder-width apart',
      'Brace your core and initiate the descent by pushing your hips back',
      'Lower until your thighs are parallel to the ground or slightly below',
      'Drive through your heels to stand back up explosively',
      'Lock out at the top by squeezing your glutes',
      'Repeat for the desired number of repetitions'
    ],
    tips: [
      'Keep your chest up and back neutral throughout the movement',
      'Push your knees out over your toes during the descent',
      'Take a deep breath and brace your core before each rep',
      'Start with bodyweight or light weights to perfect your form'
    ]
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    description: 'The fundamental upper body exercise that requires no equipment. Push-ups build chest, shoulders, and triceps strength while engaging your core for stability.',
    category: 'no-equipment',
    difficulty: 'beginner',
    muscleGroup: 'Chest',
    equipment: 'None',
    duration: 5,
    calories: 35,
    image: '/images/workout-no-equip.png',
    steps: [
      'Start in a high plank position with hands shoulder-width apart',
      'Keep your body in a straight line from head to heels',
      'Lower your chest toward the ground by bending your elbows',
      'Keep elbows at a 45-degree angle from your body',
      'Push back up to the starting position by extending your arms',
      'Repeat for the desired number of repetitions'
    ],
    tips: [
      'Engage your core throughout the entire movement',
      'Don\'t let your hips sag or pike up',
      'If standard push-ups are too hard, start on your knees',
      'For more challenge, try decline or diamond push-ups'
    ]
  },
  {
    id: 'yoga-flow',
    name: 'Vinyasa Yoga Flow',
    description: 'A flowing sequence of yoga poses that improves flexibility, balance, and mindfulness. Perfect for recovery days or as a warm-up/cool-down routine.',
    category: 'home',
    difficulty: 'beginner',
    muscleGroup: 'Full Body',
    equipment: 'Yoga Mat',
    duration: 20,
    calories: 95,
    image: '/images/workout-home.png',
    steps: [
      'Start in Mountain Pose (Tadasana) - stand tall with feet together',
      'Inhale and sweep arms overhead into Upward Salute',
      'Exhale and fold forward into Standing Forward Bend',
      'Inhale to a halfway lift with flat back',
      'Exhale and step or jump back to Plank position',
      'Lower to Chaturanga, then push up into Upward Dog',
      'Push back into Downward Dog and hold for 5 breaths',
      'Walk feet to hands and slowly roll up to standing'
    ],
    tips: [
      'Move with your breath - each movement is paired with an inhale or exhale',
      'Don\'t force yourself into poses that feel painful',
      'Focus on alignment over depth in each posture',
      'Practice regularly for best results - even 10 minutes daily helps'
    ]
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    description: 'The most effective full-body strength exercise. Deadlifts target your posterior chain including hamstrings, glutes, and lower back while building incredible raw strength.',
    category: 'gym',
    difficulty: 'advanced',
    muscleGroup: 'Back',
    equipment: 'Barbell',
    duration: 10,
    calories: 110,
    image: '/images/workout-strength.png',
    steps: [
      'Stand with feet hip-width apart, barbell over mid-foot',
      'Hinge at hips and grip the bar just outside your knees',
      'Drop your hips and lift your chest, creating tension in your back',
      'Drive through your heels, pushing the floor away',
      'Keep the bar close to your body as you stand up',
      'Lock out by standing tall with hips extended',
      'Reverse the movement with control to lower the bar'
    ],
    tips: [
      'Your arms are just hooks - pull with your legs and back',
      'Keep your neutral spine throughout the entire lift',
      'Use mixed grip or straps if grip becomes a limiting factor',
      'Never round your lower back - this is the most important safety tip'
    ]
  },
  {
    id: 'plank',
    name: 'Plank Hold',
    description: 'The ultimate core exercise. A simple isometric hold that builds incredible core stability, shoulder strength, and mental toughness. No equipment needed.',
    category: 'no-equipment',
    difficulty: 'beginner',
    muscleGroup: 'Core',
    equipment: 'None',
    duration: 3,
    calories: 20,
    image: '/images/workout-no-equip.png',
    steps: [
      'Start in a forearm plank position with elbows under shoulders',
      'Extend legs behind you, balancing on toes',
      'Create a straight line from head to heels',
      'Engage your core by pulling your belly button toward your spine',
      'Squeeze your glutes and quads for stability',
      'Hold the position for the desired time'
    ],
    tips: [
      'Start with 20-30 seconds and gradually increase',
      'Don\'t let your hips drop or raise too high',
      'Breathe normally throughout the hold',
      'For variation, try side planks or shoulder taps'
    ]
  },
  {
    id: 'burpees',
    name: 'Burpees',
    description: 'The ultimate full-body conditioning exercise. Burpees combine a squat thrust, plank, push-up, and jump into one explosive movement that torches calories.',
    category: 'no-equipment',
    difficulty: 'advanced',
    muscleGroup: 'Full Body',
    equipment: 'None',
    duration: 5,
    calories: 65,
    image: '/images/workout-no-equip.png',
    steps: [
      'Stand with feet shoulder-width apart',
      'Drop into a squat position with hands on the ground',
      'Kick feet back into a plank position',
      'Perform a push-up (optional for more intensity)',
      'Jump feet back to hands into squat position',
      'Explosively jump up with arms overhead',
      'Land softly and immediately begin the next rep'
    ],
    tips: [
      'Pace yourself - burpees are taxing, focus on form over speed',
      'Land softly on the balls of your feet to protect your knees',
      'Modify by removing the push-up or jump if needed',
      'Great for HIIT workouts - try 30 seconds on, 15 seconds off'
    ]
  },
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    description: 'The foundation of lower body training. Master this movement pattern before adding weight. Builds leg strength, mobility, and functional fitness.',
    category: 'home',
    difficulty: 'beginner',
    muscleGroup: 'Legs',
    equipment: 'None',
    duration: 8,
    calories: 50,
    image: '/images/workout-home.png',
    steps: [
      'Stand with feet shoulder-width apart or slightly wider',
      'Point toes slightly outward (15-30 degrees)',
      'Extend arms in front of you for counterbalance',
      'Push your hips back and bend knees to descend',
      'Lower until thighs are parallel to the ground',
      'Drive through your heels to return to standing',
      'Squeeze glutes at the top'
    ],
    tips: [
      'Keep your weight in your heels, not your toes',
      'Knees should track in the same direction as your toes',
      'Keep your chest up and back straight',
      'Use a chair behind you for depth reference and safety'
    ]
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    description: 'The gold standard for upper body pulling strength. Pull-ups develop an impressive back, biceps, and grip strength. The ultimate test of relative strength.',
    category: 'gym',
    difficulty: 'advanced',
    muscleGroup: 'Back',
    equipment: 'Pull-Up Bar',
    duration: 8,
    calories: 75,
    image: '/images/workout-strength.png',
    steps: [
      'Grip the pull-up bar slightly wider than shoulder-width',
      'Hang with arms fully extended (dead hang position)',
      'Pull yourself up by driving elbows down and back',
      'Continue until your chin clears the bar',
      'Lower yourself with control back to dead hang',
      'Repeat for desired repetitions'
    ],
    tips: [
      'If you can\'t do a pull-up yet, start with assisted or negative pull-ups',
      'Avoid excessive kipping or swinging',
      'Focus on squeezing your back muscles at the top',
      'Vary your grip (overhand, underhand, neutral) to target different muscles'
    ]
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio Blast',
    description: 'High-Intensity Interval Training that maximizes calorie burn in minimum time. Alternates between intense bursts of activity and fixed periods of rest.',
    category: 'home',
    difficulty: 'intermediate',
    muscleGroup: 'Full Body',
    equipment: 'None',
    duration: 15,
    calories: 150,
    image: '/images/workout-home.png',
    steps: [
      'Warm up with 2 minutes of light jogging in place',
      'Round 1: 30 seconds high knees + 15 seconds rest',
      'Round 2: 30 seconds mountain climbers + 15 seconds rest',
      'Round 3: 30 seconds jump squats + 15 seconds rest',
      'Round 4: 30 seconds burpees + 15 seconds rest',
      'Round 5: 30 seconds plank jacks + 15 seconds rest',
      'Cool down with 2 minutes of stretching'
    ],
    tips: [
      'Give maximum effort during work intervals - that\'s where the magic happens',
      'Keep rest periods strict for best results',
      'Stay hydrated throughout the session',
      'Start with 3-4 rounds if 5 is too challenging'
    ]
  },
  {
    id: 'shoulder-press',
    name: 'Dumbbell Shoulder Press',
    description: 'The premier exercise for building strong, capped shoulders. Targets all three deltoid heads and builds pressing strength that carries over to other upper body movements.',
    category: 'gym',
    difficulty: 'intermediate',
    muscleGroup: 'Shoulders',
    equipment: 'Dumbbells',
    duration: 8,
    calories: 55,
    image: '/images/workout-strength.png',
    steps: [
      'Sit on a bench with back support (or stand)',
      'Hold dumbbells at shoulder height with palms facing forward',
      'Press the dumbbells overhead until arms are fully extended',
      'Pause briefly at the top',
      'Lower the dumbbells back to shoulder height with control',
      'Repeat for desired repetitions'
    ],
    tips: [
      'Keep your core engaged to protect your lower back',
      'Don\'t lock out elbows aggressively at the top',
      'Avoid using momentum by not leaning back excessively',
      'Start with lighter weights to master the movement pattern'
    ]
  }
];

export const mealPlans: MealPlan[] = [
  {
    id: 'breakfast-1',
    name: 'Protein Power Bowl',
    category: 'breakfast',
    calories: 420,
    protein: 35,
    carbs: 45,
    fat: 12,
    description: 'A high-protein breakfast bowl with Greek yogurt, granola, berries, and a drizzle of honey. The perfect start to fuel your morning workout.',
    ingredients: ['200g Greek yogurt', '40g granola', '100g mixed berries', '1 tbsp honey', '15g chia seeds']
  },
  {
    id: 'breakfast-2',
    name: 'Avocado Toast with Eggs',
    category: 'breakfast',
    calories: 380,
    protein: 22,
    carbs: 30,
    fat: 20,
    description: 'Two slices of whole grain toast topped with smashed avocado and poached eggs. Rich in healthy fats and protein to keep you full.',
    ingredients: ['2 slices whole grain bread', '1 ripe avocado', '2 eggs', 'Salt, pepper, red pepper flakes']
  },
  {
    id: 'lunch-1',
    name: 'Grilled Chicken Quinoa Bowl',
    category: 'lunch',
    calories: 520,
    protein: 45,
    carbs: 50,
    fat: 14,
    description: 'A balanced lunch bowl with grilled chicken breast, fluffy quinoa, roasted vegetables, and a light lemon-tahini dressing.',
    ingredients: ['200g chicken breast', '150g quinoa', '100g roasted sweet potato', '80g broccoli', 'Lemon tahini dressing']
  },
  {
    id: 'lunch-2',
    name: 'Mediterranean Salad',
    category: 'lunch',
    calories: 380,
    protein: 28,
    carbs: 25,
    fat: 20,
    description: 'Fresh Mediterranean salad with grilled halloumi, mixed greens, olives, cherry tomatoes, and a red wine vinaigrette.',
    ingredients: ['150g halloumi', 'Mixed greens', '50g olives', '100g cherry tomatoes', 'Cucumber, red onion, vinaigrette']
  },
  {
    id: 'dinner-1',
    name: 'Salmon with Asparagus',
    category: 'dinner',
    calories: 480,
    protein: 40,
    carbs: 20,
    fat: 28,
    description: 'Pan-seared Atlantic salmon fillet served with roasted asparagus and a side of wild rice. Rich in omega-3 fatty acids.',
    ingredients: ['200g salmon fillet', '200g asparagus', '80g wild rice', 'Olive oil, lemon, garlic, dill']
  },
  {
    id: 'dinner-2',
    name: 'Lean Beef Stir-Fry',
    category: 'dinner',
    calories: 450,
    protein: 38,
    carbs: 35,
    fat: 16,
    description: 'Quick and flavorful lean beef stir-fry with mixed vegetables, brown rice, and a homemade teriyaki sauce.',
    ingredients: ['200g lean beef strips', '150g brown rice', 'Bell peppers, snap peas, carrots', 'Low-sodium soy sauce, ginger, garlic']
  },
  {
    id: 'snack-1',
    name: 'Protein Smoothie',
    category: 'snack',
    calories: 250,
    protein: 30,
    carbs: 28,
    fat: 5,
    description: 'A delicious protein smoothie with whey protein, banana, spinach, and almond milk. Perfect post-workout recovery drink.',
    ingredients: ['1 scoop whey protein', '1 banana', '50g spinach', '250ml almond milk', 'Ice cubes']
  },
  {
    id: 'snack-2',
    name: 'Trail Mix & Apple',
    category: 'snack',
    calories: 220,
    protein: 8,
    carbs: 25,
    fat: 12,
    description: 'A handful of mixed nuts and seeds with a crisp apple. Provides healthy fats, fiber, and natural energy.',
    ingredients: ['30g mixed nuts & seeds', '1 medium apple', 'Dash of cinnamon']
  }
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Lost 15kg in 3 months',
    avatar: '/images/trainer.png',
    content: 'Prime Forge completely transformed my fitness journey. The AI Coach creates personalized plans that adapt to my progress, and the workout library is incredible. I\'ve never been more consistent!',
    rating: 5
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Marathon Runner',
    avatar: '/images/trainer.png',
    content: 'As an experienced runner, I was skeptical about an app helping me. But the AI Coach\'s training advice and the detailed exercise breakdowns helped me shave 12 minutes off my marathon time.',
    rating: 5
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    role: 'Fitness Beginner',
    avatar: '/images/trainer.png',
    content: 'I was completely new to fitness and felt intimidated by gyms. Prime Forge\'s home workouts and the supportive AI Coach gave me the confidence to start. Now I train 5 days a week!',
    rating: 5
  },
  {
    id: '4',
    name: 'David Park',
    role: 'Personal Trainer',
    avatar: '/images/trainer.png',
    content: 'I recommend Prime Forge to all my clients. The nutrition tracking, progress charts, and exercise demonstrations make it the perfect companion app for any fitness professional.',
    rating: 4
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Basic workout library access',
      '5 AI Coach messages per day',
      'Basic progress tracking',
      'Community access',
      'Standard exercise demos'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12.99,
    period: 'month',
    popular: true,
    features: [
      'Full workout library',
      'Unlimited AI Coach access',
      'Advanced progress analytics',
      'Custom meal plans',
      'HD video demonstrations',
      'Priority support',
      'Save favorite workouts'
    ]
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 29.99,
    period: 'month',
    features: [
      'Everything in Pro',
      '1-on-1 video consultations',
      'Competition prep plans',
      'Body composition analysis',
      'Exclusive workout programs',
      'Early access to new features',
      'Personalized nutrition coaching'
    ]
  }
];

export const features: Feature[] = [
  {
    id: 'ai-coach',
    title: 'AI-Powered Coach',
    description: 'Get personalized workout plans and real-time advice from our intelligent AI coach that learns from your progress.',
    icon: 'bot'
  },
  {
    id: 'workouts',
    title: '500+ Exercises',
    description: 'Access a massive library of exercises with step-by-step instructions, video demos, and difficulty ratings.',
    icon: 'dumbbell'
  },
  {
    id: 'tracking',
    title: 'Smart Tracking',
    description: 'Monitor your progress with advanced charts, calorie tracking, and body composition metrics.',
    icon: 'chart'
  },
  {
    id: 'nutrition',
    title: 'Meal Planning',
    description: 'Get personalized meal plans with calorie tracking, macro breakdowns, and a food database.',
    icon: 'apple'
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Join a supportive fitness community, share your achievements, and stay motivated together.',
    icon: 'users'
  },
  {
    id: 'anywhere',
    title: 'Train Anywhere',
    description: 'Gym, home, or outdoor - our workouts adapt to your environment and available equipment.',
    icon: 'map-pin'
  }
];

export const weeklySchedule = [
  { day: 'Mon', workout: 'Push Day', done: true, duration: 55, calories: 420 },
  { day: 'Tue', workout: 'Pull Day', done: true, duration: 50, calories: 380 },
  { day: 'Wed', workout: 'Rest / Yoga', done: true, duration: 20, calories: 95 },
  { day: 'Thu', workout: 'Leg Day', done: false, duration: 60, calories: 500 },
  { day: 'Fri', workout: 'Upper Body', done: false, duration: 55, calories: 430 },
  { day: 'Sat', workout: 'HIIT + Core', done: false, duration: 30, calories: 350 },
  { day: 'Sun', workout: 'Rest Day', done: false, duration: 0, calories: 0 },
];

export const progressData = [
  { week: 'W1', weight: 82, calories: 2450, workouts: 3 },
  { week: 'W2', weight: 81.5, calories: 2380, workouts: 4 },
  { week: 'W3', weight: 80.8, calories: 2420, workouts: 4 },
  { week: 'W4', weight: 80.2, calories: 2350, workouts: 5 },
  { week: 'W5', weight: 79.6, calories: 2400, workouts: 5 },
  { week: 'W6', weight: 79.1, calories: 2380, workouts: 5 },
  { week: 'W7', weight: 78.5, calories: 2320, workouts: 6 },
  { week: 'W8', weight: 78.0, calories: 2350, workouts: 6 },
];

export const dailyCalorieData = [
  { day: 'Mon', consumed: 2100, burned: 420, protein: 145, carbs: 220, fat: 65 },
  { day: 'Tue', consumed: 2350, burned: 380, protein: 160, carbs: 240, fat: 70 },
  { day: 'Wed', consumed: 1980, burned: 95, protein: 120, carbs: 210, fat: 58 },
  { day: 'Thu', consumed: 2200, burned: 500, protein: 155, carbs: 230, fat: 62 },
  { day: 'Fri', consumed: 2100, burned: 430, protein: 140, carbs: 215, fat: 60 },
  { day: 'Sat', consumed: 2400, burned: 350, protein: 130, carbs: 260, fat: 75 },
  { day: 'Sun', consumed: 1900, burned: 0, protein: 110, carbs: 200, fat: 55 },
];

export const machineGuides: MachineGuide[] = [
  {
    id: 'treadmill',
    name: 'Treadmill',
    category: 'Cardio',
    muscleGroup: 'Legs, Core, Cardiovascular',
    difficulty: 'beginner',
    image: '/images/gym-machines.png',
    setup: 'Stand on the side rails, clip the safety key to your clothing. Select a program or manual mode. Start at a slow walk to warm up.',
    steps: [
      'Step onto the belt and start walking at 3-4 mph',
      'Gradually increase speed to your desired pace (5-6 mph for jogging, 6+ mph for running)',
      'Maintain an upright posture with a slight forward lean from the ankles',
      'Swing your arms naturally — don\'t grip the handrails tightly',
      'Land softly on the midfoot, rolling through to push off your toes',
      'Cool down by walking at 3 mph for the last 3-5 minutes'
    ],
    commonMistakes: [
      'Holding onto the handrails while running (reduces calorie burn by 20-30%)',
      'Starting at too high a speed without warming up',
      'Looking down at the screen — keep your head up and look forward',
      'Running too close to the front of the belt'
    ],
    proTip: 'Use incline intervals (1 min at 5% incline, 1 min flat) to boost calorie burn by up to 40% without increasing speed.'
  },
  {
    id: 'leg-press',
    name: 'Leg Press Machine',
    category: 'Strength',
    muscleGroup: 'Quads, Glutes, Hamstrings',
    difficulty: 'beginner',
    image: '/images/exercise-squat.png',
    setup: 'Sit in the seat with your back flat against the pad. Place feet shoulder-width apart on the platform, positioned at the middle of the foot plate.',
    steps: [
      'Unlock the safety latches by pressing the handles to the side',
      'Slowly lower the weight by bending your knees toward your chest',
      'Lower until your knees reach approximately 90 degrees — don\'t go deeper',
      'Push through your heels to press the weight back to the starting position',
      'Exhale on the push, inhale on the lowering phase',
      'Re-engage the safety latches when finished'
    ],
    commonMistakes: [
      'Locking out knees completely at the top — keep a slight bend',
      'Placing feet too high on the platform (too much glute, not enough quad)',
      'Letting knees cave inward during the press',
      'Lowering the weight too fast — control the eccentric phase'
    ],
    proTip: 'Vary your foot placement: higher = more glutes/hamstrings, lower = more quads, wider = more inner thigh.'
  },
  {
    id: 'cable-machine',
    name: 'Cable Crossover Machine',
    category: 'Strength',
    muscleGroup: 'Chest, Shoulders, Arms',
    difficulty: 'intermediate',
    image: '/images/workout-strength.png',
    setup: 'Set both pulleys to the highest position. Attach single-grip D-handles. Select your weight on both weight stacks.',
    steps: [
      'Stand in a staggered stance between the two pulleys, one foot forward',
      'Grab both handles with palms facing down or slightly inward',
      'Take a small step forward to create tension in the cables',
      'With a slight bend in your elbows, bring both hands together in an arc',
      'Squeeze your chest hard at the center crossing point',
      'Slowly open your arms back to the starting position with control'
    ],
    commonMistakes: [
      'Using too much weight — this leads to swinging and poor form',
      'Bending the elbows too much (turns it into a tricep exercise)',
      'Standing too close or too far from the machine',
      'Not controlling the return phase — the stretch is where muscle growth happens'
    ],
    proTip: 'Try high-to-low (cable flyes) for lower chest, or low-to-high for upper chest. Each angle targets different muscle fibers.'
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown Machine',
    category: 'Strength',
    muscleGroup: 'Lats, Biceps, Upper Back',
    difficulty: 'beginner',
    image: '/images/workout-strength.png',
    setup: 'Adjust the thigh pad so it locks your legs in place. Stand up and grab the wide bar, then sit back down. Your arms should be fully extended overhead.',
    steps: [
      'Grip the bar wider than shoulder-width, palms facing away',
      'Lean back slightly (about 15 degrees) and stick your chest out',
      'Pull the bar down toward your upper chest by driving your elbows down and back',
      'Squeeze your shoulder blades together at the bottom',
      'Slowly release the bar back up with control — don\'t let it snap back',
      'Keep your core engaged throughout the movement'
    ],
    commonMistakes: [
      'Pulling the bar behind your neck — unsafe for shoulders, always pull to chest',
      'Leaning too far back (turns it into a row, not a pulldown)',
      'Using body momentum to swing the weight down',
      'Gripping too narrow (targets biceps more than lats)'
    ],
    proTip: 'Focus on driving your elbows to your hips rather than thinking about pulling the bar. This mental cue activates more lat muscle fibers.'
  },
  {
    id: 'chest-press-machine',
    name: 'Chest Press Machine',
    category: 'Strength',
    muscleGroup: 'Chest, Shoulders, Triceps',
    difficulty: 'beginner',
    image: '/images/workout-strength.png',
    setup: 'Adjust the seat height so the handles are at mid-chest level. Sit with your back flat, feet firmly on the floor. Select your weight.',
    steps: [
      'Grip the handles with palms facing forward or slightly inward',
      'Unrack the weight by pressing the handles forward slightly',
      'Press the handles forward until your arms are nearly extended (don\'t lock out)',
      'Squeeze your chest muscles at the full extension point',
      'Slowly bring the handles back toward your chest in a controlled motion',
      'Pause briefly at the chest, then press again'
    ],
    commonMistakes: [
      'Setting the seat too low or too high (causes shoulder impingement)',
      'Locking out elbows forcefully at the top',
      'Rounding shoulders forward instead of keeping chest up',
      'Using too much weight and arching the back to compensate'
    ],
    proTip: 'Pause for 1-2 seconds at the bottom of each rep (when handles are closest to chest). This eliminates momentum and builds more strength.'
  },
  {
    id: 'smith-machine',
    name: 'Smith Machine',
    category: 'Strength',
    muscleGroup: 'Full Body (Versatile)',
    difficulty: 'intermediate',
    image: '/images/gym-machines.png',
    setup: 'The Smith Machine has a fixed barbell path. Set the safety stops at the appropriate height. Add weight plates and secure collars. Unlock the bar by rotating it.',
    steps: [
      'Position yourself under the bar for your chosen exercise (squat, bench press, row)',
      'For squats: place bar on upper back, feet slightly forward of center',
      'Unrack the bar by rotating the hooks outward',
      'Perform your exercise along the fixed vertical path',
      'Re-rack by rotating the bar back at any point — the safety stops catch it',
      'Always use the safety catches as a backup'
    ],
    commonMistakes: [
      'Relying entirely on the machine and never learning free weight form',
      'Standing too far forward (for squats) which puts excessive strain on the lower back',
      'Not using safety stops — essential for solo training',
      'Loading uneven weight on one side'
    ],
    proTip: 'The Smith Machine is excellent for beginners learning movement patterns and for advanced lifters doing isolation work. Use it as a tool, not a crutch.'
  }
];

export const workoutPrograms: WorkoutProgram[] = [
  {
    id: 'beginner-fullbody',
    name: 'Full Body Foundation',
    description: 'The perfect starting point for beginners. This program builds a solid foundation of strength and muscle across your entire body with simple, effective compound movements 3 days per week.',
    level: 'beginner',
    duration: '8 weeks',
    daysPerWeek: 3,
    goal: 'Build Strength & Learn Proper Form',
    image: '/images/prog-fullbody.png',
    highlights: ['3 days per week', '45 min sessions', 'Full body each session', 'Progressive overload', 'Rest day between workouts'],
    schedule: [
      { day: 'Monday', focus: 'Full Body A', exercises: ['Goblet Squat 3×10', 'Push-Ups 3×8-12', 'Dumbbell Row 3×10', 'Plank 3×30s', 'Lat Pulldown 3×10'] },
      { day: 'Wednesday', focus: 'Full Body B', exercises: ['Leg Press 3×12', 'Dumbbell Shoulder Press 3×10', 'Dumbbell Bench Press 3×10', 'Cable Crunch 3×15', 'Face Pulls 3×15'] },
      { day: 'Friday', focus: 'Full Body C', exercises: ['Bodyweight Squat 3×15', 'Incline Dumbbell Press 3×10', 'Seated Cable Row 3×12', 'Romanian Deadlift 3×10', 'Bicep Curl 2×12'] },
    ]
  },
  {
    id: 'ppl-split',
    name: 'Push / Pull / Legs',
    description: 'The most popular intermediate program. Each session targets specific movement patterns for maximum muscle stimulation and recovery. Ideal for building serious muscle mass.',
    level: 'intermediate',
    duration: '12 weeks',
    daysPerWeek: 6,
    goal: 'Build Muscle & Size',
    image: '/images/prog-ppl.png',
    highlights: ['6 days per week', '60 min sessions', 'Push/Pull/Legs split', 'Optimal recovery', 'Progressive overload'],
    schedule: [
      { day: 'Monday', focus: 'Push', exercises: ['Bench Press 4×8', 'OHP 3×10', 'Incline DB Press 3×12', 'Lateral Raises 3×15', 'Tricep Pushdown 3×12'] },
      { day: 'Tuesday', focus: 'Pull', exercises: ['Deadlift 4×6', 'Pull-Ups 4×8', 'Barbell Row 3×10', 'Face Pulls 3×15', 'Barbell Curl 3×12'] },
      { day: 'Wednesday', focus: 'Legs', exercises: ['Barbell Squat 4×8', 'Leg Press 3×12', 'Romanian Deadlift 3×10', 'Leg Curl 3×12', 'Calf Raises 4×15'] },
      { day: 'Thursday', focus: 'Push', exercises: ['OHP 4×8', 'DB Bench Press 3×10', 'Cable Flyes 3×15', 'Tricep Dips 3×12', 'Shrugs 3×15'] },
      { day: 'Friday', focus: 'Pull', exercises: ['Barbell Row 4×8', 'Lat Pulldown 3×10', 'Seated Cable Row 3×12', 'Hammer Curls 3×12', 'Hanging Leg Raise 3×15'] },
      { day: 'Saturday', focus: 'Legs', exercises: ['Front Squat 4×8', 'Bulgarian Split Squat 3×10', 'Leg Extension 3×15', 'Hip Thrust 3×12', 'Plank 3×45s'] },
    ]
  },
  {
    id: 'hiit-fat-loss',
    name: 'HIIT Fat Burn',
    description: 'An intense high-intensity interval training program designed to maximize calorie burn and fat loss. Combines cardio bursts with strength circuits for the ultimate conditioning challenge.',
    level: 'intermediate',
    duration: '6 weeks',
    daysPerWeek: 4,
    goal: 'Burn Fat & Improve Conditioning',
    image: '/images/prog-hiit.png',
    highlights: ['4 days per week', '30 min sessions', 'HIIT intervals', 'No equipment needed', 'Max calorie burn'],
    schedule: [
      { day: 'Monday', focus: 'HIIT Cardio', exercises: ['Warm-Up 3 min', 'Burpees 30s/Rest 15s ×4', 'Mountain Climbers 30s/Rest 15s ×4', 'Jump Squats 30s/Rest 15s ×4', 'Cool-Down 3 min'] },
      { day: 'Tuesday', focus: 'Upper Body Circuit', exercises: ['Push-Ups ×15', 'Pike Push-Ups ×10', 'Tricep Dips ×12', 'Plank Shoulder Taps ×20', 'Rest 60s — Repeat 4 rounds'] },
      { day: 'Thursday', focus: 'Lower Body Circuit', exercises: ['Jump Squats ×15', 'Walking Lunges ×12/leg', 'Glute Bridges ×20', 'Calf Raises ×25', 'Rest 60s — Repeat 4 rounds'] },
      { day: 'Saturday', focus: 'Full Body HIIT', exercises: ['Burpee to Push-Up ×10', 'Tuck Jumps ×12', 'V-Up Crunches ×15', 'Plank Jacks ×20', 'Rest 60s — Repeat 5 rounds'] },
    ]
  },
  {
    id: 'strength-builder',
    name: 'Strength Builder',
    description: 'A classic strength-focused program built around the big compound lifts. Designed to increase your 1RM on squat, bench press, deadlift, and overhead press through progressive overload.',
    level: 'advanced',
    duration: '16 weeks',
    daysPerWeek: 4,
    goal: 'Increase Raw Strength',
    image: '/images/prog-strength.png',
    highlights: ['4 days per week', '75 min sessions', 'Heavy compound lifts', '1RM progression', 'Deload every 4th week'],
    schedule: [
      { day: 'Monday', focus: 'Upper Strength', exercises: ['Bench Press 5×5', 'Barbell Row 5×5', 'OHP 3×8', 'Weighted Pull-Ups 3×8', 'Barbell Curl 3×10'] },
      { day: 'Tuesday', focus: 'Lower Strength', exercises: ['Barbell Back Squat 5×5', 'Romanian Deadlift 3×8', 'Leg Press 3×12', 'Weighted Calf Raises 4×10', 'Ab Wheel 3×12'] },
      { day: 'Thursday', focus: 'Upper Hypertrophy', exercises: ['Incline Bench 4×8', 'Weighted Dips 4×8', 'Cable Row 3×12', 'Lateral Raises 4×15', 'Hammer Curls 3×12'] },
      { day: 'Friday', focus: 'Lower Hypertrophy', exercises: ['Front Squat 4×8', 'Leg Curl 4×12', 'Hip Thrust 4×10', 'Walking Lunges 3×12/leg', 'Hanging Leg Raise 3×15'] },
    ]
  },
  {
    id: 'upper-lower-split',
    name: 'Upper / Lower Split',
    description: 'A balanced 4-day program alternating between upper body and lower body sessions. Great for intermediate lifters wanting to add muscle and strength with adequate recovery.',
    level: 'intermediate',
    duration: '10 weeks',
    daysPerWeek: 4,
    goal: 'Balanced Muscle & Strength',
    image: '/images/prog-upperlower.png',
    highlights: ['4 days per week', '55 min sessions', 'Upper/Lower split', '2 rest days', 'Balanced volume'],
    schedule: [
      { day: 'Monday', focus: 'Upper Body A', exercises: ['Bench Press 4×8', 'Barbell Row 4×8', 'OHP 3×10', 'Lat Pulldown 3×10', 'Face Pulls 3×15'] },
      { day: 'Tuesday', focus: 'Lower Body A', exercises: ['Back Squat 4×8', 'Romanian Deadlift 3×10', 'Leg Press 3×12', 'Leg Curl 3×12', 'Calf Raises 4×15'] },
      { day: 'Thursday', focus: 'Upper Body B', exercises: ['Incline DB Press 4×10', 'Pull-Ups 4×8', 'Cable Flyes 3×12', 'Seated Cable Row 3×12', 'DB Curl 3×12'] },
      { day: 'Friday', focus: 'Lower Body B', exercises: ['Front Squat 3×10', 'Hip Thrust 4×10', 'Bulgarian Split Squat 3×10', 'Leg Extension 3×15', 'Plank 3×45s'] },
    ]
  },
  {
    id: 'muscle-hypertrophy',
    name: 'Muscle Hypertrophy',
    description: 'An advanced bodybuilding program designed for maximum muscle growth. Uses higher volume, moderate weight, and shorter rest periods to create the optimal stimulus for muscle hypertrophy.',
    level: 'advanced',
    duration: '12 weeks',
    daysPerWeek: 5,
    goal: 'Maximum Muscle Growth',
    image: '/images/prog-hypertrophy.png',
    highlights: ['5 days per week', '70 min sessions', 'High volume', 'Short rest (60-90s)', 'Mind-muscle connection'],
    schedule: [
      { day: 'Monday', focus: 'Chest & Triceps', exercises: ['Bench Press 4×10', 'Incline DB Press 4×10', 'Cable Flyes 3×15', 'Dips 3×12', 'Overhead Extension 3×15'] },
      { day: 'Tuesday', focus: 'Back & Biceps', exercises: ['Deadlift 4×8', 'Pull-Ups 4×10', 'Barbell Row 4×10', 'Cable Curl 3×12', 'Hammer Curl 3×12'] },
      { day: 'Wednesday', focus: 'Shoulders & Abs', exercises: ['OHP 4×10', 'Lateral Raises 4×15', 'Face Pulls 3×15', 'Hanging Leg Raise 4×15', 'Cable Crunch 3×20'] },
      { day: 'Thursday', focus: 'Legs', exercises: ['Squat 4×10', 'Leg Press 4×12', 'Leg Curl 4×12', 'Leg Extension 3×15', 'Calf Raises 5×15'] },
      { day: 'Friday', focus: 'Full Body Pump', exercises: ['DB Bench 3×12', 'Cable Row 3×12', 'Lunges 3×12/leg', 'Lateral Raise 3×15', 'Plank 3×60s'] },
    ]
  }
];
