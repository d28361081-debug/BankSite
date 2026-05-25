let currentUser = null;
let particleSystem = null; // Глобальная переменная для перекрашивания частиц 3D сферы

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
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x0a1128,
        emissive: 0x052211,
        wireframe: true,
        shininess: 10
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
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
        color: 0x00ff66, // Базовый зеленый цвет частиц
        transparent: true,
        opacity: 0.4
    });
    particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    const dirLight = new THREE.DirectionalLight(0x00ff66, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x0a1520);
    scene.add(ambientLight);

    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.0015;
        earth.rotation.x += 0.0003;
        particleSystem.rotation.y -= 0.0005;
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
// NEW: CYBER NOTIFICATION FRAMEWORK (КРАСНЫЕ КВАДРАТЫ)
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

    // Удаление ошибки через 4 секунды с плавным исчезновением
    setTimeout(() => {
        alertBox.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        alertBox.style.opacity = "0";
        alertBox.style.transform = "translateX(50px)";
        setTimeout(() => alertBox.remove(), 400);
    }, 4000);
}

// ==========================================
// NEW: REALTIME THEME CHANGER MATRIX
// ==========================================
function changeMatrixTheme(themeName, element) {
    // Смена класса на body
    document.body.className = '';
    if (themeName !== 'green') {
        document.body.classList.add(`theme-${themeName}`);
    }

    // Переключение галочки (активной точки) в меню
    document.querySelectorAll('.theme-dot').forEach(dot => dot.classList.remove('active'));
    element.classList.add('active');

    // Перекрашивание 3D частиц сферы под цвет темы
    if (particleSystem) {
        if (themeName === 'green') particleSystem.material.color.setHex(0x00ff66);
        if (themeName === 'cyan') particleSystem.material.color.setHex(0x00f0ff);
        if (themeName === 'pink') particleSystem.material.color.setHex(0xff00ff);
    }
}

// ==========================================
// UI INTERACTIONS
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
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
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

function showActivePanel(panelId) {
    const allPanels = document.querySelectorAll('.panel');
    allPanels.forEach(panel => panel.classList.remove('active'));

    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.classList.add('active');
}

// ==========================================
// REAL-TIME AUTHENTICATION (SUPABASE)
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const repeat = document.getElementById('reg-repeat').value;

    if (pass !== repeat) {
        return showCyberAlert('error', 'SECURITY ERROR', 'Passwords absolute mismatch.');
    }

    try {
        const { data: existingUser, error: checkError } = await _supabase
            .from('users')
            .select('username')
            .eq('username', user)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            return showCyberAlert('error', 'REGISTRATION FAILED', 'Username already operational within Net Matrix.');
        }

        const generatedBankId = Math.floor(10000000 + Math.random() * 90000000).toString();

        const { error: insertError } = await _supabase
            .from('users')
            .insert([{ username: user, password_hash: pass, bank_id: generatedBankId, balance: 0.00 }]);

        if (insertError) throw insertError;

        showCyberAlert('success', 'ACCESS GRANTED', `Registered! Core Bank ID: ${generatedBankId}`);
        switchAuthTab('login');

    } catch (err) {
        showCyberAlert('error', 'DATABASE CRASH', 'Could not sync node with registry database.');
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
            return showCyberAlert('error', 'CORRUPTION DETECTED', 'Invalid encryption key for ADMIN node.');
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
            return showCyberAlert('error', 'ACCESS DENIED', 'Invalid username or encryption password.');
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
        showCyberAlert('error', 'LINK OFFLINE', 'Secure database link is currently unestablished.');
    }
}

// ==========================================
// USER OPERATIONS & LEDGER
// ==========================================
function initUserDashboard() {
    showActivePanel('user-dashboard');
    document.getElementById('user-display-name').innerText = currentUser.username.toUpperCase();
    document.getElementById('user-bank-id').innerText = currentUser.bank_id;
    document.getElementById('user-balance').innerText = `${parseFloat(currentUser.balance).toFixed(2)} ฿`;
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
                <span style="font-family:'Orbitron'; font-weight:700; color: ${isIncoming ? 'var(--neon-accent)' : 'var(--neon-red)'}">
                    ${isIncoming ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} ฿
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
        return showCyberAlert('error', 'LOOP ERROR', 'Cannot loop transactions back into self node.');
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
            return showCyberAlert('error', 'NODE ERROR', 'Targeted Bank ID does not exist in Network.');
        }

        const newSenderBal = parseFloat(currentUser.balance) - amount;
        const newRecBal = parseFloat(receiver.balance) + amount;

        await _supabase.from('users').update({ balance: newSenderBal }).eq('id', currentUser.id);
        await _supabase.from('users').update({ balance: newRecBal }).eq('id', receiver.id);
        await _supabase.from('transactions').insert([{ sender_id: currentUser.bank_id, receiver_id: destId, amount: amount }]);

        currentUser.balance = newSenderBal;
        showCyberAlert('success', 'SUCCESS', 'Credit transfer executed successfully.');
        initUserDashboard();
    } catch (err) {
        showCyberAlert('error', 'FATAL EXCEPTION', 'Server rejected the transaction block.');
    }
}

// ==========================================
// ADMIN CONTROL MATRIX & NEW TERMINATE FUNCTION
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
                <td style="color:var(--neon-accent); font-weight:bold;">${parseFloat(u.balance).toFixed(2)} ฿</td>
                <td style="color: ${u.is_banned ? 'var(--neon-red)' : 'var(--neon-accent)'}">${u.is_banned ? 'BANNED' : 'OPERATIONAL'}</td>
                <td><button class="terminate-btn" onclick="terminateUserNode('${u.bank_id}')">DELETE</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Failed to load admin user matrix.");
    }
}

// NEW: Полное удаление аккаунта администратором из базы данных
async function terminateUserNode(bankId) {
    if (!confirm(`// WARNING: Are you sure you want to completely erase Node [${bankId}] from matrix history?`)) {
        return;
    }

    try {
        // Каскадно очищаем или удаляем записи в Supabase
        const { error } = await _supabase
            .from('users')
            .delete()
            .eq('bank_id', bankId);

        if (error) throw error;

        showCyberAlert('success', 'NODE PURGED', `Account node [${bankId}] has been completely deleted.`);
        initAdminDashboard(); // Обновляем таблицу на экране

    } catch (err) {
        showCyberAlert('error', 'PURGE REFUSED', 'Database rejected node deletion command.');
    }
}

async function executeAdminAction(action) {
    const targetId = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value) || 0;

    if(!targetId) return showCyberAlert('error', 'ADMIN SPECIFICATION', 'Target ID required.');

    try {
        const { data: targetUser, error } = await _supabase.from('users').select('*').eq('bank_id', targetId).maybeSingle();
        if(error || !targetUser) {
            return showCyberAlert('error', 'TARGET NODE', 'User not found.');
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

        showCyberAlert('success', 'ACTION EXECUTED', `Admin action [${action.toUpperCase()}] engaged on node ${targetId}`);
        initAdminDashboard();
    } catch (err) {
        showCyberAlert('error', 'CRITICAL REFUSAL', 'Admin action refused by database.');
    }
}

function logout() {
    currentUser = null;
    showActivePanel('auth-panel');
}

window.onload = () => {
    init3DEngine();
    setupUIEffects();
    showActivePanel('auth-panel');
};
