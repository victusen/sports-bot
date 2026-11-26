import {
  buildGoalPost,
  buildSubstitutionPost
} from './postTemplates.js';

export function buildPostsForEvents(
  events,
  fixture
) {
  const posts = [];

  for (const event of events) {
    if (event.type === 'goal') {
      posts.push({
        eventId: event.eventId,
        type: 'goal',
        fixtureId: fixture.id,
        message: buildGoalPost({
          home: fixture.home,
          away: fixture.away,
          homeScore: event.homeScore,
          awayScore: event.awayScore,
          minute: event.minute,
          scorer: event.scorer,
          assist: event.assist,
          ownGoal: event.ownGoal
        })
      });
    }
  }

  return posts;
}

export function buildPostsForSubstitutions(
  substitutionGroups,
  fixture,
  score
) {
  return substitutionGroups.map(group => ({
    eventId: group.eventId,
    type: 'substitution',
    fixtureId: fixture.id,
    message: buildSubstitutionPost({
      home: fixture.home,
      away: fixture.away,
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      minute: group.minute,
      team: group.team,
      playersIn: group.playersIn,
      playersOut: group.playersOut
    })
  }));
}
