import jwt from 'jsonwebtoken';


// seller login: /api/seller/login

export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "All fields are required" });
        }
    
        // Check if user exists
        if (email !== process.env.SELLER_EMAIL) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid credentials" });
        }
    
        // Check password
        if (password !== process.env.SELLER_PASSWORD) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid credentials" });
        }
    
        const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
        });
    
        // Set token in cookie
        res.cookie("sellerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(201).json({
        success: true,
        message: "Seller logged in successfully",
        seller: { email },
        });
    } catch (error) {
        console.error("Error logging in seller:", error);
        res.status(500).json({ message: error.message, success: false });
    }
    }

// seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        return res.status(200).json({
            success: true});
    } catch (error) {
        console.error("Error checking seller authentication:", error);
        res.status(500).json({ message: error.message, success: false });
    }
}

// seller logout: /api/seller/logout
export const sellerLogout = async (req, res) => {
    try {
        res.clearCookie("sellerToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });
        return res.status(200).json({
            success: true,
            message: "Seller logged out successfully",
        });
    } catch (error) {
        console.error("Error logging out seller:", error);
        res.status(500).json({ message: error.message, success: false });
    }
}