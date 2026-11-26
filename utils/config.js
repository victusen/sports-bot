export const allowedLeagues = [
  'ENGLAND: PREMIER LEAGUE',
  'SPAIN: LALIGA',
  'ITALY: SERIE A',
  'GERMANY: BUNDESLIGA',
  'FRANCE: LIGUE 1',
  'NIGERIA: NPFL',
  'WORLD: WORLD CUP'
];

export const filters = {
  excludeYouth: true,
  excludeWomen: true,

  youthPattern: /\bU(?:17|19|21|23)\b/i,
  womenPattern: /\b(?:WOMEN| W)\b/i,

  watchedTeams: [
    'Juventus',
    'Arsenal',
    'Brighton & Hove Albion',
    'Manchester City',
    'Liverpool',
    'Bournemouth',
    'Brentford',
    'Leeds United',
    'Chelsea',
    'Manchester Utd',
    'Tottenham Hotspur',
    'Barcelona',
    'Real Madrid',
    'Atl. Madrid',
    'Betis',
    'Real Sociedad',
    'Lazio',
    'AS Roma',
    'Inter',
    'AC Milan',
    'Como',
    'Fenerbache',
    'Galatasaray',
    'PSG'
  ]
};

export const flashscore = {
  site: 'https://www.flashscore.com.ng',
  matchSite: 'https://www.flashscore.com',
  feedHost: 'https://global.flashscore.ninja/44/x/feed',

  // Keep the sign in an environment variable in production.
  feedSign: process.env.FLASHSCORE_FEED_SIGN || 'SW9D1eZo',

  sportId: 1,
  language: 'en-ng',
  timezoneOffset: 0,
  feedVersion: 1,

  headers: {
    'x-ua': 'x',
    'Origin': 'https://www.flashscore.com.ng',
    'Referer': 'https://www.flashscore.com.ng/',
    'Accept': '*/*'
  }
};

export const endpoints = {
  // dayOffset: 0 means today
  // dayOffset: -1 means yesterday
  // dayOffset: 1 means tomorrow
  fixturesByDay: ({ dayOffset = 0 } = {}) =>
    `${flashscore.feedHost}/f_${flashscore.sportId}_${dayOffset}_${flashscore.timezoneOffset}_${flashscore.language}_${flashscore.feedVersion}`,

  matchPage: matchId =>
    `${flashscore.matchSite}/match/${matchId}/`,

  // Match incidents, goals, cards, substitutions and period scores
  incidents: matchId =>
    `${flashscore.feedHost}/df_sui_${flashscore.sportId}_${matchId}`,

  // Formations, starting players, substitutes, coaches and player ratings
  lineups: matchId =>
    `${flashscore.feedHost}/df_li_${flashscore.sportId}_${matchId}`,

  // Match statistics: possession, shots, passes, corners, etc.
  statistics: matchId =>
    `${flashscore.feedHost}/df_st_${flashscore.sportId}_${matchId}`,

  // Live text commentary
  commentary: matchId =>
    `${flashscore.feedHost}/df_lc_${flashscore.sportId}_${matchId}`,

  // Head-to-head and recent form
  headToHead: matchId =>
    `${flashscore.feedHost}/df_hh_${flashscore.sportId}_${matchId}`,

  // Tennis, darts and snooker point-by-point data
  pointByPoint: matchId =>
    `${flashscore.feedHost}/df_mh_${flashscore.sportId}_${matchId}`,

  // TV and streaming information
  television: matchId =>
    `${flashscore.feedHost}/df_tv_${flashscore.sportId}_${matchId}`
};

export const odds = {
  /*
   * Flashscore odds use a separate persisted GraphQL service.
   * The hash is not the same as the normal score-feed URL.
   * Do not invent a hash. Read the current odds request from the page.
   */
  enabled: false,
  host: process.env.FLASHSCORE_ODDS_HOST ||
    'https://global.ds.lsapp.eu/odds/pq_graphql',
  hash: process.env.FLASHSCORE_ODDS_HASH || '',
  projectId: process.env.FLASHSCORE_PROJECT_ID || '44',
  geoIpCode: process.env.FLASHSCORE_GEO || 'NG'
};

export const polling = {
  fetchFixturesOnStart: true,
  refreshLiveMatches: true,

  // Do not request every endpoint for every match too frequently.
  fixturesEveryMs: 5 * 60 * 1000,
  liveDataEveryMs: 30 * 1000,
  oddsEveryMs: 60 * 1000,
  requestTimeoutMs: 30 * 1000
};

export const logging = {
  directory: './logs',
  rawDirectory: './logs/raw',
  fixturesFile: './logs/fixtures.jsonl',
  liveFile: './logs/live.jsonl',
  errorsFile: './logs/errors.jsonl',
  oddsFile: './logs/odds.jsonl',
  saveRawResponses: true
};
