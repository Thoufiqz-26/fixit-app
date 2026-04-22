/** Strip non-digits and keep last 10 characters (India mobile) */
const sanitizePhone = (p) => (p || '').replace(/\D/g, '').slice(-10);

module.exports = { sanitizePhone };
