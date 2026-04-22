const OTP      = require('../models/OTP');
const Mechanic = require('../models/Mechanic');
const { signToken }     = require('../utils/jwt');
const { sanitizePhone } = require('../utils/sanitize');
const logger            = require('../utils/logger');

const IS_PROD = process.env.NODE_ENV === 'production';

/* ──────────────────────────────────────
   POST /api/auth/otp/send
────────────────────────────────────── */
const sendOtp = async (req, res, next) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    if (phone.length < 10)
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });

    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.findOneAndUpdate(
      { phone },
      { otp, expiresAt, verified: false },
      { upsert: true, new: true }
    );

    // ── PRODUCTION: Swap this block with your SMS provider ──────────────
    // Example with Twilio:
    //   const twilio = require('twilio')(TWILIO_SID, TWILIO_TOKEN);
    //   await twilio.messages.create({ body: `FixIt OTP: ${otp}`, from: TWILIO_PHONE, to: `+91${phone}` });
    // ────────────────────────────────────────────────────────────────────
    logger.info(`📱  OTP for +91-${phone}  →  ${otp}  (expires in 5 min)`);

    res.json({
      message: 'OTP sent successfully',
      ...(IS_PROD ? {} : { demo_otp: otp })   // only expose in dev
    });

  } catch (err) {
    next(err);
  }
};

/* ──────────────────────────────────────
   POST /api/auth/otp/verify
────────────────────────────────────── */
const verifyOtp = async (req, res, next) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    const { otp } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ error: 'Phone and OTP are required' });

    const record = await OTP.findOne({ phone });
    if (!record)                        return res.status(400).json({ error: 'No OTP found. Request a new one.' });
    if (record.otp !== String(otp))     return res.status(400).json({ error: 'Incorrect OTP' });
    if (record.expiresAt < new Date())  return res.status(400).json({ error: 'OTP expired. Request a new one.' });

    await OTP.findOneAndUpdate({ phone }, { verified: true });

    // Find or auto-create mechanic on first login
    let mechanic = await Mechanic.findOne({ phone });
    const isNew  = !mechanic;
    if (isNew) mechanic = await Mechanic.create({ phone });

    if (mechanic.blocked)
      return res.status(403).json({ error: 'Your account has been blocked. Contact support.' });

    await Mechanic.findByIdAndUpdate(mechanic._id, { lastSeen: new Date() });

    const token = signToken({ id: mechanic._id, role: mechanic.role, phone });

    res.json({
      token,
      isNew,
      profileComplete: mechanic.profileComplete,
      mechanic: {
        id:              mechanic._id,
        name:            mechanic.name,
        phone:           mechanic.phone,
        service:         mechanic.service,
        available:       mechanic.available,
        verified:        mechanic.verified,
        profileComplete: mechanic.profileComplete,
        role:            mechanic.role
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = { sendOtp, verifyOtp };
