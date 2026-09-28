import assert from 'node:assert/strict'
import {
  FISH_TURTLE_FOOD_RESPONSE,
  TURTLE_BEHAVIOR,
  getTurtleFeedingState,
} from '../src/pond/animalBehavior.js'

const food = { startedAt: 1_000 }

assert.ok(
  TURTLE_BEHAVIOR.maxReactionDelayMs <= 300,
  'turtles should react to food within 300ms',
)
assert.equal(
  getTurtleFeedingState({ food, now: 1_080, distance: 3, reactionDelay: 150 }),
  'alert',
  'a turtle should visibly notice food before accelerating',
)
assert.equal(
  getTurtleFeedingState({ food, now: 1_220, distance: 3, reactionDelay: 150 }),
  'sprint',
  'a distant turtle should sprint after its reaction delay',
)
assert.equal(
  getTurtleFeedingState({ food, now: 1_900, distance: 0.35, reactionDelay: 150 }),
  'feeding',
  'a turtle near the pellets should switch to feeding',
)
assert.equal(
  getTurtleFeedingState({ food, now: 10_400, distance: 1.5, reactionDelay: 150 }),
  'recovering',
  'a turtle should decelerate smoothly after the food is gone',
)
assert.equal(
  getTurtleFeedingState({ food, now: 12_500, distance: 1.5, reactionDelay: 150 }),
  'cruise',
  'a turtle should eventually return to cruising',
)
assert.ok(
  TURTLE_BEHAVIOR.motion.sprint.approachRate
    >= FISH_TURTLE_FOOD_RESPONSE.approachRate * 8,
  'turtles should pursue turtle food at least eight times as eagerly as fish',
)
assert.ok(
  FISH_TURTLE_FOOD_RESPONSE.avoidanceRadius
    >= TURTLE_BEHAVIOR.feedingRadius * 2,
  'curious fish should stay outside the turtle feeding cluster',
)
assert.ok(
  FISH_TURTLE_FOOD_RESPONSE.interestMs <= TURTLE_BEHAVIOR.foodActiveMs / 2,
  'fish interest in turtle food should fade well before turtle interest',
)
assert.ok(
  TURTLE_BEHAVIOR.motion.sprint.strokeCadence
    >= TURTLE_BEHAVIOR.motion.cruise.strokeCadence * 3,
  'sprinting turtles should paddle much faster than cruising turtles',
)

console.log('Turtle feeding behavior checks passed.')
