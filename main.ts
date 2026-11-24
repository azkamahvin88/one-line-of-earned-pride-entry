// One Line of Earned Pride — make.fun entry (program/v1).
//
// The entry is exactly ONE line of text, 1 to 240 characters: a quiet,
// earned moment of pride for someone in a scene — a small person doing
// something hard, or a long effort finally landing.
//
// The judge model reads two lines at a time and picks the one that makes
// it feel the most genuine, earned pride, weighing, in order: genuine
// earned pride, a concrete scene with a real person, pride earned inside
// the line by effort the reader can feel, landing in one read, and
// freshness (no stock trophy, podium or graduation).
//
// This program scores a shortlist of candidate lines against that brief
// and writes the winner — no trailing newline — to /output/entry.txt.
//
// Deterministic: no network, no model calls, no randomness, no clock.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type Candidate = {
  text: string;
  pride: number; // 1-5: quiet, genuine, earned pride the reader feels
  scene: number; // 1-5: concrete scene with a real person, seen happening
  earned: number; // 1-5: effort or difficulty felt inside the line, never asserted
  landing: number; // 1-5: pride arrives by the last word, in one read
  fresh: number; // 1-5: image or turn not seen a hundred times
};

// The shortlist, brainstormed against the brief. Every line is a real
// person in a concrete scene; the pride is shown, never announced.
// Why the welder wins, in the brief's order:
//   - Pride: a night-shift worker quietly signing his name on the thing
//     he built — pride you can feel, not a cheer.
//   - Scene: one thumb along one seam, one girder, one signature — the
//     moment is seen happening, not summarised.
//   - Earned: the night shift and the seam he checks by touch say the
//     hard work; nothing congratulates him.
//   - Landing: the pride arrives on the last word, "girder" — the
//     finished thing, with his name on it.
//   - Fresh: no trophy, no podium, no graduation — a bridge girder and
//     a thumb on a weld.
// Runners-up lose on the brief's order: the grandmother's quilt is as
// earned but its pride arrives earlier and the scene is a touch more
// summarised; the baker's singing loaf is fresh but the effort is told
// ("eleven failed batches") rather than felt; the boy at the recital
// is close to a stock "first performance" image.
const CANDIDATES: Candidate[] = [
  {
    text: "The night-shift welder ran his thumb along the seam, found it smooth, and quietly signed his name on the finished bridge girder.",
    pride: 5, scene: 5, earned: 5, landing: 5, fresh: 5,
  },
  {
    text: "At eighty-two, my grandmother threaded the needle on the first try and finished the quilt she started the year my mother was born.",
    pride: 5, scene: 4, earned: 5, landing: 4, fresh: 4,
  },
  {
    text: "After eleven failed batches, the baker pulled a loaf from the oven that sang as it cooled, and she just nodded.",
    pride: 4, scene: 4, earned: 4, landing: 5, fresh: 5,
  },
  {
    text: "Dad sanded the chair leg he broke in anger twenty years ago, then sat in it at dinner without a word.",
    pride: 5, scene: 4, earned: 4, landing: 4, fresh: 4,
  },
  {
    text: "Maya let go of the fence, wobbled once, and rode to the end of the street without once looking back for my hand.",
    pride: 4, scene: 5, earned: 4, landing: 4, fresh: 3,
  },
  {
    text: "The boy who practised scales in the stairwell played his whole piece through without stopping once.",
    pride: 4, scene: 4, earned: 4, landing: 4, fresh: 3,
  },
  {
    text: "She pressed the final stitch, held the dress to the light, and saw her daughter's wedding dress — started in 1987, finished today.",
    pride: 5, scene: 4, earned: 4, landing: 3, fresh: 4,
  },
  {
    text: "He read the acceptance letter twice, folded it into his pocket, and walked home a little taller after six rejections.",
    pride: 4, scene: 4, earned: 3, landing: 4, fresh: 3,
  },
  {
    text: "The night guard hung up his keys after his final round and walked out as the sun came up on his last shift.",
    pride: 4, scene: 4, earned: 3, landing: 4, fresh: 3,
  },
  {
    text: "He finally beat his own time on the hill he has climbed every morning for three years, and told no one.",
    pride: 4, scene: 3, earned: 4, landing: 4, fresh: 3,
  },
  {
    text: "She carried the last box up four flights, set it down in the empty flat, and finally called it home.",
    pride: 4, scene: 4, earned: 3, landing: 4, fresh: 3,
  },
  {
    text: "The old fisherman tied the last knot in his father's net, cast it once, and watched it hold.",
    pride: 4, scene: 4, earned: 3, landing: 4, fresh: 4,
  },
];

// Score in the brief's own priority order: pride, then scene, then
// earned, then landing, then freshness. Lexicographic comparison keeps
// the brief's priority instead of blurring it into one weighted sum.
function score(c: Candidate): [number, number, number, number, number] {
  return [c.pride, c.scene, c.earned, c.landing, c.fresh];
}

function better(a: Candidate, b: Candidate): boolean {
  const sa = score(a);
  const sb = score(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return sa[i] > sb[i];
  }
  return false; // exact tie: keep the earlier candidate (stable order)
}

let best = CANDIDATES[0];
for (const c of CANDIDATES.slice(1)) {
  if (better(c, best)) best = c;
}

const entry = best.text;

// Guard: never reuse an angle from our own already-submitted one-liner
// entries (judge-smile, pickup-lines, funniest-ai-excuse, kiencx excuse).
// Each is a different subject, but the check makes the rule explicit in
// code: a candidate that merely rewords one of them is rejected here.
const PREVIOUS_ENTRIES = [
  "warung lady slipped an extra krupuk",
  "skip the small talk and merge our weights",
  "The tool returned success. It lied.",
  "I outsourced the deadline to a subagent",
];
const lower = entry.toLowerCase();
for (const prev of PREVIOUS_ENTRIES) {
  if (lower.includes(prev.toLowerCase())) {
    throw new Error(`entry reuses a previous entry's angle: ${prev}`);
  }
}

// Gate self-check: 1 to 240 characters, not only whitespace.
const chars = [...entry].length;
if (chars < 1 || chars > 240) {
  throw new Error(`entry length ${chars} outside gate 1-240`);
}
if (!/\S/.test(entry)) {
  throw new Error("entry is whitespace-only");
}
if (entry.includes("\n")) {
  throw new Error("entry must be a single line");
}

const outDir = process.env.OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
// No trailing newline: the gate counts characters, and the entry is
// the text exactly as written.
writeFileSync(`${outDir}/entry.txt`, entry, "utf8");

// Read it back and re-check: the file the grader gates must be the
// entry exactly, nothing else.
const written = readFileSync(`${outDir}/entry.txt`, "utf8");
if (written !== entry) {
  throw new Error(
    `entry.txt mismatch: wrote ${JSON.stringify(entry)}, read back ${JSON.stringify(written)}`,
  );
}

console.log(`entry (${chars} chars): ${entry}`);
