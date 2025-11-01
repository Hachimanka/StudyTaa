// Middleware to verify token and extract user ID
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // The token is the user ID itself (stored during login)
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Store the userId in the request object for use in routes
    req.userId = token;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};
