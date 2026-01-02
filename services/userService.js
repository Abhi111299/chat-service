const { User, UserProfileImage } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

class UserService {
    async getUsers(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            attributes: [ 'id', 'email', 'name', 'role', 'createdAt' ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [ [ 'createdAt', 'DESC' ] ]
        });

        return {
            users: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async uploadProfilePictures(userId, files) {
        if (!files || files.length === 0) {
            throw new Error('No files uploaded');
        }

        const uploadedImages = [];

        try {
            for (const file of files) {
                const url = `/uploads/profile-pictures/${path.basename(file.path)}`;

                const image = await UserProfileImage.create({
                    userId,
                    url,
                    isDefault: false
                });

                uploadedImages.push({
                    id: image.id,
                    url: image.url,
                    isDefault: image.isDefault,
                    createdAt: image.createdAt
                });
            }

            return uploadedImages;
        } catch (error) {
            // Clean up uploaded files on error
            files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            throw error;
        }
    }

    async setDefaultProfilePicture(userId, pictureId) {
        // Check if picture exists and belongs to user
        const picture = await UserProfileImage.findOne({
            where: { id: pictureId, userId }
        });

        if (!picture) {
            throw new Error('Profile picture not found');
        }

        // Set all other pictures to non-default
        await UserProfileImage.update(
            { isDefault: false },
            { where: { userId, id: { [ Op.ne ]: pictureId } } }
        );

        // Set this picture as default
        await picture.update({ isDefault: true });

        return {
            id: picture.id,
            url: picture.url,
            isDefault: picture.isDefault
        };
    }

    async deleteProfilePicture(userId, pictureId) {
        // Find picture
        const picture = await UserProfileImage.findOne({
            where: { id: pictureId, userId }
        });

        if (!picture) {
            throw new Error('Profile picture not found');
        }

        // Delete file from filesystem
        const filePath = path.join(process.cwd(), picture.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await picture.destroy();
    }

    checkPermission(currentUserId, targetUserId, currentUserRole) {
        if (currentUserId !== targetUserId && currentUserRole !== 'admin') {
            throw new Error('Permission denied');
        }
    }
}

module.exports = new UserService();

