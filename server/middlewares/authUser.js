import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  const {token} = req.cookies;
  if (!token) {
    return res.json({ success: false, message: "Not Authorized" });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (tokenDecode.id) {
     
      req.user = tokenDecode;
    } else {
      return res.json({ success: false, message: "Not Athorized" });
    }
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authUser;


