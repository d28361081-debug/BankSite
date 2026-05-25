let currentUser = null;
let particleSystem = null; 
let earth = null;       
let dirLight = null;    

// ==========================================
// THREE.JS 3D ENGINE
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
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x0a1128,
        emissive: 0x052211,
        wireframe: true,
        shininess: 10
    });
    earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    const particlesGeo = new THREE.BufferGeometry();
    const count = 700;
    const positions = new Float32Array(count * 3);

    for(let i=0; i<count*3; i++) {
        positions[i] = (Math.random() - 0.5) * 15;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMat = new THREE.PointsMaterial({
        size: 0.04,
        color: 0x00ff66, 
        transparent: true,
        opacity: 0.4
    });
    particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    dirLight = new THREE.DirectionalLight(0x00ff66, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x0a1520);
    scene.add(ambientLight);

    function animate() {
        requestAnimationFrame(animate);
        if (earth) {
            earth.rotation.y += 0.0015;
            earth.rotation.x += 0.0003;
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
// NOTIFICATIONS MATRIX
// ==========================================
function showCyberAlert(type, title, message) {
    const zone = document.getElementById('cyber-notification-zone');
    if (!zone) return;

    const alertBox = document.createElement('div');
    alertBox.className = `cyber-alert ${type === 'success' ? 'cyber-alert-success' : 'cyber-alert-error'}`;
    
    alertBox.innerHTML = `
        <div class="alert-title">// ${title.toUpperCase()}</div>
        <div class="alert-desc">${message}</div>
    `;

    zone.appendChild(alertBox);

    setTimeout(() => {
        alertBox.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        alertBox.style.opacity = "0";
        alertBox.style.transform = "translateX(50px)";
        setTimeout(() => alertBox.remove(), 400);
    }, 4000);
}

// ==========================================
// MATRIX THEMES
// ==========================================
function changeMatrixTheme(themeName, element) {
    document.body.className = '';
    if (themeName !== 'green') {
        document.body.classList.add(`theme-${themeName}`);
    }

    document.querySelectorAll('.theme-dot').forEach(dot => dot.classList.remove('active'));
    element.classList.add('active');

    if (themeName === 'green') {
        if (particleSystem) particleSystem.material.color.setHex(0x00ff66);
        if (earth) earth.material.emissive.setHex(0x052211); 
        if (dirLight) dirLight.color.setHex(0x00ff66);
    }
    if (themeName === 'cyan') {
        if (particleSystem) particleSystem.material.color.setHex(0x00f0ff);
        if (earth) earth.material.emissive.setHex(0x002233); 
        if (dirLight) dirLight.color.setHex(0x00f0ff);
    }
    if (themeName === 'pink') {
        if (particleSystem) particleSystem.material.color.setHex(0xff00ff);
        if (earth) earth.material.emissive.setHex(0x330022); 
        if (dirLight) dirLight.color.setHex(0xff00ff);
    }
}

// ==========================================
// HARDCORE PANEL SWITCHER (FIX FOR OVERLAPS)
// ==========================================
function showActivePanel(panelId) {
    const panels = ['auth-panel', 'user-dashboard', 'admin-dashboard', 'ban-panel'];
    
    panels.forEach(id => {
        const p = document.getElementById(id);
        if (p) {
            p.style.display = 'none';
            p.classList.remove('active');
        }
    });

    const target = document.getElementById(panelId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => {
            target.classList.add('active');
        }, 10);
    }
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

// ==========================================
// SUPABASE SECURE AUTHORIZATION
// ==========================================
async function handleRegister(event) {
    event.preventDefault();
    
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const repeat = document.getElementById('reg-repeat').value;

    if (pass !== repeat) {
        return showCyberAlert('error', 'SECURITY ERROR', 'Passwords absolute mismatch.');
    }

    try {
        if (typeof _supabase === 'undefined') {
            return showCyberAlert('error', 'CONFIG ERROR', 'Database connection missing.');
        }

        const { data: existingUser, error: checkError } = await _supabase
            .from('users')
            .select('username')
            .eq('username', user)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            return showCyberAlert('error', 'REGISTRATION FAILED', 'Username already operational.');
        }

        const generatedBankId = Math.floor(10000000 + Math.random() * 90000000).toString();

        const { error: insertError } = await _supabase
            .from('users')
            .insert([{ username: user, password_hash: pass, bank_id: generatedBankId, balance: 0.00 }]);

        if (insertError) throw insertError;

        showCyberAlert('success', 'ACCESS GRANTED', `Registered! Bank ID: ${generatedBankId}`);
        switchAuthTab('login');

    } catch (err) {
        showCyberAlert('error', 'DATABASE CRASH', err.message);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;

    // Сверхзащищенный хардкод админа
    if (user === 'admin21') {
        if (pass === 'admin210412') {
            currentUser = { username: 'admin21', bank_id: '99999999', balance: 999999999, is_admin: true, is_banned: false };
            initAdminDashboard();
            return;
        } else {
            return showCyberAlert('error', 'CORRUPTION DETECTED', 'Invalid encryption key.');
        }
    }

    try {
        if (typeof _supabase === 'undefined') {
            return showCyberAlert('error', 'CONFIG ERROR', 'Database link offline.');
        }

        const { data, error } = await _supabase
            .from('users')
            .select('*')
            .eq('username', user)
            .eq('password_hash', pass)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return showCyberAlert('error', 'ACCESS DENIED', 'Invalid node parameters.');
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
        showCyberAlert('error', 'LINK OFFLINE', err.message);
    }
}

// ==========================================
// USER DASHBOARD MATRIX
// ==========================================
function initUserDashboard() {
    showActivePanel('user-dashboard');
    document.getElementById('user-display-name').innerText = currentUser.username.toUpperCase();
    document.getElementById('user-bank-id').innerText = currentUser.bank_id;
    document.getElementById('user-balance').innerText = `${parseFloat(currentUser.balance).toFixed(2)} LMT`;
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
                <div style="text-align: left;">
                    <p style="font-weight:700;">${isIncoming ? '← NET_INFLOW' : '→ NET_OUTFLOW'}</p>
                    <small style="color:#64748b;">${isIncoming ? 'From: ' + tx.sender_id : 'To: ' + tx.receiver_id}</small>
                </div>
                <span style="font-family:'Orbitron'; font-weight:700; color: ${isIncoming ? 'var(--neon-accent)' : 'var(--neon-red)'}">
                    ${isIncoming ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} LMT
                </span>
            `;
            container.appendChild(item);
        });
    } catch (e) {
        container.innerHTML = '<p style="color:#64748b; text-align:center; margin-top:20px;">ERROR LOADING LEDGER</p>';
    }
}

async function handleTransfer(event) {
    event.preventDefault();
    
    const destId = document.getElementById('transfer-id').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);

    if (destId === currentUser.bank_id) {
        return showCyberAlert('error', 'LOOP ERROR', 'Cannot loop transactions.');
    }
    if (amount > currentUser.balance) {
        return showCyberAlert('error', 'QUANTUM REFUSAL', 'Insufficient balance credits.');
    }

    try {
        const { data: receiver, error: rErr } = await _supabase
            .from('users')
            .select('*')
            .eq('bank_id', destId)
            .maybeSingle();

        if (rErr || !receiver) {
            return showCyberAlert('error', 'NODE ERROR', 'Target ID does not exist.');
        }

        const newSenderBal = parseFloat(currentUser.balance) - amount;
        const newRecBal = parseFloat(receiver.balance) + amount;

        await _supabase.from('users').update({ balance: newSenderBal }).eq('id', currentUser.id);
        await _supabase.from('users').update({ balance: newRecBal }).eq('id', receiver.id);
        await _supabase.from('transactions').insert([{ sender_id: currentUser.bank_id, receiver_id: destId, amount: amount }]);

        currentUser.balance = newSenderBal;
        showCyberAlert('success', 'SUCCESS', 'Credit transfer executed.');
        initUserDashboard();
    } catch (err) {
        showCyberAlert('error', 'FATAL EXCEPTION', 'Transaction rejected.');
    }
}

// ==========================================
// MASTER CONTROL DASHBOARD (ADMIN)
// ==========================================
async function initAdminDashboard() {
    showActivePanel('admin-dashboard');
    const tbody = document.getElementById('admin-user-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    try {
        const { data: users, error } = await _supabase.from('users').select('*');
        if (error || !users) return;
        
        users.forEach(u => {
            if(u.is_admin) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.username}</td>
                <td style="font-family:'Orbitron';">${u.bank_id}</td>
                <td style="color:var(--neon-accent); font-weight:bold;">${parseFloat(u.balance).toFixed(2)} LMT</td>
                <td style="color: ${u.is_banned ? 'var(--neon-red)' : 'var(--neon-accent)'}">${u.is_banned ? 'BANNED' : 'OPERATIONAL'}</td>
                <td><button class="terminate-btn" onclick="terminateUserNode('${u.bank_id}')">DELETE</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Failed to load user matrix.");
    }
}

async function terminateUserNode(bankId) {
    if (!confirm(`// WARNING: Completely erase Node [${bankId}]?`)) return;

    try {
        const { error } = await _supabase.from('users').delete().eq('bank_id', bankId);
        if (error) throw error;
        showCyberAlert('success', 'NODE PURGED', 'Account node deleted.');
        initAdminDashboard(); 
    } catch (err) {
        showCyberAlert('error', 'PURGE REFUSED', 'Deletion failed.');
    }
}

async function executeAdminAction(action) {
    const targetId = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value) || 0;

    if(!targetId) return showCyberAlert('error', 'ADMIN SPECIFICATION', 'Target ID required.');

    try {
        const { data: targetUser, error } = await _supabase.from('users').select('*').eq('bank_id', targetId).maybeSingle();
        if(error || !targetUser) return showCyberAlert('error', 'TARGET NODE', 'User not found.');

        if (action === 'give' && amount > 0) {
            await _supabase.from('users').update({ balance: parseFloat(targetUser.balance) + amount }).eq('bank_id', targetId);
        } else if (action === 'remove' && amount > 0) {
            let bal = Math.max(0, parseFloat(targetUser.balance) - amount);
            await _supabase.from('users').update({ balance: bal }).eq('id', targetUser.id);
        } else if (action === 'banned' || action === 'ban') {
            await _supabase.from('users').update({ is_banned: true }).eq('bank_id', targetId);
        } else if (action === 'unban') {
            await _supabase.from('users').update({ is_banned: false }).eq('bank_id', targetId);
        }

        showCyberAlert('success', 'ACTION EXECUTED', 'Admin action engaged.');
        initAdminDashboard();
    } catch (err) {
        showCyberAlert('error', 'CRITICAL REFUSAL', 'Action refused.');
    }
}

function logout() {
    currentUser = null;
    showActivePanel('auth-panel');
}

// ==========================================
// CORE INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    init3DEngine();
    
    // Плавное скрытие стартового прелоадера
    setTimeout(() => {
        const loader = document.getElementById('preloader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 600);
        }
    }, 1200);

    const cursor = document.getElementById('cursor-glow');
    if (cursor) {
        window.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    showActivePanel('auth-panel');
});
