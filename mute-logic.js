// =========================
// 📦 IMPORTS & SETUP
// =========================
const { AtpAgent } = require('@atproto/api');


// ======================================================
// 🔢 HELPER: Get number of likes on a post (no muting)
// ======================================================
async function getLikeCount({ username, password, postAccount, postId, log }) {
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  // 🔐 Login to Bluesky
  log(`🔐 Logging in as ${username}...`);
  await agent.login({ identifier: username, password });
  log(`✅ Login successful!`);

  // 🔍 Resolve the post author's DID from their handle
  log(`🔄 Resolving handle ${postAccount}...`);
  const { data } = await agent.api.com.atproto.identity.resolveHandle({ handle: postAccount });
  const did = data.did;
  log(`✅ Resolved DID: ${did}`);

  // 🧩 Build full post URI for API
  const postUri = `at://${did}/app.bsky.feed.post/${postId}`;

  // 📥 Fetch all likes using pagination
  let allLikes = [];
  let cursor;
  log(`📥 Fetching likes for post...`);
  do {
    const res = await agent.api.app.bsky.feed.getLikes({ uri: postUri, cursor });
    if (res.data?.likes) allLikes.push(...res.data.likes);
    cursor = res.data?.cursor;
  } while (cursor);

  // ✅ Return the total number of likes
  log(`👥 Found ${allLikes.length} likes.`);
  return allLikes.length;
}


// ===============================================
// 🔇 MAIN FUNCTION: Mute everyone who liked post
// ===============================================
async function muteLikers({ username, password, postAccount, postId, log }) {
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  // 🔐 Step 1: Login
  try {
    log(`🔐 Logging in as ${username}...`);
    await agent.login({ identifier: username, password });
    log(`✅ Login successful!`);
  } catch (err) {
    log(`❌ Login failed: ${err.message}`);
    return;
  }

  // 🔍 Step 2: Resolve post author to DID
  let did;
  try {
    log(`🔄 Resolving handle ${postAccount}...`);
    const { data } = await agent.api.com.atproto.identity.resolveHandle({ handle: postAccount });
    did = data.did;
    log(`✅ Resolved DID: ${did}`);
  } catch (err) {
    log(`❌ Failed to resolve handle: ${err.message}`);
    return;
  }

  // 🧩 Step 3: Construct the post URI
  const postUri = `at://${did}/app.bsky.feed.post/${postId}`;

  // 📥 Step 4: Fetch all likes on the post
  let allLikes = [];
  let cursor;
  log(`📥 Fetching likes for post...`);
  try {
    do {
      const res = await agent.api.app.bsky.feed.getLikes({ uri: postUri, cursor });
      if (res.data?.likes) allLikes.push(...res.data.likes);
      cursor = res.data?.cursor;
    } while (cursor);

    log(`👥 Found ${allLikes.length} likes.`);
  } catch (err) {
    log(`❌ Error fetching likes: ${err.message}`);
    return;
  }

  // ⚠️ Step 5: No likes? Exit early
  if (allLikes.length === 0) {
    log('⚠️ No likes found.');
    return;
  }

  // 🔇 Step 6: Mute each user who liked the post
  for (const user of allLikes) {
    const handle = user.actor.handle;
    const did = user.actor.did;
    const name = user.actor.displayName || handle;
    try {
      await agent.app.bsky.graph.muteActor({ actor: did });
      log(`🔇 Muted ${name} (@${handle})`);
    } catch (err) {
      log(`❌ Failed to mute ${name}: ${err.message}`);
    }
  }

// ✅ Step 7: All done!
log(`✅ Finished muting all users.`);

// Return count for frontend to display in popup
return allLikes.length;
}


// 🧾 EXPORT functions so index.html can use them
module.exports = { muteLikers, getLikeCount };
