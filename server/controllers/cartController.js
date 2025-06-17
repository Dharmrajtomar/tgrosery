import User from "../models/User.js";

// Update User CartData : /api/cart/update

export const updateCart = async (req, res) => {
  try {
    // const {userId, cartItems } = req.body
       const userId = req.user.id; // ✅ Use ID from token
     const { cartItems } = req.body;


      if (!cartItems) {
      return res.status(400).json({ success: false, message: "No cart items provided" });
     }


    await User.findByIdAndUpdate(userId, { cartItems });
    res.json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }

  // try {
  //   const userId = req.user.id; // ✅ Use ID from token
  //   const { cartItems } = req.body;

  //   if (!cartItems) {
  //     return res.status(400).json({ success: false, message: "No cart items provided" });
  //   }

  //   await User.findByIdAndUpdate(userId, { cartItems });
  //   res.json({ success: true, message: "Cart updated successfully" });
  // } catch (error) {
  //   console.log(error.message);
  //   res.json({ success: false, message: error.message });
  // }
};
