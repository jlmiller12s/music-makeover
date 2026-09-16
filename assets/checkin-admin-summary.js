(function (root) {
  // Deterministic conversation prompts derived from the scored domains, not a diagnosis.
  function summarize(snapshot) {
    const ranked = [...snapshot.domains].sort((a, b) => a.average - b.average);
    const pressure = ranked.filter(d => d.average < 3.5);
    const supporting = ranked.filter(d => d.average >= 3.5).reverse();
    const needs = {
      connection: 'explore trusted peer support and regular opportunities to connect',
      capacity: 'identify workload demands that exceed available time or resources',
      voice: 'identify where clearer communication or more decision-making input could help',
      advocacy: 'clarify advocacy goals, risks, and available support before choosing a next step',
      boundaries: 'identify one recurring demand where a boundary or recovery time could help',
      confidence: 'separate specific development needs from pressures created by the situation',
      program: 'identify a program condition that may need resources or organizational change',
      sustainability: 'explore what is making the current way of working difficult to sustain'
    };
    let feedback = pressure.length
      ? `Start with ${pressure.slice(0, 2).map(d => d.name).join(' and ')}. Ashley could ${pressure.slice(0, 2).map(d => needs[d.id]).join('; then ')}.`
      : 'All eight areas are currently Strong or Stable. Explore what is working and agree on one way to protect those supports; the scores do not point to a specific area needing intervention.';
    if (snapshot.outlook.value <= 2) feedback += ' Their three-year outlook suggests that continuing under current conditions feels difficult. Ask what would need to change, even if domain scores look positive.';
    else if (snapshot.outlook.value === 3) feedback += ' Their three-year outlook is uncertain; ask what would make continuing feel more sustainable.';
    return { pressure, supporting, feedback };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { summarize };
  else root.CheckinAdminSummary = { summarize };
})(typeof window !== 'undefined' ? window : this);
