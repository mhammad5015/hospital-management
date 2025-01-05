const jwt = require("jsonwebtoken");
const models = require("../../models/index");
const CustomError = require("../../util/CustomError");

module.exports = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new CustomError("Authentication token is missing. Access is denied.", 401);
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (error, user) => {
      try {
        if (error) {
          throw new CustomError("Invalid or expired token. Access is forbidden.", 403);
        }
        const isUser = await models.User.findOne({
          where: { id: user.id, userName: user.userName },
        });
        if (!isUser) {
          throw new CustomError("Invalid token. Access is forbidden.", 403);
        }
        req.user = user;
        next();
      } catch (err) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
};
