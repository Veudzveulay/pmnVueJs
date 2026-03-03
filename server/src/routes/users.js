const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Toutes les routes sont réservées à l'admin
router.get('/', auth, roleCheck('admin'), userController.getUsers);
router.get('/:id', auth, roleCheck('admin'), userController.getUser);
router.put('/:id', auth, roleCheck('admin'), userController.updateUser);
router.delete('/:id', auth, roleCheck('admin'), userController.deleteUser);

module.exports = router;
