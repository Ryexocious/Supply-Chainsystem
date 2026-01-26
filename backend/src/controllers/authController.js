const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

exports.register = async (req, res, next) => {
    try {
        const { email, password, fullName, role = 'user' } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({
                error: 'Please provide email, password, and full name'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters'
            });
        }

        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await query(
            `INSERT INTO users (email, password, full_name, role, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, email, full_name, role, created_at`,
            [email, hashedPassword, fullName, role]
        );

        const user = result.rows[0];
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Please provide email and password'
            });
        }

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const result = await query(
            `SELECT id, email, full_name, role, created_at, last_login 
       FROM users WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    } catch (error) {
        next(error);
    }
};