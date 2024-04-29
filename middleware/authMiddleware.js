const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(token)
    
    if (!token) {
        return res.status(403).json({ error: "Invalid token" });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
    });
}

function authenticateAdminToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(token)
    
    if (!token) {
        return res.status(403).json({ error: "Invalid token" });
    }

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        if (user.userRole !== 'ADMIN') {
            return res.status(401).json({ error: "Unauthorized: Only admins can access this resource" });
        }
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
    authenticateAdminToken
};

