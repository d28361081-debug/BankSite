let currentUser = null;
let currentTheme = 'green'; // Базовая тема при запуске

// Конфигурация неоновых матриц для трех тем
const THEMES = {
    green: {
        color: 0x00ff66,
        emissive: 0x052211,
        particles: 0x00ff66,
        accentColor: '#00ff66',
        glowStyle: 'rgba(0, 255, 102, 0.4)'
    },
    blue: {
        color: 0x00d9ff,
        emissive: 0x001133,
        particles: 0x00d9ff,
        accentColor: '#00d9ff',
        glowStyle: 'rgba(0, 217, 255, 0.4)'
    },
    purple: {
        color: 0xcc00ff,
        emissive: 0x220033,
        particles: 0xff00aa,
        accentColor: '#cc00ff',
        glowStyle: 'rgba(204, 0, 255, 0.4)'
    }
};

// Глобальные ссылки на объекты Three.js для изменения на лету
let earthMesh, earthMaterial, particleMaterial, directionalLight;

// ==========================================
// THREE.JS 3D ENGINE (CINEMATIC PLANET)
// ==========================================
function init3DEngine() {
    const canvas = document.getElementById('cyber-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020208, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const earthGeo = new THREE.SphereGeometry(3, 64, 64);
    
    // Инициализация стартовой темы (Green)
    const initTheme = THEMES[currentTheme];
    earthMaterial = new THREE.MeshPhongMaterial({
        color: initTheme.color,
        emissive: initTheme.emissive,
        wireframe: true,
        shininess: 10
    });
    earthMesh = new THREE.Mesh(earthGeo, earthMaterial);
    scene.add(earthMesh);

    const particlesGeo = new THREE.BufferGeometry();
    const count = 700;
    const positions = new Float32Array(count * 3);

    for(let i=0; i<count*3; i++) {
        positions[i] = (Math.random() - 0.5) * 15;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    particleMaterial = new THREE.PointsMaterial({
        size: 0.04,
        color: initTheme.particles,
        transparent: true,
        opacity: 0.4
    });
    const particleSystem = new THREE.Points(particlesGeo, particleMaterial);
    scene.add(particleSystem);

    directionalLight = new THREE.DirectionalLight(initTheme.color, 1.5);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x0a1520);
    scene.add(ambientLight);

    function animate() {
        requestAnimationFrame(animate);
        if (earthMesh) {
            earthMesh.rotation.y += 0.0015;
            earthMesh.rotation.x += 0.0003;
        }
        if (particleSystem) {
            particleSystem.rotation.y -= 0.0005;
        }
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ==========================================
// МОДУЛЬ СМЕНЫ ТЕМЫ (ПЛАНЕТА, РАМКИ, ИНТЕРФЕЙС)
// ==========================================
function injectThemeSelector(containerId) {
    const parent = document.getElementById(containerId);
    if (!parent || document.getElementById(`theme-switcher-${containerId}`)) return;

    const switcher = document.createElement('div');
    switcher.id = `theme-switcher-${containerId}`;
    switcher.className = 'input-group theme-selector-group';
    switcher.style.margin = '15px 0';
    switcher.innerHTML = `
        <label style="letter-spacing: 2px; font-size: 0.8rem;">VISUAL MATRIX THEME</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
            <button type="button" class="cyber-btn" style="border-color: #00ff66 !important; color: #00ff66; padding: 6px;" onclick="switchSystemTheme('green')">GREEN</button>
            <button type="button" class="cyber-btn" style="border-color: #00d9ff !important; color: #00d9ff; padding: 6px;" onclick="switchSystemTheme('blue')">BLUE</button>
            <button type="button" class="cyber-btn" style="border-color: #cc00ff !important; color: #cc00ff; padding: 6px;" onclick="switchSystemTheme('purple')">PURPLE</button>
        </div>
    `;
    parent.insertBefore(switcher, parent.firstChild);
}

function switchSystemTheme(themeName) {
    if (!THEMES[themeName]) return;
    currentTheme = themeName;
    const config = THEMES[themeName];

    // 1. Перекраска 3D Движка
    if (earthMaterial && particleMaterial && directionalLight) {
        earthMaterial.color.setHex(config.color);
        earthMaterial.emissive.setHex(config.emissive);
        particleMaterial.color.setHex(config.particles);
        directionalLight.color.setHex(config.color);
    }

    // 2. Динамическая перекраска CSS переменных (Рамки, Текст, Свечение)
    document.documentElement.style.setProperty('--neon-green', config.accentColor);
    document.documentElement.style.setProperty('--neon-green-glow', config.glowStyle);
    
    // Перекраска кастомного курсора
    const cursor = document.getElementById('cursor-glow');
    if (cursor) {
        cursor.style.background = `radial-gradient(circle, ${config.glowStyle.replace('0.4', '0.15')} 0%, rgba(0,0,0,0) 70%)`;
    }
}

// ==========================================
// UI INTERACTIONS & VISUALS
// ==========================================
function setupUIEffects() {
    setTimeout(() => {
        const loader = document.getElementById('preloader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 800);
        }
    }, 2000);

    const cursor = document.getElementById('cursor-glow');
    if (cursor) {
        window.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 868) { 
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        });
    }
    
    injectThemeSelector('auth-panel');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if(tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

function showActivePanel(panelId) {
    const allPanels = document.querySelectorAll('.panel');
    allPanels.forEach(panel => {
        panel.classList.remove('active');
        panel.style.setProperty('display', 'none', 'important');
    });

    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('active');
        if (panelId === 'user-dashboard' || panelId === 'admin-dashboard') {
            targetPanel.style.setProperty('display', window.innerWidth <= 868 ? 'flex' : (panelId === 'user-dashboard' ? 'grid' : 'flex'), 'important');
        } else {
            targetPanel.style.setProperty('display', 'block', 'important');
        }
    }
}

// ==========================================
// СТРОГАЯ ЛОГИКА АВТОРИЗАЦИИ И РЕГИСТРАЦИИ
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const repeat = document.getElementById('reg-repeat').value;

    if (pass !== repeat) {
        return alert("SECURITY ERROR: Passwords absolute mismatch.");
    }

    try {
        const { data: existingUser, error: checkError } = await _supabase
            .from('users')
            .select('username')
            .eq('username', user)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            return alert("REGISTRATION FAILED: Username already operational within Net Matrix.");
        }

        const generatedBankId = Math.floor(10000000 + Math.random() * 90000000).toString();

        const { error: insertError } = await _supabase
            .from('users')
            .insert([{ username: user, password_hash: pass, bank_id: generatedBankId, balance: 0.00 }]);

        if (insertError) throw insertError;

        alert(`ACCESS GRANTED. Account registered! Your Core Bank ID is: ${generatedBankId}`);
        switchAuthTab('login');

    } catch (err) {
        console.error(err);
        alert("CRITICAL DATABASE ERROR: Could not process registration.");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;

    if (user === 'admin21') {
        if (pass === 'admin210412') {
            currentUser = { username: 'admin21', bank_id: '99999999', balance: 999999999, is_admin: true, is_banned: false };
            initAdminDashboard();
            return;
        } else {
            return alert("ACCESS DENIED: Invalid encryption credentials.");
        }
    }

    try {
        const { data, error } = await _supabase
            .from('users')
            .select('*')
            .eq('username', user)
            .eq('password_hash', pass)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return alert("ACCESS DENIED: Invalid username or encryption password.");
        }

        if (data.is_banned) {
            return showActivePanel('ban-panel');
        }

        currentUser = data;

        if (data.is_admin === true) {
            initAdminDashboard();
        } else {
            initUserDashboard();
        }

    } catch (err) {
        console.error(err);
        alert("CONNECTION ERROR: Secure database link is offline.");
    }
}

// ==========================================
// USER OPERATIONS & LEDGER (LMT CURRENCY)
// ==========================================
function initUserDashboard() {
    showActivePanel('user-dashboard');
    document.getElementById('user-display-name').innerText = currentUser.username.toUpperCase();
    document.getElementById('user-bank-id').innerText = currentUser.bank_id;
    document.getElementById('user-balance').innerText = `${parseFloat(currentUser.balance).toFixed(2)} LMT`;
    
    injectThemeSelector('user-dashboard');
    loadTransactionHistory();
}

async function loadTransactionHistory() {
    const container = document.getElementById('ledger-history');
    if (!container) return;
    container.innerHTML = '';

    try {
        const { data, error } = await _supabase
            .from('transactions')
            .select('*')
            .or(`sender_id.eq.${currentUser.bank_id},receiver_id.eq.${currentUser.bank_id}`)
            .order('timestamp', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#64748b; text-align:center; margin-top:20px;">NO TRANSACTIONS DETECTED</p>';
            return;
        }

        data.forEach(tx => {
            const isIncoming = tx.receiver_id === currentUser.bank_id;
            const item = document.createElement('div');
            item.className = `ledger-item ${isIncoming ? 'incoming' : 'outgoing'}`;
            item.innerHTML = `
                <div>
                    <p style="font-weight:700;">${isIncoming ? '← NET_INFLOW' : '→ NET_OUTFLOW'}</p>
                    <small style="color:#64748b;">${isIncoming ? 'From: ' + tx.sender_id : 'To: ' + tx.receiver_id}</small>
                </div>
                <span style="font-family:'Orbitron'; font-weight:700; color: ${isIncoming ? 'var(--neon-green)' : 'var(--neon-red)'}">
                    ${isIncoming ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} LMT
                </span>
            `;
            container.appendChild(item);
        });
    } catch (e) {
        container.innerHTML = '<p style="color:#64748b; text-align:center; margin-top:20px;">ERROR LOADING LEDGER</p>';
    }
}

async function handleTransfer(e) {
    e.preventDefault();
    const destId = document.getElementById('transfer-id').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);

    if (destId === currentUser.bank_id) {
        return alert("ERROR: Cannot loop transactions back into self node.");
    }
    if (amount > currentUser.balance) {
        return alert("QUANTUM REFUSAL: Insufficient balance credits.");
    }

    try {
        const { data: receiver, error: rErr } = await _supabase
            .from('users')
            .select('*')
            .eq('bank_id', destId)
            .maybeSingle();

        if (rErr || !receiver) {
            return alert("NODE NOT FOUND: Targeted Bank ID does not exist in Network.");
        }

        const newSenderBal = parseFloat(currentUser.balance) - amount;
        const newRecBal = parseFloat(receiver.balance) + amount;

        await _supabase.from('users').update({ balance: newSenderBal }).eq('id', currentUser.id);
        await _supabase.from('users').update({ balance: newRecBal }).eq('id', receiver.id);
        
        await _supabase.from('transactions').insert([
            { sender_id: currentUser.bank_id, receiver_id: destId, amount: amount }
        ]);

        currentUser.balance = newSenderBal;
        alert("CREDIT TRANSFER EXECUTED SUCCESSFULLY.");
        initUserDashboard();
    } catch (err) {
        alert("TRANSACTION ERROR: Server rejected the transfer block.");
    }
}

// ==========================================
// ADMIN CONTROL MATRIX & ACCOUNT DELETION
// ==========================================
async function initAdminDashboard() {
    showActivePanel('admin-dashboard');
    const tbody = document.getElementById('admin-user-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    injectThemeSelector('admin-dashboard');

    try {
        const { data: users, error } = await _supabase.from('users').select('*');
        if (error || !users) return;
        
        users.forEach(u => {
            if(u.is_admin) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.username}</td>
                <td style="font-family:'Orbitron';">${u.bank_id}</td>
                <td style="color:var(--neon-green); font-weight:bold;">${parseFloat(u.balance).toFixed(2)} LMT</td>
                <td style="color: ${u.is_banned ? 'var(--neon-red)' : 'var(--neon-green)'}">${u.is_banned ? 'BANNED' : 'OPERATIONAL'}</td>
                <td style="text-align: center;">
                    <button class="cyber-btn red-glow" style="padding: 4px 10px; font-size: 0.75rem; width: auto;" onclick="purgeUserAccount('${u.bank_id}', '${u.username}')">PURGE</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Failed to load admin user matrix.");
    }
}

async function executeAdminAction(action) {
    const targetId = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value) || 0;

    if(!targetId) return alert("ADMIN SPECIFICATION ERROR: Target ID required.");

    try {
        const { data: targetUser, error } = await _supabase.from('users').select('*').eq('bank_id', targetId).maybeSingle();
        if(error || !targetUser) {
            return alert("TARGET NODE INVALID: User not found.");
        }

        if (action === 'give' && amount > 0) {
            await _supabase.from('users').update({ balance: parseFloat(targetUser.balance) + amount }).eq('bank_id', targetId);
        } else if (action === 'remove' && amount > 0) {
            let bal = Math.max(0, parseFloat(targetUser.balance) - amount);
            await _supabase.from('users').update({ balance: bal }).eq('bank_id', targetId);
        } else if (action === 'ban') {
            await _supabase.from('users').update({ is_banned: true }).eq('bank_id', targetId);
        } else if (action === 'unban') {
            await _supabase.from('users').update({ is_banned: false }).eq('bank_id', targetId);
        }

        alert(`ADMIN ACTION [${action.toUpperCase()}] ENGAGED ON NODE ${targetId}`);
        initAdminDashboard();
    } catch (err) {
        alert("ADMIN ACTION REFUSED BY DATABASE.");
    }
}

async function purgeUserAccount(bankId, username) {
    const accessConfirm = confirm(`CRITICAL ATTEMPT: Are you sure you want to completely PURGE "${username}" (ID: ${bankId}) from the Core Mainframe? All data will be destroyed.`);
    if (!accessConfirm) return;

    try {
        const { error } = await _supabase
            .from('users')
            .delete()
            .eq('bank_id', bankId);

        if (error) throw error;

        alert(`SUCCESFULLY PURGED: Node ${bankId} dropped from network.`);
        initAdminDashboard();
    } catch (err) {
        console.error(err);
        alert("DATABASE REFUSAL: Failed to delete user node.");
    }
}

function logout() {
    currentUser = null;
    showActivePanel('auth-panel');
}

window.addEventListener('resize', () => {
    const activePanel = document.querySelector('.panel.active');
    if (activePanel) {
        showActivePanel(activePanel.id);
    }
});

window.onload = () => {
    init3DEngine();
    setupUIEffects();
    showActivePanel('auth-panel');
};
