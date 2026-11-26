import {
  flashscore,
  polling
} from '../utils/config.js';

export async function fetchText(url) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, polling.requestTimeoutMs || 30_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        ...flashscore.headers,
        'x-fsign': flashscore.feedSign
      }
    });

    const rawData = await response.text();

    if (!response.ok) {
      throw new Error(
        `Flashscore returned HTTP ${response.status}: ` +
        rawData.slice(0, 200)
      );
    }

    return rawData;
  } finally {
    clearTimeout(timeout);
  }
}
