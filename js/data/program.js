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
    name: 'Sessie A · Vol lichaam',
    short: 'Vol lichaam A',
    focus: ['quadriceps', 'hamstrings', 'chest', 'back', 'shoulders', 'biceps', 'core'],
    durationMin: 52,
    description: 'Vol lichaam in één sessie. Bij twee keer per week is dat de enige indeling waarbij elke spiergroep genoeg volume én genoeg frequentie krijgt — een split komt bij 2x/week neer op minder dan één keer per week per spiergroep.',
    warmup: null,
    slots: [
      { ex: 'quads_goblet_squat', sets: 3, reps: [8, 12], rir: 2, rest: 150, note: 'Zwaarste beenoefening: rustig zakken, borst omhoog.' },
      { ex: 'hams_stiff_leg_deadlift', sets: 3, reps: [10, 15], rir: 2, rest: 150, note: 'Heupscharnier. Rug recht, dumbbells langs de benen, rek in de hamstrings.' },
      { ex: 'chest_dumbbell_bench_press', sets: 3, reps: [8, 12], rir: 1, rest: 75, ss: 'ab1', note: 'Superset met de row: terwijl je borst werkt, rust je rug.' },
      { ex: 'back_dumbbell_row', sets: 3, reps: [10, 12], rir: 1, rest: 75, ss: 'ab1', note: 'Per arm. Trek met je elleboog, niet met je hand.' },
      { ex: 'shoulders_lateral_raise', sets: 2, reps: [12, 20], rir: 0, rest: 60, ss: 'ab2', note: 'Licht gewicht, tot spierfalen. Dit is je RIR-ijkpunt.' },
      { ex: 'biceps_hammer_curl', sets: 2, reps: [10, 15], rir: 0, rest: 60, ss: 'ab2', note: 'Neutrale greep, ook goed voor je onderarmen.' },
      { ex: 'core_ab_wheel', sets: 2, reps: [6, 12], rir: 2, rest: 60, note: 'Vanaf de knieën. Rug mag niet doorzakken.' },
    ],
  },
  sessionB: {
    id: 'sessionB',
    type: 'heavy',
    name: 'Sessie B · Vol lichaam',
    short: 'Vol lichaam B',
    focus: ['quadriceps', 'glutes', 'chest', 'back', 'shoulders', 'triceps'],
    durationMin: 52,
    description: 'Dezelfde bewegingspatronen als A, maar met andere oefeningen: eenbenig in plaats van tweebenig, schuin drukken in plaats van vlak. Zo krijgt elke spiergroep twee keer per week een prikkel zonder dat het eentonig wordt.',
    warmup: null,
    slots: [
      { ex: 'quads_bulgarian_split_squat', sets: 3, reps: [8, 12], rir: 2, rest: 120, note: 'Per been. Achterste voet op de bank, gewicht op je voorste hiel.' },
      { ex: 'glutes_single_leg_hip_thrust', sets: 3, reps: [10, 15], rir: 2, rest: 120, note: 'Schouders op de bank, knijp bovenin je billen aan.' },
      { ex: 'chest_incline_dumbbell_press', sets: 3, reps: [8, 12], rir: 1, rest: 75, ss: 'ab3', note: 'Bank op 30°. Superset met de row.' },
      { ex: 'back_dumbbell_row', sets: 3, reps: [12, 15], rir: 1, rest: 75, ss: 'ab3', note: 'Hoger repbereik dan in sessie A.' },
      { ex: 'shoulders_dumbbell_press', sets: 2, reps: [8, 12], rir: 1, rest: 60, ss: 'ab4', note: 'Zittend met rugsteun.' },
      { ex: 'triceps_overhead_extension', sets: 2, reps: [10, 15], rir: 0, rest: 60, ss: 'ab4', note: 'Volledige rek boven je hoofd. Laatste set tot spierfalen.' },
      { ex: 'back_band_pull_apart', sets: 2, reps: [15, 20], rir: 1, rest: 45, note: 'Achterkant schouders — houdt je schouders gezond bij al dat drukwerk.' },
    ],
  },
  snackCore: {
    id: 'snackCore',
    type: 'snack',
    name: 'Snack · Core & Sixpack',
    short: 'Core',
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
    short: 'Banden',
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
    short: 'Mobiliteit',
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
/**
 * Begeleide warming-up volgens RAMP (Raise, Activate, Mobilise, Potentiate).
 * Ongeveer 7 minuten. Bewust geen lange statische rekoefeningen vooraf: houd
 * je een spier 60 seconden of langer op rek, dan lever je daarna ~4,6% kracht
 * in (Behm 2016). Korte, bewegende oefeningen kosten je niets en warmen wel op.
 * Rekken doe je na de training, niet ervoor.
 */
export const WARMUP = [
  { id: 'wu_raise', name: 'Op temperatuur komen', sec: 90, fase: 'Raise',
    detail: 'Touwtjespringen, jumping jacks of stevig de trap op en af. Doel: licht buiten adem, warme spieren.',
    why: 'Spiertemperatuur is het belangrijkste dat een warming-up doet — daar komt vrijwel het hele effect vandaan.' },
  { id: 'wu_legswing', name: 'Beenzwaaien', sec: 60, fase: 'Mobilise',
    detail: '8x voor-achter en 8x zijwaarts per been. Rustig groter worden, niet forceren.', ex: null,
    why: 'Brengt je heupen door hun volledige bereik zonder ze te verzwakken.' },
  { id: 'wu_squat', name: 'Squat zonder gewicht', sec: 45, fase: 'Mobilise', ex: 'quads_goblet_squat',
    detail: '10 langzame squats tot een diepte die comfortabel voelt.',
    why: 'Je oefent het patroon vast in, zonder belasting.' },
  { id: 'wu_band', name: 'Band pull-apart + doorhalen', sec: 60, fase: 'Activate', ex: 'back_band_pull_apart',
    detail: '12x pull-apart, daarna 8x de band over je hoofd naar achteren en terug.',
    why: 'Maakt je schouders klaar voor drukwerk en pakt meteen de achterkant aan die bij thuistrainen vaak achterblijft.' },
  { id: 'wu_greatest', name: 'Werelds beste stretch', sec: 60, fase: 'Mobilise', ex: 'mobility_worlds_greatest',
    detail: '5x per kant, in beweging blijven — niet stilhouden.',
    why: 'Borstwervelkolom en heupbuigers los, precies wat je nodig hebt voor squats en drukken.' },
  { id: 'wu_pushup', name: 'Push-ups', sec: 45, fase: 'Potentiate', ex: 'chest_push_up',
    detail: '8-10 rustige push-ups. Op je knieën mag ook.',
    why: 'Belast het drukpatroon licht voor je aan het echte werk begint.' },
  { id: 'wu_ramp', name: 'Opwarmsets eerste oefening', sec: 120, fase: 'Potentiate', rampSets: true,
    detail: null,
    why: 'Twee opwarmsets is genoeg. Meer kost alleen energie: bij trainen rond de 10 herhalingen maakt extra opwarmen nauwelijks verschil (Enes 2025).' },
];

export const WEEK_TEMPLATE = ['sessionA', 'snackCore', 'rest', 'sessionB', 'snackPump', 'rest', 'rest'];

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
