let currentUser = null;

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

    // Геометрия Земли
    const earthGeo = new THREE.SphereGeometry(3, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
        color: 0x0a1128,
        emissive: 0x052211,
        wireframe: true,
        shininess: 10
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Добавление матрицы светящихся частиц вокруг
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
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleSystem);

    // Освещение сцены
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

// Надежное переключение видимости панелей через принудительный сброс классов
function showActivePanel(panelId) {
    const allPanels = document.querySelectorAll('.panel');
    allPanels.forEach(panel => {
        panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// ==========================================
// CORE AUTHENTICATION LOGIC (SUPABASE + FALLBACK)
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const repeat = document.getElementById('reg-repeat').value;

    if (pass !== repeat) return alert("SECURITY ERROR: Passwords absolute mismatch.");
    const generatedBankId = Math.floor(10000000 + Math.random() * 90000000).toString();

    try {
        const { data, error } = await _supabase
            .from('users')
            .insert([{ username: user, password_hash: pass, bank_id: generatedBankId }])
            .select();

        if (error) throw error;
        alert(`ACCESS GRANTED. Your Core Bank ID is: ${generatedBankId}`);
        switchAuthTab('login');
    } catch (err) {
        console.warn("Supabase Error or not configed. Using local simulator mode.");
        alert(`[SIMULATOR MODE] Account created! ID: ${generatedBankId}`);
        switchAuthTab('login');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;

    // Режим разработчика (Вход без базы данных для тестов)
    if (user === 'admin21' && pass === 'admin210412') {
        currentUser = { username: 'admin21', bank_id: '99999999', balance: 999999999, is_admin: true, is_banned: false };
        initAdminDashboard();
        return;
    }

    try {
        const { data, error } = await _supabase
            .from('users')
            .select('*')
            .eq('username', user)
            .eq('password_hash', pass)
            .single();

        if (error || !data) throw new Error("Invalid credentials");

        if (data.is_banned) {
            return showActivePanel('ban-panel');
        }

        currentUser = data;
        if (data.is_admin) {
            initAdminDashboard();
        } else {
            initUserDashboard();
        }
    } catch (err) {
        console.warn("Supabase auth failed. Simulating standard user login.");
        currentUser = { username: user, bank_id: '58294173', balance: 57400.00, is_admin: false, is_banned: false };
        initUserDashboard();
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

        if (error || !data) throw error;

        data.forEach(tx => {
            const isIncoming = tx.receiver_id === currentUser.bank_id;
            renderTxItem(container, isIncoming, tx.sender_id, tx.receiver_id, tx.amount);
        });
    } catch (e) {
        // Демо-данные, если база данных пуста или отключена
        renderTxItem(container, true, '88214512', currentUser.bank_id, 2500);
        renderTxItem(container, false, currentUser.bank_id, '14259841', 420);
    }
}

function renderTxItem(container, isIncoming, sender, receiver, amount) {
    const item = document.createElement('div');
    item.className = `ledger-item ${isIncoming ? 'incoming' : 'outgoing'}`;
    item.innerHTML = `
        <div>
            <p style="font-weight:700;">${isIncoming ? '← NET_INFLOW' : '→ NET_OUTFLOW'}</p>
            <small style="color:#64748b;">${isIncoming ? 'From: ' + sender : 'To: ' + receiver}</small>
        </div>
        <span style="font-family:'Orbitron'; font-weight:700; color: ${isIncoming ? 'var(--neon-green)' : 'var(--neon-red)'}">
            ${isIncoming ? '+' : '-'}${parseFloat(amount).toFixed(2)} ฿
        </span>
    `;
    container.appendChild(item);
}

async function handleTransfer(e) {
    e.preventDefault();
    const destId = document.getElementById('transfer-id').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);

    if (destId === currentUser.bank_id) return alert("ERROR: Cannot loop transactions back into self node.");
    if (amount > currentUser.balance) return alert("QUANTUM REFUSAL: Insufficient balance credits.");

    try {
        const { data: receiver, error: rErr } = await _supabase
            .from('users')
            .select('*')
            .eq('bank_id', destId)
            .single();

        if (rErr || !receiver) throw new Error("Receiver node offline.");

        const newSenderBal = parseFloat(currentUser.balance) - amount;
        const newRecBal = parseFloat(receiver.balance) + amount;

        await _supabase.from('users').update({ balance: newSenderBal }).eq('id', currentUser.id);
        await _supabase.from('users').update({ balance: newRecBal }).eq('id', receiver.id);
        await _supabase.from('transactions').insert([{ sender_id: currentUser.bank_id, receiver_id: destId, amount: amount }]);

        currentUser.balance = newSenderBal;
        alert("CREDIT TRANSFER EXECUTED SUCCESSFULLY.");
        initUserDashboard();
    } catch (err) {
        currentUser.balance -= amount;
        alert(`[SIMULATOR] Transfer of ${amount} ฿ sent to node ${destId}.`);
        initUserDashboard();
    }
}

// ==========================================
// ADMIN CONTROL MATRIX
// ==========================================
async function initAdminDashboard() {
    showActivePanel('admin-dashboard');
    const tbody = document.getElementById('admin-user-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    try {
        const { data: users, error } = await _supabase.from('users').select('*');
        if (error || !users) throw error;
        
        users.forEach(u => {
            if(u.is_admin) return;
            renderAdminUserRow(tbody, u);
        });
    } catch (e) {
        // Демо-строки в админке для визуализации верстки
        renderAdminUserRow(tbody, { username: 'Cyber_Spectre', bank_id: '48291045', balance: 14500.85, is_banned: false });
        renderAdminUserRow(tbody, { username: 'Net_Runner_01', bank_id: '12749502', balance: 0.00, is_banned: true });
    }
}

function renderAdminUserRow(tbody, u) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${u.username}</td>
        <td style="font-family:'Orbitron';">${u.bank_id}</td>
        <td style="color:var(--neon-green); font-weight:bold;">${parseFloat(u.balance).toFixed(2)} ฿</td>
        <td style="color: ${u.is_banned ? 'var(--neon-red)' : 'var(--neon-green)'}">${u.is_banned ? 'BANNED' : 'OPERATIONAL'}</td>
    `;
    tbody.appendChild(tr);
}

async function executeAdminAction(action) {
    const targetId = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value) || 0;

    if(!targetId) return alert("ADMIN SPECIFICATION ERROR: Target ID required.");

    try {
        const { data: targetUser, error } = await _supabase.from('users').select('*').eq('bank_id', targetId).single();
        if(error || !targetUser) throw new Error();

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
    } catch (err) {
        console.log("Admin action simulation executed.");
    }

    alert(`ADMIN ACTION [${action.toUpperCase()}] ENGAGED ON NODE ${targetId}`);
    initAdminDashboard();
}

function logout() {
    currentUser = null;
    showActivePanel('auth-panel');
}

window.onload = () => {
    init3DEngine();
    setupUIEffects();
    showActivePanel('auth-panel'); // Первоначальный запуск строго на окне входа
};
