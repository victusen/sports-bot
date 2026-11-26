import { filters } from './config.js';

function normalize(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function isYouthFixture(fixture) {
  const text = `${fixture.league} ${fixture.home} ${fixture.away}`;

  return (
    filters.excludeYouth &&
    filters.youthPattern.test(text)
  );
}

function isWomenFixture(fixture) {
  const text = `${fixture.league} ${fixture.home} ${fixture.away}`;

  return (
    filters.excludeWomen &&
    filters.womenPattern.test(text)
  );
}

function printLeagueResult(label, fixtures) {
  if (fixtures.length === 0) {
    console.log(`[${label} fixtures]: No (0) today.`);
    return;
  }

  console.log(
    `[${label} fixtures]: Yes (${fixtures.length}) today.`
  );

  for (const fixture of fixtures) {
    console.log(formatFixture(fixture));
  }
}

function formatTime(unixSeconds, timeZone) {
  if (!unixSeconds) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(unixSeconds * 1000));
}

function formatFixture(fixture) {
  const localTimeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const localTime = formatTime(
    fixture.kickoffUnix,
    localTimeZone
  );

  const utcTime = formatTime(
    fixture.kickoffUnix,
    'UTC'
  );

  const score =
    fixture.homeScore !== '' ||
    fixture.awayScore !== ''
      ? `${fixture.homeScore || '-'}-${fixture.awayScore || '-'}`
      : 'vs';

  return (
    `${localTime} local / ${utcTime} UTC  ` +
    `ID=${fixture.id}  ` +
    `${fixture.home} ${score} ${fixture.away}`
  );
}

function validFixture(fixture) {
  return (
    fixture &&
    fixture.id &&
    fixture.home &&
    fixture.away &&
    !isYouthFixture(fixture) &&
    !isWomenFixture(fixture)
  );
}

function getLeagueFixtures(fixtures, matcher) {
  return fixtures.filter(fixture => {
    return validFixture(fixture) && matcher(fixture);
  });
}

export function getUCL(fixtures) {
  const uclFixtures = getLeagueFixtures(
    fixtures,
    fixture => {
      const league = normalize(fixture.league);

      return (
        league === 'EUROPE: CHAMPIONS LEAGUE' ||
        league === 'EUROPE: UEFA CHAMPIONS LEAGUE'
      );
    }
  );

  printLeagueResult('UCL', uclFixtures);

  return uclFixtures;
}

export function getEPL(fixtures) {
  const eplFixtures = getLeagueFixtures(
    fixtures,
    fixture =>
      normalize(fixture.league) ===
      'ENGLAND: PREMIER LEAGUE'
  );

  printLeagueResult('EPL', eplFixtures);

  return eplFixtures;
}

export function getSerieA(fixtures) {
  const serieAFixtures = getLeagueFixtures(
    fixtures,
    fixture =>
      normalize(fixture.league) ===
      'ITALY: SERIE A'
  );

  printLeagueResult('Serie A', serieAFixtures);

  return serieAFixtures;
}

export function getLaliga(fixtures) {
  const laligaFixtures = getLeagueFixtures(
    fixtures,
    fixture =>
      normalize(fixture.league) ===
      'SPAIN: LALIGA'
  );

  printLeagueResult('LaLiga', laligaFixtures);

  return laligaFixtures;
}

export function getWatchedFixtures(
  fixtures,
  outputArray = []
) {
  const watchedTeams = filters.watchedTeams.map(normalize);

  for (const fixture of fixtures) {
    if (!validFixture(fixture)) {
      continue;
    }

    const home = normalize(fixture.home);
    const away = normalize(fixture.away);

    const homeIsWatched =
      watchedTeams.includes(home);

    const awayIsWatched =
      watchedTeams.includes(away);

    if (homeIsWatched || awayIsWatched) {
      outputArray.push(fixture);
    }
  }

  console.log(
    `[watched fixtures]: ${outputArray.length} today.`
  );

  return outputArray;
}
