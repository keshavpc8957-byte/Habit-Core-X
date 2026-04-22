const state = {
    theme: 'modern-blue',
    font: "'Outfit', sans-serif",
    logo: '',
    heroBg: '',
    name: 'Business Name',
    tagline: 'Empowering your growth with cutting-edge expertise.',
    btnText: 'Contact Us Now',
    aboutTitle: 'About Us',
    aboutContent: 'We are a results-driven team committed to delivering excellence. Our background spans over a decade of industry-leading innovation and client success.',
    services: [
        { name: 'Web Development', desc: 'Custom, responsive websites built with modern technologies.' },
        { name: 'Digital Growth', desc: 'Strategic marketing to expand your online presence.' }
    ],
    phone: '+91 999 000 1111',
    whatsapp: '919990001111',
    address: '123 Tech Square, Silicon Valley, Bengaluru',
    copyright: '© 2026 Your Brand. All rights reserved.',
    gallery: []
};

const dom = {
    previewFrame: document.getElementById('preview-frame'),
    downloadTrigger: document.getElementById('download-trigger'),
    addServiceBtn: document.getElementById('add-service-btn'),
    servicesListAdmin: document.getElementById('services-list-admin')
};

// --- Initialization ---
function init() {
    loadState();
    setupAccordions();
    setupResponsiveView();
    setupInputs();
    setupImageHandlers();
    
    // Initial renders
    syncInputsFromState();
    renderGalleryThumbs();
    renderServicesAdmin();
    updatePreview();
}

// --- Persistence ---
function saveState() {
    localStorage.setItem('webgen_state_free', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('webgen_state_free');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        } catch (e) {
            console.error("Failed to parse saved state", e);
        }
    }
}

// --- Accordion Logic ---
function setupAccordions() {
    const panels = document.querySelectorAll('.panel-item');
    panels.forEach(panel => {
        panel.querySelector('.panel-trigger').addEventListener('click', () => {
            const isOpen = panel.classList.contains('open');
            panel.classList.toggle('open', !isOpen);
        });
    });
    panels[0].classList.add('open');
}


// --- Inputs Sync ---
function setupInputs() {
    const mapping = {
        'input-name': 'name',
        'input-tagline': 'tagline',
        'input-btn-text': 'btnText',
        'input-about-title': 'aboutTitle',
        'input-about-content': 'aboutContent',
        'input-phone': 'phone',
        'input-whatsapp': 'whatsapp',
        'input-address': 'address',
        'input-copyright': 'copyright'
    };

    Object.entries(mapping).forEach(([id, stateKey]) => {
        const input = document.getElementById(id);
        input.addEventListener('input', (e) => {
            state[stateKey] = e.target.value;
            saveState();
            updatePreview();
        });
    });

    document.getElementsByName('theme').forEach(radio => {
        if (radio.value === state.theme) radio.checked = true;
        radio.addEventListener('change', (e) => {
            state.theme = e.target.value;
            saveState();
            updatePreview();
        });
    });

    const fontSelect = document.getElementById('font-family');
    fontSelect.value = state.font;
    fontSelect.addEventListener('change', (e) => {
        state.font = e.target.value;
        saveState();
        updatePreview();
    });

    if (dom.addServiceBtn) {
        dom.addServiceBtn.addEventListener('click', () => {
            state.services.push({ name: 'New Service', desc: 'Service description goes here.' });
            saveState();
            renderServicesAdmin();
            updatePreview();
        });
    }
}

function syncInputsFromState() {
    document.getElementById('input-name').value = state.name;
    document.getElementById('input-tagline').value = state.tagline;
    document.getElementById('input-btn-text').value = state.btnText;
    document.getElementById('input-about-title').value = state.aboutTitle;
    document.getElementById('input-about-content').value = state.aboutContent;
    document.getElementById('input-phone').value = state.phone;
    document.getElementById('input-whatsapp').value = state.whatsapp;
    document.getElementById('input-address').value = state.address;
    document.getElementById('input-copyright').value = state.copyright;
}

// --- Services Manager ---
function renderServicesAdmin() {
    dom.servicesListAdmin.innerHTML = '';
    state.services.forEach((service, index) => {
        const div = document.createElement('div');
        div.className = 'admin-service-item';
        div.innerHTML = `
            <input type="text" value="${service.name}" placeholder="Service Title" oninput="updateService(${index}, 'name', this.value)">
            <textarea placeholder="Description" oninput="updateService(${index}, 'desc', this.value)">${service.desc}</textarea>
            <div class="admin-service-controls">
                <button type="button" class="btn-icon" onclick="moveService(${index}, -1)" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                <button type="button" class="btn-icon" onclick="moveService(${index}, 1)" ${index === state.services.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                <button type="button" class="btn-icon" onclick="deleteService(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        dom.servicesListAdmin.appendChild(div);
    });
}

window.updateService = (index, key, value) => {
    state.services[index][key] = value;
    saveState();
    updatePreview();
};

window.deleteService = (index) => {
    if (state.services.length <= 1) return;
    state.services.splice(index, 1);
    saveState();
    renderServicesAdmin();
    updatePreview();
};

window.moveService = (index, dir) => {
    const newIdx = index + dir;
    if (newIdx >= 0 && newIdx < state.services.length) {
        [state.services[index], state.services[newIdx]] = [state.services[newIdx], state.services[index]];
        saveState();
        renderServicesAdmin();
        updatePreview();
    }
};

// --- Image Handlers ---
function setupImageHandlers() {
    document.getElementById('logo-upload').addEventListener('change', async e => {
        state.logo = await toBase64(e.target.files[0]);
        saveState();
        updatePreview();
    });
    document.getElementById('hero-bg-upload').addEventListener('change', async e => {
        state.heroBg = await toBase64(e.target.files[0]);
        saveState();
        updatePreview();
    });
    document.getElementById('gallery-upload').addEventListener('change', async e => {
        const files = Array.from(e.target.files);
        for (let f of files) state.gallery.push(await toBase64(f));
        saveState();
        renderGalleryThumbs();
        updatePreview();
    });
}

function renderGalleryThumbs() {
    const container = document.getElementById('gallery-thumbs');
    if (!container) return;
    container.innerHTML = state.gallery.map((img, i) => `
        <div class="thumb-item">
            <img src="${img}">
            <button type="button" class="thumb-remove" onclick="removeGalleryImg(${i})">×</button>
        </div>
    `).join('');
}

window.removeGalleryImg = (i) => {
    state.gallery.splice(i, 1);
    saveState();
    renderGalleryThumbs();
    updatePreview();
};

function toBase64(file) {
    if (!file) return '';
    return new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
    });
}

// --- Preview View Controls ---
function setupResponsiveView() {
    const dBtn = document.getElementById('view-desktop');
    const mBtn = document.getElementById('view-mobile');
    dBtn.addEventListener('click', () => {
        dom.previewFrame.classList.remove('mobile');
        dBtn.classList.add('active');
        mBtn.classList.remove('active');
    });
    mBtn.addEventListener('click', () => {
        dom.previewFrame.classList.add('mobile');
        mBtn.classList.add('active');
        dBtn.classList.remove('active');
    });
}

// --- Preview Generation ---
function updatePreview() {
    const cp = {
        'modern-blue': { p: '#2563eb', s: '#eff6ff', a: '#1d4ed8', t: '#0f172a' },
        'forest-green': { p: '#059669', s: '#ecfdf5', a: '#047857', t: '#064e3b' },
        'royal-purple': { p: '#7c3aed', s: '#f5f3ff', a: '#6d28d9', t: '#2e1065' },
        'midnight-dark': { p: '#334155', s: '#f8fafc', a: '#1e293b', t: '#0f172a' }
    }[state.theme] || { p: '#2563eb', s: '#eff6ff', a: '#1d4ed8', t: '#0f172a' };

    const style = `
        :root { --p: ${cp.p}; --s: ${cp.s}; --a: ${cp.a}; --t: ${cp.t}; --font: ${state.font}; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--font); color: var(--t); line-height: 1.6; background: #fff; overflow-x: hidden; scroll-behavior: smooth; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        header { background: #fff; padding: 18px 0; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 1000; }
        nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { display:flex; align-items:center; gap:12px; font-weight:800; font-size:1.5rem; color:var(--p); text-decoration:none; }
        .logo img { height: 40px; border-radius: 6px; }
        .nav-links { display: flex; gap: 30px; }
        .nav-links a { text-decoration: none; color: var(--t); font-weight: 600; font-size: 0.95rem; }
        section { padding: 100px 0; }
        .hero { 
            text-align: center; background: var(--s); padding: 160px 0; 
            ${state.heroBg ? `background-image: linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${state.heroBg}); background-size: cover; background-position: center;` : ''}
        }
        .hero h1 { font-size: 4rem; margin-bottom: 15px; font-weight: 800; line-height: 1.1; }
        .hero p { font-size: 1.25rem; opacity: 0.8; max-width: 700px; margin: 0 auto 40px; }
        .btn { display: inline-block; background: var(--p); color: #fff; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; transition: 0.3s; }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        h2 { font-size: 2.5rem; text-align: center; margin-bottom: 60px; font-weight: 800; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .card { background: #fff; padding: 40px; border-radius: 24px; border: 1px solid #eee; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.02); }
        .card h3 { font-size: 1.5rem; margin-bottom: 10px; color: var(--p); }
        .gal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .gal-item { border-radius: 20px; overflow: hidden; aspect-ratio: 4/3; }
        .gal-item img { width: 100%; height: 100%; object-fit: cover; }
        .contact-box { background: var(--s); padding: 70px 40px; border-radius: 40px; text-align: center; }
        .floating-wa { position: fixed; bottom: 30px; right: 30px; background: #25d366; color: #fff; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; box-shadow: 0 10px 30px rgba(37,211,102,0.3); z-index: 1000; text-decoration: none; }
        footer { padding: 90px 0; background: #0f172a; color: #94a3b8; text-align: center; border-radius: 60px 60px 0 0; margin-top: -60px; position: relative; }
        footer h4 { color: #fff; margin-bottom: 20px; font-size: 1.8rem; }
        [contenteditable]:focus { outline: 2px dashed var(--p); outline-offset: 4px; border-radius: 4px; }
        @media (max-width: 768px) { .hero h1 { font-size: 2.8rem; } .nav-links { display: none; } }
    `;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${style}</style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;600&display=swap" rel="stylesheet">
        </head>
        <body>
            <header><div class="container"><nav>
                <a href="#hero" class="logo">${state.logo ? `<img src="${state.logo}">` : ''} <span id="ed-name" contenteditable="true">${state.name}</span></a>
                <div class="nav-links"><a href="#about">About</a><a href="#services">Services</a><a href="#contact">Contact</a></div>
            </nav></div></header>
            <section id="hero" class="hero"><div class="container">
                <h1 id="ed-tag-line" contenteditable="true">${state.tagline}</h1>
                <p style="margin-bottom: 40px;">Professional services tailored to your unique business needs.</p>
                <a href="tel:${state.phone}" class="btn" id="ed-btn-text" contenteditable="true">${state.btnText}</a>
            </div></section>
            <section id="about"><div class="container">
                <h2 id="ed-about-title" contenteditable="true">${state.aboutTitle}</h2>
                <p id="ed-about-content" contenteditable="true" style="max-width:800px; margin:0 auto; text-align:center; font-size:1.15rem; color:#475569;">${state.aboutContent}</p>
            </div></section>
            <section id="services"><div class="container"><h2>Our Services</h2><div class="grid">${state.services.map((s) => `<div class="card"><h3>${s.name}</h3><p>${s.desc}</p></div>`).join('')}</div></div></section>
            ${state.gallery.length > 0 ? `<section id="gallery"><div class="container"><h2>Our Work</h2><div class="gal-grid">${state.gallery.map(img => `<div class="gal-item"><img src="${img}"></div>`).join('')}</div></div></section>` : ''}
            <section id="contact"><div class="container"><div class="contact-box">
                <h2>Ready to get started?</h2>
                <p id="ed-address" contenteditable="true" style="margin-bottom:40px; font-size:1.2rem; color:#475569;">${state.address}</p>
                <div style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap;"><a href="tel:${state.phone}" class="btn" style="background:var(--t)">Call Now</a><a href="https://wa.me/${state.whatsapp}" class="btn" style="background:#25d366">WhatsApp</a></div>
            </div></div></section>
            <footer><div class="container"><h4>${state.name}</h4><p>${state.phone} | ${state.address}</p><p id="ed-copyright" contenteditable="true" style="margin-top:20px; font-size:0.9rem; opacity:0.6;">${state.copyright}</p></div></footer>
            <a href="https://wa.me/${state.whatsapp}" target="_blank" class="floating-wa"><i class="fab fa-whatsapp"></i></a>
            <script>
                const ids = ['ed-name', 'ed-tag-line', 'ed-btn-text', 'ed-about-title', 'ed-about-content', 'ed-address', 'ed-copyright'];
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if(el) el.addEventListener('input', () => window.parent.postMessage({ id, content: el.innerText }, '*'));
                });
            </script>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    dom.previewFrame.src = URL.createObjectURL(blob);
}

// Sync back logic
window.addEventListener('message', e => {
    const { id, content } = e.data;
    const mapping = { 'ed-name': 'name', 'ed-tag-line': 'tagline', 'ed-btn-text': 'btnText', 'ed-about-title': 'aboutTitle', 'ed-about-content': 'aboutContent', 'ed-address': 'address', 'ed-copyright': 'copyright' };
    if (mapping[id]) {
        state[mapping[id]] = content;
        saveState();
        syncInputsFromState();
    }
});

// --- Direct Download (Free) ---
dom.downloadTrigger.addEventListener('click', async () => {
    finalizeDownload();
});


async function finalizeDownload() {

    const frameDoc = dom.previewFrame.contentDocument || dom.previewFrame.contentWindow.document;
    const clone = frameDoc.documentElement.cloneNode(true);
    
    // Cleanup preview-specific scripts and attributes
    const script = clone.querySelector('script');
    if (script) script.remove();
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));

    const finalHtml = `<!DOCTYPE html>\n<html>\n${clone.innerHTML}\n</html>`;

    // Visual feedback
    dom.downloadTrigger.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating ZIP...`;

    try {
        // Initialize JSZip
        const zip = new JSZip();
        const folderName = state.name.replace(/\s+/g, '_') || 'my_website';
        
        // Add index.html to ZIP
        zip.file("index.html", finalHtml);
        
        // Add a basic README
        zip.file("README.txt", `Website generated by WebGenFree\nProject Name: ${state.name}\n\nTo host this website:\n1. Upload the files to any static host (GitHub Pages, Netlify, etc.)\n2. Open index.html in any browser to view.`);

        // Generate the ZIP file
        const content = await zip.generateAsync({ type: "blob" });
        
        // Create download link and trigger it
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `${folderName}_website.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        // Success cleanup
        alert("Your website is ready. Click download to get your files.");
        dom.downloadTrigger.innerHTML = `<i class="fas fa-cloud-download-alt"></i> Download Website`;

    } catch (err) {
        console.error("ZIP Generation Error:", err);
        alert('Failed to generate ZIP. Please try again.');
        dom.downloadTrigger.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Retry Download`;
    }
}

init();
