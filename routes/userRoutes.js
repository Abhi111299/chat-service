const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');
const { paginationSchema } = require('../utils/validation');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get list of users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, validate(paginationSchema), userController.getUsers);

router.post(
  '/:id/profile-pictures',
  authenticate,
  upload.array('images', 10),
  userController.uploadProfilePictures
);

router.patch(
  '/:id/profile-pictures/:pictureId/default',
  authenticate,
  userController.setDefaultProfilePicture
);

router.delete(
  '/:id/profile-pictures/:pictureId',
  authenticate,
  userController.deleteProfilePicture
);

module.exports = router;

