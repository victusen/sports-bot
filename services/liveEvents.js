function parseFields(record) {
  const fields = {};

  for (const part of record.split('¬')) {
    const separator = part.indexOf('÷');

    if (separator === -1) {
      continue;
    }

    fields[part.slice(0, separator)] =
      part.slice(separator + 1);
  }

  return fields;
}

function getMinute(fields) {
  return fields.IB || fields.IMIN || '';
}

function getEventId(fields) {
  return fields.III || fields.AA || '';
}

function getScore(fields, fallback) {
  return {
    homeScore: fields.INX ?? fallback.homeScore ?? '',
    awayScore: fields.IOX ?? fallback.awayScore ?? ''
  };
}

export function parseLiveEvents(rawData, fixture) {
  const events = [];

  for (const record of rawData.split('~')) {
    const fields = parseFields(record);

    const eventType = fields.IK || '';
    const player = fields.IF || '';
    const minute = getMinute(fields);
    const eventId = getEventId(fields);

    if (!eventId) {
      continue;
    }

    const score = getScore(fields, fixture);

    if (eventType.toLowerCase().includes('goal')) {
      const ownGoal =
        eventType.toLowerCase().includes('own goal') ||
        fields.ICT?.toLowerCase().includes('own goal') ||
        fields.IK?.toLowerCase().includes('own goal');

      events.push({
        eventId,
        type: 'goal',
        minute,
        scorer: player,
        assist: fields.ASSIST || fields.IA || '',
        ownGoal,
        homeScore: score.homeScore,
        awayScore: score.awayScore,
        rawFields: fields
      });

      continue;
    }

    if (
      eventType === 'Substitution - Out' ||
      eventType === 'Substitution - In'
    ) {
      events.push({
        eventId,
        type: eventType === 'Substitution - Out'
          ? 'substitution-out'
          : 'substitution-in',
        minute,
        player,
        team: fields.TEAM || fields.SIDE || '',
        side: fields.SIDE || '',
        rawFields: fields
      });
    }
  }

  return events;
}

export function groupSubstitutions(events) {
  const groups = new Map();

  const substitutions = events.filter(event =>
    event.type === 'substitution-in' ||
    event.type === 'substitution-out'
  );

  for (const event of substitutions) {
    const groupKey = [
      event.side || event.team || 'unknown',
      event.minute
    ].join(':');

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        eventId: `substitution-${groupKey}`,
        type: 'substitution',
        minute: event.minute,
        team: event.team || event.side || 'Team',
        playersIn: [],
        playersOut: [],
        homeScore: event.homeScore || '',
        awayScore: event.awayScore || ''
      });
    }

    const group = groups.get(groupKey);

    if (event.type === 'substitution-in') {
      group.playersIn.push(event.player);
    }

    if (event.type === 'substitution-out') {
      group.playersOut.push(event.player);
    }
  }

  return [...groups.values()];
}

