import { Monster } from './types';

export const LEVEL_THRESHOLDS = [0, 50, 100, 150, 200];
export const MAX_GAME_SCORE = 200;

export const MONSTERS: Record<number, Monster> = {
  1: {
    level: 1,
    minScore: 50,
    minTaskValue: 30,
    name: "Dammråttan Rex",
    image: "https://picsum.photos/seed/monster1/200/200",
    description: "En gigantisk dammråtta blockerar vägen! Du behöver städa ordentligt för att komma förbi."
  },
  2: {
    level: 2,
    minScore: 100,
    minTaskValue: 40,
    name: "Diskberget",
    image: "https://picsum.photos/seed/monster2/200/200",
    description: "Ett berg av smutsig disk hotar att rasa. Endast en hjälte kan diska undan det!"
  },
  3: {
    level: 3,
    minScore: 150,
    minTaskValue: 50,
    name: "Kaos-Trollet",
    image: "https://picsum.photos/seed/monster3/200/200",
    description: "Han stökar ner snabbare än du städar. Bevisa din snabbhet!"
  }
};

export const AVATARS = [
  "https://picsum.photos/seed/av1/100/100",
  "https://picsum.photos/seed/av2/100/100",
  "https://picsum.photos/seed/av3/100/100",
  "https://picsum.photos/seed/av4/100/100",
  "https://picsum.photos/seed/av5/100/100",
];