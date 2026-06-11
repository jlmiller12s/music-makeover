(function () {
  const state = {
    category: new URLSearchParams(window.location.search).get('category') || 'general',
  };

  const serviceToCategoryMap = {
    'Private Music Coaching': 'private',
    'Audition / Performance Prep': 'private',
    'Worship Team Support': 'worship',
    'Choir & Ensemble Coaching': 'ensemble',
    'Quick Fix Assessment': 'school',
    'Music Educator Makeover': 'school',
    'Music Makeover Intensive': 'school',
    'Full Program Makeover': 'school',
    'Speaking / Workshop Request': 'school',
    'General Inquiry / Not Sure Yet': 'general'
  };

  const startingPointToServiceMap = {
    'private': 'Private Music Coaching',
    'worship': 'Worship Team Support',
    'ensemble': 'Choir & Ensemble Coaching',
    'school': 'Music Makeover Intensive',
    'general': 'General Inquiry / Not Sure Yet'
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    wireStartingPointCards();
    wireServiceInterestDropdown();
    wireTimelineDropdown();
    wireMobileAccordion();
    prefillFromUrl();
    
    const form = document.getElementById('music-inquiry-form');
    if (form) {
      form.addEventListener('submit', submitInquiry);
    }
  }

  // Section 2 Card interactions
  function wireStartingPointCards() {
    const cards = document.querySelectorAll('.starting-card');
    cards.forEach((card) => {
      // Click handler
      card.addEventListener('click', () => {
        selectStartingPointCard(card);
      });

      // Keypress handler for accessibility (Enter/Space)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectStartingPointCard(card);
        }
      });
    });
  }

  function selectStartingPointCard(card) {
    const lane = card.dataset.lane;
    state.category = lane;

    // Highlight card
    document.querySelectorAll('.starting-card').forEach((c) => {
      c.classList.toggle('active', c === card);
    });

    // Pre-select service in dropdown
    const serviceSelect = document.getElementById('supportNeeded');
    if (serviceSelect) {
      const matchedService = startingPointToServiceMap[lane];
      if (matchedService) {
        serviceSelect.value = matchedService;
        // Trigger change event to update conditional inputs
        serviceSelect.dispatchEvent(new Event('change'));
      }
    }

    // Scroll smoothly to form
    const formAnchor = document.getElementById('booking-form-anchor');
    if (formAnchor) {
      formAnchor.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Section 5: Form Conditional Logic on Service Interest Selection
  function wireServiceInterestDropdown() {
    const select = document.getElementById('supportNeeded');
    if (!select) return;

    select.addEventListener('change', () => {
      const selectedValue = select.value;
      const category = serviceToCategoryMap[selectedValue] || 'general';
      state.category = category;
      document.getElementById('category').value = category;

      // Update card highlighting to match dropdown selection
      document.querySelectorAll('.starting-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.lane === category);
      });

      // Toggle conditional fields
      toggleConditionalFields(category);
    });
  }

  function toggleConditionalFields(category) {
    // Hide all conditional blocks first
    document.querySelectorAll('.conditional-block').forEach((block) => {
      block.hidden = true;
      // Disable inputs so browser validation doesn't block submit on hidden elements
      block.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = true;
        el.removeAttribute('required');
      });
    });

    // Show matching block
    let activeBlock = null;
    if (category === 'private') {
      activeBlock = document.getElementById('cond-private');
    } else if (category === 'worship') {
      activeBlock = document.getElementById('cond-worship');
    } else if (category === 'ensemble') {
      activeBlock = document.getElementById('cond-ensemble');
    } else if (category === 'school') {
      activeBlock = document.getElementById('cond-school');
    }

    if (activeBlock) {
      activeBlock.hidden = false;
      activeBlock.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = false;
        // Make essential conditional inputs required
        if (el.id === 'studentAge' || el.id === 'experienceLevel' || el.id === 'preferredLessonType' || el.id === 'voiceInstrumentFocus' || el.id === 'preferredAvailability') {
          el.setAttribute('required', 'required');
        } else if (el.id === 'teamSize') {
          el.setAttribute('required', 'required');
        } else if (el.id === 'ensembleSize') {
          el.setAttribute('required', 'required');
        }
      });
    }
  }

  // Handle "Before a specific date" option in Timeline
  function wireTimelineDropdown() {
    const timelineSelect = document.getElementById('preferredTimeline');
    const specificDateContainer = document.getElementById('specific-date-field-container');
    const upcomingDateInput = document.getElementById('upcomingDates');
    if (!timelineSelect || !specificDateContainer) return;

    timelineSelect.addEventListener('change', () => {
      if (timelineSelect.value === 'Before a specific date') {
        specificDateContainer.hidden = false;
        if (upcomingDateInput) upcomingDateInput.setAttribute('required', 'required');
      } else {
        specificDateContainer.hidden = true;
        if (upcomingDateInput) {
          upcomingDateInput.removeAttribute('required');
          upcomingDateInput.value = '';
        }
      }
    });
  }

  // Section 4 Accordion Toggler on Mobile
  function wireMobileAccordion() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        const panel = trigger.nextElementSibling;

        // Toggle state
        trigger.setAttribute('aria-expanded', String(!expanded));
        if (panel) {
          panel.hidden = expanded;
        }

        // Close other panels
        triggers.forEach((t) => {
          if (t !== trigger) {
            t.setAttribute('aria-expanded', 'false');
            const p = t.nextElementSibling;
            if (p) p.hidden = true;
          }
        });
      });
    });
  }

  // Read URL query parameters to pre-fill the form
  function prefillFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      const card = document.querySelector(`.starting-card[data-lane="${categoryParam}"]`);
      if (card) {
        selectStartingPointCard(card);
      }
    }
  }

  // Submit Handler with Form Field mapping
  async function submitInquiry(event) {
    event.preventDefault();
    showMessage('', '');

    const form = event.currentTarget;
    
    // Custom Field Validation Check
    const invalidFields = [];
    const fieldsToValidate = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    fieldsToValidate.forEach((field) => {
      if (field.closest('[hidden]')) {
        // Skip hidden conditional elements
        field.classList.remove('input-error');
        return;
      }
      if (!field.value || field.value.trim() === '') {
        invalidFields.push(field);
        field.classList.add('input-error');
      } else {
        field.classList.remove('input-error');
      }
    });

    if (invalidFields.length > 0) {
      showMessage('error', 'Please fill out all required fields marked with an asterisk (*).');
      invalidFields[0].focus();
      // Scroll to the invalid field
      invalidFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Gather file upload metadata
    const fileInput = form.querySelector('#attachments');
    data.attachments = Array.from((fileInput && fileInput.files) || []).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    // Data Mapping to prevent backend validation errors
    const category = state.category;
    data.category = category;

    if (category === 'private') {
      data.studentName = data.name;
      data.musicGoals = `Focus: ${data.voiceInstrumentFocus || ''}\nGoals/Challenges: ${data.currentChallenges || ''}`;
      // experienceLevel, preferredLessonType, and preferredAvailability are mapped directly from form inputs
    } else if (category === 'worship') {
      data.organization = data.organization || 'N/A';
      data.role = data.role || 'N/A';
      data.teamSize = String(data.teamSize);
      data.currentChallenges = data.currentChallenges || 'Not specified';
      data.preferredTimeline = data.preferredTimeline || 'Not specified';
    } else if (category === 'ensemble') {
      data.organization = data.organization || 'N/A';
      data.teamSize = String(data.ensembleSize); // Choir coaching matches ensemble size to teamSize on backend
      data.currentChallenges = data.currentChallenges || 'Not specified';
      data.preferredTimeline = data.preferredTimeline || 'Not specified';
    } else if (category === 'school') {
      data.organization = data.organization || 'N/A';
      data.role = data.role || 'N/A';
      data.currentChallenges = data.currentChallenges || 'Not specified';
      data.preferredTimeline = data.preferredTimeline || 'Not specified';
    } else {
      // General Inquiry
      data.supportNeeded = data.supportNeeded || 'General Inquiry / Not Sure Yet';
    }

    const button = form.querySelector('button[type="submit"]');
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending...';

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error || 'Inquiry was not submitted');
      }

      // Success! Render success view inline instead of redirecting
      renderSuccessView();

    } catch (error) {
      showMessage('error', `${error.message}. If this keeps happening, email themusicmakeover@gmail.com and include your service lane and preferred timeline.`);
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function renderSuccessView() {
    const form = document.getElementById('music-inquiry-form');
    const panelHeader = document.querySelector('.booking-panel-header');
    const successView = document.getElementById('booking-success-view');

    if (form) form.hidden = true;
    if (panelHeader) panelHeader.hidden = true;
    if (successView) {
      successView.hidden = false;
      // Scroll to the success panel
      successView.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showMessage(type, message) {
    const box = document.getElementById('booking-status');
    if (!box) return;
    box.className = `status-message ${type || ''}${message ? ' is-visible' : ''}`;
    box.textContent = message;
  }
}());
