const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['student', 'instructor', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be student, instructor, or admin.' });
    }

    const targetUserId = req.params.id;

    // Prevent an admin from demoting themselves (which could cause accidental lockout)
    if (String(req.user._id) === String(targetUserId) && role !== 'admin') {
      return res.status(400).json({ message: 'Security safeguard: You cannot demote your own administrator account.' });
    }

    // Prevent demoting the last active administrator
    if (role !== 'admin') {
      const targetUser = await User.findById(targetUserId);
      if (targetUser && targetUser.role === 'admin') {
        const totalAdmins = await User.countDocuments({ role: 'admin' });
        if (totalAdmins <= 1) {
          return res.status(400).json({ message: 'Action blocked: Platform must have at least one active administrator.' });
        }
      }
    }

    const user = await User.findByIdAndUpdate(targetUserId, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

exports.verifyInstructor = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = isVerified !== undefined ? !!isVerified : true;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Prevent admin from deleting their own account via admin dashboard
    if (String(req.user._id) === String(targetUserId)) {
      return res.status(400).json({ message: 'Security safeguard: You cannot delete your own account from the admin console.' });
    }

    // Check if target is admin and is the last remaining admin
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser.role === 'admin') {
      const totalAdmins = await User.countDocuments({ role: 'admin' });
      if (totalAdmins <= 1) {
        return res.status(400).json({ message: 'Action blocked: Cannot delete the only remaining administrator.' });
      }
    }

    await User.findByIdAndDelete(targetUserId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};
