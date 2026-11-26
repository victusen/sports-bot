import { endpoints, filters } from '../utils/config.js';
import { fetchText } from './flashscore.js';
import { parseLiveEvents, groupSubstitutions } from './liveEvents.js';
import { buildPostsForEvents, buildPostsForSubstitutions } from './livePostBuilder.js';
import { enqueuePost } from './postQueue.js';

function isWatchedTeam(teamName, watchedTeams) {
  const norm = String(teamName || '').trim().toUpperCase();
  return watchedTeams.map(t => t.toUpperCase()).includes(norm);
}

export function startLivePolling(fixture) {
  console.log(
    `[live polling started] ${fixture.home} vs ${fixture.away}`
  );

  const seenEventIds = new Set();
  let timer;
  let polling = false;

  async function pollFixture() {
    if (polling) {
      console.log(`[live] Previous request still running: ${fixture.id}`);
      return;
    }

    polling = true;

    try {
      const rawData = await fetchText(
        endpoints.incidents(fixture.id)
      );

      const events = parseLiveEvents(
        rawData,
        fixture
      );

      const newEvents = events.filter(event => {
        if (seenEventIds.has(event.eventId)) {
          return false;
        }

        seenEventIds.add(event.eventId);
        return true;
      });

      console.log(`[live poll summary] ${fixture.home} vs ${fixture.away} (Id=${fixture.id}) -> Total parsed events: ${events.length}, New events this poll: ${newEvents.length}`);

      if (newEvents.length === 0) {
        console.log(
          `[live] No new events: ${fixture.id}`
        );
        return;
      }

      // Filter events involving watched team(s)
      const watchedTeams = filters.watchedTeams || [];
      const watchedNewEvents = newEvents.filter(event => {
        // Goals have event.scorer or team, substitutions have group.team
        const teamName = event.team || '';
        return isWatchedTeam(teamName, watchedTeams) || 
               isWatchedTeam(fixture.home, watchedTeams) || 
               isWatchedTeam(fixture.away, watchedTeams);
      });

      const goals = watchedNewEvents.filter(
        event => event.type === 'goal'
      );

      const substitutions = watchedNewEvents.filter(
        event =>
          event.type === 'substitution-in' ||
          event.type === 'substitution-out'
      );

      const substitutionGroups =
        groupSubstitutions(substitutions);

      console.log(`[live events breakdown] ${fixture.home} vs ${fixture.away} -> Goals: ${goals.length}, Substitution Groups: ${substitutionGroups.length}`);

      const goalPosts = buildPostsForEvents(
        goals,
        fixture
      );

      const substitutionPosts =
        buildPostsForSubstitutions(
          substitutionGroups,
          fixture,
          {
            homeScore: fixture.homeScore,
            awayScore: fixture.awayScore
          }
        );

      for (const post of [
        ...goalPosts,
        ...substitutionPosts
      ]) {
        enqueuePost(post);
      }

      if (/finished/i.test(rawData)) {
        clearInterval(timer);

        console.log(
          `[live polling stopped] Match finished: ${fixture.home} vs ${fixture.away} (${fixture.id})`
        );
      }
    } catch (error) {
      console.error(
        `[live polling error] ${fixture.id}: ${error.message}`
      );
    } finally {
      polling = false;
    }
  }

  // Fetch once immediately after kickoff.
  pollFixture();

  // Then fetch every 8 minutes.
  timer = setInterval(
    pollFixture,
    8 * 60 * 1000
  );

  return timer;
}
