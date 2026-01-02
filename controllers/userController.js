const userService = require('../services/userService');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.validated || {};

    const result = await userService.getUsers(page, limit);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const uploadProfilePictures = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Check permission
    userService.checkPermission(req.userId, userId, req.user.role);

    const images = await userService.uploadProfilePictures(userId, req.files);

    res.status(201).json({
      message: 'Profile pictures uploaded successfully',
      images
    });
  } catch (error) {
    if (error.message === 'Permission denied') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'No files uploaded') {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

const setDefaultProfilePicture = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const pictureId = parseInt(req.params.pictureId);

    // Check permission
    userService.checkPermission(req.userId, userId, req.user.role);

    const image = await userService.setDefaultProfilePicture(userId, pictureId);

    res.json({
      message: 'Default profile picture updated',
      image
    });
  } catch (error) {
    if (error.message === 'Permission denied') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Profile picture not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

const deleteProfilePicture = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const pictureId = parseInt(req.params.pictureId);

    // Check permission
    userService.checkPermission(req.userId, userId, req.user.role);

    await userService.deleteProfilePicture(userId, pictureId);

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    if (error.message === 'Permission denied') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Profile picture not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getUsers,
  uploadProfilePictures,
  setDefaultProfilePicture,
  deleteProfilePicture
};
