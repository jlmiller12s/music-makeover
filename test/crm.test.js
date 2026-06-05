const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildDashboardSummary,
  createDefaultState,
  generateServiceRecommendations,
  normalizeInquiry,
  recordTestimonial,
  recordInquiry,
  saveConsultationNotes,
  updateServiceCatalog,
} = require('../lib/musicMakeoverCrm');

test('normalizes and tags a school inquiry for the pipeline', () => {
  const inquiry = normalizeInquiry({
    category: 'school',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '314-555-0199',
    organization: 'Central High School',
    role: 'Choir Director',
    location: 'St. Louis, MO',
    supportNeeded: 'Contest preparation',
    currentChallenges: 'Blend and confidence',
    preferredTimeline: 'Fall semester',
  });

  assert.equal(inquiry.category, 'school');
  assert.equal(inquiry.stage, 'New Inquiry');
  assert.deepEqual(inquiry.tags, ['School', 'School Lead', 'Needs Review']);
  assert.equal(inquiry.clientType, 'School / Music Educator Support');
  assert.ok(inquiry.id.startsWith('inq_'));
});

test('validates category-specific required inquiry fields', () => {
  assert.throws(
    () => normalizeInquiry({
      category: 'private',
      name: 'Avery Student',
      email: 'avery@example.com',
      musicGoals: 'Audition prep',
    }),
    /phone is required/i,
  );

  const privateInquiry = normalizeInquiry({
    category: 'private',
    studentName: 'Avery Student',
    parentGuardianName: 'Morgan Parent',
    age: '14',
    email: 'avery@example.com',
    phone: '314-555-1212',
    musicGoals: 'Audition prep',
    experienceLevel: 'Intermediate',
    preferredLessonType: '45-minute private coaching',
    preferredAvailability: 'Tuesday evenings',
  });

  assert.equal(privateInquiry.category, 'private');
  assert.ok(privateInquiry.tags.includes('Private Coaching'));
});

test('builds dashboard metrics from leads, appointments, invoices, tasks, and payments', () => {
  const state = createDefaultState('2026-05-14T18:00:00.000Z');
  const dashboard = buildDashboardSummary(state, '2026-05-14T18:00:00.000Z');

  assert.equal(dashboard.cards.newInquiries, 4);
  assert.equal(dashboard.cards.consultationsScheduled, 3);
  assert.equal(dashboard.cards.contractsPending, 2);
  assert.equal(dashboard.cards.invoicesUnpaid, 3);
  assert.equal(dashboard.cards.followUpsDue, 3);
  assert.equal(dashboard.cards.testimonialsPending, 2);
  assert.equal(dashboard.cards.activeClients, 5);
  assert.equal(dashboard.cards.revenueThisMonth, 2675);
  assert.deepEqual(dashboard.leadsByCategory, {
    school: 2,
    ensemble: 1,
    worship: 2,
    private: 2,
    general: 1,
  });
});

test('updates service catalog values without replacing the full service list', () => {
  const state = createDefaultState('2026-05-14T18:00:00.000Z');
  const updated = updateServiceCatalog(state, 'svc_worship_makeover', {
    priceLabel: '$575',
    bookable: false,
  });

  const worship = updated.services.find((service) => service.id === 'svc_worship_makeover');
  const quickFix = updated.services.find((service) => service.id === 'svc_quick_fix');

  assert.equal(worship.priceLabel, '$575');
  assert.equal(worship.bookable, false);
  assert.equal(quickFix.priceLabel, '$350');
  assert.notEqual(updated, state);
});

test('records a business notification and inquiry confirmation email when requested', () => {
  const state = createDefaultState('2026-05-14T18:00:00.000Z');
  const result = recordInquiry(state, {
    category: 'school',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    phone: '314-555-0199',
    organization: 'Central High School',
    role: 'Choir Director',
    location: 'St. Louis, MO',
    supportNeeded: 'Contest preparation',
    currentChallenges: 'Blend and confidence',
    preferredTimeline: 'Fall semester',
    sendConfirmationEmail: 'on',
  }, '2026-05-14T18:00:00.000Z');

  assert.equal(result.inquiry.confirmationEmailRequested, true);
  assert.equal(result.state.inquiryEmailOutbox.length, 2);
  assert.equal(result.state.inquiryEmailOutbox[0].to, 'themusicmakeover@gmail.com');
  assert.equal(result.state.inquiryEmailOutbox[0].replyTo, 'jordan@example.com');
  assert.match(result.state.inquiryEmailOutbox[0].subject, /New School \/ Music Educator Support inquiry/i);
  assert.equal(result.state.inquiryEmailOutbox[1].to, 'jordan@example.com');
  assert.match(result.state.inquiryEmailOutbox[1].subject, /Music Makeover inquiry/i);
});

test('records a public testimonial submission and notifies the business', () => {
  const state = createDefaultState('2026-05-14T18:00:00.000Z');
  const result = recordTestimonial(state, {
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    serviceType: 'Choir & Ensemble Coaching',
    challengeGoal: 'Our choir needed stronger blend and confidence before contest.',
    standout: 'Ashley made the feedback practical and encouraging.',
    changedImproved: 'Students understood vowel shape and tone faster.',
    considerationQuote: 'The Music Makeover helped us sound better and feel braver.',
    sharePermission: 'yes',
    nameDisplay: 'First name only',
  }, '2026-05-14T19:00:00.000Z');

  assert.equal(result.testimonial.status, 'submitted');
  assert.equal(result.testimonial.clientName, 'Jordan Lee');
  assert.equal(result.testimonial.approvedForWebsite, true);
  assert.equal(result.testimonial.nameDisplay, 'First name only');
  assert.equal(result.state.testimonials[0].id, result.testimonial.id);
  assert.equal(result.state.testimonialEmailOutbox.length, 1);
  assert.equal(result.state.testimonialEmailOutbox[0].to, 'themusicmakeover@gmail.com');
  assert.equal(result.state.testimonialEmailOutbox[0].replyTo, 'jordan@example.com');
  assert.match(result.state.testimonialEmailOutbox[0].subject, /New testimonial/i);
});

test('saves consultation notes with upload metadata for AI review', () => {
  const state = createDefaultState('2026-05-14T18:00:00.000Z');
  const result = saveConsultationNotes(state, {
    clientName: 'Grace City Church',
    category: 'worship',
    sessionDate: '2026-05-14',
    notes: 'The worship team needs better rehearsal structure, vocal blend, and leader follow-through.',
    files: [
      { name: 'worship-set-list.pdf', size: 150000, type: 'application/pdf' },
      { name: 'rehearsal-notes.docx', size: 64000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    ],
  }, '2026-05-14T18:30:00.000Z');

  assert.equal(result.result.clientName, 'Grace City Church');
  assert.equal(result.result.category, 'worship');
  assert.equal(result.result.attachments.length, 2);
  assert.equal(result.result.attachments[0].name, 'worship-set-list.pdf');
  assert.equal(result.state.consultationNotes[0].id, result.result.id);
});

test('generates service and package recommendations from consultation notes', () => {
  const state = createDefaultState('2026-05-14T18:00:00.000Z');
  const noteResult = saveConsultationNotes(state, {
    clientName: 'Grace City Church',
    category: 'worship',
    notes: 'They need a four week worship team plan with weekly rehearsal coaching, stronger vocal blend, service transitions, song list feedback, and leader accountability.',
  }, '2026-05-14T18:30:00.000Z');

  const recommendationResult = generateServiceRecommendations(
    noteResult.state,
    noteResult.result.id,
    '2026-05-14T18:45:00.000Z',
  );

  assert.equal(recommendationResult.result.clientName, 'Grace City Church');
  assert.equal(recommendationResult.result.recommendations[0].serviceId, 'svc_worship_four_week');
  assert.equal(recommendationResult.result.recommendations[0].confidence, 'High');
  assert.match(recommendationResult.result.recommendations[0].rationale.join(' '), /worship|four-week|rehearsal/i);
  assert.equal(recommendationResult.state.aiRecommendations[0].consultationId, noteResult.result.id);
});
