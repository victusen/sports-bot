import { postToFacebook } from './facebook.js';

const pendingPosts = [];
const sendingPosts = [];
const sentEventIds = new Set();

export function enqueuePost(post) {
  if (!post.eventId) {
    console.error('[queue] Cannot queue post without event ID');
    return;
  }

  if (sentEventIds.has(post.eventId)) {
    console.log(`[queue] Duplicate ignored: ${post.eventId}`);
    return;
  }

  const alreadyQueued = pendingPosts.some(
    item => item.eventId === post.eventId
  );

  if (alreadyQueued) {
    console.log(`[queue] Already queued: ${post.eventId}`);
    return;
  }

  pendingPosts.push(post);

  console.log(
    `[queue] Added ${post.type}: ${post.eventId}`
  );
}

function movePendingPostsToSendingQueue() {
  if (pendingPosts.length === 0) {
    console.log('[queue sweep] Empty');
    return;
  }

  const posts = pendingPosts.splice(
    0,
    pendingPosts.length
  );

  sendingPosts.push(...posts);

  console.log(
    `[queue sweep] Moved ${posts.length} post(s) to sending queue`
  );
}

async function sendOnePost() {
  if (sendingPosts.length === 0) {
    return;
  }

  const post = sendingPosts.shift();

  console.log(
    `[queue send] Sending ${post.type}: ${post.eventId}`
  );

  const result = await postToFacebook(post.message);

  if (result.success) {
    sentEventIds.add(post.eventId);

    console.log(
      `[queue send successful] Post sent successfully -> Type: ${post.type}, EventId: ${post.eventId}, FixtureId: ${post.fixtureId}, Facebook Post ID: ${result.postId || 'N/A'}`
    );
  } else {
    console.error(
      `[queue send] Failed: ${post.eventId} - ${result.message}`
    );
  }
}

export function startPostQueue() {
  // Sweep the pending array every minute.
  setInterval(
    movePendingPostsToSendingQueue,
    60 * 1000
  );

  // Send no more than one post every 10 seconds.
  setInterval(async () => {
    try {
      await sendOnePost();
    } catch (error) {
      console.error(
        `[queue send error] ${error.message}`
      );
    }
  }, 10 * 1000);

  console.log(
    '[queue] Started: sweep every 60s, send every 10s'
  );
}
