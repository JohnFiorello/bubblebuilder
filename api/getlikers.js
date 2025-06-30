const { AtpAgent } = require('@atproto/api');

module.exports = async (req, res) => {
  try {
    const { username, password, postAccount, postId } = req.body;
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    await agent.login({ identifier: username, password });
    const { data } = await agent.api.com.atproto.identity.resolveHandle({ handle: postAccount });
    const did = data.did;
    const postUri = `at://${did}/app.bsky.feed.post/${postId}`;

    let allLikes = [], cursor;
    do {
      const r = await agent.api.app.bsky.feed.getLikes({ uri: postUri, cursor });
      if (r.data?.likes) allLikes.push(...r.data.likes);
      cursor = r.data?.cursor;
    } while (cursor);

    // return only the actor info we need
    const likers = allLikes.map(u => ({
      handle:   u.actor.handle,
      displayName: u.actor.displayName || u.actor.handle,
      did:      u.actor.did
    }));

    res.status(200).json({ likers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
