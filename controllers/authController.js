const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.validated;

    const result = await authService.register(email, password, name, role);

    res.status(201).json({
      message: 'User registered successfully',
      ...result
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    const result = await authService.login(email, password);

    res.json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    const tokens = await authService.refreshToken(refreshToken);

    res.json(tokens);
  } catch (error) {
    if (error.message === 'Invalid or expired refresh token' ||
      error.message === 'User not found') {
      return res.status(401).json({ error: error.message });
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.validated;

    await authService.logout(refreshToken);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout
};
