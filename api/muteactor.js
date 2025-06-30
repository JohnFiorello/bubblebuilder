const { AtpAgent } = require('@atproto/api');

module.exports = async (req, res) => {
  try {
    const { username, password, actorDid } = req.body;
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    await agent.login({ identifier: username, password });
    await agent.app.bsky.graph.muteActor({ actor: actorDid });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
