require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const CONTENT_FILE = path.join(__dirname, 'data', 'content.json');

// ============ TƏHLÜKƏSİZLİK ============
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const sessions = new Map();

function generateSessionToken() {
    return crypto.randomBytes(64).toString('hex');
}

function requireAuth(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const session = sessions.get(token);
    if (Date.now() - session.createdAt > 3600000) {
        sessions.delete(token);
        return res.status(401).json({ error: 'Session vaxtı bitmişdir' });
    }
    
    session.createdAt = Date.now();
    sessions.set(token, session);
    next();
}

// Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        const token = generateSessionToken();
        sessions.set(token, { createdAt: Date.now() });
        res.json({ success: true, token: token });
    } else {
        res.status(401).json({ success: false, error: 'Şifrə yanlışdır!' });
    }
});

app.post('/api/logout', requireAuth, (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    sessions.delete(token);
    res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (token && sessions.has(token)) {
        return res.json({ isAdmin: true });
    }
    res.json({ isAdmin: false });
});

// ============ FAYL ƏMƏLİYYATLARI ============
function readContent() {
    try {
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        if (!fs.existsSync(CONTENT_FILE)) {
            const defaultContent = {
                experience: [],
                education: [],
                projects: [],
                skills: { items: [], featuredCount: 6 },
                certificates: [],
                hero: { name: { az: '', en: '', tr: '' }, title: { az: '', en: '', tr: '' }, intro: { az: '', en: '', tr: '' } },
                ui: { az: {}, en: {}, tr: {} },
                deletedItems: []
            };
            fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf8');
            return defaultContent;
        }
        
        const data = fs.readFileSync(CONTENT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Fayl oxunarkən xəta:', error);
        return null;
    }
}

function writeContent(data) {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Fayl yazılarkən xəta:', error);
        return false;
    }
}

// ============ SOFT DELETE FUNKSİYALARI ============

// Soft delete - məlumatı deletedItems-a köçür
function softDeleteItem(section, id) {
    const content = readContent();
    if (!content) return false;
    
    const items = content[section];
    if (!items) return false;
    
    // Əgər items array deyilsə (skills kimi), onun items propertysini yoxla
    let itemsArray = items;
    let isSkillsSection = false;
    
    if (section === 'skills' && items.items) {
        itemsArray = items.items;
        isSkillsSection = true;
    }
    
    if (!Array.isArray(itemsArray)) return false;
    
    const index = itemsArray.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    const deletedItem = JSON.parse(JSON.stringify(itemsArray[index]));
    deletedItem.deletedAt = new Date().toISOString();
    deletedItem.originalSection = section;
    
    if (!content.deletedItems) content.deletedItems = [];
    content.deletedItems.push(deletedItem);
    
    // Məlumatı əsas array-dən sil
    if (isSkillsSection) {
        content[section].items.splice(index, 1);
    } else {
        content[section].splice(index, 1);
    }
    
    return writeContent(content);
}

// RESTORE - DÜZGÜN İŞLƏYƏN VERSİYA
function restoreItem(section, id) {
    const content = readContent();
    if (!content) return false;
    
    if (!content.deletedItems || content.deletedItems.length === 0) return false;
    
    // Silinmiş məlumatı tap
    const deletedIndex = content.deletedItems.findIndex(item => item.id === id && item.originalSection === section);
    
    if (deletedIndex === -1) return false;
    
    // Məlumatı klonla
    const restoredItem = JSON.parse(JSON.stringify(content.deletedItems[deletedIndex]));
    
    // Əlavə field-ləri sil
    delete restoredItem.deletedAt;
    delete restoredItem.originalSection;
    
    // Əsas bölməyə əlavə et
    if (!content[section]) {
        content[section] = [];
    }
    
    // SKILLS xüsusi handling
    if (section === 'skills') {
        if (!content.skills.items) content.skills.items = [];
        content.skills.items.push(restoredItem);
    } 
    // CERTIFICATES handling
    else if (section === 'certificates') {
        if (!content.certificates) content.certificates = [];
        content.certificates.push(restoredItem);
    }
    // EXPERIENCE, EDUCATION, PROJECTS
    else if (Array.isArray(content[section])) {
        content[section].push(restoredItem);
    } 
    else {
        // Əgər array deyilsə, array yarat
        content[section] = [restoredItem];
    }
    
    // Silinmişlər siyahısından çıxar
    content.deletedItems.splice(deletedIndex, 1);
    
    return writeContent(content);
}

// Hard delete - tamamilə sil
function hardDeleteItem(section, id) {
    const content = readContent();
    if (!content) return false;
    
    // Əvvəlcə deletedItems-da axtar
    if (content.deletedItems) {
        const delIndex = content.deletedItems.findIndex(item => item.id === id && item.originalSection === section);
        if (delIndex !== -1) {
            content.deletedItems.splice(delIndex, 1);
            return writeContent(content);
        }
    }
    
    // Aktiv məlumatlardadırsa
    const items = content[section];
    if (items) {
        if (section === 'skills' && items.items) {
            const index = items.items.findIndex(i => i.id === id);
            if (index !== -1) {
                items.items.splice(index, 1);
                return writeContent(content);
            }
        } else if (Array.isArray(items)) {
            const index = items.findIndex(i => i.id === id);
            if (index !== -1) {
                items.splice(index, 1);
                return writeContent(content);
            }
        }
    }
    
    return false;
}

// ============ API ENDPOINTS ============

// İctimai - məlumatları oxu
app.get('/api/content', (req, res) => {
    const content = readContent();
    if (content) {
        res.json(content);
    } else {
        res.status(500).json({ error: 'Məlumat oxunmadı' });
    }
});

// Qorunan endpointlər
app.get('/api/deleted-items', requireAuth, (req, res) => {
    const content = readContent();
    res.json(content.deletedItems || []);
});

// RESTORE - BƏRPA ET
app.post('/api/restore/:section/:id', requireAuth, (req, res) => {
    const { section, id } = req.params;
    console.log(`Restore: ${section} / ${id}`);
    
    try {
        const success = restoreItem(section, id);
        
        if (success) {
            res.json({ success: true, message: 'Məlumat bərpa edildi' });
        } else {
            res.status(404).json({ error: 'Məlumat tapılmadı' });
        }
    } catch (error) {
        console.error('Restore xətası:', error);
        res.status(500).json({ error: 'Server xətası: ' + error.message });
    }
});

// Hard delete
app.delete('/api/hard-delete/:section/:id', requireAuth, (req, res) => {
    const { section, id } = req.params;
    const success = hardDeleteItem(section, id);
    
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Silinmədi' });
    }
});

// ============ EXPERIENCE CRUD ============
app.post('/api/experience', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const newItem = { 
        ...req.body, 
        id: req.body.id || `exp_${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    if (!content.experience) content.experience = [];
    content.experience.push(newItem);
    
    if (writeContent(content)) {
        res.json({ success: true, item: newItem });
    } else {
        res.status(500).json({ error: 'Əlavə edilmədi' });
    }
});

app.put('/api/experience/:id', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const index = content.experience.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Tapılmadı' });
    
    content.experience[index] = { ...content.experience[index], ...req.body };
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.delete('/api/experience/:id', requireAuth, (req, res) => {
    const success = softDeleteItem('experience', req.params.id);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Silinmədi' });
    }
});

// ============ EDUCATION CRUD ============
app.post('/api/education', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const newItem = { ...req.body, id: req.body.id || `edu_${Date.now()}` };
    if (!content.education) content.education = [];
    content.education.push(newItem);
    
    if (writeContent(content)) {
        res.json({ success: true, item: newItem });
    } else {
        res.status(500).json({ error: 'Əlavə edilmədi' });
    }
});

app.put('/api/education/:id', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const index = content.education.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Tapılmadı' });
    
    content.education[index] = { ...content.education[index], ...req.body };
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.delete('/api/education/:id', requireAuth, (req, res) => {
    const success = softDeleteItem('education', req.params.id);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Silinmədi' });
    }
});

// ============ PROJECTS CRUD ============
app.post('/api/projects', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const newItem = { ...req.body, id: req.body.id || `proj_${Date.now()}` };
    if (!content.projects) content.projects = [];
    content.projects.push(newItem);
    
    if (writeContent(content)) {
        res.json({ success: true, item: newItem });
    } else {
        res.status(500).json({ error: 'Əlavə edilmədi' });
    }
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const index = content.projects.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Tapılmadı' });
    
    content.projects[index] = { ...content.projects[index], ...req.body };
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
    const success = softDeleteItem('projects', req.params.id);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Silinmədi' });
    }
});

// ============ CERTIFICATES CRUD ============
app.post('/api/certificates', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const newItem = { ...req.body, id: req.body.id || `cert_${Date.now()}` };
    if (!content.certificates) content.certificates = [];
    content.certificates.push(newItem);
    
    if (writeContent(content)) {
        res.json({ success: true, item: newItem });
    } else {
        res.status(500).json({ error: 'Əlavə edilmədi' });
    }
});

app.put('/api/certificates/:id', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    const index = content.certificates.findIndex(i => i.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Tapılmadı' });
    
    content.certificates[index] = { ...content.certificates[index], ...req.body };
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.delete('/api/certificates/:id', requireAuth, (req, res) => {
    const success = softDeleteItem('certificates', req.params.id);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Silinmədi' });
    }
});

// ============ SKILLS ============
app.get('/api/skills', (req, res) => {
    const content = readContent();
    res.json(content.skills || { items: [], featuredCount: 6 });
});

app.put('/api/skills', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    content.skills = req.body;
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.delete('/api/skills/:id', requireAuth, (req, res) => {
    const success = softDeleteItem('skills', req.params.id);
    if (success) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Silinmədi' });
    }
});

// ============ HERO & UI ============
app.put('/api/hero', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    content.hero = req.body;
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.put('/api/ui', requireAuth, (req, res) => {
    const content = readContent();
    if (!content) return res.status(500).json({ error: 'Fayl oxunmadı' });
    
    content.ui = req.body;
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Yenilənmədi' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server ${PORT} portunda çalışır`);
    console.log(`🔒 Admin panel: http://localhost:${PORT}/admin.html`);
});