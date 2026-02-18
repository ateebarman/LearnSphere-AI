/**
 * @desc    Health check for uptime monitoring
 * @route   GET /api/health
 * @access  Public
 */
const checkHealth = (req, res) => {
  res.status(200).send('OK');
};

export { checkHealth };
