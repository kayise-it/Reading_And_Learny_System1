const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log('Your JWT_SECRET:');
console.log(secret);
console.log('\nCopy this into your .env file as:');
console.log(`JWT_SECRET=${secret}`);