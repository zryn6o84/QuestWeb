const adjectives = [
  'Happy', 'Lucky', 'Sunny', 'Clever', 'Bright',
  'Swift', 'Brave', 'Noble', 'Wise', 'Kind',
  'Quick', 'Sharp', 'Smart', 'Bold', 'Cool',
  'Fresh', 'Wild', 'Free', 'Epic', 'Super'
];

const nouns = [
  'Panda', 'Tiger', 'Eagle', 'Lion', 'Wolf',
  'Bear', 'Fox', 'Hawk', 'Owl', 'Dragon',
  'Phoenix', 'Unicorn', 'Knight', 'Wizard', 'Hero',
  'Warrior', 'Hunter', 'Scout', 'Ranger', 'Explorer'
];

export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);

  return `${adjective}${noun}${number}`;
}