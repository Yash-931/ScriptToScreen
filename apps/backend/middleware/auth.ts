import type { Request, Response, NextFunction } from "express"
import jwt, { type JwtPayload } from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request{
    user?: {
        username: string
    }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction){
    const token = req.headers.authorization
    if(!token){
        res.status(403).json({
            message: "Token not present, please signin first"
        })
        return
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!)
    if(!decodedToken){
        res.status(403).json({
            message: "Invalid token"
        })
        return
    }

    if(typeof decodedToken === 'object' && 'data' in decodedToken){
        const userId = decodedToken.data
        req.user = userId
    }
    else{
        res.status(401).json({
            message: "Invalid payload in the token"
        })
        return
    }
    next()
}