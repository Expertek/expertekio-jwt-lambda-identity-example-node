require('dotenv').config({ silent: true });

const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const util = require('util');

// extract and return the Bearer Token from the Lambda event parameters
const getToken = (event) => {
  if (!event || !event.headers) {
    throw new Error('Expected event headers');
  }
  const tokenString = event.headers.authorization;
  if (!tokenString) {
    throw new Error('Expected "event.headers.authorization" parameter to be set');
  }
  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
  }
  return match[1];
}

const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  jwksUri: 'https://keys.expertek.io/.well-known/jwks.json'
});

const authenticate = async (event) => {
  const token = getToken(event);
  
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('invalid token');
  }

  const jwtOptions = {};
  const issuer = process.env.TOKEN_ISSUER
  if (issuer) {
    jwtOptions.issuer = issuer.split(',')
  }

  const getSigningKey = util.promisify(client.getSigningKey);
  return getSigningKey(decoded.header.kid)
  .then((key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    return jwt.verify(token, signingKey, jwtOptions);
  });
}

exports.handler = async (event) => {

  let claims = {};

  // validate token
  try {
    claims = await authenticate(event);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 401,
      headers: {},
      body: "Unauthorized."
    };
  }

  // check claims for access to this package
  const access = claims.pks.reduce((prev, pkg) => prev || pkg === process.env.PACKAGE, false)
  if (!access) {
    console.log('package "' + process.env.PACKAGE + '" not found in ' + claims.pks.join(', '));
    return {
      statusCode: 403,
      headers: {},
      body: "Forbidden."
    };
  }

  const responseBody = {
    tenantId: claims.tid,
    company: claims.cno,
    operator: claims.opr,
    package: claims.pid,
  };

  const response = {
      statusCode: 200,
      body: JSON.stringify(responseBody),
  };

  return response;
};