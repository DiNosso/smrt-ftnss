// Hybride trainingsprogramma — gebaseerd op het rapport
// "Fysiologische Optimalisatie van Thuistraining voor Hypertrofie en Lichaamsrecompositie"
//
// Opzet: 3 langere sessies (45-60 min, zwaar werk dicht bij spierfalen, 2-3 min rust)
//        + korte dagelijkse snacks (5-15 min) op de overige dagen.
// Volumedoelen (rapport): borst 12-16 sets/week, biceps/triceps 8-12, core hoog-frequent.
// Progressie: double progression (reps omhoog binnen range, dan gewicht +stap).
// Deload: elke 5e week, volume x0.6 en RIR 4.

// slot: {ex: exerciseId, sets, reps: [min,max], rir, rest (sec), note?, superset? }
export const SESSIONS = {
  sessionA: {
    id: 'sessionA',
    type: 'heavy',
    name: 'Sessie A · Borst & Triceps',
    focus: ['chest', 'triceps'],
    durationMin: 50,
    description: 'Het zware drukwerk. Dumbbell presses met volledige rust (2-3 min) voor maximale mechanische spanning — het wetenschappelijk optimum uit je rapport.',
    warmup: 'Vijf minuten: armzwaaien, band pull-aparts (15x licht), 1 lichte opwarmset per eerste oefening.',
    slots: [
      { ex: 'chest_dumbbell_bench_press', sets: 4, reps: [6, 10], rir: 1, rest: 180, note: 'Hoofdlift. Diepe stretch onderin, controle omhoog.' },
      { ex: 'chest_incline_dumbbell_press', sets: 3, reps: [8, 12], rir: 2, rest: 150, note: 'Bank op 30-45°, bovenborst.' },
      { ex: 'chest_banded_push_up', sets: 2, reps: [10, 20], rir: 1, rest: 120, note: 'Finisher: constante spanning bovenin dankzij de band.' },
      { ex: 'triceps_overhead_extension', sets: 3, reps: [10, 15], rir: 2, rest: 120, ss: 'triA', note: 'Lange tricepskop op volledige rek.' },
      { ex: 'triceps_diamond_push_up', sets: 2, reps: [8, 15], rir: 1, rest: 90, ss: 'triA', note: 'Hoogste triceps-EMG volgens je rapport. Op knieën als het te zwaar wordt.' },
    ],
  },
  sessionB: {
    id: 'sessionB',
    type: 'heavy',
    name: 'Sessie B · Rug, Schouders & Biceps',
    focus: ['back', 'shoulders', 'biceps'],
    durationMin: 50,
    description: 'De trekdag: houdt je schouders gezond en je vlak in balans met al het drukwerk, plus gericht bicepswerk voor bredere armen.',
    warmup: 'Vijf minuten: band pull-aparts licht, schouderrol, 1 lichte opwarmset roeien.',
    slots: [
      { ex: 'back_dumbbell_row', sets: 4, reps: [8, 12], rir: 1, rest: 150, note: 'Eén arm, knie op het bankje. Trek naar je heup.' },
      { ex: 'shoulders_lateral_raise', sets: 3, reps: [12, 20], rir: 1, rest: 90, ss: 'shB', note: 'Licht gewicht, strakke uitvoering — breedte in je schouders.' },
      { ex: 'back_band_pull_apart', sets: 2, reps: [15, 25], rir: 2, rest: 60, ss: 'shB', note: 'Achterkant schouders, houding.' },
      { ex: 'biceps_concentration_curl', sets: 3, reps: [8, 12], rir: 1, rest: 120, note: 'Hoogste biceps-EMG uit je rapport. Elleboog tegen je dij, supineer bewust.' },
      { ex: 'biceps_hammer_curl', sets: 2, reps: [10, 15], rir: 2, rest: 90, note: 'Brachialis en onderarm — visuele breedte.' },
    ],
  },
  sessionC: {
    id: 'sessionC',
    type: 'heavy',
    name: 'Sessie C · Borst, Armen & Benen',
    focus: ['chest', 'biceps', 'triceps', 'quadriceps'],
    durationMin: 55,
    description: 'Tweede borstprikkel van de week (frequentie 2x per spiergroep) plus armen en een fundament van beenwerk zodat het geheel in balans blijft.',
    warmup: 'Vijf minuten: squat tot diep zonder gewicht, armzwaaien, lichte opwarmset press.',
    slots: [
      { ex: 'chest_incline_dumbbell_press', sets: 3, reps: [6, 10], rir: 1, rest: 180, note: 'Nu als hoofdlift — probeer iets zwaarder dan sessie A.' },
      { ex: 'chest_dumbbell_fly', sets: 2, reps: [10, 15], rir: 2, rest: 120, note: 'Diepe stretch, niet te zwaar.' },
      { ex: 'quads_goblet_squat', sets: 3, reps: [10, 15], rir: 2, rest: 150, note: 'Met kettlebell of dumbbell. Benen en core.' },
      { ex: 'biceps_incline_curl', sets: 2, reps: [8, 12], rir: 1, rest: 120, ss: 'armC', note: 'Biceps op maximale rek (bank schuin).' },
      { ex: 'triceps_band_pushdown', sets: 3, reps: [15, 25], rir: 1, rest: 90, ss: 'armC', note: 'Constante spanning, elleboogvriendelijk finisher-werk.' },
    ],
  },
  snackCore: {
    id: 'snackCore',
    type: 'snack',
    name: 'Snack · Core & Sixpack',
    focus: ['core'],
    durationMin: 12,
    description: 'Korte core-prikkel. De ab-rollout is volgens je rapport de meest impactvolle investering voor je sixpack (anti-extensie met extreme excentrische rek).',
    warmup: null,
    slots: [
      { ex: 'core_ab_wheel', sets: 3, reps: [6, 12], rir: 1, rest: 90, note: 'Vanaf de knieën, rug licht bol. Zo ver uitrollen als je gecontroleerd terug kunt.' },
      { ex: 'core_lying_leg_raise', sets: 2, reps: [10, 15], rir: 1, rest: 60, note: 'Onderrug op de mat houden.' },
      { ex: 'core_crunch', sets: 2, reps: [12, 20], rir: 1, rest: 45, note: 'Uitademen bovenin, langzaam zakken.' },
    ],
  },
  snackPump: {
    id: 'snackPump',
    type: 'snack',
    name: 'Snack · Banden & Pomp',
    focus: ['chest', 'triceps', 'back'],
    durationMin: 10,
    description: 'Exercise snack met banden: houdt je stofwisseling actief en telt mee voor je weekvolume, zonder je herstel te belasten.',
    warmup: null,
    slots: [
      { ex: 'chest_banded_push_up', sets: 2, reps: [10, 20], rir: 2, rest: 60, ss: 'pumpP' },
      { ex: 'back_band_row', sets: 2, reps: [15, 20], rir: 2, rest: 60, ss: 'pumpP' },
      { ex: 'biceps_band_curl', sets: 2, reps: [15, 25], rir: 2, rest: 45 },
    ],
  },
  snackMobility: {
    id: 'snackMobility',
    type: 'snack',
    name: 'Snack · Mobiliteit & Herstel',
    focus: ['fullBody'],
    durationMin: 10,
    description: 'Actief herstel: mobiliteit en lichte activatie. Perfect op een vermoeide dag — beweging zonder herstelkosten.',
    warmup: null,
    slots: [
      { ex: 'mobility_worlds_greatest', sets: 2, reps: [5, 8], rir: 5, rest: 30, note: 'Per kant.' },
      { ex: 'mobility_couch_stretch', sets: 2, reps: [1, 1], rir: 5, rest: 30, note: '45-60 sec per kant.' },
      { ex: 'core_dead_bug', sets: 2, reps: [8, 12], rir: 4, rest: 45 },
    ],
  },
  rest: {
    id: 'rest',
    type: 'rest',
    name: 'Rustdag',
    focus: [],
    durationMin: 0,
    description: 'Vandaag geen training. Herstel — en vooral slaap — is waar de spiergroei daadwerkelijk plaatsvindt.',
    warmup: null,
    slots: [],
  },
};

// Standaard weekindeling (dag 0 = maandag)
export const WEEK_TEMPLATE = ['sessionA', 'snackCore', 'sessionB', 'snackPump', 'sessionC', 'snackCore', 'rest'];

// Dagelijkse gewoontes (naast de geplande workout)
export const DAILY_HABITS = [
  {
    id: 'hang',
    name: 'Dagelijks hangen',
    detail: '2-3x 20-45 sec passief hangen: grip, schouderdecompressie en de basis voor pull-ups later.',
    requiresEquipment: 'pullUpBar',
    fallback: 'Geen stang thuis? Het calisthenics-rek om de hoek werkt ook — of sla over tot je een deurpost-stang hebt.',
  },
  {
    id: 'protein',
    name: 'Eiwit bij elke hoofdmaaltijd',
    detail: 'Richtlijn uit je rapport: ~2 g/kg lichaamsgewicht per dag, verdeeld over 3-5 momenten (0,3-0,4 g/kg per maaltijd).',
  },
  {
    id: 'sleep',
    name: '7+ uur slaap',
    detail: 'Het rapport is er hard over: bij <7 uur slaap verschuift gewichtsverlies van vet naar spier (tot 60% meer spierafbraak).',
  },
];

// Deload: elke 5e week
export const DELOAD_EVERY_WEEKS = 5;
export const DELOAD = { setFactor: 0.6, rirBonus: 3, note: 'Deloadweek: ~40% minder sets en ver van spierfalen. Je spieren groeien dóór terwijl gewrichten en zenuwstelsel bijtanken.' };

// Progressie (double progression)
export const PROGRESSION = {
  weightStepKg: 2,       // standaard stap omhoog als de rep-range vol is
  bodyweightNote: 'Bij lichaamsgewicht-oefeningen: verzwaar met band, verhoog reps, of vertraag het tempo (3 sec zakken).',
};
