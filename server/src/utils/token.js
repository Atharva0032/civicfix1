import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/** Issues a signed JWT whose `sub` is the user id. Never store roles in the token. */
export const signAuthToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export default signAuthToken;
