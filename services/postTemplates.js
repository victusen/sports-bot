export function buildGoalPost({
  home,
  away,
  homeScore,
  awayScore,
  minute,
  scorer,
  assist,
  ownGoal
}) {
  const scorerText = ownGoal
    ? `(Own goal) ${scorer}`
    : scorer;

  const assistText = assist
    ? `\nAssist: ${assist}`
    : '';

  return (
    `🔴 LIVE: ${home} ${homeScore}-${awayScore} ${away}\n\n` +
    `⚽ Goal: ${scorerText}${assistText}\n` +
    `⏱️ ${minute}'\n\n` +
    `📱 Follow Player Of The Match`
  );
}

export function buildSubstitutionPost({
  home,
  away,
  homeScore,
  awayScore,
  minute,
  team,
  playersIn,
  playersOut
}) {
  return (
    `🔴 LIVE: ${home} ${homeScore}-${awayScore} ${away}\n\n` +
    `🔄 Substitution: ${team}\n` +
    `In: ${playersIn.join(', ')}\n` +
    `Out: ${playersOut.join(', ')}\n` +
    `⏱️ ${minute}'\n\n` +
    `📱 Follow Player Of The Match`
  );
}
