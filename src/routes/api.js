const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Mock stores
const docs = new Map();

function authFromHeader(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.decode(token) || { _id: 'u1', name: 'User', email: 'user@example.com' };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// POST /api/upload_docs
router.post('/upload_docs', authFromHeader, upload.single('file'), (req, res) => {
  const id = uuidv4();
  docs.set(id, { id, name: req.file?.originalname || 'data.csv', content: req.file?.buffer || Buffer.from('') });
  return res.json({ task: true, docId: id });
});

// POST /api/sentiment-analysis-docs
router.post('/sentiment-analysis-docs', (req, res) => {
  // Echo back structure with fake scores
  const { params } = req.body || {};
  const result = (params?.docIds || []).map((docId) => ({ docId, sentiment: 'neutral', confidence: 0.7 }));
  res.json({ success: true, data: result });
});

// POST /api/report-gen-docs
router.post('/report-gen-docs', (req, res) => {
  // Pretend to create a report and return a link/id
  const reportId = uuidv4();
  res.json({ success: true, reportId, url: `/api/report/${reportId}` });
});

// POST /api/sentiment-analysis-comments
router.post('/sentiment-analysis-comments', (req, res) => {
  const { params } = req.body || {};
  const result = (params?.comments || []).map((comment, idx) => ({
    commentId: idx + 1,
    comment,
    sentiment: comment.toLowerCase().includes('frustrating') ? 'negative' : 'positive',
    confidence: 0.9
  }));
  res.json({ success: true, data: result });
});

module.exports = router;



