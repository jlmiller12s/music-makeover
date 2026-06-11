const BUSINESS_EMAIL = 'themusicmakeover@gmail.com';

const PIPELINE_STAGES = [
  'New Inquiry',
  'Needs Review',
  'Consultation Scheduled',
  'Proposal Sent',
  'Contract Sent',
  'Deposit / Payment Pending',
  'Booked',
  'Service Delivered',
  'Follow-Up Sent',
  'Testimonial Requested',
  'Completed',
  'Archived / Not a Fit',
];

const CATEGORY_DEFINITIONS = {
  school: {
    label: 'School',
    clientType: 'School / Music Educator Support',
    tags: ['School', 'School Lead', 'Needs Review'],
    required: ['name', 'email', 'phone', 'organization', 'role', 'location', 'supportNeeded', 'currentChallenges', 'preferredTimeline'],
  },
  ensemble: {
    label: 'Choir / Ensemble',
    clientType: 'Choir & Ensemble Coaching',
    tags: ['Choir & Ensemble', 'Needs Review'],
    required: ['name', 'email', 'phone', 'organization', 'location', 'supportNeeded', 'currentChallenges', 'preferredTimeline'],
  },
  worship: {
    label: 'Worship Team',
    clientType: 'Worship Team / Church Support',
    tags: ['Worship Team', 'Church Lead', 'Needs Review'],
    required: ['name', 'email', 'phone', 'organization', 'role', 'location', 'teamSize', 'supportNeeded', 'currentChallenges', 'preferredTimeline'],
  },
  private: {
    label: 'Private Coaching',
    clientType: 'Private Music Coaching',
    tags: ['Private Coaching', 'Needs Review'],
    required: ['name', 'email', 'phone', 'musicGoals', 'experienceLevel', 'preferredLessonType', 'preferredAvailability'],
  },
  general: {
    label: 'General Inquiry',
    clientType: 'General Consultation',
    tags: ['General Inquiry', 'Needs Review'],
    required: ['name', 'email', 'phone', 'supportNeeded'],
  },
};

const FORM_FIELDS = {
  school: [
    ['name', 'Name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['organization', 'School / organization', 'text'],
    ['role', 'Role / title', 'text'],
    ['location', 'Location', 'text'],
    ['supportNeeded', 'Which service are you interested in?', 'select'],
    ['audienceType', 'What type of client are you?', 'select'],
    ['currentChallenges', 'What are your current goals or challenges?', 'textarea'],
    ['upcomingDates', 'Are you preparing for an audition, event, service, performance, concert, or season?', 'text'],
    ['preferredTimeline', 'What timeline are you hoping for?', 'text'],
    ['preferredFormat', 'What format are you interested in?', 'select'],
    ['budgetRange', 'What budget range are you working with?', 'select'],
    ['leadSource', 'How did you hear about us?', 'text'],
    ['notes', 'Anything else Ashley should know?', 'textarea'],
  ],
  ensemble: [
    ['name', 'Name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['organization', 'School / organization', 'text'],
    ['role', 'Role / title', 'text'],
    ['location', 'Location', 'text'],
    ['teamSize', 'Ensemble size', 'number'],
    ['supportNeeded', 'Which service are you interested in?', 'select'],
    ['audienceType', 'What type of client are you?', 'select'],
    ['currentChallenges', 'What are your current goals or challenges?', 'textarea'],
    ['upcomingDates', 'Are you preparing for an audition, event, service, performance, concert, or season?', 'text'],
    ['preferredTimeline', 'What timeline are you hoping for?', 'text'],
    ['preferredFormat', 'What format are you interested in?', 'select'],
    ['budgetRange', 'What budget range are you working with?', 'select'],
    ['leadSource', 'How did you hear about The Music Makeover?', 'text'],
    ['notes', 'Anything else Ashley should know?', 'textarea'],
  ],
  worship: [
    ['name', 'Name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['organization', 'Church / ministry name', 'text'],
    ['role', 'Role / title', 'text'],
    ['location', 'Location', 'text'],
    ['teamSize', 'Team size', 'number'],
    ['supportNeeded', 'Which service are you interested in?', 'select'],
    ['audienceType', 'What type of client are you?', 'select'],
    ['currentChallenges', 'What are your current goals or challenges?', 'textarea'],
    ['upcomingDates', 'Are you preparing for an audition, event, service, performance, concert, or season?', 'text'],
    ['preferredTimeline', 'What timeline are you hoping for?', 'text'],
    ['preferredFormat', 'What format are you interested in?', 'select'],
    ['budgetRange', 'What budget range are you working with?', 'select'],
    ['leadSource', 'How did you hear about The Music Makeover?', 'text'],
    ['notes', 'Anything else Ashley should know?', 'textarea'],
  ],
  private: [
    ['studentName', 'Student/client name', 'text'],
    ['parentGuardianName', 'Parent/guardian name if minor', 'text'],
    ['age', 'Age', 'number'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['supportNeeded', 'Which service are you interested in?', 'select'],
    ['audienceType', 'What type of client are you?', 'select'],
    ['musicGoals', 'What are your current goals or challenges?', 'textarea'],
    ['upcomingDates', 'Are you preparing for an audition, event, service, performance, concert, or season?', 'text'],
    ['experienceLevel', 'Experience level', 'select'],
    ['preferredLessonType', 'Preferred lesson type', 'select'],
    ['preferredAvailability', 'Preferred availability', 'textarea'],
    ['preferredFormat', 'What format are you interested in?', 'select'],
    ['budgetRange', 'What budget range are you working with?', 'select'],
    ['leadSource', 'How did you hear about The Music Makeover?', 'text'],
    ['emergencyContact', 'Emergency contact if needed', 'text'],
    ['notes', 'Anything else Ashley should know?', 'textarea'],
  ],
  general: [
    ['name', 'Name', 'text'],
    ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'],
    ['organization', 'School / organization', 'text'],
    ['role', 'Role / title', 'text'],
    ['location', 'Location', 'text'],
    ['supportNeeded', 'Which service are you interested in?', 'select'],
    ['audienceType', 'What type of client are you?', 'select'],
    ['currentChallenges', 'What are your current goals or challenges?', 'textarea'],
    ['upcomingDates', 'Are you preparing for an audition, event, service, performance, concert, or season?', 'text'],
    ['preferredTimeline', 'What timeline are you hoping for?', 'text'],
    ['preferredFormat', 'What format are you interested in?', 'select'],
    ['budgetRange', 'What budget range are you working with?', 'select'],
    ['leadSource', 'How did you hear about The Music Makeover?', 'text'],
    ['notes', 'Anything else Ashley should know?', 'textarea'],
  ],
};

const SERVICES = [
  {
    id: 'svc_quick_fix',
    name: 'Quick Fix Assessment',
    category: 'school',
    priceLabel: '$350',
    duration: '60 minutes',
    bookable: true,
    delivery: 'Virtual or on-site assessment',
    description: 'A focused consultation to identify strengths, gaps, and immediate next steps for a singer, team, choir, or program.',
    inclusions: ['Needs assessment', 'Strengths and growth-area summary', 'Priority action plan'],
  },
  {
    id: 'svc_music_educator_makeover',
    name: 'Music Educator Makeover',
    category: 'school',
    priceLabel: '$750',
    duration: 'Half-day consulting block',
    bookable: false,
    delivery: 'Request-first custom booking',
    description: 'Program consulting for educators who need rehearsal systems, classroom flow, performance prep, or program-building strategy.',
    inclusions: ['Consultation', 'Program strategy', 'Rehearsal plan guidance', 'Resource packet'],
  },
  {
    id: 'svc_ensemble_boost',
    name: 'Vocal Boost Workshop',
    category: 'ensemble',
    priceLabel: '$350+',
    duration: '60 to 90 minutes',
    bookable: false,
    delivery: 'Workshop request',
    description: 'A targeted workshop for choirs, teams, or vocal groups that need tone, blend, confidence, and rehearsal momentum.',
    inclusions: ['Warm-up sequence', 'Live coaching', 'Director recap', 'Practice assignments'],
  },
  {
    id: 'svc_worship_makeover',
    name: 'Worship Team Makeover Session',
    category: 'worship',
    priceLabel: '$500',
    duration: '90 minutes',
    bookable: false,
    delivery: 'Request-first custom booking',
    description: 'A worship team coaching session with feedback and follow-up recommendations for stronger vocals, culture, and rehearsal flow.',
    inclusions: ['Team assessment', 'Vocal coaching', 'Rehearsal framework', 'Next-step summary'],
  },
  {
    id: 'svc_worship_makeover_plus',
    name: 'Team Makeover Session',
    category: 'worship',
    priceLabel: '$500-$850',
    duration: 'Custom team session',
    bookable: false,
    delivery: 'Request-first custom booking',
    description: 'A deeper group coaching experience for choirs, ensembles, or worship teams that need leadership guidance and practical systems.',
    inclusions: ['Team coaching', 'Leader consult', 'Song-list feedback', 'Follow-up plan'],
  },
  {
    id: 'svc_worship_four_week',
    name: '4-Week Makeover Series',
    category: 'worship',
    priceLabel: '$1,500+',
    duration: 'Four weeks',
    bookable: false,
    delivery: 'Program proposal',
    description: 'A multi-week coaching series designed for consistent team, choir, or worship ministry development.',
    inclusions: ['Weekly team coaching', 'Leader check-ins', 'Rehearsal templates', 'Final summary'],
  },
  {
    id: 'svc_intensive',
    name: 'Music Makeover Intensive',
    category: 'school',
    priceLabel: '$1,250+',
    duration: 'Custom intensive',
    bookable: false,
    delivery: 'Custom proposal',
    description: 'A customized consulting and coaching experience with assessment, observation, recommendations, and follow-up support.',
    inclusions: ['Live coaching', 'Sectional strategy', 'Director/leader consult', 'Resource packet'],
  },
  {
    id: 'svc_full_program',
    name: 'Full Program Makeover',
    category: 'school',
    priceLabel: '$3,000+',
    duration: 'Multi-day or multi-week',
    bookable: false,
    delivery: 'Custom proposal',
    description: 'A comprehensive multi-week development package for churches, schools, or organizations that need strategy plus delivery.',
    inclusions: ['Discovery call', 'Program assessment', 'Implementation roadmap', 'Delivery notes', 'Follow-up consult'],
  },
  {
    id: 'svc_private_30',
    name: 'Private Coaching - 30 minutes',
    category: 'private',
    priceLabel: '$40',
    duration: '30 minutes',
    bookable: true,
    delivery: 'Private lesson',
    description: 'A focused private coaching session for young beginners, quick goals, or introductory skill-building.',
    inclusions: ['One-on-one coaching', 'Practice assignment', 'Session summary'],
  },
  {
    id: 'svc_private_45',
    name: 'Private Coaching - 45 minutes',
    category: 'private',
    priceLabel: '$65',
    duration: '45 minutes',
    bookable: true,
    delivery: 'Private lesson',
    description: 'A balanced private coaching session with time for technique, repertoire, and goal-setting.',
    inclusions: ['One-on-one coaching', 'Technique work', 'Practice assignment', 'Session summary'],
  },
  {
    id: 'svc_private_60',
    name: 'Private Coaching - 60 minutes',
    category: 'private',
    priceLabel: '$85',
    duration: '60 minutes',
    bookable: true,
    delivery: 'Private lesson',
    description: 'A full private coaching session for deeper vocal, musical, or performance development.',
    inclusions: ['One-on-one coaching', 'Repertoire support', 'Practice assignment', 'Session summary'],
  },
  {
    id: 'svc_private_monthly_45',
    name: 'Monthly 4-Pack - 45-minute Private Coaching',
    category: 'private',
    priceLabel: '$250',
    duration: 'Four 45-minute sessions',
    bookable: true,
    delivery: 'Monthly private coaching package',
    description: 'A monthly private coaching package for consistent weekly development and personalized growth.',
    inclusions: ['Four private sessions', 'Practice assignments', 'Session summaries', 'Monthly progress focus'],
  },
  {
    id: 'svc_private_monthly_60',
    name: 'Monthly 4-Pack - 60-minute Private Coaching',
    category: 'private',
    priceLabel: '$325',
    duration: 'Four 60-minute sessions',
    bookable: true,
    delivery: 'Monthly private coaching package',
    description: 'A monthly private coaching package for serious singers, worship leaders, audition prep, or deeper coaching.',
    inclusions: ['Four private sessions', 'Repertoire support', 'Practice assignments', 'Monthly progress focus'],
  },
];

const APPOINTMENT_TYPES = [
  { id: 'appt_fit_call', name: 'Free 15-Minute Fit Call', durationMinutes: 15, bookable: true, bufferMinutes: 10 },
  { id: 'appt_quick_fix', name: '60-Minute Quick Fix Assessment', durationMinutes: 60, bookable: true, bufferMinutes: 15 },
  { id: 'appt_private_30', name: 'Private Music Coaching - 30 minutes', durationMinutes: 30, bookable: true, bufferMinutes: 10 },
  { id: 'appt_private_45', name: 'Private Music Coaching - 45 minutes', durationMinutes: 45, bookable: true, bufferMinutes: 10 },
  { id: 'appt_private_60', name: 'Private Music Coaching - 60 minutes', durationMinutes: 60, bookable: true, bufferMinutes: 15 },
  { id: 'appt_school_consult', name: 'School Consultation', durationMinutes: 45, bookable: true, bufferMinutes: 15 },
  { id: 'appt_worship_consult', name: 'Worship Team Consultation', durationMinutes: 45, bookable: true, bufferMinutes: 15 },
  { id: 'appt_follow_up', name: 'Follow-Up Call', durationMinutes: 30, bookable: true, bufferMinutes: 10 },
  { id: 'appt_clinic_placeholder', name: 'Clinic / Workshop Booking Placeholder', durationMinutes: 120, bookable: false, bufferMinutes: 30 },
];

const PROPOSAL_TEMPLATES = [
  template('proposal_school_makeover', 'School / Music Educator Makeover', 'School', ['Recommended service', 'Scope of work', 'Timeline', 'Investment', 'Payment terms', 'Optional add-ons']),
  template('proposal_ensemble_boost', 'Choir / Ensemble Boost Workshop', 'Choir / Ensemble', ['Workshop goals', 'What is included', 'Timeline', 'Investment', 'Add-ons']),
  template('proposal_worship_makeover', 'Worship Team Makeover', 'Worship Team', ['Team needs', 'Scope of support', 'Timeline', 'Investment', 'Next steps']),
  template('proposal_ministry_assessment', 'Music Ministry Assessment', 'Worship Team', ['Assessment focus', 'Deliverables', 'Leadership notes', 'Investment']),
  template('proposal_intensive', 'Music Makeover Intensive', 'School', ['Day-of plan', 'Prep needs', 'Deliverables', 'Investment']),
  template('proposal_full_program', 'Full Program Makeover', 'School', ['Program goals', 'Phases', 'Deliverables', 'Investment', 'Payment plan']),
  template('proposal_private_package', 'Private Coaching Package', 'Private Coaching', ['Package summary', 'Session cadence', 'Payment terms', 'Practice expectations']),
];

const CONTRACT_TEMPLATES = [
  template('contract_school', 'School / Educator Agreement', 'School', ['Scope of services', 'Payment terms', 'Cancellation/rescheduling policy', 'Travel fees', 'Media permissions', 'Supervision responsibilities', 'Materials usage rights']),
  template('contract_worship', 'Church / Worship Team Agreement', 'Worship Team', ['Scope of services', 'Payment terms', 'Rescheduling policy', 'Media permissions', 'Ministry context language', 'Liability limitations', 'Team expectations']),
  template('contract_private', 'Private Coaching Agreement', 'Private Coaching', ['Session length/rate', 'Payment policy', 'Cancellation policy', 'Parent/guardian consent', 'Practice expectations', 'Communication boundaries', 'Media release option']),
  template('contract_media_release', 'General Media Release', 'All', ['Photo permission', 'Video permission', 'Audio permission', 'Testimonial permission', 'Restrictions', 'Expiration/date signed']),
];

const EMAIL_TEMPLATES = [
  emailTemplate('email_inquiry_school', 'School inquiry received', 'school', 'Thanks for reaching out to The Music Makeover. I will review your program needs and respond within 1-2 business days.'),
  emailTemplate('email_inquiry_worship', 'Worship inquiry received', 'worship', 'Thank you for sharing what your team is carrying. I will review your ministry goals and follow up within 1-2 business days.'),
  emailTemplate('email_inquiry_private', 'Private coaching inquiry received', 'private', 'Thank you for reaching out about private coaching. I will review the goals and availability you shared and follow up within 1-2 business days.'),
  emailTemplate('email_consult_booked', 'Consultation booked', 'all', 'Your consultation is confirmed. Bring your goals, upcoming dates, and any music or rehearsal notes you want me to review.'),
  emailTemplate('email_consult_reminder', '24-hour consultation reminder', 'all', 'This is a friendly reminder for your Music Makeover consultation tomorrow.'),
  emailTemplate('email_proposal_sent', 'Proposal sent follow-up', 'all', 'Here is the recommended next step based on your needs. You can review the proposal and accept when you are ready.'),
  emailTemplate('email_booked', 'Contract signed / invoice paid', 'all', 'You are officially booked. I am excited to work with you.'),
  emailTemplate('email_pre_session', 'Pre-session reminder', 'all', 'Here is what to prepare before our session: location details, repertoire, access needs, and any updated goals.'),
  emailTemplate('email_post_session', 'Post-session follow-up', 'all', 'Here is a summary of what we worked on, strengths observed, growth areas, and recommended next steps.'),
  emailTemplate('email_testimonial', 'Testimonial request', 'all', 'If the work was helpful, I would be grateful for a short testimonial I can use with your permission.'),
  emailTemplate('email_inactive_lead', 'Inactive lead follow-up', 'all', 'Just checking in to see whether you are still interested in moving forward.'),
];

const CATEGORY_RECOMMENDATION_KEYWORDS = {
  school: ['school', 'educator', 'teacher', 'classroom', 'contest', 'program', 'students', 'grade', 'district', 'performance assessment'],
  ensemble: ['choir', 'ensemble', 'chorale', 'blend', 'sectional', 'concert', 'singers', 'repertoire', 'director', 'workshop'],
  worship: ['worship', 'church', 'ministry', 'service', 'worship team', 'worship leader', 'song list', 'set list', 'transitions', 'team culture'],
  private: ['private', 'student', 'parent', 'audition', 'lesson', 'voice lesson', 'coaching', 'technique', 'practice', 'solo'],
  general: ['consultation', 'clarity', 'not sure', 'recommendation', 'next step'],
};

const SERVICE_RECOMMENDATION_PROFILES = {
  svc_quick_fix: {
    keywords: ['quick', 'assessment', 'diagnostic', 'clarity', 'one session', '60 minute', 'fast', 'specific issue', 'short call'],
    nextStep: 'Offer a focused assessment first, then decide whether a larger proposal is needed.',
  },
  svc_music_educator_makeover: {
    keywords: ['educator', 'teacher', 'classroom', 'rehearsal flow', 'contest', 'school program', 'curriculum', 'performance prep'],
    nextStep: 'Send a School / Educator Makeover proposal with rehearsal systems and program-support deliverables.',
  },
  svc_ensemble_boost: {
    keywords: ['choir', 'ensemble', 'blend', 'sectional', 'concert', 'workshop', 'chorale', 'tone', 'confidence', 'repertoire'],
    nextStep: 'Recommend a workshop scope with live coaching, director recap, and rehearsal assignments.',
  },
  svc_worship_makeover: {
    keywords: ['worship', 'church', 'team vocals', 'rehearsal culture', 'service prep', 'half day', 'reset', 'vocal coaching'],
    nextStep: 'Send a Worship Team Makeover proposal focused on a practical team reset.',
  },
  svc_worship_makeover_plus: {
    keywords: ['leader consult', 'leadership', 'song list', 'full day', 'deeper', 'systems', 'follow-up plan', 'team coaching'],
    nextStep: 'Recommend the Plus option if leadership guidance and a full-day team experience are needed.',
  },
  svc_worship_four_week: {
    keywords: ['four week', '4-week', 'four-week', 'month', 'weekly', 'accountability', 'leader accountability', 'rehearsal coaching', 'structured growth'],
    nextStep: 'Prepare a 4-week worship team proposal with weekly coaching, leader check-ins, and final summary.',
  },
  svc_intensive: {
    keywords: ['intensive', 'one day', 'clinic', 'major reset', 'concert', 'contest', 'worship night', 'sectional strategy', 'full day'],
    nextStep: 'Build a one-day Music Makeover Intensive proposal with prep needs and day-of deliverables.',
  },
  svc_full_program: {
    keywords: ['full program', 'multi-day', 'multi week', 'transformation', 'roadmap', 'director transition', 'large program', 'implementation', 'long term'],
    nextStep: 'Scope a Full Program Makeover with phases, implementation roadmap, payment plan, and follow-up consult.',
  },
  svc_private_30: {
    keywords: ['30 minutes', 'quick lesson', 'check-in', 'private', 'student', 'short lesson'],
    nextStep: 'Offer a 30-minute private coaching session for a focused goal or quick technique check.',
  },
  svc_private_45: {
    keywords: ['45 minutes', 'balanced', 'private', 'student', 'technique', 'repertoire', 'weekly lesson'],
    nextStep: 'Offer a 45-minute private coaching session for technique plus repertoire work.',
  },
  svc_private_60: {
    keywords: ['60 minutes', 'full private', 'audition', 'performance development', 'repertoire support', 'deep coaching'],
    nextStep: 'Offer a 60-minute private coaching session for deeper vocal and performance development.',
  },
};

function template(id, name, category, sections) {
  return { id, name, category, sections, editable: true, updatedAt: null };
}

function emailTemplate(id, name, category, body) {
  return { id, name, category, subject: name, body, editable: true, active: true, updatedAt: null };
}

const DEFAULT_SITE_CONTENT = {
  home: {
    heroHeadline: 'Music Coaching for: \nStronger Teams\nThriving Programs\nConfident Singers',
    tickerText: 'YOU CAN SING!!!',
    heroBody: 'The Music Makeover provides worship team development, choir training, program consulting, and personalized music coaching designed to help individuals and organizations grow with confidence, excellence, and purpose.',
    primaryCtaLabel: 'Book Private Coaching',
    primaryCtaHref: 'booking.html?category=private',
    secondaryCtaLabel: 'Explore Team Makeovers',
    secondaryCtaHref: 'services.html',
    servicesHeadline: 'Services Designed To Meet You Where You Are and Move You Forward With Purpose.',
    servicesBody: 'Every singer, team, choir, and music program has different needs. The Music Makeover offers customized coaching and consulting options for individuals, families, churches, schools, and organizations seeking meaningful musical growth.',
    finalCtaHeadline: "Let's Find the Right Makeover For You.",
    finalCtaBody: 'Whether you need private coaching, team development, choir support, or a full program intensive, The Music Makeover can help you move forward with clarity.',
    finalCtaLabel: 'Find My Next Step',
    finalCtaHref: 'booking.html?category=general',
  },
  services: {
    heroEyebrow: 'Services',
    heroHeadline: 'Coaching, Workshops, and Strategy Designed To Meet You Where You Are.',
    heroBody: 'Every singer, team, choir, and music program has different needs, and growth should never feel one-size-fits-all. The Music Makeover offers customized coaching, workshops, and consulting support for individuals, families, churches, schools, and organizations ready to grow with skill, confidence, structure, and purpose.',
    consultationEyebrow: 'Start Here',
    consultationHeadline: 'Music Makeover Consultation',
    consultationBody: 'For churches, schools, leaders, and individuals who need clarity before choosing a package. We will discuss your current needs, goals, challenges, and the best next step for meaningful growth.',
    consultationBestFor: 'Parents, Singers, Worship Leaders, Choir Directors, Pastors, School Leaders, and Program Directors.',
    consultationCtaLabel: 'Schedule a Consultation',
    consultationCtaHref: 'booking.html?category=general',
    ctaHeadline: 'Your Next Level Does Not Have to Feel Unclear.',
    ctaBody: "Whether you are building confidence as a singer, supporting your child's musical growth, strengthening a worship team, preparing a choir, or rebuilding an entire program, The Music Makeover can help you move forward with clarity and purpose.",
    ctaLabel: 'Schedule a Consultation',
    ctaHref: 'booking.html?category=general',
  },
  about: {
    heroEyebrow: 'About The Music Makeover',
    heroHeadline: 'Growth That Goes Deeper Than Technique.',
    heroBody: 'The Music Makeover was created for singers, students, worship teams, choirs, and music programs that are ready for more than "just getting by."',
    storyHeadline: 'Whole-Sound Coaching For Skill, Confidence, Leadership, and Purpose.',
    storyParagraph1: 'Around here, we do not just work on notes, rhythms, warm-ups, or performances. We work on the whole sound: the skill, the confidence, the leadership, the structure, the purpose, and the heart behind the music.',
    storyParagraph2: 'Whether you are a parent looking for meaningful music instruction for your child, a singer ready to strengthen your voice, a worship team needing clarity and support, or a music leader trying to rebuild, refine, or evaluate your program, The Music Makeover provides intentional coaching tailored to your next level.',
    storyParagraph3: 'Founded by Ashley Miller, a music educator, conductor, worship leader, songwriter, recording artist, and coach with nearly 20 years of experience, The Music Makeover brings together musical training, leadership development, confidence-building, and strategic support.',
    pullQuote: 'Real musical growth is not just about sounding better. It is about becoming stronger, clearer, more confident, and more purposeful in the gift you carry.',
    meetEyebrow: 'Meet Ashley',
    meetHeadline: 'Music Educator, Conductor, Worship Leader, Songwriter, Recording Artist, Consultant, and Coach.',
    meetParagraph1: 'Ashley Miller has nearly 20 years of experience helping singers, students, choirs, worship teams, and music programs grow with confidence, excellence, and purpose.',
    meetParagraph2: 'Her work is rooted in the belief that music is more than performance. It is a gift, a responsibility, and a powerful tool for connection, confidence, worship, and transformation.',
    meetParagraph3: 'Through The Music Makeover, Ashley helps individuals and groups strengthen their sound, clarify their purpose, and develop the tools they need to grow with confidence.',
    ctaLabel: 'Find My Next Step',
    ctaHref: 'booking.html',
  },
  contact: {
    heroEyebrow: 'Contact',
    heroHeadline: "Let's Talk About Your Next Music Makeover.",
    heroBody: 'Have a question about worship team support, choir development, workshops, program consulting, or private coaching,? Send a message and Ashley will follow up with the next best step.',
    heroSupportBody: 'For service requests, custom workshops, team support, or program intensives, you can also begin through the booking inquiry form.',
    primaryCtaLabel: 'Start a Booking Inquiry',
    primaryCtaHref: 'booking.html',
    responseNote: 'Ashley typically responds within 1-2 business days.',
    email: 'themusicmakeover@gmail.com',
    emailNote: 'For the fastest response, please include your service interest, location, and ideal timeline.',
    location: 'Missouri, USA',
    locationNote: 'Available for select in-person and virtual coaching, workshops, and consulting.',
    socialIntro: 'Follow The Music Makeover for coaching tips, vocal encouragement, behind-the-scenes updates, and music leadership support.',
    instagramUrl: 'https://www.instagram.com/themusicmakeover/',
    facebookUrl: 'https://www.facebook.com/profile.php?id=61580252074616',
    tiktokUrl: 'https://www.tiktok.com/@shleymillz?lang=en',
    linkedinUrl: 'https://www.linkedin.com/in/ashley-miller-89201938/',
  },
  testimonials: {
    heroEyebrow: 'Testimonials',
    heroHeadline: 'Real Voices. Real Growth.',
    heroBody: "When technique meets heart, confidence grows, teams strengthen, and music begins to move with greater purpose. Here's what singers, choir members, worship teams, and leaders have shared after working with Ashley Miller and The Music Makeover.",
    formIntro: 'Your words help future students, families, worship teams, choirs, and music leaders understand what is possible through The Music Makeover.',
    ctaHeadline: 'Ready For Your Own Music Makeover?',
    ctaBody: 'Whether you are seeking choir support, worship team development, program strategy, or private coaching, The Music Makeover is designed to meet you where you are and help you move forward with clarity, confidence, and purpose.',
    ctaLabel: 'Find My Next Step',
    ctaHref: 'booking.html',
  },
  booking: {
    heroKicker: 'Book / Contact',
    heroHeadline: "Let's Find the Right Makeover For You.",
    introLine1: 'Whether you are looking for worship team support, choir development, a full music program intensive, or private coaching, this is the place to start.',
    introLine2: 'Share a little about where you are, what you need, and what you are hoping to improve. Ashley will review your inquiry and recommend the best next step based on your goals, timeline, and service needs.',
    nextStepsHeading: 'What Happens Next?',
    nextSteps: 'Ashley reviews your goals, challenges, timeline, location, and preferred format.\nYour inquiry is matched to the best service path.\nPrivate coaching inquiries receive next steps for scheduling.\nTeam, choir, school, church, and program requests may move into consultation, proposal, and approved dates.\nOnce details are confirmed, secure payment links or invoices will be sent through Stripe.',
    choosePathKicker: 'Choose Your Path',
    choosePathHeadline: 'Start With the Lane That Sounds Closest.',
    inquirySectionLabel: 'Inquiry Form',
    inquirySectionHelper: 'Tell Ashley What Kind of Support You Need.',
    privacyNote: 'Payment details are not collected through this inquiry form. Once your service, scope, timeline, and dates are confirmed, invoices or secure payment links will be sent through Stripe.',
    submitLabel: 'Find My Next Step',
    helpHeading: 'Need Help Now?',
    helpBody: 'Email the musicmakeover@gmail.com with your preferred timeline and service lane.',
  },
};

function createDefaultState(nowInput = new Date().toISOString()) {
  const now = new Date(nowInput);
  return {
    version: 1,
    generatedAt: now.toISOString(),
    categories: CATEGORY_DEFINITIONS,
    pipelineStages: PIPELINE_STAGES,
    formFields: FORM_FIELDS,
    services: clone(SERVICES),
    appointmentTypes: clone(APPOINTMENT_TYPES),
    proposalTemplates: clone(PROPOSAL_TEMPLATES),
    contractTemplates: clone(CONTRACT_TEMPLATES),
    emailTemplates: clone(EMAIL_TEMPLATES),
    availability: {
      timezone: 'America/Chicago',
      googleCalendarStatus: 'Ready to connect',
      defaultBuffersMinutes: 15,
      bookingRules: [
        'Private coaching and consultation calls may be bookable after inquiry review.',
        'School, ensemble, and worship team full services are request-first and require approval.',
      ],
    },
    integrations: [
      { id: 'google_calendar', name: 'Google Calendar', status: 'needs connection' },
      { id: 'gmail', name: 'Gmail / email sending', status: 'needs connection' },
      { id: 'stripe', name: 'Stripe payments', status: 'needs keys' },
      { id: 'square', name: 'Square payments', status: 'optional' },
      { id: 'drive', name: 'Google Drive / file storage', status: 'needs connection' },
      { id: 'zoom', name: 'Zoom / Google Meet', status: 'optional' },
    ],
    inquiries: seedInquiries(now),
    clients: seedClients(now),
    appointments: seedAppointments(now),
    proposals: seedProposals(now),
    contracts: seedContracts(now),
    invoices: seedInvoices(now),
    payments: seedPayments(now),
    tasks: seedTasks(now),
    notes: seedNotes(now),
    resources: seedResources(now),
    testimonials: seedTestimonials(now),
    mediaReleases: seedMediaReleases(now),
    consultationNotes: seedConsultationNotes(now),
    aiRecommendations: [],
    inquiryEmailOutbox: [],
    testimonialEmailOutbox: [],
    siteContent: createDefaultSiteContent(now.toISOString()),
    adminContent: {
      bookingIntro: 'Choose your lane, share what is happening, and Ashley will recommend the next best step.',
      serviceGuideUrl: '',
      homepageBookingCta: 'Start your Music Makeover',
      privacyPolicyUrl: '',
      termsUrl: '',
    },
  };
}

function createDefaultSiteContent(nowInput = new Date().toISOString()) {
  return {
    ...clone(DEFAULT_SITE_CONTENT),
    updatedAt: new Date(nowInput).toISOString(),
  };
}

function normalizeCrmState(state, nowInput = new Date().toISOString()) {
  const defaults = createDefaultState(nowInput);
  if (!state || typeof state !== 'object') return defaults;

  const nextState = {
    ...defaults,
    ...clone(state),
  };

  nextState.categories = nextState.categories || defaults.categories;
  nextState.pipelineStages = Array.isArray(nextState.pipelineStages) ? nextState.pipelineStages : defaults.pipelineStages;
  nextState.formFields = nextState.formFields || defaults.formFields;
  nextState.services = Array.isArray(nextState.services) ? nextState.services : defaults.services;
  nextState.appointmentTypes = Array.isArray(nextState.appointmentTypes) ? nextState.appointmentTypes : defaults.appointmentTypes;
  nextState.proposalTemplates = Array.isArray(nextState.proposalTemplates) ? nextState.proposalTemplates : defaults.proposalTemplates;
  nextState.contractTemplates = Array.isArray(nextState.contractTemplates) ? nextState.contractTemplates : defaults.contractTemplates;
  nextState.emailTemplates = Array.isArray(nextState.emailTemplates) ? nextState.emailTemplates : defaults.emailTemplates;
  nextState.integrations = Array.isArray(nextState.integrations) ? nextState.integrations : defaults.integrations;
  nextState.siteContent = normalizeSiteContent(nextState.siteContent, nowInput);
  nextState.adminContent = nextState.adminContent || defaults.adminContent;

  return nextState;
}

function normalizeSiteContent(siteContent, nowInput = new Date().toISOString()) {
  const defaults = createDefaultSiteContent(nowInput);
  const input = siteContent && typeof siteContent === 'object' ? siteContent : {};
  const normalized = { updatedAt: input.updatedAt || defaults.updatedAt };

  Object.entries(DEFAULT_SITE_CONTENT).forEach(([sectionName, defaultSection]) => {
    normalized[sectionName] = normalizeSiteContentSection(defaultSection, input[sectionName]);
  });

  if (normalized.contact) {
    normalized.contact.facebookUrl = 'https://www.facebook.com/profile.php?id=61580252074616';
    normalized.contact.instagramUrl = 'https://www.instagram.com/themusicmakeover/';
  }

  return normalized;
}

function normalizeSiteContentSection(defaultSection, inputSection) {
  const input = inputSection && typeof inputSection === 'object' ? inputSection : {};
  return Object.entries(defaultSection).reduce((section, [key, defaultValue]) => {
    const value = input[key];
    section[key] = value === undefined || value === null ? defaultValue : String(value).trim();
    return section;
  }, {});
}

function normalizeTestimonial(input, nowInput = new Date().toISOString()) {
  const now = new Date(nowInput);
  const normalized = normalizeInput(input);
  const requiredFields = [
    ['name', 'name'],
    ['email', 'email'],
    ['serviceType', 'service received'],
    ['challengeGoal', 'challenge or goal'],
    ['standout', 'what stood out'],
    ['changedImproved', 'what changed or improved'],
    ['considerationQuote', 'testimonial quote'],
    ['sharePermission', 'sharing permission'],
    ['nameDisplay', 'name display preference'],
  ];

  for (const [field, label] of requiredFields) {
    if (!hasValue(normalized[field])) {
      throw new Error(`${label} is required for testimonial submissions`);
    }
  }

  const sharePermission = String(normalized.sharePermission).toLowerCase();
  const approvedForWebsite = ['yes', 'true', 'on', 'approved'].includes(sharePermission);
  const responses = {
    serviceType: normalized.serviceType,
    challengeGoal: normalized.challengeGoal,
    standout: normalized.standout,
    changedImproved: normalized.changedImproved,
    considerationQuote: normalized.considerationQuote,
    sharePermission: normalized.sharePermission,
    nameDisplay: normalized.nameDisplay,
  };

  return {
    id: normalized.id || generateId('test'),
    clientId: normalized.clientId || null,
    clientName: normalized.name,
    email: normalized.email,
    serviceType: normalized.serviceType,
    status: normalized.status || 'submitted',
    starRating: normalized.starRating || '',
    shortQuote: normalized.considerationQuote,
    fullTestimonial: [
      `Challenge or goal: ${normalized.challengeGoal}`,
      `What stood out: ${normalized.standout}`,
      `What changed: ${normalized.changedImproved}`,
      `Words to share: ${normalized.considerationQuote}`,
    ].join('\n\n'),
    approvedForWebsite,
    approvedForSocial: approvedForWebsite,
    photosVideosApproved: false,
    nameDisplay: normalized.nameDisplay,
    responses,
    submittedAt: normalized.submittedAt || now.toISOString(),
    createdAt: normalized.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    source: normalized.source || 'public-testimonial-form',
  };
}

function recordTestimonial(state, payload, nowInput = new Date().toISOString()) {
  const nextState = clone(state);
  const testimonial = normalizeTestimonial(payload, nowInput);
  nextState.testimonials = [testimonial, ...(nextState.testimonials || [])];
  nextState.testimonialEmailOutbox = [
    ...((nextState.testimonialEmailOutbox || [])),
    buildTestimonialAdminNotificationEmail(testimonial, nowInput),
  ];
  nextState.generatedAt = new Date(nowInput).toISOString();
  return { state: nextState, testimonial };
}

function buildTestimonialAdminNotificationEmail(testimonial, nowInput = new Date().toISOString()) {
  return {
    id: generateId('email'),
    type: 'testimonial-notification',
    to: BUSINESS_EMAIL,
    replyTo: testimonial.email,
    subject: `New testimonial from ${testimonial.clientName}`,
    body: [
      `New testimonial submitted by ${testimonial.clientName}.`,
      '',
      `Email: ${testimonial.email}`,
      `Service received: ${testimonial.serviceType}`,
      `Approved for website/social: ${testimonial.approvedForWebsite ? 'Yes' : 'No'}`,
      `Name display preference: ${testimonial.nameDisplay}`,
      '',
      'Challenge or goal:',
      testimonial.responses.challengeGoal,
      '',
      'What stood out:',
      testimonial.responses.standout,
      '',
      'What changed:',
      testimonial.responses.changedImproved,
      '',
      'Words to share:',
      testimonial.responses.considerationQuote,
    ].join('\n'),
    createdAt: new Date(nowInput).toISOString(),
    status: 'dev-outbox',
  };
}

function normalizeInquiry(input, nowInput = new Date().toISOString()) {
  const now = new Date(nowInput);
  const normalized = normalizeInput(input);
  const category = normalizeCategory(normalized.category || normalized.clientType || normalized.serviceCategory);
  const definition = CATEGORY_DEFINITIONS[category];
  const displayName = normalized.name || normalized.studentName || normalized.clientName;
  const normalizedWithName = { ...normalized, name: displayName };

  for (const field of definition.required) {
    if (!hasValue(normalizedWithName[field])) {
      throw new Error(`${field} is required for ${definition.label} inquiries`);
    }
  }

  return {
    id: normalized.id || generateId('inq'),
    createdAt: normalized.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    category,
    clientType: definition.clientType,
    stage: normalized.stage || 'New Inquiry',
    status: normalized.status || 'Needs Review',
    tags: unique([...(definition.tags || []), ...(asArray(normalized.tags))]),
    name: displayName,
    studentName: normalized.studentName || '',
    parentGuardianName: normalized.parentGuardianName || '',
    age: normalized.age || '',
    email: normalized.email,
    phone: normalized.phone,
    organization: normalized.organization || normalized.school || normalized.church || '',
    role: normalized.role || '',
    location: normalized.location || normalized.city || '',
    teamSize: normalized.teamSize || normalized.choirSize || normalized.size || '',
    supportNeeded: normalized.supportNeeded || normalized.typeOfSupport || normalized.service || '',
    currentChallenges: normalized.currentChallenges || '',
    audienceType: normalized.audienceType || '',
    improvementGoals: normalized.improvementGoals || '',
    upcomingDates: normalized.upcomingDates || normalized.eventDates || '',
    preferredTimeline: normalized.preferredTimeline || normalized.timeline || '',
    coachingCadence: normalized.coachingCadence || '',
    preferredFormat: normalized.preferredFormat || '',
    howSoon: normalized.howSoon || '',
    budgetRange: normalized.budgetRange || normalized.budget || '',
    musicGoals: normalized.musicGoals || '',
    experienceLevel: normalized.experienceLevel || '',
    preferredLessonType: normalized.preferredLessonType || '',
    preferredAvailability: normalized.preferredAvailability || '',
    emergencyContact: normalized.emergencyContact || '',
    leadSource: normalized.leadSource || normalized.ref || '',
    notes: normalized.notes || '',
    attachments: normalizeAttachments(normalized.attachments || normalized.files),
    confirmationEmailRequested: isTruthy(normalized.sendConfirmationEmail || normalized.confirmationEmailRequested),
    formData: normalized,
    followUpDate: normalized.followUpDate || addDays(now, 2).toISOString(),
  };
}

function recordInquiry(state, payload, nowInput = new Date().toISOString()) {
  const nextState = clone(state);
  const inquiry = normalizeInquiry(payload, nowInput);
  nextState.inquiries = [inquiry, ...(nextState.inquiries || [])];
  nextState.inquiryEmailOutbox = [
    ...((nextState.inquiryEmailOutbox || [])),
    buildInquiryAdminNotificationEmail(inquiry, nowInput),
    ...(inquiry.confirmationEmailRequested ? [buildInquiryConfirmationEmail(inquiry, nowInput)] : []),
  ];
  nextState.tasks = [
    {
      id: generateId('task'),
      type: 'follow-up',
      title: `Review ${inquiry.name}`,
      clientId: null,
      inquiryId: inquiry.id,
      dueAt: addDays(new Date(nowInput), 1).toISOString(),
      status: 'open',
      priority: 'high',
    },
    ...(nextState.tasks || []),
  ];
  nextState.generatedAt = new Date(nowInput).toISOString();
  return { state: nextState, inquiry };
}

function buildInquiryAdminNotificationEmail(inquiry, nowInput = new Date().toISOString()) {
  return {
    id: generateId('email'),
    type: 'inquiry-notification',
    to: BUSINESS_EMAIL,
    replyTo: inquiry.email,
    subject: `New ${inquiry.clientType} inquiry from ${inquiry.name}`,
    body: [
      `New inquiry received from ${inquiry.name}.`,
      '',
      `Service lane: ${inquiry.clientType}`,
      `Email: ${inquiry.email}`,
      `Phone: ${inquiry.phone}`,
      `Organization: ${inquiry.organization || 'Not provided'}`,
      `Role: ${inquiry.role || 'Not provided'}`,
      `Location: ${inquiry.location || 'Not provided'}`,
      `Support needed: ${inquiry.supportNeeded || inquiry.musicGoals || 'Not provided'}`,
      `Preferred timeline: ${inquiry.preferredTimeline || inquiry.preferredAvailability || 'Not provided'}`,
      `Budget range: ${inquiry.budgetRange || 'Not provided'}`,
      '',
      'Current challenges / notes:',
      inquiry.currentChallenges || inquiry.notes || 'Not provided',
    ].join('\n'),
    createdAt: new Date(nowInput).toISOString(),
    status: 'dev-outbox',
  };
}

function buildInquiryConfirmationEmail(inquiry, nowInput = new Date().toISOString()) {
  return {
    id: generateId('email'),
    type: 'inquiry-confirmation',
    to: inquiry.email,
    subject: 'Your Music Makeover inquiry was received',
    body: [
      `Hi ${inquiry.name},`,
      '',
      'Thank you for reaching out to The Music Makeover. Your inquiry was received and routed to the right service lane.',
      '',
      `Service lane: ${inquiry.clientType}`,
      'Ashley will review your details and respond within 1-2 business days.',
      '',
      'With care,',
      'The Music Makeover',
    ].join('\n'),
    createdAt: new Date(nowInput).toISOString(),
    status: 'dev-outbox',
  };
}

function buildDashboardSummary(state, nowInput = new Date().toISOString()) {
  const now = new Date(nowInput);
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const inquiries = state.inquiries || [];
  const appointments = state.appointments || [];
  const contracts = state.contracts || [];
  const invoices = state.invoices || [];
  const payments = state.payments || [];
  const tasks = state.tasks || [];
  const clients = state.clients || [];
  const testimonials = state.testimonials || [];

  const cards = {
    newInquiries: inquiries.filter((item) => item.stage === 'New Inquiry').length,
    consultationsScheduled: appointments.filter((item) => item.status === 'scheduled' && /consult|assessment|fit call/i.test(item.type || item.name || '')).length,
    contractsPending: contracts.filter((item) => item.status === 'pending' || item.status === 'sent').length,
    invoicesUnpaid: invoices.filter((item) => item.status === 'unpaid' || item.status === 'overdue' || item.status === 'partial').length,
    upcomingSessions: appointments.filter((item) => item.status === 'scheduled' && new Date(item.startAt) >= now).length,
    recentPayments: payments.filter((item) => item.status === 'paid').slice(0, 5).length,
    followUpsDue: tasks.filter((item) => item.status === 'open' && item.type === 'follow-up' && new Date(item.dueAt) <= now).length,
    testimonialsPending: testimonials.filter((item) => item.status === 'requested' || item.status === 'draft').length,
    activeClients: clients.filter((item) => item.status === 'active').length,
    revenueThisMonth: payments
      .filter((item) => {
        const paidAt = new Date(item.paidAt);
        return item.status === 'paid' && paidAt.getUTCMonth() === month && paidAt.getUTCFullYear() === year;
      })
      .reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };

  const leadsByCategory = Object.keys(CATEGORY_DEFINITIONS).reduce((acc, category) => {
    acc[category] = inquiries.filter((item) => item.category === category).length;
    return acc;
  }, {});

  const pipeline = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: inquiries.filter((item) => item.stage === stage).length,
    leads: inquiries.filter((item) => item.stage === stage).slice(0, 6),
  }));

  return {
    cards,
    leadsByCategory,
    pipeline,
    upcomingAppointments: appointments
      .filter((item) => item.status === 'scheduled' && new Date(item.startAt) >= now)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 6),
    unpaidInvoices: invoices.filter((item) => item.status !== 'paid').slice(0, 6),
    followUpsDue: tasks
      .filter((item) => item.status === 'open' && new Date(item.dueAt) <= now)
      .slice(0, 8),
    recentPayments: payments
      .filter((item) => item.status === 'paid')
      .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
      .slice(0, 5),
  };
}

function updateServiceCatalog(state, serviceId, patch, nowInput = new Date().toISOString()) {
  const nextState = clone(state);
  let found = false;
  nextState.services = (nextState.services || []).map((service) => {
    if (service.id !== serviceId) return service;
    found = true;
    return { ...service, ...patch, id: service.id, updatedAt: new Date(nowInput).toISOString() };
  });
  if (!found) throw new Error(`Service not found: ${serviceId}`);
  return nextState;
}

function updateSiteContent(state, patch, nowInput = new Date().toISOString()) {
  const nextState = normalizeCrmState(state, nowInput);
  const currentContent = normalizeSiteContent(nextState.siteContent, nowInput);
  const incoming = patch && typeof patch === 'object' ? patch : {};

  Object.entries(DEFAULT_SITE_CONTENT).forEach(([sectionName, defaultSection]) => {
    const sectionPatch = incoming[sectionName];
    if (!sectionPatch || typeof sectionPatch !== 'object') return;

    Object.keys(defaultSection).forEach((fieldName) => {
      if (!Object.prototype.hasOwnProperty.call(sectionPatch, fieldName)) return;
      const value = sectionPatch[fieldName];
      currentContent[sectionName][fieldName] = value === undefined || value === null ? '' : String(value).trim();
    });
  });

  currentContent.updatedAt = new Date(nowInput).toISOString();
  nextState.siteContent = currentContent;
  return {
    state: nextState,
    result: currentContent,
  };
}

function updateTemplate(state, collectionName, templateId, patch, nowInput = new Date().toISOString()) {
  const allowed = ['proposalTemplates', 'contractTemplates', 'emailTemplates'];
  if (!allowed.includes(collectionName)) throw new Error(`Template collection not editable: ${collectionName}`);
  const nextState = clone(state);
  let found = false;
  nextState[collectionName] = (nextState[collectionName] || []).map((item) => {
    if (item.id !== templateId) return item;
    found = true;
    return { ...item, ...patch, id: item.id, updatedAt: new Date(nowInput).toISOString() };
  });
  if (!found) throw new Error(`Template not found: ${templateId}`);
  return nextState;
}

function moveInquiryStage(state, inquiryId, stage, nowInput = new Date().toISOString()) {
  if (!PIPELINE_STAGES.includes(stage)) throw new Error(`Unknown pipeline stage: ${stage}`);
  const nextState = clone(state);
  let found = false;
  nextState.inquiries = (nextState.inquiries || []).map((item) => {
    if (item.id !== inquiryId) return item;
    found = true;
    return { ...item, stage, updatedAt: new Date(nowInput).toISOString() };
  });
  if (!found) throw new Error(`Inquiry not found: ${inquiryId}`);
  return nextState;
}

function saveConsultationNotes(state, payload, nowInput = new Date().toISOString()) {
  const now = new Date(nowInput);
  const normalized = normalizeInput(payload);
  const category = normalizeCategory(normalized.category || normalized.clientType || normalized.serviceCategory);

  if (!hasValue(normalized.clientName || normalized.name || normalized.organization)) {
    throw new Error('clientName is required for consultation notes');
  }

  if (!hasValue(normalized.notes)) {
    throw new Error('notes are required for consultation notes');
  }

  const consultation = {
    id: normalized.id || generateId('consult'),
    clientName: normalized.clientName || normalized.name || normalized.organization,
    organization: normalized.organization || '',
    category,
    clientType: CATEGORY_DEFINITIONS[category].clientType,
    sessionDate: normalized.sessionDate || now.toISOString().slice(0, 10),
    notes: normalized.notes,
    goals: normalized.goals || '',
    challenges: normalized.challenges || normalized.currentChallenges || '',
    supportNeeded: normalized.supportNeeded || '',
    nextSteps: normalized.nextSteps || '',
    attachments: normalizeAttachments(normalized.attachments || normalized.files),
    createdAt: normalized.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const nextState = clone(state);
  nextState.consultationNotes = [consultation, ...((nextState.consultationNotes || []))];
  nextState.generatedAt = now.toISOString();
  return { state: nextState, result: consultation };
}

function generateServiceRecommendations(state, consultationId, nowInput = new Date().toISOString()) {
  const now = new Date(nowInput);
  const consultation = (state.consultationNotes || []).find((item) => item.id === consultationId);
  if (!consultation) throw new Error(`Consultation notes not found: ${consultationId}`);

  const scoredServices = (state.services || [])
    .map((service) => scoreServiceForConsultation(service, consultation))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name));

  const recommendations = buildRankedRecommendations(scoredServices, consultation);
  const recommendation = {
    id: generateId('rec'),
    consultationId,
    clientName: consultation.clientName,
    category: consultation.category,
    clientType: consultation.clientType,
    generatedAt: now.toISOString(),
    engine: 'music-makeover-rules-v1',
    summary: summarizeConsultation(consultation),
    recommendations,
  };

  const nextState = clone(state);
  nextState.aiRecommendations = [recommendation, ...((nextState.aiRecommendations || []))];
  nextState.consultationNotes = (nextState.consultationNotes || []).map((item) => (
    item.id === consultationId
      ? { ...item, lastRecommendedAt: now.toISOString(), latestRecommendationId: recommendation.id }
      : item
  ));
  nextState.generatedAt = now.toISOString();
  return { state: nextState, result: recommendation };
}

function scoreServiceForConsultation(service, consultation) {
  const profile = SERVICE_RECOMMENDATION_PROFILES[service.id] || { keywords: [] };
  const consultationText = buildConsultationText(consultation);
  const serviceText = [
    service.name,
    service.description,
    service.duration,
    service.delivery,
    ...(service.inclusions || []),
  ].join(' ').toLowerCase();

  const categoryMatches = findPhraseMatches(consultationText, CATEGORY_RECOMMENDATION_KEYWORDS[service.category] || []);
  const profileMatches = findPhraseMatches(consultationText, profile.keywords || []);
  const serviceMatches = findPhraseMatches(consultationText, serviceText.split(/\s+/).filter((word) => word.length > 6));
  const sameCategory = consultation.category === service.category;
  const adjacentSchoolEnsemble = ['school', 'ensemble'].includes(consultation.category) && ['school', 'ensemble'].includes(service.category);
  const adjacentWorshipEnsemble = consultation.category === 'worship' && service.category === 'ensemble' && categoryMatches.includes('choir');

  let score = 0;
  if (sameCategory) score += 36;
  if (adjacentSchoolEnsemble) score += 12;
  if (adjacentWorshipEnsemble) score += 8;
  if (consultation.category === 'general') score += 8;
  score += categoryMatches.length * 5;
  score += profileMatches.length * 13;
  score += Math.min(serviceMatches.length, 5) * 2;

  return {
    service,
    score,
    matched: unique([...profileMatches, ...categoryMatches, ...serviceMatches]).slice(0, 7),
    nextStep: profile.nextStep || 'Review this option and decide whether it belongs in the proposal.',
  };
}

function buildRankedRecommendations(scoredServices, consultation) {
  const top = scoredServices.slice(0, 4);
  if (top.length) {
    return top.map((item, index) => recommendationFromScore(item, index));
  }

  return (SERVICES.filter((service) => service.category === consultation.category).slice(0, 3))
    .map((service, index) => recommendationFromScore({
      service,
      score: 18,
      matched: [CATEGORY_DEFINITIONS[consultation.category].label],
      nextStep: 'Use this as a starting point and adjust after reviewing the full consultation notes.',
    }, index));
}

function recommendationFromScore(item, index) {
  return {
    rank: index + 1,
    serviceId: item.service.id,
    serviceName: item.service.name,
    category: item.service.category,
    priceLabel: item.service.priceLabel,
    duration: item.service.duration,
    delivery: item.service.delivery,
    score: item.score,
    confidence: confidenceForScore(item.score),
    rationale: buildRationale(item),
    suggestedNextStep: item.nextStep,
    proposalReady: !item.service.bookable,
  };
}

function buildRationale(item) {
  const reasons = [];
  if (item.matched.length) {
    reasons.push(`Consultation notes point to ${formatMatchedTerms(item.matched)}.`);
  }
  if (!item.service.bookable) {
    reasons.push('This is inquiry-only, so it should become a custom proposal instead of an instant booking.');
  }
  if (item.service.inclusions && item.service.inclusions.length) {
    reasons.push(`Includes ${item.service.inclusions.slice(0, 3).join(', ')}.`);
  }
  return reasons;
}

function confidenceForScore(score) {
  if (score >= 75) return 'High';
  if (score >= 42) return 'Medium';
  return 'Light';
}

function buildConsultationText(consultation) {
  return [
    consultation.clientName,
    consultation.organization,
    consultation.category,
    consultation.clientType,
    consultation.notes,
    consultation.goals,
    consultation.challenges,
    consultation.supportNeeded,
    consultation.nextSteps,
    ...(consultation.attachments || []).map((file) => file.name),
  ].join(' ').toLowerCase();
}

function findPhraseMatches(text, phrases) {
  return unique((phrases || [])
    .map((phrase) => String(phrase || '').toLowerCase().trim())
    .filter((phrase) => phrase && text.includes(phrase)));
}

function formatMatchedTerms(terms) {
  return terms.slice(0, 5).map((term) => {
    if (term === '4-week' || term === 'four-week' || term === 'four week') return 'four-week support';
    return term;
  }).join(', ');
}

function summarizeConsultation(consultation) {
  const summary = String(consultation.notes || '').replace(/\s+/g, ' ').trim();
  if (summary.length <= 190) return summary;
  return `${summary.slice(0, 187).trim()}...`;
}

function normalizeCategory(value = 'general') {
  const raw = String(value).trim().toLowerCase();
  const aliases = {
    schools: 'school',
    educator: 'school',
    education: 'school',
    choir: 'ensemble',
    ensemble: 'ensemble',
    worshipteam: 'worship',
    'worship-team': 'worship',
    church: 'worship',
    ministry: 'worship',
    privatecoaching: 'private',
    coaching: 'private',
    generalinquiry: 'general',
  };
  const compact = raw.replace(/[^a-z]/g, '');
  return CATEGORY_DEFINITIONS[raw] ? raw : aliases[compact] || 'general';
}

function normalizeInput(input = {}) {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === 'string') {
      acc[key] = value.trim();
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isTruthy(value) {
  return value === true || value === 'true' || value === 'on' || value === 'yes' || value === '1';
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeAttachments(files) {
  if (!files) return [];
  const items = Array.isArray(files) ? files : [files];
  return items.filter(Boolean).map((file) => {
    if (typeof file === 'string') return { name: file };
    return {
      name: file.name || 'Attachment',
      size: file.size || null,
      type: file.type || '',
      url: file.url || '',
    };
  });
}

function seedInquiries(now) {
  const seed = [
    ['school', 'Marisol Grant', 'Jefferson High School', 'Choir Director', 'Contest readiness and rehearsal flow', 'New Inquiry'],
    ['worship', 'Caleb Brooks', 'New Hope Worship', 'Worship Pastor', 'Team vocal blend and rehearsal systems', 'New Inquiry'],
    ['private', 'Tiana Carter', '', '', 'Audition prep and confidence', 'New Inquiry'],
    ['general', 'Denise Walker', 'Community Arts Coalition', 'Program Lead', 'Not sure which Music Makeover lane fits', 'New Inquiry'],
    ['school', 'Riverside Middle School', 'Riverside Middle School', 'Fine Arts Chair', 'Full program reset after director transition', 'Proposal Sent'],
    ['worship', 'Pastor Elena Moore', 'Grace City Church', 'Music Ministry Lead', 'Four-week worship team coaching', 'Contract Sent'],
    ['ensemble', 'North County Chorale', 'North County Chorale', 'Board Chair', 'Boost workshop before spring concert', 'Consultation Scheduled'],
    ['private', 'Miles Thompson', '', '', 'Private coaching package', 'Deposit / Payment Pending'],
  ];
  return seed.map(([category, name, organization, role, supportNeeded, stage], index) => ({
    id: `inq_seed_${index + 1}`,
    createdAt: addDays(now, -index - 1).toISOString(),
    updatedAt: addDays(now, -index).toISOString(),
    category,
    clientType: CATEGORY_DEFINITIONS[category].clientType,
    stage,
    status: stage === 'New Inquiry' ? 'Needs Review' : 'Active',
    tags: CATEGORY_DEFINITIONS[category].tags,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@example.com`,
    phone: `314-555-01${String(index).padStart(2, '0')}`,
    organization,
    role,
    location: index % 2 === 0 ? 'St. Louis, MO' : 'Columbia, MO',
    teamSize: category === 'private' ? '' : String(24 + index * 6),
    supportNeeded,
    currentChallenges: 'Consistency, confidence, and clear next steps.',
    upcomingDates: 'Fall concert and spring contest windows',
    preferredTimeline: index < 4 ? 'Next 30 days' : 'This semester',
    budgetRange: index < 3 ? '$500 to $1,000' : '$1,000 to $2,500',
    musicGoals: category === 'private' ? supportNeeded : '',
    experienceLevel: category === 'private' ? 'Intermediate' : '',
    preferredLessonType: category === 'private' ? '45-minute private coaching' : '',
    preferredAvailability: category === 'private' ? 'Tuesday evenings' : '',
    leadSource: index % 2 === 0 ? 'Website' : 'Referral',
    notes: 'Seed record for dashboard preview.',
    attachments: [],
    followUpDate: addDays(now, index < 3 ? -1 : 2).toISOString(),
  }));
}

function seedClients(now) {
  return [
    client('client_riverside', 'Riverside Middle School', 'school', 'active', 1250, now),
    client('client_grace_city', 'Grace City Church', 'worship', 'active', 750, now),
    client('client_north_county', 'North County Chorale', 'ensemble', 'active', 350, now),
    client('client_miles', 'Miles Thompson', 'private', 'active', 195, now),
    client('client_central', 'Central High School', 'school', 'active', 130, now),
    client('client_archive', 'Archived Sample', 'general', 'archived', 0, now),
  ];
}

function client(id, name, category, status, totalRevenue, now) {
  return {
    id,
    name,
    category,
    clientType: CATEGORY_DEFINITIONS[category].clientType,
    status,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/\.$/, '')}@example.com`,
    phone: '314-555-0100',
    organization: category === 'private' ? '' : name,
    tags: CATEGORY_DEFINITIONS[category].tags,
    lastContactDate: addDays(now, -3).toISOString(),
    leadSource: 'Website',
    servicesPurchased: [],
    totalRevenue,
    followUpDate: addDays(now, 3).toISOString(),
  };
}

function seedAppointments(now) {
  return [
    appointment('appt_1', 'Riverside Middle School', 'School Consultation', 'client_riverside', 1, 'scheduled', now),
    appointment('appt_2', 'Grace City Church', 'Worship Team Consultation', 'client_grace_city', 4, 'scheduled', now),
    appointment('appt_3', 'North County Chorale', 'Free 15-Minute Fit Call', 'client_north_county', 8, 'scheduled', now),
    appointment('appt_4', 'Miles Thompson', 'Private Music Coaching - 45 minutes', 'client_miles', 12, 'scheduled', now),
  ];
}

function appointment(id, clientName, type, clientId, daysFromNow, status, now) {
  const start = addDays(now, daysFromNow);
  start.setUTCHours(20, 0, 0, 0);
  return { id, clientName, type, clientId, startAt: start.toISOString(), status, timezone: 'America/Chicago' };
}

function seedProposals(now) {
  return [
    { id: 'prop_1', clientId: 'client_riverside', clientName: 'Riverside Middle School', templateId: 'proposal_intensive', status: 'sent', amount: 1250, expiresAt: addDays(now, 7).toISOString() },
    { id: 'prop_2', clientId: 'client_grace_city', clientName: 'Grace City Church', templateId: 'proposal_worship_makeover', status: 'accepted', amount: 750, expiresAt: addDays(now, 9).toISOString() },
  ];
}

function seedContracts(now) {
  return [
    { id: 'contract_1', clientId: 'client_riverside', clientName: 'Riverside Middle School', templateId: 'contract_school', status: 'pending', sentAt: addDays(now, -1).toISOString() },
    { id: 'contract_2', clientId: 'client_grace_city', clientName: 'Grace City Church', templateId: 'contract_worship', status: 'sent', sentAt: addDays(now, -2).toISOString() },
    { id: 'contract_3', clientId: 'client_miles', clientName: 'Miles Thompson', templateId: 'contract_private', status: 'signed', sentAt: addDays(now, -6).toISOString(), signedAt: addDays(now, -5).toISOString() },
  ];
}

function seedInvoices(now) {
  return [
    invoice('inv_1', 'Riverside Middle School', 'client_riverside', 625, 'unpaid', now, 5),
    invoice('inv_2', 'Grace City Church', 'client_grace_city', 250, 'partial', now, 7),
    invoice('inv_3', 'Miles Thompson', 'client_miles', 195, 'overdue', now, -2),
    invoice('inv_4', 'North County Chorale', 'client_north_county', 350, 'paid', now, 0),
  ];
}

function invoice(id, clientName, clientId, amount, status, now, dueOffset) {
  return { id, clientName, clientId, amount, status, dueAt: addDays(now, dueOffset).toISOString(), paymentProvider: 'Stripe-ready' };
}

function seedPayments(now) {
  return [
    { id: 'pay_1', clientId: 'client_riverside', clientName: 'Riverside Middle School', amount: 1250, status: 'paid', paidAt: addDays(now, -2).toISOString(), provider: 'manual' },
    { id: 'pay_2', clientId: 'client_grace_city', clientName: 'Grace City Church', amount: 750, status: 'paid', paidAt: addDays(now, -4).toISOString(), provider: 'Stripe' },
    { id: 'pay_3', clientId: 'client_north_county', clientName: 'North County Chorale', amount: 675, status: 'paid', paidAt: addDays(now, -8).toISOString(), provider: 'manual' },
  ];
}

function seedTasks(now) {
  return [
    { id: 'task_1', type: 'follow-up', title: 'Follow up with Marisol Grant', inquiryId: 'inq_seed_1', dueAt: addDays(now, -1).toISOString(), status: 'open', priority: 'high' },
    { id: 'task_2', type: 'follow-up', title: 'Send proposal reminder to Riverside', clientId: 'client_riverside', dueAt: addDays(now, -2).toISOString(), status: 'open', priority: 'medium' },
    { id: 'task_3', type: 'follow-up', title: 'Check payment status for Miles', clientId: 'client_miles', dueAt: addDays(now, -1).toISOString(), status: 'open', priority: 'medium' },
    { id: 'task_4', type: 'testimonial', title: 'Request testimonial from North County Chorale', clientId: 'client_north_county', dueAt: addDays(now, 2).toISOString(), status: 'open', priority: 'low' },
  ];
}

function seedNotes(now) {
  return [
    { id: 'note_1', clientId: 'client_riverside', visibility: 'internal', title: 'Consultation prep', body: 'Review repertoire list and rehearsal video before consult.', createdAt: addDays(now, -1).toISOString() },
    { id: 'note_2', clientId: 'client_grace_city', visibility: 'shared', title: 'Session summary', body: 'Worked on blend, mic technique, and rehearsal handoffs. Next step: tighten transitions.', createdAt: addDays(now, -3).toISOString() },
  ];
}

function seedConsultationNotes(now) {
  return [
    {
      id: 'consult_seed_1',
      clientName: 'Grace City Church',
      organization: 'Grace City Church',
      category: 'worship',
      clientType: CATEGORY_DEFINITIONS.worship.clientType,
      sessionDate: addDays(now, -3).toISOString().slice(0, 10),
      notes: 'The worship team needs better vocal blend, clearer rehearsal structure, song-list feedback, and leadership follow-through before the next worship night.',
      goals: 'Create a repeatable rehearsal framework and stronger team confidence.',
      challenges: 'Blend, service transitions, and team consistency.',
      supportNeeded: 'Worship team coaching and leader consult.',
      nextSteps: 'Recommend a worship team package and proposal.',
      attachments: [{ name: 'sample-worship-notes.pdf', type: 'PDF', size: null, url: '' }],
      createdAt: addDays(now, -3).toISOString(),
      updatedAt: addDays(now, -3).toISOString(),
      lastRecommendedAt: null,
      latestRecommendationId: null,
    },
  ];
}

function seedResources(now) {
  return [
    { id: 'res_1', clientId: 'client_grace_city', name: 'Worship warm-up sheet', type: 'PDF', shared: true, uploadedAt: addDays(now, -3).toISOString() },
    { id: 'res_2', clientId: 'client_riverside', name: 'Rehearsal plan template', type: 'Google Doc', shared: true, uploadedAt: addDays(now, -1).toISOString() },
  ];
}

function seedTestimonials(now) {
  return [
    { id: 'test_1', clientId: 'client_north_county', clientName: 'North County Chorale', status: 'requested', serviceType: 'Workshop', approvedForWebsite: false, requestedAt: addDays(now, -1).toISOString() },
    { id: 'test_2', clientId: 'client_grace_city', clientName: 'Grace City Church', status: 'draft', serviceType: 'Worship Team Makeover', approvedForWebsite: false, requestedAt: addDays(now, -2).toISOString() },
  ];
}

function seedMediaReleases(now) {
  return [
    { id: 'media_1', clientId: 'client_riverside', signed: false, approved: { photo: false, video: false, audio: false, testimonial: false, name: false, organization: false }, restrictions: 'Student media pending school approval.', signedAt: null },
    { id: 'media_2', clientId: 'client_grace_city', signed: true, signedBy: 'Pastor Elena Moore', approved: { photo: true, video: true, audio: false, testimonial: true, name: true, organization: true }, restrictions: 'No full worship set recordings.', signedAt: addDays(now, -5).toISOString() },
  ];
}

module.exports = {
  APPOINTMENT_TYPES,
  CATEGORY_DEFINITIONS,
  EMAIL_TEMPLATES,
  FORM_FIELDS,
  PIPELINE_STAGES,
  SERVICES,
  buildDashboardSummary,
  createDefaultState,
  generateServiceRecommendations,
  moveInquiryStage,
  normalizeCrmState,
  normalizeCategory,
  normalizeInquiry,
  normalizeTestimonial,
  recordInquiry,
  recordTestimonial,
  saveConsultationNotes,
  updateSiteContent,
  updateServiceCatalog,
  updateTemplate,
};
