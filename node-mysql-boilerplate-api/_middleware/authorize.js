const { expressjwt: jwt } = require('express-jwt');
const { secret } = require('../config.json');
const db = require('../_helpers/db');

module.exports = authorize;

function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    jwt({ secret, algorithms: ['HS256'] }),

    // handle errors from jwt middleware (invalid token, missing token)
    (err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: 'Invalid or missing token' });
      }
      next(err);
    },

    // authorize based on user role
    async (req, res, next) => {
      try {
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: 'Unauthorized: Missing user info' });
        }

        const account = await db.Account.findByPk(req.user.id);

        if (!account || (roles.length && !roles.includes(account.role))) {
          // account no longer exists or role not authorized
          return res.status(401).json({ message: 'Unauthorized' });
        }

        // authentication and authorization successful
        req.user.role = account.role;
        const refreshTokens = await account.getRefreshTokens();
        req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
        next();
      } catch (error) {
        next(error);
      }
    }
  ];
}
