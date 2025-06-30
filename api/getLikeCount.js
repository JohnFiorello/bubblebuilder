const { getLikeCount } = require('../mute-logic.js');

module.exports = async (req, res) => {
  try {
    const { username, password, postAccount, postId } = req.body;
    const likeCount = await getLikeCount({
      username,
      password,
      postAccount,
      postId,
      log: () => {}  // no-op logger
    });
    return res.status(200).json({ likeCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
