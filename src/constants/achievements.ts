import { Achievement } from "@/types/game";

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  {
    id: "first_food",
    name: "First Bite",
    description: "Eat your first food",
  },
  {
    id: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
  },
  {
    id: "level_10",
    name: "Master Snake",
    description: "Reach level 10",
  },
  {
    id: "score_100",
    name: "Centurion",
    description: "Score 100 points",
  },
  {
    id: "score_500",
    name: "High Roller",
    description: "Score 500 points",
  },
  {
    id: "combo_5",
    name: "Combo Master",
    description: "Achieve a 5x combo",
  },
  {
    id: "snake_length_20",
    name: "Long Boi",
    description: "Grow to 20 segments",
  },
  {
    id: "eat_powerup",
    name: "Power Hungry",
    description: "Eat your first power-up",
  },
  {
    id: "avoid_poison",
    name: "Poison Avoider",
    description: "Avoid 5 poison foods in a row",
  },
];

export const ACHIEVEMENT_STORAGE_KEY = "snake-game-achievements";


