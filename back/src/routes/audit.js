import express from 'express';
import { asyncHandler } from '../lib/errorHandler.js';
import { runIptablesAudit } from '../lib/iptablesAudit.js';
import { mapFirewallAudit } from '../lib/firewallDataMapper.js';

const router = express.Router();

router.get('/iptables', asyncHandler(async (req, res) => {
  const audit = await runIptablesAudit();
  const mapped = mapFirewallAudit(audit);

  res.json({
    ...audit,
    ...mapped,
    mappedAt: new Date().toISOString()
  });
}));

export default router;
