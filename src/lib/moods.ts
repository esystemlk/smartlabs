import { Angry, Frown, Laugh, Heart, Smile, type LucideIcon } from 'lucide-react';

export interface MoodDef {
  key: string;
  label: string;
  /** Icon shown on the picker button and the profile chip (no emoji). */
  icon: LucideIcon;
  /** Tailwind classes for the picker button hover state. */
  hover: string;
  /** Tailwind classes for the profile badge chip. */
  chip: string;
}

export const MOODS: MoodDef[] = [
  { key: 'angry',    label: 'Angry',    icon: Angry, hover: 'hover:bg-red-50 hover:border-red-300',       chip: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'scared',   label: 'Scared',   icon: Frown, hover: 'hover:bg-sky-50 hover:border-sky-300',       chip: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'naughty',  label: 'Naughty',  icon: Laugh, hover: 'hover:bg-violet-50 hover:border-violet-300', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
  { key: 'romantic', label: 'Romantic', icon: Heart, hover: 'hover:bg-pink-50 hover:border-pink-300',     chip: 'bg-pink-50 text-pink-700 border-pink-200' },
  { key: 'happy',    label: 'Happy',    icon: Smile, hover: 'hover:bg-amber-50 hover:border-amber-300',   chip: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export const moodByKey = (key?: string | null): MoodDef | undefined =>
  key ? MOODS.find(m => m.key === key) : undefined;
