import schedule from 'crondis';
import {
  endpoints,
  flashscore,
} from './utils/config.js';
import {
  getUCL,
  getEPL,
  getSerieA,
  getLaliga,
  getWatchedFixtures
} from './utils/filterleague.js';
import http from 'node:http';
import dotenv from "dotenv"; 
import {
  scheduleKickoffPost
} from './utils/beginPost.js';
import {
  startPostQueue
} from './services/postQueue.js';
import {
  startLivePolling
} from './services/livePolling.js';


dotenv.config();

const PORT = process.env.PORT || 3000;
const PING_INTERVAL = 8 * 60 * 1000; // 8 minutes

// schedule(
//   "2026-11-24T22:48",
//   "once",
//   () => {
//     console.log("[CRONDIS PACKAGE] Report sent.");
//   }
// );

async function fetchFlashscore() {
  const url = endpoints.fixturesByDay({
    dayOffset: 0
  });

  console.log('[request]', url);

  const response = await fetch(url, {
    headers: {
      ...flashscore.headers,
      'x-fsign': flashscore.feedSign
    }
  });

  console.log('[status]', response.status);

  const rawData = await response.text();

  if (!response.ok) {
    throw new Error(
      `Flashscore returned HTTP ${response.status}: ${rawData.slice(0, 200)}`
    );
  }

  return rawData;
}

function pad(number) {
  return String(number).padStart(2, '0');
}

function unixToDeviceTime(unixSeconds) {
  const date = new Date(unixSeconds * 1000);

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + 'T' + [
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join(':');
}

function unixToUtcTime(unixSeconds) {
  return new Date(unixSeconds * 1000)
    .toISOString()
    .slice(0, 16) + 'Z';
}

function parseFields(record) {
  const fields = {};

  for (const part of record.split('¬')) {
    const separator = part.indexOf('÷');

    if (separator === -1) {
      continue;
    }

    const key = part.slice(0, separator);
    const value = part.slice(separator + 1);

    fields[key] = value;
  }

  return fields;
}

function parseFixtures(rawData) {
  const fixtures = [];
  let currentLeague = '';

  for (const record of rawData.split('~')) {
    const fields = parseFields(record);

    // ZA is the competition or league heading.
    if (fields.ZA) {
      currentLeague = fields.ZA.trim();
    }

    // AA is the fixture ID.
    if (!fields.AA) {
      continue;
    }

    const fixture = {
      league: currentLeague,
      id: fields.AA,
      kickoffUnix: Number(fields.AD || 0),
      home: (fields.AE || fields.CX || '').trim(),
      away: (fields.AF || '').trim(),
      homeScore: fields.AG ?? '',
      awayScore: fields.AH ?? ''
    };
    
    fixture.kickoffDeviceTime =
      unixToDeviceTime(fixture.kickoffUnix);
    
    fixture.kickoffUtcTime =
      unixToUtcTime(fixture.kickoffUnix);


    // Ignore incomplete non-fixture records.
    if (!fixture.home || !fixture.away) {
      continue;
    }

    fixtures.push(fixture);
  }

  return fixtures;
}

async function main() {
  try {
    console.log('[server] Started.');
    console.log('[server] Initializing post queue...');
    startPostQueue();

    console.log('[server] Fetching today’s fixtures...');

    // Your existing function returns the raw Flashscore text.
    const rawData = await fetchFlashscore();

    console.log(
      `[server] Raw data received: ${rawData.length} characters`
    );

    // Convert the raw Flashscore text into fixture objects.
    const fixtures = parseFixtures(rawData);

    console.log(
      `[server] Fixtures parsed: ${fixtures.length}`
    );

    // Print league checks.
    getUCL(fixtures);
    getEPL(fixtures);
    getSerieA(fixtures);
    getLaliga(fixtures);

    // Collect fixtures involving watched teams.
    const todaysWatchedFixtures = [];

    getWatchedFixtures(
      fixtures,
      todaysWatchedFixtures
    );

    console.log(
      `[server] Watched fixtures collected: ` +
      `${todaysWatchedFixtures.length}`
    );

    console.log(
      '[server] Watched fixtures:',
      todaysWatchedFixtures
    );

    const now = Date.now();
    const notStarted = [];
    const alreadyLiveOrFinished = [];

    for (const fixture of todaysWatchedFixtures) {
      const kickoffMs = fixture.kickoffUnix * 1000;
      // If kickoff time has passed or match is live/finished (approx kickoffMs <= now)
      if (kickoffMs <= now) {
        alreadyLiveOrFinished.push(fixture);
      } else {
        notStarted.push(fixture);
      }
    }

    console.log(`[server lifecycle] Found ${alreadyLiveOrFinished.length} watched fixture(s) already in progress or finished, and ${notStarted.length} upcoming watched fixture(s).`);

    // Start live polling immediately for any watched games that have already started/are live right now
    for (const fixture of alreadyLiveOrFinished) {
      console.log(`[live catch-up] Starting live polling immediately for already started/live fixture: ${fixture.home} vs ${fixture.away} (Id=${fixture.id})`);
      startLivePolling(fixture);
    }

    // Schedule upcoming kickoff & lineup posts for future fixtures
    scheduleKickoffPost(notStarted);

    return todaysWatchedFixtures;
  } catch (error) {
    console.error('[server error]', error.message);
  }
}

function startKeepAliveServer() {
  const server = http.createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'application/json'
    });

    response.end(JSON.stringify({
      status: 'ok',
      service: 'flashscore-bot',
      time: new Date().toISOString()
    }));
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[http] Server listening on port ${PORT}`);
  });
}

async function pingApi() {
  const url = 'https://sports-bot-a4jn.onrender.com';

  try {
    const response = await fetch(url);

    console.log(
      `[ping] ${url} -> HTTP ${response.status} ` +
      `at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error(
      `[ping error] ${url}: ${error.message}`
    );
  }
}

function startPingLoop() {
  // Ping immediately when the server starts.
  pingApi();

  // Ping again every 8 minutes.
  setInterval(pingApi, PING_INTERVAL);

  console.log('[ping] Ping loop started: every 8 minutes');
}

startKeepAliveServer()
startPingLoop()
main();
