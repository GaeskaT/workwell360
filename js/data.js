/* ===========================================================
   data.js — content for the 11-pillar ecosystem
   =========================================================== */

export const PILLARS = [
  { id: 'mental',    emoji: '🧠', name: 'Mental Health',        desc: 'Everyday emotional wellbeing', route: '#/mental' },
  { id: 'stress',    emoji: '😰', name: 'Stress Management',    desc: 'Track & lighten the load',     route: '#/stress' },
  { id: 'burnout',   emoji: '🔥', name: 'Burnout Recovery',     desc: 'Recognise & recover',          route: '#/burnout' },
  { id: 'anger',     emoji: '😡', name: 'Anger Management',     desc: 'Pause, reflect, respond',      route: '#/anger' },
  { id: 'conflict',  emoji: '🤝', name: 'Conflict Resolution',  desc: 'Sort it out, don\'t carry it', route: '#/conflict' },
  { id: 'counselling', emoji: '💼', name: 'Workplace Counselling', desc: 'Talk to a professional',    route: '#/counselling' },
  { id: 'family',    emoji: '👨‍👩‍👧', name: 'Family & Relationships', desc: 'Support at home',          route: '#/family' },
  { id: 'marriage',  emoji: '💍', name: 'Marriage & Partnership', desc: 'Protect the home front',     route: '#/marriage' },
  { id: 'substance', emoji: '🌿', name: 'Substance Use & Recovery', desc: 'One day at a time',        route: '#/substance' },
  { id: 'chronic',   emoji: '🩺', name: 'Chronic Illness',      desc: 'Living well with a long-term condition', route: '#/chronic' },
  { id: 'grief',     emoji: '🕊️', name: 'Loss & Grief',         desc: 'Support through bereavement',  route: '#/grief' },
];

/* ---- Daily check-in moods ---- */
export const MOODS = [
  { v: 5, e: '😊', l: 'Doing well' },
  { v: 4, e: '🙂', l: 'Okay' },
  { v: 3, e: '😐', l: 'Struggling' },
  { v: 2, e: '😟', l: 'Very stressed' },
  { v: 1, e: '😔', l: 'Not coping' },
  { v: 0, e: '🚨', l: 'I need help' },
];

/* ---- "What do you need today?" router ---- */
export const NEED_PATHS = [
  { e: '😡', label: 'I am angry',                 route: '#/anger',       tag: 'Anger pathway' },
  { e: '😰', label: 'I am stressed',              route: '#/stress',      tag: 'Stress pathway' },
  { e: '🔥', label: 'I am exhausted',             route: '#/burnout',     tag: 'Burnout pathway' },
  { e: '🕊️', label: 'I am grieving',              route: '#/grief', tag: 'Grief pathway' },
  { e: '🤝', label: 'I am caught in a conflict',  route: '#/conflict',    tag: 'Conflict pathway' },
  { e: '🌿', label: 'I am struggling with substances', route: '#/substance', tag: 'Recovery pathway' },
  { e: '💍', label: 'My marriage is under strain', route: '#/marriage',   tag: 'Marriage pathway' },
  { e: '🩺', label: 'I live with a chronic illness', route: '#/chronic',  tag: 'Chronic illness pathway' },
  { e: '💼', label: 'I am struggling at work',    route: '#/counselling?cat=Workplace conflict', tag: 'Workplace pathway' },
  { e: '❤️', label: 'My relationship is struggling', route: '#/family',   tag: 'Relationship pathway' },
  { e: '🧠', label: 'I need professional help',   route: '#/counselling', tag: 'Counselling pathway' },
];

/* ---- Assessments (0-4 Likert; score = sum normalised to 100) ---- */
export const ASSESSMENTS = {
  anger: {
    id: 'anger', title: 'Anger self-assessment', pillar: 'anger',
    intro: 'Answer honestly. This is a reflection tool, not a diagnosis.',
    questions: [
      'I lose my temper more easily than I would like.',
      'When criticised, I react before I think.',
      'My body tenses up (jaw, fists, heart racing) when I am angry.',
      'My anger affects my colleagues or family.',
      'I say or do things in anger that I later regret.',
      'Small workplace frustrations build up over the day.',
    ],
    bands: [
      { max: 30, band: 'Low', note: 'You generally manage anger well. Keep using healthy outlets.' },
      { max: 60, band: 'Moderate', note: 'Some triggers get the better of you. The toolkit below will help.' },
      { max: 100, band: 'Elevated', note: 'Anger is affecting your relationships. Consider the course + a counsellor.' },
    ],
  },
  stress: {
    id: 'stress', title: 'Stress check', pillar: 'stress',
    intro: 'Think about the last two weeks at work and home.',
    questions: [
      'My workload feels unmanageable.',
      'I struggle to switch off after work.',
      'Deadlines or targets keep me on edge.',
      'Financial pressure weighs on me.',
      'My sleep is disturbed by worry.',
      'I have little time for the things that restore me.',
    ],
    bands: [
      { max: 30, band: 'Low', note: 'Your stress is in a healthy range. Maintain your boundaries.' },
      { max: 60, band: 'Moderate', note: 'Stress is climbing. Try the breathing + boundary tools this week.' },
      { max: 100, band: 'High', note: 'Sustained high stress can lead to burnout. Talk to someone early.' },
    ],
  },
  burnout: {
    id: 'burnout', title: 'Burnout self-check', pillar: 'burnout',
    intro: 'Burnout builds slowly: exhaustion → detachment → reduced effectiveness.',
    questions: [
      'I feel emotionally drained by my work.',
      'I have become more cynical or detached about my job.',
      'I doubt the value or impact of my work.',
      'Even after rest, I do not feel recovered.',
      'I am running on empty to get through the day.',
      'I dread the start of the work week.',
    ],
    bands: [
      { max: 30, band: 'Low risk', note: 'Energy reserves are healthy. Keep protecting your recovery time.' },
      { max: 55, band: 'Warning signs', note: 'Early burnout signals. Prioritise rest and reduce load now.' },
      { max: 100, band: 'High risk', note: 'This looks like burnout. A recovery plan + counsellor is strongly advised.' },
    ],
  },
  wellbeing: {
    id: 'wellbeing', title: 'Wellbeing self-check', pillar: 'mental',
    intro: 'A gentle check-in on how you have been over the last two weeks. Not a diagnosis.',
    questions: [
      'I have felt down, low or hopeless.',
      'I have had little interest or pleasure in things I usually enjoy.',
      'I have felt anxious, worried or on edge.',
      'I have struggled to cope with everyday demands.',
      'I have felt isolated or without support.',
      'Changes in my sleep or appetite have affected me.',
    ],
    bands: [
      { max: 30, band: 'Positive wellbeing', note: 'You are coping well. Keep up the habits that support you.' },
      { max: 60, band: 'Some strain', note: 'You are carrying more than usual. Lean on the tools below this week.' },
      { max: 100, band: 'Reach out', note: 'This has been heavy. Talking to a professional could really help.' },
    ],
  },
  grief: {
    id: 'grief', title: 'Grief support check', pillar: 'grief',
    intro: 'A gentle check on how grief has been affecting you lately. There are no wrong answers, and this is not a diagnosis.',
    questions: [
      'Waves of grief have made it hard to get through the day.',
      'I have struggled to sleep, eat, or care for myself.',
      'I have felt isolated or cut off from others.',
      'It has been hard to manage my usual work or responsibilities.',
      'I have felt stuck, unable to move forward.',
      'The pain has felt like too much to carry alone.',
    ],
    bands: [
      { max: 30, band: 'Coping, with support', note: 'You are carrying grief and still coping. Keep leaning on the tools and the people around you.' },
      { max: 60, band: 'Grief is weighing heavily', note: 'This has been hard. Be gentle with yourself, and consider talking to someone who can support you.' },
      { max: 100, band: 'Please reach out', note: 'You do not have to carry this alone. A grief counsellor can really help — and if you ever feel unsafe, please use Get urgent help now.' },
    ],
  },
  workplace: {
    id: 'workplace', title: 'Workplace wellbeing check', pillar: 'workplace',
    intro: 'How work has felt over the last two weeks. A reflection tool, not a diagnosis.',
    questions: [
      'My workload has felt unmanageable.',
      'Conflict or tension at work has affected me.',
      'I have dreaded going to work.',
      'I have felt unsupported by my manager or team.',
      'Work stress has followed me home.',
      'I have thought about leaving because of how work feels.',
    ],
    bands: [
      { max: 30, band: 'Healthy at work', note: 'Work feels manageable. Keep protecting your boundaries and energy.' },
      { max: 60, band: 'Under strain', note: 'Pressure is building. Try the workplace tools and a workload conversation this week.' },
      { max: 100, band: 'High workplace strain', note: 'Work is taking a real toll. Talking to a counsellor could help you find a way forward.' },
    ],
  },
  family: {
    id: 'family', title: 'Relationship & home check', pillar: 'family',
    intro: 'How things have felt at home lately. A reflection tool, not a diagnosis.',
    questions: [
      'Tension at home has been weighing on me.',
      'We struggle to communicate without conflict.',
      'I feel distant or disconnected from those close to me.',
      'Work leaves me little energy for the people I love.',
      'The same unresolved issues keep coming back.',
      'I feel unsupported at home.',
    ],
    bands: [
      { max: 30, band: 'Connected', note: 'Your relationships feel steady. Keep nurturing them with time and honest talk.' },
      { max: 60, band: 'Some strain', note: 'A few things need attention. The communication tools below are a good place to start.' },
      { max: 100, band: 'Struggling — reach out', note: 'Home has felt hard. Couples or family counselling could help you reconnect.' },
    ],
  },
  substance: {
    id: 'substance', title: 'Substance-use check', pillar: 'substance',
    intro: 'Be honest — nobody else sees this. It is a reflection tool, not a diagnosis.',
    questions: [
      'I use alcohol or other substances to calm my nerves or switch off.',
      'I have broken a promise to myself or my family about how much I use.',
      'Thinking about the next drink or dose shapes my day.',
      'I have used alone, or hidden how much I use.',
      'Work, money or relationships have suffered because of my use.',
      'When I stop, I feel irritable, restless or unwell.',
    ],
    bands: [
      { max: 30, band: 'In control', note: 'Your use does not seem to be running your life. Keep watching the patterns that creep up.' },
      { max: 60, band: 'Warning signs', note: 'Use is starting to cost you something. The craving tools and a check-in with a counsellor will help.' },
      { max: 100, band: 'Time to reach out', note: 'This looks like dependence. Please talk to a professional — and do not stop alcohol or sedatives abruptly without medical advice.' },
    ],
  },
  conflict: {
    id: 'conflict', title: 'Conflict style & load check', pillar: 'conflict',
    intro: 'Think of a specific ongoing disagreement at work or at home. A reflection tool, not a diagnosis.',
    questions: [
      'I avoid difficult conversations until they blow up.',
      'The same disagreement keeps coming back unresolved.',
      'I react sharply when I feel criticised or undermined.',
      'Conflict follows me home and into my sleep.',
      'I struggle to say what I actually need.',
      'I do not feel safe raising the issue directly.',
    ],
    bands: [
      { max: 30, band: 'Handling it well', note: 'You deal with friction early and directly. Keep the same skills for the harder conversations ahead.' },
      { max: 60, band: 'Carrying unresolved tension', note: 'Avoidance or heat is costing you. The prep tool below will get a hard conversation started safely.' },
      { max: 100, band: 'Conflict is wearing you down', note: 'This is beyond small talk. Use the escalation ladder, and consider a counsellor or HR/mediation.' },
    ],
  },
  marriage: {
    id: 'marriage', title: 'Marriage & partnership check', pillar: 'marriage',
    intro: 'About your relationship over the last few weeks. A reflection tool, not a diagnosis.',
    questions: [
      'We repeat the same argument without resolution.',
      'I feel emotionally distant from my partner.',
      'Money is a source of tension between us.',
      'One of us carries most of the home and parenting load.',
      'We rarely make time for each other in a normal week.',
      'I feel criticised or dismissed at home.',
    ],
    bands: [
      { max: 30, band: 'Steady', note: 'Your partnership looks solid. Keep the small habits that protect it — they are what hold.' },
      { max: 60, band: 'Strained', note: 'Distance is building. The weekly check-in and repair scripts below are made for exactly this point.' },
      { max: 100, band: 'Reach out — together', note: 'This is heavy to carry alone. Couples counselling works best before resentment sets. If you are ever unsafe at home, please use Get urgent help.' },
    ],
  },
  chronic: {
    id: 'chronic', title: 'Living with a chronic condition', pillar: 'chronic',
    intro: 'How the condition — and the practical weight of it — has been lately. Not a diagnosis.',
    questions: [
      'Managing my health takes most of my energy.',
      'I worry about how work will treat my condition.',
      'Symptoms or treatment side-effects disturb my sleep and focus.',
      'I have given up things I value because of my health.',
      'I feel isolated or misunderstood about my illness.',
      'Clinic visits, medicine and transport costs weigh on me.',
    ],
    bands: [
      { max: 30, band: 'Coping well', note: 'You are managing the condition without it managing you. Keep pacing yourself and protecting rest.' },
      { max: 60, band: 'Carrying a heavy load', note: 'Illness stress is real stress. Try the pacing and appointment tools, and let someone in.' },
      { max: 100, band: 'Overwhelmed — reach out', note: 'Living with a long-term condition is a common route into anxiety and depression. Talking to a counsellor alongside your clinic care helps.' },
    ],
  },
};

/* ---- Toolkits per pillar ---- */
export const TOOLKITS = {
  anger: [
    { ico: '📓', title: 'Anger diary', desc: 'Log triggers, body signals & responses', route: '#/anger/diary' },
    { ico: '🌬️', title: 'Pause & breathe (4-7-8)', desc: '90-second guided reset', route: '#/tool/breathe?ctx=anger' },
    { ico: '🎯', title: 'Trigger identification', desc: 'Map what sets you off', route: '#/anger/triggers' },
    { ico: '⏸️', title: 'STOP · PAUSE · REFLECT · RESPOND', desc: 'Workplace scenario coach', route: '#/anger/scenario' },
    { ico: '🗣️', title: 'Assertive communication', desc: 'Say it firmly, not fiercely', route: '#/anger/assertive' },
    { ico: '🎓', title: 'Anger-management course', desc: '6 short lessons', route: '#/course/anger' },
  ],
  stress: [
    { ico: '📊', title: 'Stress dashboard', desc: 'Track workload, sleep & balance', route: '#/stress/diary' },
    { ico: '🌬️', title: 'Box breathing', desc: '4-4-4-4 calm-down', route: '#/tool/breathe?ctx=stress' },
    { ico: '🧘', title: 'Progressive relaxation', desc: 'Release tension head-to-toe', route: '#/tool/relax' },
    { ico: '⏱️', title: 'Time & priority tool', desc: 'Sort urgent vs important', route: '#/stress/time' },
    { ico: '🚧', title: 'Boundary-setting guide', desc: 'Protect your off-hours', route: '#/stress/boundaries' },
    { ico: '💬', title: 'Workload conversation guide', desc: 'Script for your manager', route: '#/stress/workload' },
    { ico: '✅', title: 'Self-care checklist', desc: 'Daily basics that protect you', route: '#/stress/selfcare' },
    { ico: '🎓', title: 'Managing workplace stress', desc: 'Course · 5 lessons', route: '#/course/stress' },
  ],
  burnout: [
    { ico: '🔋', title: 'Energy tracker', desc: 'Energy, sleep & workload trend', route: '#/burnout/energy' },
    { ico: '😴', title: 'Sleep tracker', desc: 'Protect your recovery', route: '#/burnout/energy' },
    { ico: '🛌', title: 'Rest & leave planner', desc: 'Plan real recovery time', route: '#/burnout/rest' },
    { ico: '🚧', title: 'Boundary exercises', desc: 'Reduce the constant load', route: '#/stress/boundaries' },
    { ico: '🗺️', title: 'Recovery plan', desc: 'Your step-by-step comeback', route: '#/burnout/recovery' },
    { ico: '↩️', title: 'Return-to-work support', desc: 'Ease back sustainably', route: '#/burnout/rtw' },
    { ico: '🎓', title: 'Preventing burnout', desc: 'Course · 6 lessons', route: '#/course/burnout' },
  ],
  mental: [
    { ico: '🌬️', title: 'Breathing reset', desc: 'Calm your body in 90 seconds', route: '#/tool/breathe' },
    { ico: '🧘', title: 'Grounding (5-4-3-2-1)', desc: 'Come back to the present', route: '#/tool/relax' },
    { ico: '🙏', title: 'Gratitude journal', desc: 'Notice what went well', route: '#/journal/gratitude' },
    { ico: '✍️', title: 'Daily reflection', desc: 'What drained & restored you', route: '#/journal/reflection' },
    { ico: '💤', title: 'Sleep & self-care basics', desc: 'The habits that protect you', route: '#/stress/selfcare' },
    { ico: '🧠', title: 'Emotional Intelligence', desc: 'Course · 5 lessons', route: '#/course/eq' },
    { ico: '💬', title: 'Talk to a professional', desc: 'Individual counselling', route: '#/counselling?cat=Individual counselling' },
  ],
  grief: [
    { ico: '🕊️', title: 'Understanding grief', desc: 'Grief comes in waves — what to expect', route: '#/grief/understanding' },
    { ico: '🕯️', title: 'Grief journal', desc: 'A private space for how you feel', route: '#/journal/grief' },
    { ico: '💗', title: 'A memory to hold', desc: 'A gentle remembrance exercise', route: '#/grief/remember' },
    { ico: '🌬️', title: 'Breathing for hard moments', desc: 'Steady yourself when it surges', route: '#/tool/breathe' },
    { ico: '🧘', title: 'Grounding when it overwhelms', desc: '5-4-3-2-1 technique', route: '#/tool/relax' },
    { ico: '🤝', title: 'Grief support group', desc: 'You are not alone', route: '#/counselling?cat=Grief and loss' },
    { ico: '💬', title: 'Talk to a grief counsellor', desc: 'Compassionate, confidential', route: '#/counselling?cat=Grief and loss' },
  ],
  workplace: [
    { ico: '🕵️', title: 'Report anonymously', desc: 'Confidential — no victimization', route: '#/workplace/report' },
    { ico: '💬', title: 'Workload conversation guide', desc: 'A script for your manager', route: '#/stress/workload' },
    { ico: '🚧', title: 'Boundaries at work', desc: 'Protect your time & energy', route: '#/stress/boundaries' },
    { ico: '🗣️', title: 'Assertive communication', desc: 'Say it firmly, not fiercely', route: '#/anger/assertive' },
    { ico: '🤝', title: 'Conflict resolution', desc: 'Handle friction professionally', route: '#/workplace/conflict' },
    { ico: '📊', title: 'Workplace stress check', desc: 'See where the pressure is', route: '#/assess/stress' },
    { ico: '🧭', title: 'Career counselling', desc: 'Talk through your path', route: '#/counselling?cat=Career counselling' },
  ],
  family: [
    { ico: '💬', title: 'Healthy communication', desc: 'Listen, speak & repair well', route: '#/family/communication' },
    { ico: '💍', title: 'Marriage & partnership', desc: 'Check-ins, repair scripts & money talks', route: '#/marriage' },
    { ico: '🗣️', title: 'Say it kindly (assertive)', desc: 'Firm and respectful', route: '#/anger/assertive' },
    { ico: '🚧', title: 'Work–life boundaries', desc: 'Keep work from spilling home', route: '#/stress/boundaries' },
    { ico: '🧒', title: 'Parenting & work', desc: 'Balancing both', route: '#/family/parenting' },
    { ico: '🧓', title: 'Caregiving & ageing parents', desc: 'The sandwich generation', route: '#/family/caregiving' },
    { ico: '🕊️', title: 'Grief & bereavement', desc: 'Support through loss', route: '#/grief' },
    { ico: '📓', title: 'Reflection journal', desc: 'Notice what matters at home', route: '#/journal/reflection' },
    { ico: '🎓', title: 'Healthy Relationships', desc: 'Course · 5 lessons', route: '#/course/rel' },
    { ico: '💞', title: 'Talk to a counsellor', desc: 'Couples & family counselling', route: '#/counselling?cat=Couples counselling' },
  ],
  substance: [
    { ico: '📓', title: 'Craving log', desc: 'Catch the urge, record what you did instead', route: '#/substance/cravings' },
    { ico: '🌱', title: 'Recovery day counter', desc: 'Milestones & your next target', route: '#/substance/counter' },
    { ico: '🧨', title: 'Trigger map', desc: 'People, places, feelings & money days', route: '#/substance/triggers' },
    { ico: '🆘', title: 'My urge plan', desc: 'What I do in the next 20 minutes', route: '#/substance/plan' },
    { ico: '🌬️', title: 'Breathe through a craving', desc: '90-second guided reset', route: '#/tool/breathe?ctx=substance' },
    { ico: '📝', title: 'Recovery journal', desc: 'Private, on your device', route: '#/journal/recovery' },
    { ico: '🎓', title: 'Overcoming substance use', desc: 'Course · 6 lessons', route: '#/course/substance' },
    { ico: '💬', title: 'Talk to a specialist', desc: 'Confidential addiction support', route: '#/counselling?cat=Substance-use concerns' },
  ],
  conflict: [
    { ico: '🧭', title: 'Find your conflict style', desc: 'How you react under pressure', route: '#/conflict/style' },
    { ico: '📋', title: 'Prepare the hard conversation', desc: 'Build a script that lands', route: '#/conflict/prepare' },
    { ico: '🕵️', title: 'De-escalation at work', desc: 'Stay professional when it heats up', route: '#/workplace/conflict' },
    { ico: '🗣️', title: 'Assertive communication', desc: 'Say it firmly, not fiercely', route: '#/anger/assertive' },
    { ico: '📓', title: 'Conflict log', desc: 'Track what happened & the outcome', route: '#/conflict/log' },
    { ico: '🪜', title: 'Escalation ladder', desc: 'When to go to your manager or HR', route: '#/conflict/escalate' },
    { ico: '🕵️', title: 'Report anonymously', desc: 'If it is bullying or harassment', route: '#/workplace/report' },
    { ico: '🎓', title: 'Conflict resolution at work', desc: 'Course · 5 lessons', route: '#/course/conflict' },
    { ico: '💬', title: 'Talk it through', desc: 'Mediation with a counsellor', route: '#/counselling?cat=Workplace conflict' },
  ],
  marriage: [
    { ico: '📅', title: 'Weekly check-in', desc: 'Five numbers that show where you are', route: '#/marriage/checkin' },
    { ico: '🩹', title: 'Repair script', desc: 'How to come back after a fight', route: '#/marriage/repair' },
    { ico: '💬', title: 'Healthy communication', desc: 'Listen, speak & repair well', route: '#/family/communication' },
    { ico: '💰', title: 'The money conversation', desc: 'Talk finances without a row', route: '#/marriage/money' },
    { ico: '💞', title: 'Connection habits', desc: 'Small things that keep you close', route: '#/marriage/rituals' },
    { ico: '🧾', title: 'Before we marry', desc: 'The 14 conversations to have first', route: '#/marriage/premarital' },
    { ico: '📝', title: 'Partnership journal', desc: 'Private to your device', route: '#/journal/marriage' },
    { ico: '🎓', title: 'Marriage & partnership', desc: 'Course · 5 lessons', route: '#/course/marriage' },
    { ico: '💬', title: 'Couples counselling', desc: 'Get support early', route: '#/counselling?cat=Couples counselling' },
  ],
  chronic: [
    { ico: '📓', title: 'Symptom & flare log', desc: 'Daily record to spot patterns', route: '#/chronic/symptoms' },
    { ico: '💊', title: 'Medication tracker', desc: 'What you take, and today\'s doses', route: '#/chronic/meds' },
    { ico: '🔋', title: 'Energy pacing', desc: 'Plan the day around your energy', route: '#/chronic/pacing' },
    { ico: '🩺', title: 'Appointment prep', desc: 'Questions to take to clinic', route: '#/chronic/appointment' },
    { ico: '🗣️', title: 'Explaining it at work', desc: 'Script for your manager', route: '#/chronic/disclose' },
    { ico: '🌬️', title: 'Breathing for pain & flare-ups', desc: 'Steady your body', route: '#/tool/breathe?ctx=chronic' },
    { ico: '📝', title: 'Living with it journal', desc: 'Private to your device', route: '#/journal/chronic' },
    { ico: '🎓', title: 'Living well with chronic illness', desc: 'Course · 5 lessons', route: '#/course/chronic' },
    { ico: '💬', title: 'Talk to a counsellor', desc: 'Adjustment & grief support', route: '#/counselling?cat=Adjustment to major life changes' },
  ],
};

/* ---- Counselling categories & demo providers ---- */
export const COUNSELLING_CATEGORIES = [
  'Individual counselling', 'Couples counselling', 'Family counselling', 'Grief and loss',
  'Anger management', 'Stress', 'Burnout', 'Anxiety', 'Workplace conflict', 'Career counselling',
  'Financial stress', 'Substance-use concerns', 'Relationship issues',
  'Bereavement', 'Adjustment to major life changes', 'Chronic illness & disability',
];

export const PROVIDER_TYPES = ['Counsellor', 'Psychologist', 'Therapist', 'Psychiatrist', 'Coach', 'EAP provider', 'Support group'];

export const PROVIDERS = [
  { id: 'p1', name: 'Priscilla Maina', type: 'Counsellor', verified: true, specialties: ['Workplace conflict', 'Stress', 'Anxiety'], modes: ['Video', 'In-person', 'Chat'], rate: 2000, langs: ['English', 'Kiswahili'], rating: 4.9, bio: 'Lead workplace-wellness counsellor. 12 yrs supporting employees through stress and workplace conflict.' },
  { id: 'p2', name: 'Dr. Amina Yusuf', type: 'Psychologist', verified: true, specialties: ['Anxiety', 'Burnout', 'Adjustment to major life changes', 'Chronic illness & disability'], modes: ['Video', 'In-person'], rate: 3500, langs: ['English'], rating: 4.8, bio: 'Clinical psychologist focused on burnout recovery, anxiety and living with long-term health conditions.' },
  { id: 'p3', name: 'Samuel Otieno', type: 'Therapist', verified: true, specialties: ['Grief and loss', 'Bereavement', 'Family counselling'], modes: ['Video', 'Chat'], rate: 2500, langs: ['English', 'Kiswahili', 'Dholuo'], rating: 4.9, bio: 'Grief and family therapist. Gentle, faith-sensitive approach.' },
  { id: 'p4', name: 'Grace Wambui', type: 'Coach', verified: true, specialties: ['Career counselling', 'Financial stress', 'Adjustment to major life changes'], modes: ['Video'], rate: 1800, langs: ['English', 'Kiswahili'], rating: 4.7, bio: 'Career & financial-wellness coach. Practical planning for life changes.' },
  { id: 'p5', name: 'Peter Njoroge', type: 'Psychiatrist', verified: true, specialties: ['Anxiety', 'Substance-use concerns'], modes: ['Video', 'In-person'], rate: 5000, langs: ['English'], rating: 4.8, bio: 'Consultant psychiatrist. Medication review and complex care.' },
  { id: 'g1', name: 'Managing Stress Together', type: 'Support group', verified: true, specialties: ['Stress', 'Burnout'], modes: ['Video'], rate: 0, langs: ['English'], rating: 4.6, bio: 'Weekly peer support group facilitated by a counsellor. Free for members.' },
  { id: 'p6', name: 'Esther Wanjiru', type: 'Counsellor', verified: true, specialties: ['Substance-use concerns', 'Chronic illness & disability', 'Grief and loss'], modes: ['Video', 'In-person', 'Chat'], rate: 2200, langs: ['English', 'Kiswahili'], rating: 4.8, bio: 'Addiction and health-adjustment counsellor. Practical, non-judgemental, family-inclusive.' },
];

/* ---- Family / relationship pathways ---- */
export const FAMILY_TOPICS = [
  { ico: '💍', title: 'Marriage & partnership', desc: 'Check-ins, repair scripts, money talks', route: '#/marriage' },
  { ico: '💞', title: 'Couples counselling', desc: 'Get support before resentment sets', route: '#/counselling?cat=Couples counselling' },
  { ico: '👪', title: 'Family counselling', desc: 'Whole-family support', route: '#/counselling?cat=Family counselling' },
  { ico: '🧒', title: 'Parenting & children', desc: 'Balancing work and home', route: '#/family/parenting' },
  { ico: '🕊️', title: 'Grief & bereavement', desc: 'Loss support for you and family', route: '#/grief' },
  { ico: '🧓', title: 'Caregiving & ageing parents', desc: 'Support the sandwich generation', route: '#/family/caregiving' },
  { ico: '🩺', title: 'Chronic illness at home', desc: 'Caring & living with a long-term condition', route: '#/chronic' },
  { ico: '🌿', title: 'Substance use in the family', desc: 'Support for you and them', route: '#/substance' },
  { ico: '⚖️', title: 'Work–life balance', desc: 'Protect home from work spillover', route: '#/stress/boundaries' },
];

/* ---- Store: journals, courses, tools ---- */
export const PRODUCTS = [
  // Journals
  { id: 'j-men', cat: 'Journals', name: 'Self-Care Journal for Men', price: 850, ico: '📓', desc: '90-day guided reflection built for men at work.' },
  { id: 'j-women', cat: 'Journals', name: 'Self-Care Journal for Women', price: 850, ico: '📔', desc: '90-day guided self-care and boundaries journal.' },
  { id: 'j-stress', cat: 'Journals', name: 'Stress Journal', price: 700, ico: '🗒️', desc: 'Daily stress log with triggers and wins.' },
  { id: 'j-burnout', cat: 'Journals', name: 'Burnout Recovery Journal', price: 950, ico: '📕', desc: 'A 12-week recovery companion.' },
  { id: 'j-anger', cat: 'Journals', name: 'Anger Management Journal', price: 750, ico: '📙', desc: 'Track triggers, responses and progress.' },
  { id: 'j-grief', cat: 'Journals', name: 'Grief Journal', price: 750, ico: '🕯️', desc: 'A gentle space for loss and remembrance.' },
  { id: 'j-recovery', cat: 'Journals', name: 'Recovery Journal', price: 850, ico: '🌿', desc: 'Day-by-day craving, win and setback log.' },
  { id: 'j-marriage', cat: 'Journals', name: 'Marriage & Partnership Journal', price: 850, ico: '💍', desc: 'Weekly check-ins, appreciations and requests.' },
  { id: 'j-chronic', cat: 'Journals', name: 'Chronic Illness Companion', price: 900, ico: '🩺', desc: 'Symptoms, energy and clinic questions in one place.' },
  // Courses
  { id: 'c-stress', cat: 'Courses', name: 'Managing Workplace Stress', price: 1500, ico: '🎓', desc: '5 lessons · certificate', courseId: 'stress' },
  { id: 'c-burnout', cat: 'Courses', name: 'Preventing Burnout', price: 1800, ico: '🎓', desc: '6 lessons · certificate', courseId: 'burnout' },
  { id: 'c-anger', cat: 'Courses', name: 'Managing Anger', price: 1500, ico: '🎓', desc: '6 lessons · certificate', courseId: 'anger' },
  { id: 'c-eq', cat: 'Courses', name: 'Emotional Intelligence', price: 2000, ico: '🎓', desc: '5 lessons · certificate', courseId: 'eq' },
  { id: 'c-balance', cat: 'Courses', name: 'Work–Life Balance', price: 1500, ico: '🎓', desc: '5 lessons · certificate', courseId: 'balance' },
  { id: 'c-finance', cat: 'Courses', name: 'Financial Wellness', price: 2500, ico: '🎓', desc: '6 lessons · certificate', courseId: 'finance' },
  { id: 'c-rel', cat: 'Courses', name: 'Healthy Relationships', price: 1800, ico: '🎓', desc: '5 lessons · certificate', courseId: 'rel' },
  { id: 'c-conflict', cat: 'Courses', name: 'Conflict Resolution at Work', price: 1500, ico: '🎓', desc: '5 lessons · certificate', courseId: 'conflict' },
  { id: 'c-substance', cat: 'Courses', name: 'Overcoming Substance Use', price: 2000, ico: '🎓', desc: '6 lessons · certificate', courseId: 'substance' },
  { id: 'c-marriage', cat: 'Courses', name: 'Marriage & Partnership', price: 1800, ico: '🎓', desc: '5 lessons · certificate', courseId: 'marriage' },
  { id: 'c-chronic', cat: 'Courses', name: 'Living Well with Chronic Illness', price: 1500, ico: '🎓', desc: '5 lessons · certificate', courseId: 'chronic' },
];

/* ---- Courses (lesson outlines) ---- */
export const COURSES = {
  anger: { id: 'anger', title: 'Managing Anger', lessons: ['Understanding your anger', 'Body signals & early warning', 'The STOP–PAUSE–REFLECT–RESPOND method', 'Assertive vs aggressive communication', 'Workplace conflict resolution', 'Building your relapse plan'] },
  stress: { id: 'stress', title: 'Managing Workplace Stress', lessons: ['What stress does to you', 'Mapping your stressors', 'Breathing & relaxation skills', 'Time & boundary management', 'Sustaining the change'] },
  burnout: { id: 'burnout', title: 'Preventing Burnout', lessons: ['Spotting burnout early', 'The exhaustion–detachment cycle', 'Rest that actually restores', 'Redesigning your workload', 'Boundaries & saying no', 'Your recovery & return plan'] },
  eq: { id: 'eq', title: 'Emotional Intelligence', lessons: ['Self-awareness', 'Self-regulation', 'Empathy at work', 'Social skills', 'Applying EQ under pressure'] },
  balance: { id: 'balance', title: 'Work–Life Balance', lessons: ['Auditing your week', 'Priorities & values', 'Protecting off-hours', 'Digital boundaries', 'Sustaining balance'] },
  finance: { id: 'finance', title: 'Financial Wellness', lessons: ['Money & wellbeing', 'Budgeting basics', 'Emergency fund & debt', 'Saving & investing', 'Passive income ideas', 'Planning for independence'] },
  rel: { id: 'rel', title: 'Healthy Relationships', lessons: ['Communication foundations', 'Conflict without harm', 'Repair & reconnection', 'Boundaries in relationships', 'Growing together'] },
  conflict: { id: 'conflict', title: 'Conflict Resolution at Work', lessons: ['Why conflict is information', 'Your default style under pressure', 'De-escalation & the facts/feelings split', 'Negotiating a shared outcome', 'When to escalate — HR, mediation, or leave'] },
  substance: { id: 'substance', title: 'Overcoming Substance Use', lessons: ['What use is doing for you', 'Mapping triggers & rituals', 'Urge surfing & the 20-minute rule', 'Changing the environment', 'Setbacks, shame & relapse planning', 'Rebuilding: sleep, money, relationships'] },
  marriage: { id: 'marriage', title: 'Marriage & Partnership', lessons: ['The four things that erode connection', 'Repair attempts & turning toward', 'Money, load & expectations', 'Intimacy after resentment', 'Rituals that keep you a team'] },
  chronic: { id: 'chronic', title: 'Living Well with Chronic Illness', lessons: ['Grieving the healthy self', 'Pacing & energy budgeting', 'Advocating in the clinic', 'Talking to your employer', 'Protecting mood & identity'] },
};

/* ---- Corporate packages ---- */
export const PACKAGES = [
  { id: 'basic', name: 'Basic', tagline: 'Wellbeing foundations', price: 'from Ksh 150 / employee / mo',
    features: ['Employee self-care tools', 'Mental-health education library', 'Monthly wellbeing webinars', 'Basic wellness dashboard'], badge: 'free' },
  { id: 'pro', name: 'Professional', tagline: 'Most popular', price: 'from Ksh 450 / employee / mo',
    features: ['Everything in Basic', 'Counselling sessions (EAP)', 'Stress & burnout programmes', 'Anger-management programme', 'Conflict-resolution workshops', 'Substance-use & recovery support', 'Grief & bereavement counselling', 'HR analytics dashboard', 'On-site employee workshops'], badge: 'pro', popular: true },
  { id: 'enterprise', name: 'Enterprise', tagline: 'Whole-organisation', price: 'Custom contract',
    features: ['Everything in Professional', 'Chronic-illness & caregiver support track', 'Marriage & family programme', 'Org-wide wellness assessment', 'Dedicated counsellors', 'Leadership wellness track', 'Custom training & certification', 'Quarterly org wellness reports', 'Dedicated account manager'], badge: 'new' },
];

/* ---- Counsellor portal demo ---- */
export const COUNSELLOR_DEMO = {
  name: 'Priscilla Maina', verified: true,
  today: [
    { time: '09:00', client: 'Client A', mode: 'Video', topic: 'Workplace conflict' },
    { time: '11:30', client: 'Client B', mode: 'In-person', topic: 'Stress' },
    { time: '14:00', client: 'Client C', mode: 'Chat', topic: 'Anxiety' },
  ],
  stats: { activeClients: 34, sessionsThisMonth: 96, avgRating: 4.9, followUpsDue: 5 },
};

/* ---- Crisis / emergency resources (Kenya-first, generic fallback) ---- */
export const CRISIS = [
  { name: 'Kenya Red Cross — free counselling', number: '1199', note: 'Toll-free psychosocial support' },
  { name: 'NACADA — substance-use helpline', number: '1192', note: 'Toll-free counselling & rehab referrals, 24 hrs' },
  { name: 'Befrienders Kenya', number: '+254 722 178 177', note: 'Emotional support & suicide prevention' },
  { name: 'Emergency services', number: '999 / 112', note: 'Immediate danger to life' },
  { name: 'Your workplace EAP', number: 'See HR / benefits', note: 'Confidential employee assistance' },
];
