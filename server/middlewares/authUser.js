import jwt from 'jsonwebtoken';

const authUser = async (req, res, next)=>{
    const {token} = req.cookies;

    if(!token){
        return res.status(401).json({message: "Unauthorized"});
    }

    try{
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if(tokenDecode.id) {
            req.body = req.body || {}; // Ensure req.body is initialized
            req.body.userId = tokenDecode.id;
        } else {
            return res.status(401).json({success: false ,message: "Unauthorized"});
        }
        next();

    } catch (error)
    {
        console.error(error);
        return res.status(500).json({success: false , message: error.message});
    }
}

export default authUser;