export const TURTLE_BEHAVIOR = Object.freeze({
  maxReactionDelayMs: 300,
  foodActiveMs: 8_500,
  recoveryMs: 1_800,
  feedingRadius: 0.58,
  motion: Object.freeze({
    cruise: Object.freeze({ approachRate: 0.58, strokeCadence: 2.2, headExtension: 0 }),
    alert: Object.freeze({ approachRate: 0.35, strokeCadence: 3.2, headExtension: 0.08 }),
    sprint: Object.freeze({ approachRate: 4.2, strokeCadence: 8.8, headExtension: 0.17 }),
    feeding: Object.freeze({ approachRate: 1.35, strokeCadence: 5.6, headExtension: 0.12 }),
    recovering: Object.freeze({ approachRate: 0.9, strokeCadence: 3.8, headExtension: 0.05 }),
  }),
})

export const FISH_TURTLE_FOOD_RESPONSE = Object.freeze({
  approachRate: 0.42,
  interestMs: 4_200,
  avoidanceRadius: 1.2,
})

export function getTurtleReactionDelay(turtle, index) {
  const seed = (turtle?.phase ?? 0) * 1.73 + index * 2.41
  return Math.round(Math.abs(Math.sin(seed)) * TURTLE_BEHAVIOR.maxReactionDelayMs)
}

export function getTurtleFeedingState({ food, now, distance, reactionDelay = 0 }) {
  if (!food || !Number.isFinite(food.startedAt)) return 'cruise'

  const age = Math.max(0, now - food.startedAt)
  if (age < reactionDelay) return 'alert'
  if (age < TURTLE_BEHAVIOR.foodActiveMs) {
    return distance <= TURTLE_BEHAVIOR.feedingRadius ? 'feeding' : 'sprint'
  }
  if (age < TURTLE_BEHAVIOR.foodActiveMs + TURTLE_BEHAVIOR.recoveryMs) {
    return 'recovering'
  }
  return 'cruise'
}

export function getTurtleMotionProfile(state) {
  return TURTLE_BEHAVIOR.motion[state] ?? TURTLE_BEHAVIOR.motion.cruise
}

export function getFishTurtleFoodInterest(food, now) {
  if (!food || !Number.isFinite(food.startedAt)) return 0
  const age = Math.max(0, now - food.startedAt)
  if (age >= FISH_TURTLE_FOOD_RESPONSE.interestMs) return 0
  return 1 - age / FISH_TURTLE_FOOD_RESPONSE.interestMs
}
