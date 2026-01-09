// Username generator for anonymous chat
const adjectives = [
  "Happy", "Calm", "Brave", "Wise", "Kind", "Bright", "Swift", "Gentle",
  "Clever", "Warm", "Cool", "Bold", "Quiet", "Loud", "Soft", "Strong",
  "Quick", "Slow", "Deep", "Light", "Dark", "Sweet", "Sour", "Fresh",
  "Old", "New", "Young", "Ancient", "Modern", "Classic", "Trendy"
];

const nouns = [
  "Panda", "Dragon", "Phoenix", "Tiger", "Lion", "Eagle", "Wolf", "Bear",
  "Dolphin", "Butterfly", "Owl", "Fox", "Cat", "Dog", "Horse", "Deer",
  "Rabbit", "Squirrel", "Penguin", "Koala", "Kangaroo", "Elephant", "Giraffe",
  "Zebra", "Monkey", "Gorilla", "Shark", "Whale", "Octopus", "Starfish",
  "Turtle", "Snake", "Frog", "Fish", "Bird", "Bee", "Ant", "Spider"
];

/**
 * Generates a random username by combining an adjective, a noun, and a random number
 * @returns {string} A randomly generated username
 */
export function generateUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
}

