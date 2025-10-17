const requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

export default requireAdmin;
