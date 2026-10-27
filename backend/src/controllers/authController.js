const db = require('../db');
const { hashPassword, comparePassword, generateToken, formatError } = require('../utils/helpers');

async function register(req, res) {
  try {
    const { name, email, phone, password, role } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json(formatError('EMAIL_EXISTS', 'An account with this email already exists'));
    }

    const passwordHash = await hashPassword(password);
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(name.trim(), cleanEmail, phone ? phone.trim() : null, passwordHash, role);

    const user = {
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      role
    };

    const token = generateToken(user);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Registration failed'));
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const user = db.prepare('SELECT id, name, email, phone, password_hash, role FROM users WHERE email = ?').get(cleanEmail);
    if (!user) {
      return res.status(401).json(formatError('INVALID_CREDENTIALS', 'Invalid email or password'));
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json(formatError('INVALID_CREDENTIALS', 'Invalid email or password'));
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = generateToken(userData);
    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json(formatError('SERVER_ERROR', 'Login failed'));
  }
}

function logout(req, res) {
  // Stateless JWT: client discards token
  return res.status(200).json({ message: 'Logged out successfully' });
}

function getMe(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
