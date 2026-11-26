import schedule from 'crondis';
import { postToFacebook } from '../services/facebook.js';
import { startLivePolling } from '../services/livePolling.js';
import { enqueuePost } from '../services/postQueue.js';

function toCrondisUtcTime(unixSeconds) {
  return new Date(unixSeconds * 1000)
    .toISOString()
    .slice(0, 16) + 'Z';
}

function buildKickoffPost(fixture) {
  return `🔴 MATCH STARTING: ${fixture.home} vs ${fixture.away}\n\nLeague: ${fixture.league}\nKickoff at ${fixture.kickoffDeviceTime}\n\n📱 Follow Player Of The Match`;
}

function buildLineupPost(fixture) {
  return `🚩 Line ups for ${fixture.home} Vs ${fixture.away} are available,\n\nCheck MatchCorner>>>`;
}

export function scheduleKickoffPost(fixtures) {
  const now = Date.now();
  const jobs = [];

  for (const fixture of fixtures) {
    const kickoffMs = fixture.kickoffUnix * 1000;

    if (!fixture.kickoffUnix || !Number.isFinite(fixture.kickoffUnix)) {
      console.log(
        `[schedule skipped] ${fixture.home} vs ${fixture.away}: invalid kickoff time`
      );
      continue;
    }

    if (kickoffMs <= now) {
      console.log(
        `[schedule skipped] ${fixture.home} vs ${fixture.away}: already started`
      );
      continue;
    }

    const kickoffUtc = toCrondisUtcTime(
      fixture.kickoffUnix
    );

    // lineupTime: 1 hr 12 mins before kickoff (72 minutes = 72 * 60 * 1000 ms)
    const lineupUnix = fixture.kickoffUnix - (72 * 60);
    const lineupUtc = toCrondisUtcTime(lineupUnix);
    fixture.lineupTime = lineupUtc;

    console.log(`[fixture]: ${fixture.home} vs ${fixture.away}, lineup ready, Id=${fixture.id}`);
    console.log(`[CRON JOB] kick off: ${fixture.home} - ${fixture.away} set, Id=${fixture.id} >>> kickoff at ${kickoffUtc}`);

    const kickoffMessage = buildKickoffPost(fixture);
    const lineupMessage = buildLineupPost(fixture);

    // Schedule Lineup Job (if in future)
    if ((lineupUnix * 1000) > now) {
      schedule(
        lineupUtc,
        'once',
        () => {
          console.log(`[CRON JOB] lineup posted trigger: ${fixture.home} vs ${fixture.away}, Id=${fixture.id}`);
          enqueuePost({
            eventId: `lineup-${fixture.id}`,
            type: 'lineup',
            fixtureId: fixture.id,
            message: lineupMessage
          });
        }
      );
    }

    // Schedule Kickoff Job
    const job = schedule(
      kickoffUtc,
      'once',
      async () => {
        console.log(
          `[kickoff] ${fixture.home} vs ${fixture.away}`
        );

        console.log('[facebook message]');
        console.log(kickoffMessage);

        try {
          const result =
            await postToFacebook(kickoffMessage);

          console.log(
            `[facebook posted successfully] Kickoff post for ${fixture.home} vs ${fixture.away} - Result: ${JSON.stringify(result)}`
          );

          // Start live polling after kickoff post goes out
          startLivePolling(fixture);
        } catch (error) {
          console.error(
            `[facebook error] ${error.message}`
          );
        }
      }
    );

    jobs.push({
      fixtureId: fixture.id,
      home: fixture.home,
      away: fixture.away,
      kickoffUtc,
      job
    });
  }

  console.log(
    `[scheduler] Created ${jobs.length} kickoff jobs.`
  );

  return jobs;
}

export function getNotStartedFixtures(fixtures) {
  const now = Date.now();

  const notStartedFixtures = fixtures.filter(fixture => {
    const kickoffTime =
      fixture.kickoffUnix * 1000;

    return kickoffTime > now;
  });

  console.log(
    `[not started fixtures]: ` +
    `${notStartedFixtures.length}/${fixtures.length}`
  );

  return notStartedFixtures;
}
