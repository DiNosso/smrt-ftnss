// Hybride trainingsprogramma
// "Fysiologische Optimalisatie van Thuistraining voor Hypertrofie en Lichaamsrecompositie"
//
// Opzet: 3 langere sessies (45-60 min, zwaar werk dicht bij spierfalen, 2-3 min rust)
//        + korte dagelijkse snacks (5-15 min) op de overige dagen.
// Volumedoelen: borst 12-16 sets/week, biceps/triceps 8-12, core hoog-frequent.
// Progressie: double progression (reps omhoog binnen range, dan gewicht +stap).
// Deload: elke 5e week, volume x0.6 en RIR 4.

// slot: {ex: exerciseId, sets, reps: [min,max], rir, rest (sec), note?, ss?, rot? }
// sameWeightAs = zelfde dumbbell als die oefening (geen wissel in de superset); progressie via reps.
// rot = accessoire-rotatie per mesocyclus: blok 1 = ex, blok 2 = rot[0], blok 3 = rot[1], dan weer ex.
// Compounds (bank, row A, press) blijven vast — daar bouw je op; accessoires wisselen voor variatie zonder progressie te verliezen.
export const SESSIONS = {
  sessionA: {
    id: 'sessionA',
    type: 'heavy',
    name: 'Sessie A · Vol lichaam',
    short: 'Vol lichaam A',
    focus: ['chest', 'back', 'shoulders', 'biceps', 'hamstrings', 'core'],
    durationMin: 58,
    description: 'Vol lichaam met de nadruk op bovenlichaam. Je quadriceps krijgen al flink werk van het fietsen; je hamstrings en billen niet — fietsen is quad-dominant. Daarom blijft de heupscharnier erin en gaat de squat eruit.',
    warmup: null,
    slots: [
      // Supersetregel (jouw verstelbare dumbbells): binnen een superset wordt nooit van
      // gewicht of bankstand gewisseld. Óf de partner gebruikt geen dumbbells (band,
      // lichaamsgewicht, ab wheel), óf hij pakt dezelfde dumbbell (sameWeightAs).
      { ex: 'chest_dumbbell_bench_press', sets: 4, reps: [8, 12], rir: 1, rest: 75, ss: 'ab1', note: 'Hoofdlift. Superset met de row: terwijl je borst werkt, rust je rug.' },
      { ex: 'back_dumbbell_row', sets: 4, reps: [10, 15], rir: 1, rest: 75, ss: 'ab1', sameWeightAs: 'chest_dumbbell_bench_press', note: 'Per arm, met dezelfde dumbbell als het bankdrukken — niet wisselen. Je rug is sterker dan je borst, dus je haalt hier meer reps; ga richting 15 en tot RIR 1.' },
      { ex: 'hams_stiff_leg_deadlift', sets: 3, reps: [10, 15], rir: 2, rest: 120, note: 'Heupscharnier — het enige beenwerk dat fietsen níét dekt. Rug recht, rek in de hamstrings.', rot: ['hams_dumbbell_rdl', 'glutes_dumbbell_sumo_deadlift'] },
      { ex: 'shoulders_dumbbell_press', sets: 3, reps: [8, 12], rir: 1, rest: 60, ss: 'ab2', note: 'Zittend met rugsteun.' },
      { ex: 'core_ab_wheel', sets: 3, reps: [6, 12], rir: 2, rest: 60, ss: 'ab2', note: 'Vanaf de knieën, rug mag niet doorzakken. Geen dumbbells: de bank kan blijven staan.', rot: ['core_v_up', 'core_hollow_hold'] },
      { ex: 'biceps_hammer_curl', sets: 3, reps: [10, 15], rir: 0, rest: 60, ss: 'ab3', note: 'Neutrale greep. Laatste set tot spierfalen — je RIR-ijkpunt.', rot: ['biceps_zottman_curl', 'biceps_cross_body_hammer_curl'] },
      { ex: 'triceps_bench_dip', sets: 3, reps: [10, 20], rir: 0, rest: 60, ss: 'ab3', note: 'Handen op de bankrand, geen dumbbells nodig. Te makkelijk? Benen op een verhoging of een dumbbell op schoot.', rot: ['triceps_close_grip_push_up', 'triceps_band_overhead_extension'] },
      { ex: 'shoulders_lateral_raise', sets: 3, reps: [12, 20], rir: 0, rest: 45, ss: 'ab4', note: 'Licht gewicht, tot spierfalen.', rot: ['shoulders_seated_lateral_raise', 'shoulders_y_raise'] },
      { ex: 'back_band_w_raise', sets: 3, reps: [15, 20], rir: 1, rest: 45, ss: 'ab4', note: 'Band, dus geen wissel. Achterkant schouders tegenover de zijkant.', rot: ['back_band_pull_apart', 'shoulders_band_lateral_raise'] },
    ],
  },
  sessionB: {
    id: 'sessionB',
    type: 'heavy',
    name: 'Sessie B · Vol lichaam',
    short: 'Vol lichaam B',
    focus: ['chest', 'back', 'shoulders', 'triceps', 'glutes', 'biceps'],
    durationMin: 58,
    description: 'Zelfde bewegingspatronen als A, andere oefeningen: schuin drukken in plaats van vlak, hip thrust in plaats van deadlift. Zo krijgt elke spiergroep twee keer per week een prikkel.',
    warmup: null,
    slots: [
      { ex: 'chest_incline_dumbbell_press', sets: 4, reps: [8, 12], rir: 1, rest: 75, ss: 'ab5', note: 'Bank op 30°. Superset met de row, zonder wissel.' },
      { ex: 'back_dumbbell_row', sets: 4, reps: [12, 15], rir: 1, rest: 75, ss: 'ab5', sameWeightAs: 'chest_incline_dumbbell_press', note: 'Dezelfde dumbbell als het schuin drukken; steun met je vrije hand op de schuine bank. Hoger repbereik dan in sessie A.', rot: ['back_bent_over_dumbbell_row', 'back_gorilla_row'] },
      { ex: 'glutes_single_leg_hip_thrust', sets: 3, reps: [10, 15], rir: 2, rest: 90, note: 'Billen en hamstrings — de achterkant die fietsen laat liggen. Knijp bovenin aan.', rot: ['glutes_single_leg_glute_bridge', 'hams_dumbbell_rdl'] },
      { ex: 'shoulders_arnold_press', sets: 3, reps: [8, 12], rir: 1, rest: 60, ss: 'ab6', note: 'Draai de dumbbells tijdens het drukken.' },
      { ex: 'back_band_pull_apart', sets: 3, reps: [15, 20], rir: 1, rest: 60, ss: 'ab6', note: 'Band — geen wissel. Achterkant schouders houdt je schouders gezond bij al dat drukwerk.', rot: ['shoulders_band_lateral_raise', 'back_band_lat_pulldown'] },
      { ex: 'biceps_incline_curl', sets: 3, reps: [8, 12], rir: 1, rest: 60, ss: 'ab7', note: 'Op de schuine bank, armen achter je lichaam voor extra rek.', rot: ['biceps_spider_curl', 'biceps_waiter_curl'] },
      { ex: 'triceps_band_overhead_extension', sets: 3, reps: [12, 20], rir: 0, rest: 60, ss: 'ab7', note: 'Band achter je hoofd, geen dumbbell nodig. Bank blijft staan.', rot: ['triceps_close_grip_push_up', 'triceps_bench_dip'] },
      { ex: 'core_lying_leg_raise', sets: 3, reps: [10, 15], rir: 1, rest: 60, note: 'Onderrug tegen de vloer houden.', rot: ['core_scissor_kick', 'core_toe_touch_crunch'] },
    ],
  },
  snackCore: {
    id: 'snackCore',
    type: 'snack',
    name: 'Snack · Core & Sixpack',
    short: 'Core',
    focus: ['core'],
    durationMin: 12,
    description: 'Korte core-prikkel. De ab-rollout is de meest impactvolle investering voor je sixpack (anti-extensie met extreme excentrische rek).',
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
      { ex: 'mobility_thoracic_bridge', sets: 2, reps: [5, 8], rir: 5, rest: 30, note: 'Per kant. Open je borst, reik ver over je hoofd.' },
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
 * in. Korte, bewegende oefeningen kosten je niets en warmen wel op.
 * Rekken doe je na de training, niet ervoor.
 */
// Warming-up: RAMP, allemaal dynamisch. Statisch rekken vóór het trainen kost kracht
// en levert niets op; bewegend opwarmen wél. Elk onderdeel heeft een regio, zodat
// een sessie zonder beenwerk ook geen been-warming-up krijgt.
//   region: 'all' | 'legs' | 'upper'
export const WARMUP = [
  { id: 'wu_raise', name: 'Op temperatuur komen', sec: 90, fase: 'Raise', region: 'all',
    detail: 'Touwtjespringen, jumping jacks of stevig de trap op en af. Doel: licht buiten adem, warme spieren.',
    why: 'Spiertemperatuur is het belangrijkste dat een warming-up doet — daar komt vrijwel het hele effect vandaan.' },
  { id: 'wu_legswing', name: 'Beenzwaaien', sec: 60, fase: 'Mobilise', region: 'legs', ex: 'mobility_leg_swing',
    detail: '8x zijwaarts en 8x voor-achter per been. Rustig groter worden, niet forceren.',
    why: 'Brengt je heupen door hun volledige bereik zonder ze te verzwakken.' },
  { id: 'wu_hipcircle', name: 'Heupcirkels', sec: 45, fase: 'Mobilise', region: 'legs', ex: 'mobility_hip_circle',
    detail: '6 cirkels per richting, per been.',
    why: 'Opent de heup voor deadlift en hip thrust.' },
  { id: 'wu_squat', name: 'Squat zonder gewicht', sec: 45, fase: 'Mobilise', region: 'legs', ex: 'quads_air_squat',
    detail: '10 langzame squats tot een diepte die comfortabel voelt.',
    why: 'Je oefent het patroon vast in, zonder belasting.' },
  { id: 'wu_shoulder', name: 'Schoudercirkels', sec: 45, fase: 'Mobilise', region: 'upper', ex: 'mobility_shoulder_circle',
    detail: '10 grote cirkels voorwaarts, 10 achterwaarts.',
    why: 'Warmt het schoudergewricht op voor druk- en trekwerk.' },
  { id: 'wu_band', name: 'Band pull-apart + doorhalen', sec: 60, fase: 'Activate', region: 'upper', ex: 'back_band_pull_apart',
    detail: '12x pull-apart, daarna 8x de band over je hoofd naar achteren en terug.',
    why: 'Maakt je schouders klaar voor drukwerk en pakt meteen de achterkant aan die bij thuistrainen vaak achterblijft.' },
  { id: 'wu_catcow', name: 'Kat-koe', sec: 45, fase: 'Mobilise', region: 'all', ex: 'mobility_cat_cow',
    detail: '8x bol, 8x hol, in het tempo van je adem. Doorbewegen, nergens vasthouden — dan is het mobilisatie, geen stretch.',
    why: 'Maakt je rug en borstwervels los voor het drukken en roeien. Vastgehouden rek hoort bij de cooling-down.' },
  { id: 'wu_pushup', name: 'Push-ups', sec: 45, fase: 'Potentiate', region: 'upper', ex: 'chest_push_up',
    detail: '8-10 rustige push-ups. Op je knieën mag ook.',
    why: 'Belast het drukpatroon licht voor je aan het echte werk begint.' },
  { id: 'wu_ramp', name: 'Opwarmsets eerste oefening', sec: 120, fase: 'Potentiate', region: 'all', rampSets: true,
    detail: null,
    why: 'Twee opwarmsets is genoeg. Meer kost alleen energie: bij trainen rond de 10 herhalingen maakt extra opwarmen nauwelijks verschil.' },
];

// Cooling-down: hier hoort het statische rekken wél. Na de training kost het geen
// kracht meer, en 30-60 s per stretch is het moment om bewegingsbereik te winnen.
// (Spierpijn voorkomt het niet — dat doet niets — maar stijfheid en houding wel.)
export const COOLDOWN = [
  { id: 'cd_child', name: 'Kindhouding', sec: 45, region: 'all', ex: 'mobility_child_pose',
    detail: 'Armen ver naar voren, adem diep in je rug.', why: 'Ontspant onderrug en lats na roeien en deadliften.' },
  { id: 'cd_downdog', name: 'Downward dog', sec: 45, region: 'all', ex: 'mobility_downward_dog',
    detail: 'Hielen richting de vloer duwen, borst richting dijen.', why: 'Schouders, kuiten en hamstrings in één.' },
  { id: 'cd_hams', name: 'Hamstrings', sec: 45, region: 'legs', ex: 'mobility_hamstring_stretch',
    detail: 'Voorover hangen, benen bijna gestrekt. Zwaarte doet het werk.', why: 'De achterkant die van fietsen en deadliften kort wordt.' },
  { id: 'cd_quad', name: 'Quads', sec: 45, region: 'legs', ex: 'mobility_standing_quad_stretch',
    detail: 'Hiel naar bil, heup naar voren. Per kant.', why: 'Voorkant dij, na squat-werk en fietsen.' },
  { id: 'cd_hipflexor', name: 'Heupbuigers', sec: 45, region: 'legs', ex: 'mobility_couch_stretch',
    detail: 'Kniel, duw de heup naar voren. Per kant.', why: 'Tegengif voor een dag zitten en een dag fietsen.' },
  { id: 'cd_thoracic', name: 'Borstwervel-brug', sec: 45, region: 'upper', ex: 'mobility_thoracic_bridge',
    detail: 'Open je borst, reik ver over je hoofd. Per kant.', why: 'Opent de borst na al het drukwerk.' },
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
    detail: 'Richtlijn: ~2 g/kg lichaamsgewicht per dag, verdeeld over 3-5 momenten (0,3-0,4 g/kg per maaltijd).',
  },
  {
    id: 'sleep',
    name: '7+ uur slaap',
    detail: 'bij <7 uur slaap verschuift gewichtsverlies van vet naar spier (tot 60% meer spierafbraak).',
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
