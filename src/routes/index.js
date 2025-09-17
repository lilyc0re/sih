const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// In-memory store (mock)
const users = new Map();
const comments = [];
const articles = [
  { id: 'a1', title: 'Pay and View MTNL Landline Bills, Delhi', content: 'MTNL announces to Delhi circle users...'},
  { id: 'a2', title: 'Search Electronic Indian Postal Order details online', content: 'Service under the Ministry...'}
];

const JWT_SECRET = 'dev-secret';

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

router.get('/', (req, res) => {
  res.redirect('/dashboard');
});

router.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.user, articles, comments });
});

router.get('/analytics', requireAuth, (req, res) => {
  res.render('analytics', { user: req.user, articles, comments });
});

router.get('/article/:id', requireAuth, (req, res) => {
  const article = articles.find(a => a.id === req.params.id) || articles[0];
  res.render('article', { user: req.user, article, comments });
});

router.get('/upload-comment', requireAuth, (req, res) => {
  res.render('upload_comment', { user: req.user, submitted: false });
});

router.post('/upload-comment', requireAuth, (req, res) => {
  const { name, category, comment, articleId } = req.body;
  comments.push({ id: comments.length + 1, name, category, comment, articleId, date: new Date() });
  res.render('upload_comment', { user: req.user, submitted: true });
});

router.get('/my-comments', requireAuth, (req, res) => {
  res.render('my_comments', { user: req.user, comments });
});

router.get('/settings', requireAuth, (req, res) => {
  res.render('settings', { user: req.user });
});

// Auth
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
  if (!user) return res.render('login', { error: 'Invalid credentials' });
  const token = jwt.sign({ _id: user.id, name: user.name, email: user.email, role: 'user' }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/dashboard');
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.post('/signup', (req, res) => {
  const { name, email, phone, username, password } = req.body;
  const id = String(users.size + 1);
  users.set(id, { id, name, email, phone, username, password });
  const token = jwt.sign({ _id: id, name, email, role: 'user' }, JWT_SECRET);
  res.cookie('token', token, { httpOnly: true });
  res.redirect('/dashboard');
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

router.get('/success', requireAuth, (req, res) => {
  res.render('success', { user: req.user });
});

// Upload Docs UI + pipeline following frames
router.get('/upload-docs', requireAuth, (req, res) => {
  res.render('upload_docs', { user: req.user, error: null });
});

router.post('/upload-docs', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.render('upload_docs', { user: req.user, error: 'Please choose a CSV file.' });
  }
  try {
    const token = req.cookies.token;
    // 1) upload_docs
    const r1 = await fetch(`${req.protocol}://${req.get('host')}/api/upload_docs`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: (() => {
        const form = new (require('form-data'))();
        form.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });
        return form;
      })()
    });
    const j1 = await r1.json();
    const docId = j1.docId;
    // 2) sentiment-analysis-docs
    await fetch(`${req.protocol}://${req.get('host')}/api/sentiment-analysis-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: { token },
        task: 'sentiment_analysis',
        params: { docIds: [docId], options: { granularity: 'sentence', returnScores: true } }
      })
    });
    // 3) report-gen-docs
    await fetch(`${req.protocol}://${req.get('host')}/api/report-gen-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: { token },
        task: 'report_generation',
        params: { analysisResults: [], options: { outputFormat: 'markdown', includeSummary: true, detailLevel: 'medium', audience: 'internal_team' } }
      })
    });
    return res.redirect('/success');
  } catch (e) {
    return res.render('upload_docs', { user: req.user, error: 'Pipeline failed.' });
  }
});

// Comments analysis UI
router.get('/sentiment-analysis-comments', requireAuth, (req, res) => {
  res.render('sentiment_analysis_comments', { user: req.user, result: null });
});

router.post('/sentiment-analysis-comments', requireAuth, async (req, res) => {
  const { comments: text } = req.body;
  const list = (text || '').split('\n').map(s => s.trim()).filter(Boolean);
  try {
    const token = req.cookies.token;
    const r = await fetch(`${req.protocol}://${req.get('host')}/api/sentiment-analysis-comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: { token },
        task: 'sentiment_analysis_comments',
        params: { comments: list, options: { granularity: 'comment', returnScores: true } }
      })
    });
    const j = await r.json();
    res.render('sentiment_analysis_comments', { user: req.user, result: j.data });
  } catch (e) {
    res.render('sentiment_analysis_comments', { user: req.user, result: [] });
  }
});

// Word cloud placeholder
router.get('/word-cloud', requireAuth, (req, res) => {
  res.render('word_cloud', { user: req.user });
});

module.exports = router;



