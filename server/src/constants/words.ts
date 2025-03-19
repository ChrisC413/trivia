const ADJECTIVES = [
  'Dancing',
  'Jumping',
  'Flying',
  'Glowing',
  'Sneaky',
  'Sleepy',
  'Grumpy',
  'Dizzy',
  'Wobbly',
  'Sparkly'
];

const FUNNY_WORDS = [
  'Butt',
  'Fart',
  'Burp',
  'Snot',
  'Booger',
  'Wedgie',
  'Armpit',
  'Undies',
  'Toot',
  'Barf'
];

const NOUNS = [
  'Unicorn',
  'Ninja',
  'Pirate',
  'Monkey',
  'Dragon',
  'Penguin',
  'Wizard',
  'Robot',
  'Dinosaur',
  'Llama'
];

function getRandomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateRoomId() {
  const adjective = getRandomElement(ADJECTIVES);
  const funnyWord = getRandomElement(FUNNY_WORDS);
  const noun = getRandomElement(NOUNS);
  
  return `${adjective}${funnyWord}${noun}`;
}
