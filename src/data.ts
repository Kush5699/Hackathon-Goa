export const PREFIXES = [
  "Terminal", "Midnight", "Feral", "Signal", "Sandbox", 
  "Salt-Air", "Full-Send", "Zero-Fluff", "High-Fiber", 
  "Wave-Riding", "Off-Grid", "Genesis"
];

export const SUFFIXES = [
  "Whisperer", "Shipper", "Debugger", "Architect", 
  "Alchemist", "Pirate", "Monk", "Wizard", 
  "Surfer", "Whale", "Ronin", "Prophet"
];

export const STACKS = [
  "Frontend", "Backend", "Full-stack", "ML/AI", 
  "Design", "Product", "DevOps", "Other"
];

export function generateTitle() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${prefix} ${suffix}`;
}
