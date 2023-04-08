const admin = require("firebase-admin");

// Middleware to authenticate users
exports.isAuthenticated = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const idToken = authorization.split("Bearer ")[1];

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch((error) => {
      console.error(error);
      return res.status(401).json({
        error: "Unauthorized",
      });
    });
};
