const express = require('express');
const router = express.Router();

router.post('/:action', (req, res) => {
  const { action } = req.params;
  const { value } = req.body;
  
  console.log(`Control action: ${action}, value: ${value}`);
  req.io.emit('controlUpdate', { action, value, timestamp: new Date() });
  
  res.json({ success: true, action, value });
});

module.exports = router;
