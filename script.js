let currentUser = null;

// ==========================================
// THREE.JS 3D ENGINE (CINEMATIC PLANET)
// ==========================================
function init3DEngine() {
    const canvas = document.getElementById('cyber-canvas');
    const scene = new THREE.Scene();
    
    // Настройка тумана для глубины
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

    // Анимационный цикл (GPU Optimized via requestAnimationFrame)
    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.0015;
        earth.rotation.x += 0.0003;
        particleSystem.rotation.y -= 0.0005;
        renderer.render(scene, camera);
    }
    animate();

    // Респонсивность окна рендеринга
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
    // Убираем прелоадер после полной загрузки
    setTimeout(() => {
        const loader = document.getElementById('preloader');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 2000);

    // Интерактивный светящийся курсор
    const cursor = document.getElementById('cursor-glow');
    window.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
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
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
}

// ==========================================
// CORE AUTHENTICATION LOGIC (SUPABASE)
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const repeat = document.getElementById('reg-repeat').value;

    if (pass !== repeat) return alert("SECURITY ERROR: Passwords absolute mismatch.");

    // Генерация уникального 8-значного Bank ID
    const generatedBankId = Math.floor(10000000 + Math.random() * 90000000).toString();

    const { data, error } = await _supabase
        .from('users')
        .insert([{ username: user, password_hash: pass, bank_id: generatedBankId }])
        .select();

    if (error) {
        alert("TRANSACTION HALTED: Username already operational within Net Matrix.");
    } else {
        alert(`ACCESS GRANTED. Your Core Bank ID is: ${generatedBankId}`);
        switchAuthTab('login');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;

    const { data, error } = await _supabase
        .from('users')
        .select('*')
        .eq('username', user)
        .eq('password_hash', pass)
        .single();

    if (error || !data) {
        return alert("ACCESS DENIED: Invalid encryption credentials.");
    }

    if (data.is_banned) {
        return showActivePanel('ban-panel');
    }

    currentUser = data;

    if (data.is_admin) {
        initAdminDashboard();
    } else {
        initUserDashboard();
    }
}

// ==========================================
// USER OPERATIONS & LEDGER
// ==========================================
async function initUserDashboard() {
    showActivePanel('user-dashboard');
    document.getElementById('user-display-name').innerText = currentUser.username.toUpperCase();
    document.getElementById('user-bank-id').innerText = currentUser.bank_id;
    document.getElementById('user-balance').innerText = `${parseFloat(currentUser.balance).toFixed(2)} ฿`;
    
    loadTransactionHistory();
}

async function loadTransactionHistory() {
    const container = document.getElementById('ledger-history');
    container.innerHTML = '';

    const { data, error } = await _supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${currentUser.bank_id},receiver_id.eq.${currentUser.bank_id}`)
        .order('timestamp', { ascending: false });

    if (error || !data) return;

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
                ${isIncoming ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} ฿
            </span>
        `;
        container.appendChild(item);
    });
}

async function handleTransfer(e) {
    e.preventDefault();
    const destId = document.getElementById('transfer-id').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);

    if (destId === currentUser.bank_id) return alert("ERROR: Cannot loop transactions back into self node.");
    if (amount > currentUser.balance) return alert("QUANTUM REFUSAL: Insufficient balance credits.");

    // 1. Поиск получателя
    const { data: receiver, error: rErr } = await _supabase
        .from('users')
        .select('*')
        .eq('bank_id', destId)
        .single();

    if (rErr || !receiver) return alert("NODE NOT FOUND: Targeted Bank ID does not exist.");

    // 2. Списание с баланса (В целях демо делается на клиенте, рекомендуется RPC функция)
    const newSenderBal = parseFloat(currentUser.balance) - amount;
    const newRecBal = parseFloat(receiver.balance) + amount;

    await _supabase.from('users').update({ balance: newSenderBal }).eq('id', currentUser.id);
    await _supabase.from('users').update({ balance: newRecBal }).eq('id', receiver.id);

    // 3. Запись лога транзакции
    await _supabase.from('transactions').insert([
        { sender_id: currentUser.bank_id, receiver_id: destId, amount: amount }
    ]);

    alert("CREDIT TRANSFER EXECUTED SUCCESSFULLY.");
    currentUser.balance = newSenderBal;
    initUserDashboard();
}

// ==========================================
// ADMIN CONTROL MATRIX
// ==========================================
async function initAdminDashboard() {
    showActivePanel('admin-dashboard');
    const tbody = document.getElementById('admin-user-table');
    tbody.innerHTML = '';

    const { data: users } = await _supabase.from('users').select('*');
    
    users.forEach(u => {
        if(u.is_admin) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.username}</td>
            <td style="font-family:'Orbitron';">${u.bank_id}</td>
            <td style="color:var(--neon-green); font-weight:bold;">${parseFloat(u.balance).toFixed(2)} ฿</td>
            <td style="color: ${u.is_banned ? 'var(--neon-red)' : 'var(--neon-green)'}">${u.is_banned ? 'BANNED' : 'OPERATIONAL'}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function executeAdminAction(action) {
    const targetId = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value);

    if(!targetId) return alert("ADMIN SPECIFICATION ERROR: Target ID required.");

    const { data: targetUser } = await _supabase.from('users').select('*').eq('bank_id', targetId).single();
    if(!targetUser) return alert("TARGET NODE INVALID.");

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
}

function logout() {
    currentUser = null;
    showActivePanel('auth-panel');
}

// Initialization Entry Points
window.onload = () => {
    init3DEngine();
    setupUIEffects();
};
