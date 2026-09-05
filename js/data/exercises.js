// Automatisch gegenereerd uit ExerciseLibrary.swift + aanvullingen uit trainingsrapport
// clip:true  = echte video-loop (6 s, MP4) in assets/clips/<id>.mp4 — hoogste kwaliteit
// demo:true  = 2-frame demo-animatie in assets/demos/<id>/ (terugval)
// video      = YouTube-uitleg; videoSrc:'bb' = korte clip uit de Bodybuilding.com-database
export const EXERCISES = [
 {
  "id": "chest_barbell_bench_press",
  "name": "Barbell Bench Press",
  "nameNL": "Bankdrukken",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders"
  ],
  "equipment": [
   "barbell",
   "bench"
  ],
  "difficulty": 3,
  "video": "vcBig73ojpE",
  "instructions": "Lig op een vlakke bank. Pak de stang op schouderbreedte. Laat zakken tot borst, druk omhoog.",
  "recoveryHours": 48
 },
 {
  "id": "chest_dumbbell_bench_press",
  "dumbbells": 2,
  "name": "Dumbbell Bench Press",
  "nameNL": "Dumbbell Bankdrukken",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders"
  ],
  "equipment": [
   "dumbbells",
   "bench"
  ],
  "difficulty": 2,
  "video": "Vc63DPUoA40",
  "instructions": "Lig op een vlakke bank met dumbbells. Druk omhoog, laat gecontroleerd zakken.",
  "recoveryHours": 48,
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "chest_incline_barbell_press",
  "name": "Incline Barbell Press",
  "nameNL": "Schuine Bankdrukken",
  "muscle": "chest",
  "secondary": [
   "shoulders",
   "triceps"
  ],
  "equipment": [
   "barbell",
   "inclineBench"
  ],
  "difficulty": 3,
  "video": "SrqOu55lrYU",
  "instructions": "Stel bank in op 30-45 graden. Druk stang omhoog vanaf bovenborst.",
  "recoveryHours": 48
 },
 {
  "id": "chest_incline_dumbbell_press",
  "dumbbells": 2,
  "name": "Incline Dumbbell Press",
  "nameNL": "Schuine Dumbbell Press",
  "muscle": "chest",
  "secondary": [
   "shoulders",
   "triceps"
  ],
  "equipment": [
   "dumbbells",
   "inclineBench"
  ],
  "difficulty": 2,
  "video": "DnV3R4vp3K0",
  "instructions": "Stel bank in op 30-45 graden. Druk dumbbells omhoog met lichte boog.",
  "recoveryHours": 48,
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "chest_dumbbell_fly",
  "clip": true,
  "dumbbells": 2,
  "name": "Dumbbell Fly",
  "nameNL": "Dumbbell Fly",
  "muscle": "chest",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "dumbbells",
   "bench"
  ],
  "difficulty": 2,
  "video": "QwuUZ5wgQOk",
  "instructions": "Lig op bank, armen gestrekt boven borst. Open armen in boog, breng terug.",
  "recoveryHours": 36,
  "demo": true,
  "videoSrc": "bb"
 },
 {
  "id": "chest_cable_crossover",
  "name": "Cable Crossover",
  "nameNL": "Kabel Crossover",
  "muscle": "chest",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "JUDTGZh4rhg",
  "instructions": "Sta tussen twee kabels. Trek handgrepen naar elkaar toe voor je borst.",
  "recoveryHours": 36
 },
 {
  "id": "chest_pec_deck",
  "name": "Pec Deck Machine",
  "nameNL": "Pec Deck",
  "muscle": "chest",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "pecDeck"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Zit in de machine, armen op schouderhoogte. Breng armen samen voor borst.",
  "recoveryHours": 36
 },
 {
  "id": "chest_push_up",
  "name": "Push-Up",
  "nameNL": "Push-up",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders",
   "core"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "wxhNoKZlfY8",
  "instructions": "Plankpositie, handen op schouderbreedte. Zak tot borst bijna grond raakt, druk omhoog.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "chest_dip",
  "name": "Chest Dip",
  "nameNL": "Dip (Borst)",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders"
  ],
  "equipment": [
   "dipStation"
  ],
  "difficulty": 3,
  "video": "yN6Q1UI_xkE",
  "instructions": "Hang aan dip bars, leun licht voorover. Zak tot 90 graden, druk omhoog.",
  "recoveryHours": 48,
  "altEquipment": [
   "gymnRings"
  ]
 },
 {
  "id": "chest_machine_press",
  "name": "Chest Press Machine",
  "nameNL": "Chest Press Machine",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders"
  ],
  "equipment": [
   "chestPress"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Zit in de machine, druk handgrepen naar voren. Gecontroleerd terug.",
  "recoveryHours": 36
 },
 {
  "id": "chest_decline_bench_press",
  "name": "Decline Bench Press",
  "nameNL": "Decline Bankdrukken",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders"
  ],
  "equipment": [
   "barbell",
   "bench"
  ],
  "difficulty": 3,
  "video": "LfyQBUKR8SE",
  "instructions": "Lig op dalende bank. Pak stang op schouderbreedte, laat zakken tot onderborst, druk omhoog.",
  "recoveryHours": 48
 },
 {
  "id": "chest_svend_press",
  "name": "Svend Press",
  "nameNL": "Svend Press",
  "muscle": "chest",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Druk twee platen of handpalmen voor borst samen. Duw naar voren met constante spanning.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "back_barbell_row",
  "name": "Barbell Row",
  "nameNL": "Barbell Row",
  "muscle": "back",
  "secondary": [
   "biceps",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 3,
  "video": "axoeDmW0oAY",
  "instructions": "Buig voorover met rechte rug. Trek stang naar buik, kneep schouderbladen samen.",
  "recoveryHours": 48
 },
 {
  "id": "back_dumbbell_row",
  "name": "Dumbbell Row",
  "nameNL": "Dumbbell Row",
  "muscle": "back",
  "secondary": [
   "biceps"
  ],
  "equipment": [
   "dumbbells",
   "bench"
  ],
  "difficulty": 2,
  "video": "PgpQ4-jHiq4",
  "instructions": "Eén hand en knie op bank. Trek dumbbell naar heup, kneep schouderblad.",
  "recoveryHours": 36,
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "back_lat_pulldown",
  "name": "Lat Pulldown",
  "nameNL": "Lat Pulldown",
  "muscle": "back",
  "secondary": [
   "biceps"
  ],
  "equipment": [
   "latPulldown"
  ],
  "difficulty": 2,
  "video": "CAwf7n6Luuc",
  "instructions": "Pak stang brede grip. Trek naar bovenborst, controleer terug.",
  "recoveryHours": 36
 },
 {
  "id": "back_pull_up",
  "name": "Pull-Up",
  "nameNL": "Pull-up",
  "muscle": "back",
  "secondary": [
   "biceps",
   "forearms"
  ],
  "equipment": [
   "pullUpBar"
  ],
  "difficulty": 4,
  "video": "HuuyDNGrCI8",
  "instructions": "Hang aan stang met brede grip. Trek kin boven stang, gecontroleerd zakken.",
  "recoveryHours": 48,
  "demo": true
 },
 {
  "id": "back_chin_up",
  "name": "Chin-Up",
  "nameNL": "Chin-up",
  "muscle": "back",
  "secondary": [
   "biceps"
  ],
  "equipment": [
   "pullUpBar"
  ],
  "difficulty": 3,
  "video": "bZ6Ysk9jf6E",
  "instructions": "Hang aan stang met onderhandse grip. Trek kin boven stang.",
  "recoveryHours": 48,
  "demo": true
 },
 {
  "id": "back_seated_cable_row",
  "name": "Seated Cable Row",
  "nameNL": "Seated Row",
  "muscle": "back",
  "secondary": [
   "biceps",
   "core"
  ],
  "equipment": [
   "seatedRow"
  ],
  "difficulty": 2,
  "video": "sP_4vybjVJs",
  "instructions": "Zit rechtop, voeten op platform. Trek handgreep naar buik, kneep schouderbladen.",
  "recoveryHours": 36,
  "altEquipment": [
   "cableMachine"
  ]
 },
 {
  "id": "back_deadlift",
  "name": "Deadlift",
  "nameNL": "Deadlift",
  "muscle": "back",
  "secondary": [
   "hamstrings",
   "glutes",
   "core",
   "forearms"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 5,
  "video": "VL5Ab0T07e4",
  "instructions": "Sta voor stang, voeten heupbreed. Pak stang, til op met rechte rug. Heupen door.",
  "recoveryHours": 72,
  "tips": "Hou rug recht! Begin met licht gewicht om techniek te perfectioneren."
 },
 {
  "id": "back_cable_face_pull",
  "name": "Face Pull",
  "nameNL": "Face Pull",
  "muscle": "back",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 1,
  "video": "V8dZ3pyiCBo",
  "instructions": "Kabel op gezichtshoogte. Trek touw naar gezicht, draai handen naar buiten.",
  "recoveryHours": 24
 },
 {
  "id": "back_tbar_row",
  "name": "T-Bar Row",
  "nameNL": "T-Bar Row",
  "muscle": "back",
  "secondary": [
   "biceps",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 3,
  "video": null,
  "instructions": "Plaats stang in hoek. Buig voorover, trek stang naar borst.",
  "recoveryHours": 48
 },
 {
  "id": "back_inverted_row",
  "name": "Inverted Row",
  "nameNL": "Inverted Row",
  "muscle": "back",
  "secondary": [
   "biceps",
   "core"
  ],
  "equipment": [
   "smithMachine"
  ],
  "difficulty": 2,
  "video": "Fl0UMfdEzsE",
  "instructions": "Hang onder een stang, lichaam recht. Trek borst naar stang, kneep schouderbladen.",
  "recoveryHours": 36,
  "altEquipment": [
   "gymnRings",
   "trxStraps"
  ]
 },
 {
  "id": "back_straight_arm_pulldown",
  "name": "Straight Arm Pulldown",
  "nameNL": "Straight Arm Pulldown",
  "muscle": "back",
  "secondary": [
   "core"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "soX7zhZ7yfQ",
  "instructions": "Sta voor hoge kabel. Trek stang met gestrekte armen naar bovenbenen.",
  "recoveryHours": 36
 },
 {
  "id": "back_pendlay_row",
  "name": "Pendlay Row",
  "nameNL": "Pendlay Row",
  "muscle": "back",
  "secondary": [
   "biceps",
   "core",
   "hamstrings"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 4,
  "video": "h4nkoayPFWw",
  "instructions": "Buig voorover tot torso horizontaal. Trek stang explosief naar borst, laat terug naar grond.",
  "recoveryHours": 48
 },
 {
  "id": "shoulders_overhead_press",
  "name": "Overhead Press",
  "nameNL": "Overhead Press",
  "muscle": "shoulders",
  "secondary": [
   "triceps",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 3,
  "video": "_RlRDWO2jfg",
  "instructions": "Sta rechtop, stang op borsthoogte. Druk recht omhoog boven hoofd.",
  "recoveryHours": 48
 },
 {
  "id": "shoulders_dumbbell_press",
  "dumbbells": 2,
  "name": "Dumbbell Shoulder Press",
  "nameNL": "Dumbbell Shoulder Press",
  "muscle": "shoulders",
  "secondary": [
   "triceps"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 2,
  "video": "qEwKCR5JCog",
  "instructions": "Zit of sta, dumbbells op schouderhoogte. Druk omhoog, laat zakken.",
  "recoveryHours": 48,
  "demo": true,
  "clip": true
 },
 {
  "id": "shoulders_lateral_raise",
  "dumbbells": 2,
  "name": "Lateral Raise",
  "nameNL": "Lateral Raise",
  "muscle": "shoulders",
  "secondary": [],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 1,
  "video": "LT1Eo-q58yg",
  "instructions": "Sta rechtop, dumbbells langs lichaam. Til zijwaarts op tot schouderhoogte.",
  "recoveryHours": 24,
  "altEquipment": [
   "cableMachine"
  ],
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "shoulders_front_raise",
  "dumbbells": 2,
  "name": "Front Raise",
  "nameNL": "Front Raise",
  "muscle": "shoulders",
  "secondary": [],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 1,
  "video": "-t7fuZ0KhDA",
  "instructions": "Sta rechtop, til dumbbells naar voren op tot schouderhoogte.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "shoulders_reverse_fly",
  "clip": true,
  "dumbbells": 2,
  "name": "Reverse Fly",
  "nameNL": "Reverse Fly",
  "muscle": "shoulders",
  "secondary": [
   "back"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Buig voorover, armen hangen. Til dumbbells zijwaarts, kneep schouderbladen.",
  "recoveryHours": 24,
  "altEquipment": [
   "cableMachine"
  ],
  "demo": true
 },
 {
  "id": "shoulders_machine_press",
  "name": "Machine Shoulder Press",
  "nameNL": "Shoulder Press Machine",
  "muscle": "shoulders",
  "secondary": [
   "triceps"
  ],
  "equipment": [
   "shoulderPress"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Zit in machine, druk handgrepen omhoog. Gecontroleerd terug.",
  "recoveryHours": 36
 },
 {
  "id": "shoulders_upright_row",
  "name": "Upright Row",
  "nameNL": "Upright Row",
  "muscle": "shoulders",
  "secondary": [
   "biceps"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Sta rechtop, trek stang/dumbbells omhoog langs lichaam tot kinhoogte.",
  "recoveryHours": 36,
  "altEquipment": [
   "dumbbells"
  ]
 },
 {
  "id": "shoulders_arnold_press",
  "dumbbells": 2,
  "name": "Arnold Press",
  "nameNL": "Arnold Press",
  "muscle": "shoulders",
  "secondary": [
   "triceps"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 3,
  "video": "X60-yTMOJfw",
  "instructions": "Begin met dumbbells voor gezicht (ondergreep). Draai en druk omhoog.",
  "recoveryHours": 48,
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "shoulders_cable_lateral_raise",
  "name": "Cable Lateral Raise",
  "nameNL": "Kabel Lateral Raise",
  "muscle": "shoulders",
  "secondary": [],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "Z5FA9aq3L6A",
  "instructions": "Sta naast lage kabel. Trek handgreep zijwaarts omhoog tot schouderhoogte.",
  "recoveryHours": 24
 },
 {
  "id": "shoulders_landmine_press",
  "name": "Landmine Press",
  "nameNL": "Landmine Press",
  "muscle": "shoulders",
  "secondary": [
   "chest",
   "triceps",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 3,
  "video": null,
  "instructions": "Stang in hoek, pak bovenkant met één hand. Druk omhoog en naar voren.",
  "recoveryHours": 48
 },
 {
  "id": "biceps_barbell_curl",
  "name": "Barbell Curl",
  "nameNL": "Barbell Curl",
  "muscle": "biceps",
  "secondary": [
   "forearms"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 2,
  "video": "QZEqB6wUPxQ",
  "instructions": "Sta rechtop, pak stang op schouderbreedte. Curl omhoog, langzaam zakken.",
  "recoveryHours": 36,
  "altEquipment": [
   "ezBar"
  ]
 },
 {
  "id": "biceps_dumbbell_curl",
  "dumbbells": 2,
  "name": "Dumbbell Curl",
  "nameNL": "Dumbbell Curl",
  "muscle": "biceps",
  "secondary": [
   "forearms"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 1,
  "video": "sAq_ocpRh_I",
  "instructions": "Sta of zit, curl dumbbells omhoog. Draai handpalmen naar boven.",
  "recoveryHours": 36,
  "demo": true,
  "clip": true
 },
 {
  "id": "biceps_hammer_curl",
  "dumbbells": 2,
  "name": "Hammer Curl",
  "nameNL": "Hammer Curl",
  "muscle": "biceps",
  "secondary": [
   "forearms"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 1,
  "video": "0IAM2YtviQY",
  "instructions": "Sta rechtop, dumbbells neutrale grip (duimen omhoog). Curl omhoog.",
  "recoveryHours": 36,
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "biceps_preacher_curl",
  "name": "Preacher Curl",
  "nameNL": "Preacher Curl",
  "muscle": "biceps",
  "secondary": [],
  "equipment": [
   "ezBar"
  ],
  "difficulty": 2,
  "video": "fIWP-FRFNU0",
  "instructions": "Armen op preacher pad. Curl gewicht omhoog, langzaam zakken.",
  "recoveryHours": 36,
  "altEquipment": [
   "dumbbells"
  ]
 },
 {
  "id": "biceps_cable_curl",
  "name": "Cable Curl",
  "nameNL": "Kabel Curl",
  "muscle": "biceps",
  "secondary": [
   "forearms"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Sta voor lage kabel. Curl handgreep omhoog, houd ellebogen vast.",
  "recoveryHours": 36
 },
 {
  "id": "biceps_concentration_curl",
  "name": "Concentration Curl",
  "nameNL": "Concentration Curl",
  "muscle": "biceps",
  "secondary": [],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 2,
  "video": "ZcU2hN76UyA",
  "instructions": "Zit op bank, elleboog tegen binnenkant dij. Curl dumbbell omhoog.",
  "recoveryHours": 36,
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "biceps_incline_curl",
  "dumbbells": 2,
  "name": "Incline Dumbbell Curl",
  "nameNL": "Incline Dumbbell Curl",
  "muscle": "biceps",
  "secondary": [],
  "equipment": [
   "dumbbells",
   "inclineBench"
  ],
  "difficulty": 2,
  "video": "soxrZlIl35U",
  "instructions": "Lig op schuine bank (45 graden). Laat armen hangen, curl dumbbells omhoog.",
  "recoveryHours": 36,
  "demo": true,
  "clip": true
 },
 {
  "id": "biceps_spider_curl",
  "dumbbells": 2,
  "name": "Spider Curl",
  "nameNL": "Spider Curl",
  "muscle": "biceps",
  "secondary": [],
  "equipment": [
   "dumbbells",
   "inclineBench"
  ],
  "difficulty": 2,
  "video": "BsE9zhhTU1A",
  "instructions": "Leun met borst op schuine bank (omgekeerd). Laat armen hangen, curl omhoog.",
  "recoveryHours": 36,
  "altEquipment": [
   "ezBar"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "triceps_cable_pushdown",
  "name": "Cable Tricep Pushdown",
  "nameNL": "Tricep Pushdown",
  "muscle": "triceps",
  "secondary": [],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 1,
  "video": "2-LAMcpzODU",
  "instructions": "Sta voor hoge kabel. Druk handgreep naar beneden, houd ellebogen vast.",
  "recoveryHours": 36
 },
 {
  "id": "triceps_overhead_extension",
  "name": "Overhead Tricep Extension",
  "nameNL": "Overhead Tricep Extension",
  "muscle": "triceps",
  "secondary": [],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 2,
  "video": "ntBjdnckWgo",
  "instructions": "Houd dumbbell boven hoofd met beide handen. Zak achter hoofd, druk omhoog.",
  "recoveryHours": 36,
  "altEquipment": [
   "cableMachine"
  ],
  "demo": true,
  "videoSrc": "bb",
  "clip": true
 },
 {
  "id": "triceps_skull_crusher",
  "name": "Skull Crusher",
  "nameNL": "Skull Crusher",
  "muscle": "triceps",
  "secondary": [],
  "equipment": [
   "ezBar",
   "bench"
  ],
  "difficulty": 3,
  "video": "d_KZxkY_0cM",
  "instructions": "Lig op bank, armen gestrekt. Buig ellebogen, laat gewicht zakken naar voorhoofd.",
  "recoveryHours": 36,
  "altEquipment": [
   "dumbbells",
   "bench"
  ]
 },
 {
  "id": "triceps_dip",
  "name": "Tricep Dip",
  "nameNL": "Tricep Dip",
  "muscle": "triceps",
  "secondary": [
   "chest",
   "shoulders"
  ],
  "equipment": [
   "dipStation"
  ],
  "difficulty": 3,
  "video": "uaQZ2S9D8WY",
  "instructions": "Hang aan dip bars, lichaam rechtop. Zak tot 90 graden, druk omhoog.",
  "recoveryHours": 48
 },
 {
  "id": "triceps_close_grip_bench",
  "name": "Close Grip Bench Press",
  "nameNL": "Close Grip Bankdrukken",
  "muscle": "triceps",
  "secondary": [
   "chest",
   "shoulders"
  ],
  "equipment": [
   "barbell",
   "bench"
  ],
  "difficulty": 3,
  "video": null,
  "instructions": "Lig op bank, handen dicht bij elkaar. Druk omhoog, focus op triceps.",
  "recoveryHours": 48
 },
 {
  "id": "triceps_kickback",
  "name": "Tricep Kickback",
  "nameNL": "Tricep Kickback",
  "muscle": "triceps",
  "secondary": [],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 1,
  "video": "6SS6K3lAwZ8",
  "instructions": "Buig voorover, elleboog langs lichaam. Strek arm naar achteren.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "triceps_diamond_push_up",
  "name": "Diamond Push-Up",
  "nameNL": "Diamond Push-up",
  "muscle": "triceps",
  "secondary": [
   "chest",
   "shoulders"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 3,
  "video": "J0DnG1_S92I",
  "instructions": "Push-up positie, handen samen in diamantvorm. Zak langzaam, druk omhoog.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "triceps_cable_overhead_extension",
  "name": "Cable Overhead Extension",
  "nameNL": "Kabel Overhead Extension",
  "muscle": "triceps",
  "secondary": [],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "YbX7Wd8jQ-Q",
  "instructions": "Sta met rug naar lage kabel. Trek touw boven hoofd, strek armen volledig.",
  "recoveryHours": 36
 },
 {
  "id": "quads_barbell_squat",
  "name": "Barbell Back Squat",
  "nameNL": "Squat",
  "muscle": "quadriceps",
  "secondary": [
   "glutes",
   "hamstrings",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 4,
  "video": "SW_C1A-rejs",
  "instructions": "Stang op bovenrug. Zak tot bovenbenen horizontaal, druk omhoog door hielen.",
  "recoveryHours": 72,
  "tips": "Knieen in lijn met tenen. Begin met licht gewicht."
 },
 {
  "id": "quads_front_squat",
  "name": "Front Squat",
  "nameNL": "Front Squat",
  "muscle": "quadriceps",
  "secondary": [
   "glutes",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 4,
  "video": "tlfahNdNPPI",
  "instructions": "Stang op voorkant schouders. Zak diep, houd torso rechtop.",
  "recoveryHours": 72
 },
 {
  "id": "quads_leg_press",
  "name": "Leg Press",
  "nameNL": "Leg Press",
  "muscle": "quadriceps",
  "secondary": [
   "glutes",
   "hamstrings"
  ],
  "equipment": [
   "legPress"
  ],
  "difficulty": 2,
  "video": "IZxyjW7MPJQ",
  "instructions": "Zit in machine, voeten op schouderbreedte. Druk platform weg, laat zakken tot 90 graden.",
  "recoveryHours": 48
 },
 {
  "id": "quads_leg_extension",
  "name": "Leg Extension",
  "nameNL": "Leg Extension",
  "muscle": "quadriceps",
  "secondary": [],
  "equipment": [
   "legExtension"
  ],
  "difficulty": 1,
  "video": "YyvSfVjQeL0",
  "instructions": "Zit in machine, strek benen volledig. Langzaam terug.",
  "recoveryHours": 36
 },
 {
  "id": "quads_goblet_squat",
  "name": "Goblet Squat",
  "nameNL": "Goblet Squat",
  "muscle": "quadriceps",
  "secondary": [
   "glutes",
   "core"
  ],
  "equipment": [
   "kettlebell"
  ],
  "difficulty": 2,
  "video": "MeIiIdhvXT4",
  "instructions": "Houd kettlebell/dumbbell voor borst. Squat diep, houd borst omhoog.",
  "recoveryHours": 48,
  "altEquipment": [
   "dumbbells"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "quads_bulgarian_split_squat",
  "dumbbells": 2,
  "name": "Bulgarian Split Squat",
  "nameNL": "Bulgaarse Split Squat",
  "muscle": "quadriceps",
  "secondary": [
   "glutes",
   "hamstrings"
  ],
  "equipment": [
   "dumbbells",
   "bench"
  ],
  "difficulty": 3,
  "video": "2C-uNgKwPLE",
  "instructions": "Achtervoet op bank. Zak tot voorste knie 90 graden, druk omhoog.",
  "recoveryHours": 48,
  "altEquipment": [
   "bodyweight"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "quads_lunge",
  "name": "Walking Lunge",
  "nameNL": "Walking Lunge",
  "muscle": "quadriceps",
  "secondary": [
   "glutes",
   "hamstrings"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Stap vooruit, zak tot beide knieen 90 graden. Stap door naar volgende been.",
  "recoveryHours": 48,
  "altEquipment": [
   "dumbbells"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "quads_hack_squat",
  "name": "Hack Squat",
  "nameNL": "Hack Squat",
  "muscle": "quadriceps",
  "secondary": [
   "glutes"
  ],
  "equipment": [
   "smithMachine"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Rug tegen pad, schouders onder pads. Zak tot 90 graden, druk omhoog.",
  "recoveryHours": 48
 },
 {
  "id": "quads_sissy_squat",
  "name": "Sissy Squat",
  "nameNL": "Sissy Squat",
  "muscle": "quadriceps",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 4,
  "video": "VUiFlZ2FsKA",
  "instructions": "Sta rechtop, houd iets vast voor balans. Leun achterover terwijl je knieen buigt, hak omhoog.",
  "recoveryHours": 48,
  "demo": true
 },
 {
  "id": "quads_wall_sit",
  "name": "Wall Sit",
  "nameNL": "Wall Sit",
  "muscle": "quadriceps",
  "secondary": [
   "glutes"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": "y-wV4Venusw",
  "instructions": "Rug tegen de muur, zak tot bovenbenen horizontaal. Houd positie zo lang mogelijk.",
  "recoveryHours": 24
 },
 {
  "id": "hams_romanian_deadlift",
  "name": "Romanian Deadlift",
  "nameNL": "Romanian Deadlift",
  "muscle": "hamstrings",
  "secondary": [
   "glutes",
   "back"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 3,
  "video": "JCXUYuzwNrM",
  "instructions": "Sta rechtop met stang. Buig voorover vanuit heupen, stang langs benen. Voel stretch in hamstrings.",
  "recoveryHours": 48,
  "altEquipment": [
   "dumbbells"
  ]
 },
 {
  "id": "hams_leg_curl",
  "name": "Lying Leg Curl",
  "nameNL": "Leg Curl",
  "muscle": "hamstrings",
  "secondary": [],
  "equipment": [
   "legCurl"
  ],
  "difficulty": 1,
  "video": "ELOCsoDSmrg",
  "instructions": "Lig op buik in machine. Curl benen omhoog, kneep hamstrings.",
  "recoveryHours": 36
 },
 {
  "id": "hams_good_morning",
  "name": "Good Morning",
  "nameNL": "Good Morning",
  "muscle": "hamstrings",
  "secondary": [
   "glutes",
   "back"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 3,
  "video": null,
  "instructions": "Stang op rug. Buig vanuit heupen met rechte rug tot torso horizontaal.",
  "recoveryHours": 48
 },
 {
  "id": "hams_nordic_curl",
  "name": "Nordic Hamstring Curl",
  "nameNL": "Nordic Hamstring Curl",
  "muscle": "hamstrings",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 5,
  "video": null,
  "instructions": "Knielen, voeten vastgehouden. Laat lichaam langzaam naar voren vallen, rem af met hamstrings.",
  "recoveryHours": 48,
  "demo": true
 },
 {
  "id": "hams_stiff_leg_deadlift",
  "dumbbells": 2,
  "name": "Stiff Leg Deadlift",
  "nameNL": "Stiff Leg Deadlift",
  "muscle": "hamstrings",
  "secondary": [
   "glutes",
   "back"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 3,
  "video": null,
  "instructions": "Sta rechtop met dumbbells. Buig voorover met bijna gestrekte benen.",
  "recoveryHours": 48,
  "demo": true,
  "clip": true
 },
 {
  "id": "hams_seated_leg_curl",
  "name": "Seated Leg Curl",
  "nameNL": "Zittende Leg Curl",
  "muscle": "hamstrings",
  "secondary": [],
  "equipment": [
   "legCurl"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Zit in machine, benen gestrekt. Curl benen onder je, kneep hamstrings.",
  "recoveryHours": 36
 },
 {
  "id": "hams_single_leg_rdl",
  "clip": true,
  "name": "Single Leg Romanian Deadlift",
  "nameNL": "Eenbenige Romanian Deadlift",
  "muscle": "hamstrings",
  "secondary": [
   "glutes",
   "core"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 3,
  "video": "DGavj41F_Cs",
  "instructions": "Sta op één been. Buig voorover vanuit heup, vrije been strekt naar achteren. Houd rug recht.",
  "recoveryHours": 48,
  "altEquipment": [
   "kettlebell"
  ],
  "demo": true
 },
 {
  "id": "glutes_hip_thrust",
  "name": "Barbell Hip Thrust",
  "nameNL": "Hip Thrust",
  "muscle": "glutes",
  "secondary": [
   "hamstrings"
  ],
  "equipment": [
   "barbell",
   "bench"
  ],
  "difficulty": 3,
  "video": "Zp26q4BY5HE",
  "instructions": "Bovenrug op bank, stang over heupen. Druk heupen omhoog, kneep bilspieren.",
  "recoveryHours": 48
 },
 {
  "id": "glutes_cable_kickback",
  "name": "Cable Glute Kickback",
  "nameNL": "Kabel Kickback",
  "muscle": "glutes",
  "secondary": [
   "hamstrings"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Sta voor lage kabel. Trap been naar achteren, kneep bilspier.",
  "recoveryHours": 36
 },
 {
  "id": "glutes_sumo_squat",
  "name": "Sumo Squat",
  "nameNL": "Sumo Squat",
  "muscle": "glutes",
  "secondary": [
   "quadriceps"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Sta breed, tenen naar buiten. Squat diep met gewicht voor lichaam.",
  "recoveryHours": 48,
  "altEquipment": [
   "kettlebell"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "glutes_glute_bridge",
  "name": "Glute Bridge",
  "nameNL": "Glute Bridge",
  "muscle": "glutes",
  "secondary": [
   "hamstrings"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "8bbE64NuDTU",
  "instructions": "Lig op rug, knieen gebogen. Druk heupen omhoog, kneep bilspieren.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "glutes_step_up",
  "name": "Step-Up",
  "nameNL": "Step-Up",
  "muscle": "glutes",
  "secondary": [
   "quadriceps",
   "hamstrings"
  ],
  "equipment": [
   "bench"
  ],
  "difficulty": 2,
  "video": "vLgNjXucUs0",
  "instructions": "Stap op bank/verhoging met één been. Druk door hiel omhoog, stap gecontroleerd terug.",
  "recoveryHours": 36,
  "altEquipment": [
   "dumbbells",
   "bodyweight"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "glutes_single_leg_hip_thrust",
  "name": "Single Leg Hip Thrust",
  "nameNL": "Eenbenige Hip Thrust",
  "muscle": "glutes",
  "secondary": [
   "hamstrings",
   "core"
  ],
  "equipment": [
   "bench"
  ],
  "difficulty": 3,
  "video": "L4nTaesNm0E",
  "instructions": "Bovenrug op bank, één been gestrekt. Druk heupen omhoog met één been.",
  "recoveryHours": 48,
  "altEquipment": [
   "bodyweight"
  ],
  "demo": true,
  "clip": true
 },
 {
  "id": "glutes_donkey_kickback",
  "clip": true,
  "name": "Donkey Kickback",
  "nameNL": "Donkey Kickback",
  "muscle": "glutes",
  "secondary": [
   "hamstrings"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "QreOl2tgC-8",
  "instructions": "Op handen en knieen. Trap één been naar achteren en omhoog, kneep bilspier.",
  "recoveryHours": 24,
  "altEquipment": [
   "resistanceBands"
  ],
  "demo": true
 },
 {
  "id": "glutes_frog_pump",
  "name": "Frog Pump",
  "nameNL": "Frog Pump",
  "muscle": "glutes",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "jbJBXErKD-U",
  "instructions": "Lig op rug, voetzolen tegen elkaar (kikkerstand). Druk heupen omhoog, kneep bilspieren.",
  "recoveryHours": 24,
  "demo": true
 },
 {
  "id": "core_plank",
  "name": "Plank",
  "nameNL": "Plank",
  "muscle": "core",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "pSHjTRCQxIw",
  "instructions": "Op onderarmen en tenen. Houd lichaam recht, span core aan.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "core_cable_crunch",
  "name": "Cable Crunch",
  "nameNL": "Kabel Crunch",
  "muscle": "core",
  "secondary": [],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "AV5PmZJIrrw",
  "instructions": "Knielen voor hoge kabel. Crunch naar beneden, span buikspieren.",
  "recoveryHours": 24
 },
 {
  "id": "core_hanging_leg_raise",
  "name": "Hanging Leg Raise",
  "nameNL": "Hangende Beenheffen",
  "muscle": "core",
  "secondary": [
   "forearms"
  ],
  "equipment": [
   "pullUpBar"
  ],
  "difficulty": 4,
  "video": "hdng3Nm1x_E",
  "instructions": "Hang aan stang, til benen omhoog tot horizontaal of hoger.",
  "recoveryHours": 24,
  "demo": true
 },
 {
  "id": "core_russian_twist",
  "name": "Russian Twist",
  "nameNL": "Russian Twist",
  "muscle": "core",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Zit met gebogen knieen, leun achterover. Draai torso links en rechts.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "core_ab_wheel",
  "name": "Ab Wheel Rollout",
  "nameNL": "Ab Wheel Rollout",
  "muscle": "core",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "abWheel"
  ],
  "difficulty": 4,
  "video": "j6lR4u193gE",
  "instructions": "Op knieen, rol wheel naar voren tot bijna gestrekt. Trek terug met buikspieren.",
  "recoveryHours": 36,
  "demo": true,
  "clip": true
 },
 {
  "id": "core_mountain_climber",
  "clip": true,
  "name": "Mountain Climbers",
  "nameNL": "Mountain Climbers",
  "muscle": "core",
  "secondary": [
   "quadriceps",
   "shoulders"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Plankpositie. Trek afwisselend knieen naar borst, snel tempo.",
  "recoveryHours": 24,
  "demo": true
 },
  {
  "id": "core_pallof_press",
  "name": "Pallof Press",
  "nameNL": "Pallof Press",
  "muscle": "core",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "gHGLwQGvtxg",
  "instructions": "Sta zijwaarts naar kabel. Druk handgreep recht voor je uit, weersta de rotatie. Houd 2 sec.",
  "recoveryHours": 24,
  "altEquipment": [
   "resistanceBands"
  ]
 },
 {
  "id": "core_bicycle_crunch",
  "clip": true,
  "name": "Bicycle Crunch",
  "nameNL": "Bicycle Crunch",
  "muscle": "core",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": "1we3bh9uhqY",
  "instructions": "Lig op rug, handen achter hoofd. Breng elleboog naar tegenovergestelde knie afwisselend.",
  "recoveryHours": 24,
  "demo": true
 },
 {
  "id": "core_side_plank",
  "name": "Side Plank",
  "nameNL": "Zijwaartse Plank",
  "muscle": "core",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": "XeN4pEZZJNI",
  "instructions": "Lig op zij, steun op onderarm. Hef heupen op, houd lichaam in rechte lijn.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "core_cable_woodchop",
  "name": "Cable Woodchop",
  "nameNL": "Kabel Woodchop",
  "muscle": "core",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "cableMachine"
  ],
  "difficulty": 2,
  "video": "pAplQXk3dkU",
  "instructions": "Sta zijwaarts naar hoge kabel. Trek handgreep diagonaal naar beneden met rotatie.",
  "recoveryHours": 24
 },
 {
  "id": "full_clean_and_press",
  "name": "Clean and Press",
  "nameNL": "Clean and Press",
  "muscle": "fullBody",
  "secondary": [
   "shoulders",
   "back",
   "quadriceps"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 5,
  "video": "KCe8l86-alA",
  "instructions": "Trek stang van grond naar schouders (clean). Druk boven hoofd (press).",
  "recoveryHours": 72
 },
 {
  "id": "full_kettlebell_swing",
  "name": "Kettlebell Swing",
  "nameNL": "Kettlebell Swing",
  "muscle": "fullBody",
  "secondary": [
   "glutes",
   "hamstrings",
   "shoulders"
  ],
  "equipment": [
   "kettlebell"
  ],
  "difficulty": 2,
  "video": "YSxHifyI6s8",
  "instructions": "Sta breed, swing kettlebell tussen benen. Drijf heupen, swing tot schouderhoogte.",
  "recoveryHours": 36,
  "demo": true,
  "clip": true
 },
 {
  "id": "full_burpee",
  "name": "Burpee",
  "nameNL": "Burpee",
  "muscle": "fullBody",
  "secondary": [
   "chest",
   "quadriceps",
   "core"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 3,
  "video": "wS4OsJ4yzx4",
  "instructions": "Squat, handen op grond, spring naar plank, push-up, spring terug, spring omhoog.",
  "recoveryHours": 24,
  "clip": true
 },
 {
  "id": "full_thruster",
  "name": "Thruster",
  "nameNL": "Thruster",
  "muscle": "fullBody",
  "secondary": [
   "quadriceps",
   "shoulders",
   "core"
  ],
  "equipment": [
   "barbell"
  ],
  "difficulty": 4,
  "video": null,
  "instructions": "Front squat gevolgd door overhead press in één vloeiende beweging.",
  "recoveryHours": 48,
  "altEquipment": [
   "dumbbells"
  ]
 },
 {
  "id": "full_turkish_getup",
  "name": "Turkish Get-Up",
  "nameNL": "Turkish Get-Up",
  "muscle": "fullBody",
  "secondary": [
   "core",
   "shoulders"
  ],
  "equipment": [
   "kettlebell"
  ],
  "difficulty": 4,
  "video": null,
  "instructions": "Lig op rug met kettlebell boven. Sta op in gecontroleerde stappen.",
  "recoveryHours": 36,
  "demo": true
 },
 {
  "id": "full_man_maker",
  "dumbbells": 2,
  "name": "Man Maker",
  "nameNL": "Man Maker",
  "muscle": "fullBody",
  "secondary": [
   "chest",
   "back",
   "shoulders",
   "quadriceps"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 5,
  "video": null,
  "instructions": "Push-up op dumbbells, row elke arm, spring naar squat, druk dumbbells boven hoofd.",
  "recoveryHours": 48
 },
 {
  "id": "full_wall_ball",
  "name": "Wall Ball",
  "nameNL": "Wall Ball",
  "muscle": "fullBody",
  "secondary": [
   "quadriceps",
   "shoulders",
   "core"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 3,
  "video": "fpUD0mcFp_0",
  "instructions": "Houd medicijnbal voor borst. Squat diep, sta explosief op en gooi bal hoog tegen muur.",
  "recoveryHours": 36
 },
 {
  "id": "full_battle_ropes",
  "name": "Battle Ropes",
  "nameNL": "Battle Ropes",
  "muscle": "fullBody",
  "secondary": [
   "shoulders",
   "core",
   "forearms"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 3,
  "video": null,
  "instructions": "Pak touwen vast, lichte squat. Maak afwisselende golven met armen, houd tempo hoog.",
  "recoveryHours": 36,
  "demo": true
 },
 {
  "id": "calves_standing_raise",
  "name": "Standing Calf Raise",
  "nameNL": "Staande Kuitheffen",
  "muscle": "calves",
  "secondary": [],
  "equipment": [
   "smithMachine"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Sta op rand van verhoging. Druk omhoog op tenen, zak langzaam.",
  "recoveryHours": 24,
  "altEquipment": [
   "bodyweight"
  ]
 },
 {
  "id": "calves_seated_raise",
  "name": "Seated Calf Raise",
  "nameNL": "Zittende Kuitheffen",
  "muscle": "calves",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": null,
  "instructions": "Zit met gewicht op knieen. Druk omhoog op tenen.",
  "recoveryHours": 24,
  "demo": true
 },
 {
  "id": "calves_donkey_raise",
  "name": "Donkey Calf Raise",
  "nameNL": "Donkey Kuitheffen",
  "muscle": "calves",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": null,
  "instructions": "Buig voorover met handen op steun. Druk omhoog op tenen vanuit gebogen positie.",
  "recoveryHours": 24,
  "demo": true
 },
 {
  "id": "calves_single_leg_raise",
  "name": "Single Leg Calf Raise",
  "nameNL": "Eenbenige Kuitheffen",
  "muscle": "calves",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": "ORT4oJ_R8Qs",
  "instructions": "Sta op één been op rand van verhoging. Druk omhoog, zak langzaam voorbij horizontaal.",
  "recoveryHours": 24,
  "altEquipment": [
   "dumbbells"
  ],
  "demo": true
 },
 {
  "id": "calves_jump_rope",
  "name": "Jump Rope",
  "nameNL": "Touwtjespringen",
  "muscle": "calves",
  "secondary": [
   "core",
   "shoulders"
  ],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": "s-8tbwbEZ68",
  "instructions": "Spring licht op de ballen van je voeten. Draai het touw met je polsen, niet je armen.",
  "recoveryHours": 24,
  "clip": true
 },
 {
  "id": "forearms_wrist_curl",
  "name": "Wrist Curl",
  "nameNL": "Pols Curl",
  "muscle": "forearms",
  "secondary": [],
  "equipment": [
   "barbell"
  ],
  "difficulty": 1,
  "video": "qMtmHwaCmYI",
  "instructions": "Zit op bank, onderarmen op bovenbenen, handpalmen omhoog. Curl polsen omhoog.",
  "recoveryHours": 24,
  "altEquipment": [
   "dumbbells"
  ]
 },
 {
  "id": "forearms_reverse_wrist_curl",
  "name": "Reverse Wrist Curl",
  "nameNL": "Reverse Pols Curl",
  "muscle": "forearms",
  "secondary": [],
  "equipment": [
   "barbell"
  ],
  "difficulty": 1,
  "video": "FW7URAaC-vE",
  "instructions": "Zit op bank, onderarmen op bovenbenen, handpalmen omlaag. Curl polsen omhoog.",
  "recoveryHours": 24,
  "altEquipment": [
   "dumbbells"
  ]
 },
 {
  "id": "forearms_farmer_walk",
  "dumbbells": 2,
  "name": "Farmer's Walk",
  "nameNL": "Farmer's Walk",
  "muscle": "forearms",
  "secondary": [
   "core",
   "shoulders",
   "glutes"
  ],
  "equipment": [
   "dumbbells"
  ],
  "difficulty": 2,
  "video": "Tgi5SNDbBZQ",
  "instructions": "Pak zware dumbbells op. Loop gecontroleerd, schouders naar achteren, core aangespannen.",
  "recoveryHours": 36,
  "altEquipment": [
   "kettlebell"
  ],
  "demo": true
 },
 {
  "id": "forearms_dead_hang",
  "name": "Dead Hang",
  "nameNL": "Dead Hang",
  "muscle": "forearms",
  "secondary": [
   "back",
   "shoulders"
  ],
  "equipment": [
   "pullUpBar"
  ],
  "difficulty": 2,
  "video": "OT-wTpxP9uo",
  "instructions": "Hang aan een stang met gestrekte armen. Houd zo lang mogelijk vast.",
  "recoveryHours": 24,
  "demo": true
 },
 {
  "id": "chest_banded_push_up",
  "name": "Banded Push-Up",
  "nameNL": "Push-up met weerstandsband",
  "muscle": "chest",
  "secondary": [
   "triceps",
   "shoulders",
   "core"
  ],
  "equipment": [
   "resistanceBands"
  ],
  "difficulty": 2,
  "video": "rX-rWx0Ujzo",
  "instructions": "Leg de band over je bovenrug en klem de uiteinden onder je handen. Doe push-ups; bovenin levert de band juist maximale weerstand, zodat de spanning op je borst nooit wegvalt.",
  "recoveryHours": 36,
  "tips": "Uit je rapport: de band compenseert precies het dode punt bovenin de push-up.",
  "clip": true
 },
 {
  "id": "triceps_band_pushdown",
  "name": "Band Triceps Pushdown",
  "nameNL": "Triceps pushdown met band (deuranker)",
  "muscle": "triceps",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "resistanceBands"
  ],
  "difficulty": 1,
  "video": "gOq6Ig1skxA",
  "instructions": "Anker de band bovenaan een deur. Ellebogen tegen je zij, strek je armen naar beneden en laat gecontroleerd terugkomen. Constante spanning, vriendelijk voor de ellebogen, ideaal voor 15+ herhalingen.",
  "recoveryHours": 24
 },
 {
  "id": "back_band_row",
  "name": "Band Row",
  "nameNL": "Roeien met weerstandsband",
  "muscle": "back",
  "secondary": [
   "biceps",
   "shoulders"
  ],
  "equipment": [
   "resistanceBands"
  ],
  "difficulty": 1,
  "video": "TBNt2DBvkl4",
  "instructions": "Zit met gestrekte benen, band om je voeten. Trek de uiteinden naar je middenrif, knijp je schouderbladen samen en laat langzaam terugkomen.",
  "recoveryHours": 36,
  "clip": true
 },
 {
  "id": "back_band_pull_apart",
  "name": "Band Pull-Apart",
  "nameNL": "Band pull-apart",
  "muscle": "back",
  "secondary": [
   "shoulders"
  ],
  "equipment": [
   "resistanceBands"
  ],
  "difficulty": 1,
  "video": "2fmxGGtdbog",
  "instructions": "Houd de band gestrekt voor je op schouderhoogte. Trek de band uit elkaar tot hij je borst raakt, knijp je schouderbladen samen. Perfect voor houding en gezonde schouders.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "biceps_band_curl",
  "name": "Band Curl",
  "nameNL": "Biceps curl met band",
  "muscle": "biceps",
  "secondary": [
   "forearms"
  ],
  "equipment": [
   "resistanceBands"
  ],
  "difficulty": 1,
  "video": "U7p90HpfpQQ",
  "instructions": "Ga op het midden van de band staan, curl de uiteinden omhoog met gesupineerde greep (handpalmen naar boven draaien). Oplopende weerstand bovenin.",
  "recoveryHours": 24,
  "clip": true
 },
 {
  "id": "core_crunch",
  "name": "Crunch",
  "nameNL": "Crunch",
  "muscle": "core",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "Xyd_fa5zoEU",
  "instructions": "Lig op je rug, knieën gebogen. Rol je schouderbladen van de vloer richting je bekken, adem uit bovenin, laat langzaam zakken. Focus op je rechte buikspier, trek niet aan je nek.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "core_lying_leg_raise",
  "name": "Lying Leg Raise",
  "nameNL": "Liggende beenheffen",
  "muscle": "core",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 2,
  "video": "JB2oyawG9KI",
  "instructions": "Lig op je rug, handen onder je billen. Hef gestrekte benen tot 90 graden en laat langzaam zakken zonder dat je onderrug loskomt van de mat.",
  "recoveryHours": 24,
  "demo": true,
  "clip": true
 },
 {
  "id": "core_dead_bug",
  "name": "Dead Bug",
  "nameNL": "Dead bug",
  "muscle": "core",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "g_BYB0R-4Ws",
  "instructions": "Lig op je rug, armen omhoog, knieën 90 graden. Strek langzaam tegengestelde arm en been terwijl je onderrug op de mat blijft. Wissel af.",
  "recoveryHours": 12,
  "demo": true,
  "clip": true
 },
 {
  "id": "mobility_leg_swing",
  "name": "Leg Swing",
  "nameNL": "Beenzwaaien",
  "muscle": "mobility",
  "secondary": [],
  "equipment": ["bodyweight"],
  "difficulty": 1,
  "video": null,
  "instructions": "Sta op één been, hand aan de muur of op je heup. Zwaai het andere been ontspannen zijwaarts heen en weer, elke keer iets groter. Daarna voor-achter.",
  "recoveryHours": 0,
  "clip": true
 },
 {
  "id": "mobility_cat_cow",
  "name": "Cat-Cow",
  "nameNL": "Kat-koe",
  "muscle": "mobility",
  "secondary": [],
  "equipment": ["bodyweight"],
  "difficulty": 1,
  "video": null,
  "instructions": "Op handen en knieën. Adem uit en maak je rug bol als een kat, adem in en laat hem doorzakken. Rustig, in het tempo van je adem.",
  "recoveryHours": 0,
  "clip": true
 },
 {
  "id": "mobility_thoracic_bridge",
  "name": "Thoracic Bridge",
  "nameNL": "Borstwervel-brug",
  "muscle": "mobility",
  "secondary": [],
  "equipment": ["bodyweight"],
  "difficulty": 2,
  "video": null,
  "instructions": "Zit met je voeten plat en handen achter je. Til je heupen op en reik met één arm over je hoofd naar de andere kant, open je borst. Wissel.",
  "recoveryHours": 0,
  "clip": true
 },
 {
  "id": "mobility_worlds_greatest",
  "name": "World's Greatest Stretch",
  "nameNL": "Werelds beste stretch",
  "muscle": "fullBody",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "uIFKmkvgw8w",
  "instructions": "Grote uitvalspas, plaats beide handen naast je voorvoet, draai je bovenlichaam open en reik omhoog. Wissel van kant. Mobiliseert heupen, rug en schouders in één beweging.",
  "recoveryHours": 0
 },
 {
  "id": "mobility_couch_stretch",
  "name": "Hip Flexor Stretch",
  "nameNL": "Heupbuiger stretch",
  "muscle": "fullBody",
  "secondary": [],
  "equipment": [
   "bodyweight"
  ],
  "difficulty": 1,
  "video": "-rsIS-wl-ig",
  "instructions": "Kniel met één knie op de mat, andere voet voor je. Span je bil aan en duw je heup naar voren. 45-60 sec per kant. Tegengif voor een dag zitten.",
  "recoveryHours": 0,
  "demo": true,
  "clip": true
 },
 {
   "id": "chest_incline_dumbbell_fly",
   "dumbbells": 2,
   "name": "Incline Dumbbell Fly",
   "nameNL": "Schuine Dumbbell Fly",
   "muscle": "chest",
   "secondary": [
     "shoulders"
   ],
   "equipment": [
     "dumbbells",
     "inclineBench"
   ],
   "difficulty": 2,
   "instructions": "Bank op 30°. Armen licht gebogen wijd openen tot je rek voelt op je bovenborst, dan als een boog weer sluiten. Licht gewicht, grote beweging.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "chest_glute_bridge_press",
   "dumbbells": 2,
   "name": "Glute Bridge Chest Press",
   "nameNL": "Vloerpress in brughouding",
   "muscle": "chest",
   "secondary": [
     "glutes",
     "triceps"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Lig op de vloer, heupen omhoog in een brug. Druk de dumbbells recht omhoog en laat ze zakken tot je ellebogen de vloer raken. Kort onderin, dan weer op.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "chest_decline_push_up",
   "name": "Decline Push-Up",
   "nameNL": "Decline Push-up",
   "muscle": "chest",
   "secondary": [
     "shoulders",
     "triceps"
   ],
   "equipment": [
     "bodyweight",
     "bench"
   ],
   "difficulty": 3,
   "instructions": "Voeten op de bank, handen op de vloer. Meer op de bovenborst en schouders. Lichaam als één plank, borst tot net boven de vloer.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "chest_incline_push_up",
   "name": "Incline Push-Up",
   "nameNL": "Incline Push-up",
   "muscle": "chest",
   "secondary": [
     "shoulders",
     "triceps"
   ],
   "equipment": [
     "bodyweight",
     "bench"
   ],
   "difficulty": 1,
   "instructions": "Handen op de bank, voeten op de vloer. Makkelijker dan een gewone push-up — ideaal als opbouw of als je borst al moe is.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "chest_archer_push_up",
   "name": "Archer Push-Up",
   "nameNL": "Archer Push-up",
   "muscle": "chest",
   "secondary": [
     "shoulders",
     "triceps"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 4,
   "instructions": "Handen wijd. Zak schuin naar één hand toe terwijl de andere arm gestrekt blijft. Wissel per rep. Bijna een eenarmige push-up.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "chest_wide_push_up",
   "name": "Wide Push-Up",
   "nameNL": "Brede Push-up",
   "muscle": "chest",
   "secondary": [
     "shoulders"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Handen ruim buiten schouderbreedte. Meer borst, minder triceps. Ellebogen niet helemaal naar buiten laten wijzen — 45 graden.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "chest_band_chest_press",
   "name": "Band Chest Press",
   "nameNL": "Band Chest Press",
   "muscle": "chest",
   "secondary": [
     "triceps",
     "shoulders"
   ],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Band achter je rug, uiteinden in je handen. Druk naar voren tot je armen gestrekt zijn, langzaam terug. Zittend of staand.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "back_renegade_row",
   "name": "Renegade Row",
   "nameNL": "Renegade Row",
   "muscle": "back",
   "secondary": [
     "core",
     "shoulders"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 4,
   "instructions": "Plank op twee dumbbells. Trek er één naar je heup zonder dat je heupen draaien. Wissel. Core werkt even hard als je rug.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "back_gorilla_row",
   "name": "Gorilla Row",
   "nameNL": "Gorilla Row",
   "muscle": "back",
   "secondary": [
     "biceps",
     "core"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 3,
   "instructions": "Breed staan, dumbbells op de vloer tussen je voeten. Rug plat, trek er om en om één naar je heup terwijl de andere op de vloer blijft.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "back_bent_over_dumbbell_row",
   "dumbbells": 2,
   "name": "Bent-Over Dumbbell Row",
   "nameNL": "Voorovergebogen Dumbbell Row (beide armen)",
   "muscle": "back",
   "secondary": [
     "biceps"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Heupscharnier tot je romp bijna horizontaal is. Trek beide dumbbells tegelijk naar je heupen, ellebogen langs je lichaam. Rug blijft plat.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "back_band_lat_pulldown",
   "name": "Band Lat Pulldown",
   "nameNL": "Band Lat Pulldown",
   "muscle": "back",
   "secondary": [
     "biceps"
   ],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Band boven je hoofd, handen wijd. Trek de ellebogen naar beneden en naar je zij, knijp je schouderbladen samen.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "back_band_seated_row",
   "name": "Band Seated Row",
   "nameNL": "Zittende Band Row",
   "muscle": "back",
   "secondary": [
     "biceps"
   ],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Zit met gestrekte benen, band om je voeten. Trek naar je buik, ellebogen langs het lichaam, borst vooruit.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "back_superman",
   "name": "Superman Hold",
   "nameNL": "Superman",
   "muscle": "back",
   "secondary": [
     "glutes"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Op je buik, armen en benen gestrekt van de vloer. Houd vast, kijk naar de mat. Sterke onderrug voor je deadlift.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "back_band_w_raise",
   "name": "Band W-Raise",
   "nameNL": "Band W-Raise",
   "muscle": "shoulders",
   "secondary": [
     "back"
   ],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Band voor je borst, ellebogen 90°. Trek de handen naar buiten en omhoog tot je armen een W vormen. Achterkant schouders en rotatoren.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_incline_rear_delt_fly",
   "dumbbells": 2,
   "name": "Incline Rear Delt Fly",
   "nameNL": "Rear Delt Fly op schuine bank",
   "muscle": "shoulders",
   "secondary": [
     "back"
   ],
   "equipment": [
     "dumbbells",
     "inclineBench"
   ],
   "difficulty": 2,
   "instructions": "Buik op de schuine bank. Til de dumbbells zijwaarts tot schouderhoogte, licht gebogen armen. Geen zwaai — de bank dwingt je eerlijk te zijn.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_dumbbell_upright_row",
   "dumbbells": 2,
   "name": "Dumbbell Upright Row",
   "nameNL": "Dumbbell Upright Row",
   "muscle": "shoulders",
   "secondary": [
     "back"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Dumbbells voor je dijen. Trek langs je lichaam omhoog tot borsthoogte, ellebogen hoger dan handen. Niet hoger dan comfortabel voor je schouders.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_y_raise",
   "dumbbells": 2,
   "name": "Dumbbell Y-Raise",
   "nameNL": "Dumbbell Y-Raise",
   "muscle": "shoulders",
   "secondary": [
     "back"
   ],
   "equipment": [
     "dumbbells",
     "inclineBench"
   ],
   "difficulty": 2,
   "instructions": "Buik op de schuine bank, lichte dumbbells. Til de armen schuin omhoog in een Y. Onderste trapezius en achterkant schouders — goed voor je houding.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_seated_lateral_raise",
   "dumbbells": 2,
   "name": "Seated Lateral Raise",
   "nameNL": "Zittende Lateral Raise",
   "muscle": "shoulders",
   "secondary": [],
   "equipment": [
     "dumbbells",
     "bench"
   ],
   "difficulty": 1,
   "instructions": "Zittend op de bank kun je niet meezwaaien met je benen. Til zijwaarts tot schouderhoogte, pinken iets omhoog, langzaam terug.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_band_lateral_raise",
   "name": "Band Lateral Raise",
   "nameNL": "Band Lateral Raise",
   "muscle": "shoulders",
   "secondary": [],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Sta op de band, uiteinden in je handen. Til zijwaarts tot schouderhoogte. De weerstand neemt bovenin toe — precies waar de zijkant van je schouder werkt.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_band_overhead_press",
   "name": "Band Overhead Press",
   "nameNL": "Band Overhead Press",
   "muscle": "shoulders",
   "secondary": [
     "triceps"
   ],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Sta op de band, handen op schouderhoogte. Druk recht omhoog, ribben laag, langzaam terug.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_kettlebell_press",
   "name": "Kettlebell Press",
   "nameNL": "Kettlebell Press",
   "muscle": "shoulders",
   "secondary": [
     "triceps",
     "core"
   ],
   "equipment": [
     "kettlebell"
   ],
   "difficulty": 2,
   "instructions": "Kettlebell in rack-positie tegen je onderarm. Druk recht omhoog, elleboog uitdraaien. Eén arm tegelijk — je core houdt je recht.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_pike_push_up",
   "name": "Pike Push-Up",
   "nameNL": "Pike Push-up",
   "muscle": "shoulders",
   "secondary": [
     "triceps"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 3,
   "instructions": "Heupen hoog in een omgekeerde V. Laat je hoofd tussen je handen zakken en druk omhoog. De lichaamsgewicht-versie van de shoulder press.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "shoulders_dumbbell_shrug",
   "dumbbells": 2,
   "name": "Dumbbell Shrug",
   "nameNL": "Dumbbell Shrug",
   "muscle": "shoulders",
   "secondary": [
     "back"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 1,
   "instructions": "Dumbbells langs je lichaam. Trek je schouders recht omhoog naar je oren, knijp, en laat langzaam zakken. Niet rollen.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "biceps_zottman_curl",
   "dumbbells": 2,
   "name": "Zottman Curl",
   "nameNL": "Zottman Curl",
   "muscle": "biceps",
   "secondary": [
     "forearms"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Curl omhoog met handpalmen naar boven, draai bovenin je handen om en laat zakken met de palmen naar beneden. Biceps én onderarmen.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "biceps_waiter_curl",
   "name": "Waiter Curl",
   "nameNL": "Waiter Curl",
   "muscle": "biceps",
   "secondary": [],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Houd één dumbbell als een dienblad: handpalmen onder de kop. Curl omhoog en houd de dumbbell verticaal. Veel piek-spanning.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "biceps_cross_body_hammer_curl",
   "dumbbells": 2,
   "name": "Cross-Body Hammer Curl",
   "nameNL": "Cross-body Hammer Curl",
   "muscle": "biceps",
   "secondary": [
     "forearms"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 1,
   "instructions": "Neutrale grip, curl de dumbbell schuin naar je tegenoverliggende schouder. Om en om. Brachialis en onderarm.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "biceps_alternating_curl",
   "dumbbells": 2,
   "name": "Alternating Dumbbell Curl",
   "nameNL": "Alternerende Dumbbell Curl",
   "muscle": "biceps",
   "secondary": [],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 1,
   "instructions": "Om en om curlen, met supinatie: draai je pink naar buiten terwijl je omhoog komt. Ellebogen blijven stil langs je lichaam.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "triceps_dumbbell_skull_crusher",
   "dumbbells": 2,
   "name": "Dumbbell Skull Crusher",
   "nameNL": "Dumbbell Skull Crusher",
   "muscle": "triceps",
   "secondary": [],
   "equipment": [
     "dumbbells",
     "bench"
   ],
   "difficulty": 2,
   "instructions": "Lig op de bank, dumbbells boven je. Buig alleen de ellebogen en laat de dumbbells naast je hoofd zakken, dan strekken. Ellebogen wijzen omhoog.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "triceps_tate_press",
   "dumbbells": 2,
   "name": "Tate Press",
   "nameNL": "Tate Press",
   "muscle": "triceps",
   "secondary": [],
   "equipment": [
     "dumbbells",
     "bench"
   ],
   "difficulty": 3,
   "instructions": "Lig op de bank, dumbbells boven je borst met de handpalmen vooruit. Laat de dumbbells naar binnen zakken tot ze je borst raken, ellebogen wijzen naar buiten, en druk weer op.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "triceps_single_arm_overhead_extension",
   "name": "Single-Arm Overhead Extension",
   "nameNL": "Eenarmige Overhead Extension",
   "muscle": "triceps",
   "secondary": [],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Eén dumbbell boven je hoofd. Laat achter je hoofd zakken door alleen de elleboog te buigen, strek weer. Volle rek, andere hand steunt de elleboog.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "triceps_band_overhead_extension",
   "name": "Band Overhead Extension",
   "nameNL": "Band Overhead Extension",
   "muscle": "triceps",
   "secondary": [],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Kniel op de band, uiteinde achter je hoofd. Strek de armen boven je hoofd, langzaam terug. Prima als lichte finisher.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "triceps_bench_dip",
   "name": "Bench Dip",
   "nameNL": "Bench Dip",
   "muscle": "triceps",
   "secondary": [
     "chest",
     "shoulders"
   ],
   "equipment": [
     "bodyweight",
     "bench"
   ],
   "difficulty": 2,
   "instructions": "Handen op de rand van de bank, benen gestrekt voor je. Zak tot je ellebogen 90° maken, druk terug. Schouders laag houden.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "triceps_close_grip_push_up",
   "name": "Close-Grip Push-Up",
   "nameNL": "Smalle Push-up",
   "muscle": "triceps",
   "secondary": [
     "chest"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Handen onder je schouders, ellebogen strak langs je lichaam. Meer triceps dan een gewone push-up.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "hams_dumbbell_rdl",
   "dumbbells": 2,
   "name": "Dumbbell Romanian Deadlift",
   "nameNL": "Dumbbell Romanian Deadlift",
   "muscle": "hamstrings",
   "secondary": [
     "glutes",
     "back"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Dumbbells voor je dijen, knieën licht gebogen. Duw je heupen naar achteren en laat de dumbbells langs je benen zakken tot je rek voelt in je hamstrings. Heupen naar voren om op te komen.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "glutes_dumbbell_sumo_deadlift",
   "dumbbells": 2,
   "name": "Dumbbell Sumo Deadlift",
   "nameNL": "Dumbbell Sumo Deadlift",
   "muscle": "glutes",
   "secondary": [
     "hamstrings",
     "quadriceps",
     "back"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Breed staan, tenen naar buiten, dumbbells tussen je benen. Til vanuit je heupen en billen, rug plat, knieën naar buiten duwen.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "glutes_single_leg_glute_bridge",
   "name": "Single-Leg Glute Bridge",
   "nameNL": "Eenbenige Glute Bridge",
   "muscle": "glutes",
   "secondary": [
     "hamstrings",
     "core"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op je rug, één voet op de vloer, andere been gestrekt omhoog. Duw je heup omhoog tot je lichaam recht is, knijp bovenin. Per kant.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "glutes_fire_hydrant",
   "name": "Fire Hydrant",
   "nameNL": "Fire Hydrant",
   "muscle": "glutes",
   "secondary": [
     "core"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Op handen en knieën. Til één knie zijwaarts omhoog met de knie gebogen, romp blijft stil. Zijkant van je bil — stabiliteit voor het fietsen.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "glutes_band_good_morning",
   "name": "Band Good Morning",
   "nameNL": "Band Good Morning",
   "muscle": "hamstrings",
   "secondary": [
     "glutes",
     "back"
   ],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Band onder je voeten en achter je nek. Buig voorover vanuit je heupen met een rechte rug, kom op door je heupen naar voren te duwen.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "glutes_band_monster_walk",
   "name": "Band Monster Walk",
   "nameNL": "Band Monster Walk",
   "muscle": "glutes",
   "secondary": [],
   "equipment": [
     "resistanceBands"
   ],
   "difficulty": 1,
   "instructions": "Band om je knieën of enkels, lichte squat-houding. Stap zijwaarts en houd spanning op de band. Bilzijkant en heupstabiliteit.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "quads_curtsy_lunge",
   "name": "Curtsy Lunge",
   "nameNL": "Curtsy Lunge",
   "muscle": "quadriceps",
   "secondary": [
     "glutes"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Stap schuin achter je andere been alsof je een knieval maakt. Zak recht naar beneden, kom terug. Bil en zijkant van de heup.",
   "recoveryHours": 36,
   "altEquipment": [
     "dumbbells"
   ],
   "video": null,
   "clip": true
 },
 {
   "id": "quads_lateral_lunge",
   "name": "Lateral Lunge",
   "nameNL": "Zijwaartse Lunge",
   "muscle": "quadriceps",
   "secondary": [
     "glutes",
     "hamstrings"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Grote stap zijwaarts, zak op dat been terwijl het andere gestrekt blijft. Duw terug naar het midden. Binnenkant dij en bil.",
   "recoveryHours": 36,
   "altEquipment": [
     "dumbbells"
   ],
   "video": null,
   "clip": true
 },
 {
   "id": "quads_dumbbell_thruster",
   "dumbbells": 2,
   "name": "Dumbbell Thruster",
   "nameNL": "Dumbbell Thruster",
   "muscle": "quadriceps",
   "secondary": [
     "shoulders",
     "glutes",
     "triceps"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 3,
   "instructions": "Dumbbells op je schouders. Squat diep, en gebruik de opwaartse kracht om de dumbbells boven je hoofd te drukken. Eén vloeiende beweging.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "quads_jump_squat",
   "name": "Jump Squat",
   "nameNL": "Jump Squat",
   "muscle": "quadriceps",
   "secondary": [
     "glutes",
     "calves"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Squat en spring explosief omhoog. Zacht landen, direct weer zakken. Kracht en snelheid — handig voor de sprint op de fiets.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "quads_air_squat",
   "name": "Air Squat",
   "nameNL": "Squat zonder gewicht",
   "muscle": "quadriceps",
   "secondary": [
     "glutes"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Voeten op schouderbreedte, armen naar voren. Zak zo diep als je kunt met een rechte rug en hielen aan de grond.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "quads_pistol_squat",
   "name": "Pistol Squat",
   "nameNL": "Pistol Squat",
   "muscle": "quadriceps",
   "secondary": [
     "glutes",
     "core"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 5,
   "instructions": "Eenbenige squat met het andere been gestrekt voor je. Houd je vast aan iets als het nog niet lukt. De ultieme balans- en beenoefening zonder gewicht.",
   "recoveryHours": 48,
   "video": null,
   "clip": true
 },
 {
   "id": "quads_dumbbell_march",
   "dumbbells": 2,
   "name": "Dumbbell March",
   "nameNL": "Dumbbell March",
   "muscle": "quadriceps",
   "secondary": [
     "core",
     "glutes"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 1,
   "instructions": "Dumbbells langs je lichaam, marcheer op de plaats met hoge knieën. Rustig tempo, romp stil. Heupbuigers en core.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "calves_dumbbell_calf_raise",
   "dumbbells": 2,
   "name": "Dumbbell Calf Raise",
   "nameNL": "Dumbbell Calf Raise",
   "muscle": "calves",
   "secondary": [],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 1,
   "instructions": "Dumbbells langs je lichaam, kom hoog op je tenen en zak langzaam. Voor extra rek: tenen op een verhoging.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_v_up",
   "name": "V-Up",
   "nameNL": "V-Up",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 3,
   "instructions": "Op je rug, armen en benen gestrekt. Kom tegelijk omhoog met armen en benen tot je een V vormt, raak je tenen aan. Gecontroleerd terug.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_hollow_hold",
   "name": "Hollow Hold",
   "nameNL": "Hollow Hold",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op je rug, onderrug in de vloer gedrukt, armen en benen net van de grond. Houd vast. Hoe lager, hoe zwaarder.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_flutter_kick",
   "name": "Flutter Kick",
   "nameNL": "Flutter Kicks",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op je rug, benen net boven de vloer. Kleine snelle trappen op en neer, onderrug tegen de vloer.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_scissor_kick",
   "name": "Scissor Kick",
   "nameNL": "Scissor Kicks",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op je rug, benen omhoog. Kruis de benen om en om als een schaar. Onderrug blijft plat.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_plank_hip_dip",
   "name": "Plank Hip Dip",
   "nameNL": "Plank met heupdraai",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Onderarm-plank. Draai je heupen om en om naar links en rechts tot ze bijna de vloer raken. Schuine buikspieren.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_toe_touch_crunch",
   "name": "Toe Touch Crunch",
   "nameNL": "Toe Touch Crunch",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op je rug, benen recht omhoog. Reik met je handen naar je tenen door je schouderbladen van de vloer te tillen.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_reverse_crunch",
   "name": "Reverse Crunch",
   "nameNL": "Reverse Crunch",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op je rug, knieën gebogen. Trek je knieën naar je borst en til je heupen van de vloer. Onderbuik.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_bird_dog",
   "name": "Bird Dog",
   "nameNL": "Bird Dog",
   "muscle": "core",
   "secondary": [
     "back",
     "glutes"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Op handen en knieën. Strek tegelijk je rechterarm en linkerbeen, houd even, wissel. Romp beweegt niet — stabiliteit voor je onderrug.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "core_dumbbell_chopper",
   "name": "Dumbbell Chopper",
   "nameNL": "Dumbbell Chopper",
   "muscle": "core",
   "secondary": [
     "shoulders"
   ],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Eén dumbbell met beide handen. Zwaai van laag bij je heup schuin omhoog naar de andere schouder, alsof je hout hakt. Per kant.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_weighted_russian_twist",
   "name": "Weighted Russian Twist",
   "nameNL": "Russian Twist met dumbbell",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "dumbbells"
   ],
   "difficulty": 2,
   "instructions": "Zit met licht gebogen knieën, voeten van de vloer, dumbbell voor je borst. Draai je romp om en om, ogen volgen de dumbbell.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_sit_up",
   "name": "Sit-Up",
   "nameNL": "Sit-up",
   "muscle": "core",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Op je rug, knieën gebogen, handen achter je hoofd. Kom helemaal op tot zittend, langzaam terug. Niet aan je nek trekken.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "core_side_plank_reach",
   "name": "Side Plank Reach",
   "nameNL": "Zijplank met reik",
   "muscle": "core",
   "secondary": [
     "shoulders"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 3,
   "instructions": "Zijplank op één hand. Reik met de bovenste arm onder je lichaam door en weer omhoog. Schuine buikspieren en schouderstabiliteit.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "full_kettlebell_situp_press",
   "name": "Kettlebell Sit-Up to Press",
   "nameNL": "Kettlebell Sit-up met Press",
   "muscle": "fullBody",
   "secondary": [
     "core",
     "shoulders"
   ],
   "equipment": [
     "kettlebell"
   ],
   "difficulty": 3,
   "instructions": "Op je rug met de kettlebell op je borst. Kom op tot zittend en druk de kettlebell boven je hoofd. Gecontroleerd terug.",
   "recoveryHours": 36,
   "video": null,
   "clip": true
 },
 {
   "id": "full_bear_crawl",
   "name": "Bear Crawl",
   "nameNL": "Bear Crawl",
   "muscle": "fullBody",
   "secondary": [
     "core",
     "shoulders"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 2,
   "instructions": "Op handen en voeten, knieën net boven de vloer. Kruip voor- en achteruit met tegengestelde hand en voet. Rug blijft vlak als een tafel.",
   "recoveryHours": 24,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_inchworm",
   "name": "Inchworm",
   "nameNL": "Inchworm",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Vanuit stand buig je voorover en loop je met je handen uit tot een plank, dan loop je met je voeten weer naar je handen. Hamstrings, schouders en core in één.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_hip_circle",
   "name": "Hip Circle",
   "nameNL": "Heupcirkels",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Sta op één been, maak grote cirkels met de andere knie: voor, zij, achter. Beide richtingen, beide kanten. Opent je heupen voor squats en deadlifts.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_shoulder_circle",
   "name": "Shoulder Circle",
   "nameNL": "Schoudercirkels",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Vingertoppen op je schouders, maak grote cirkels met je ellebogen. Voor- en achterwaarts. Warmt het schoudergewricht op voor drukwerk.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_hamstring_stretch",
   "name": "Standing Forward Fold",
   "nameNL": "Staande hamstringstretch",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Buig rustig voorover met bijna gestrekte benen en laat je armen hangen. Adem uit en laat je zwaarte het werk doen. 30-45 sec.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_child_pose",
   "name": "Child's Pose",
   "nameNL": "Kindhouding",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Kniel, ga zitten op je hielen en strek je armen ver naar voren, voorhoofd op de mat. Adem diep in je onderrug. Cooling-down na de deadlift.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_downward_dog",
   "name": "Downward Dog",
   "nameNL": "Downward Dog",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Omgekeerde V: handen en voeten in de vloer, heupen hoog. Duw je hielen richting de vloer en je borst richting je dijen. Kuiten, hamstrings en schouders.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_plank_to_downdog",
   "name": "Plank to Downward Dog",
   "nameNL": "Plank naar Downward Dog",
   "muscle": "mobility",
   "secondary": [
     "core",
     "shoulders"
   ],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Vanuit een hoge plank duw je je heupen omhoog en achteruit naar een downward dog, dan weer terug. Vloeiend op je adem.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 },
 {
   "id": "mobility_standing_quad_stretch",
   "name": "Standing Quad Stretch",
   "nameNL": "Staande quadstretch",
   "muscle": "mobility",
   "secondary": [],
   "equipment": [
     "bodyweight"
   ],
   "difficulty": 1,
   "instructions": "Pak je enkel achter je en trek je hiel naar je bil, knieën bij elkaar, heup naar voren. 30-45 sec per kant. Fijn na het fietsen.",
   "recoveryHours": 0,
   "video": null,
   "clip": true
 }
];

export const MUSCLE_NL = {chest:'Borst', back:'Rug', shoulders:'Schouders', biceps:'Biceps', triceps:'Triceps',
 quadriceps:'Quadriceps', hamstrings:'Hamstrings', glutes:'Billen', core:'Core', fullBody:'Full body',
 calves:'Kuiten', forearms:'Onderarmen'};
export const EQUIPMENT_NL = {dumbbells:'Dumbbells', bench:'Bankje', inclineBench:'Verstelbaar bankje', bodyweight:'Lichaamsgewicht',
 kettlebell:'Kettlebell', resistanceBands:'Weerstandsbanden', abWheel:'Ab-roller', pullUpBar:'Optrekstang',
 barbell:'Barbell', ezBar:'EZ-bar', cableMachine:'Kabelstation', dipStation:'Dip station', smithMachine:'Smith machine',
 latPulldown:'Lat pulldown', seatedRow:'Roeimachine', legPress:'Leg press', legCurl:'Leg curl', legExtension:'Leg extension',
 pecDeck:'Pec deck', chestPress:'Chest press', shoulderPress:'Shoulder press'};
export const byId = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

/** Alleen oefeningen met een animatie (of eigen toegevoegde) komen in beeld — geen vreemde eend tussen de clips. */
export function isVisible(e) { return !!(e && (e.clip || e.custom)); }
export function visibleExercises() { return EXERCISES.filter(isVisible); }
