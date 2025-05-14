import User from "../models/User.js";

// update user cart: /api/cart/update
export const updateCart = async (req, res) => {
    try{
        const {userId, cartItems} = req.body;
        await User.findByIdAndUpdate(userId, {cartItems} );
        return res.status(200).json({success: true, message: "Cart updated successfully"});
    } catch (error) {
        console.error("Error updating cart:", error);
        return res.status(500).json({success: false, message: "Failed to update cart"});
    }
}