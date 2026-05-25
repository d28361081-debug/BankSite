let currentUser = null;
let currentTheme = 'green';

// Настройки цветовых схем
const SYSTEM_THEMES = {
    green: { color: 0x00ff66, emissive: 0x052211, accent: '#00ff66', glow: 'rgba(0, 255, 102, 0.35)' },
    blue: { color: 0x00d9ff, emissive: 0x001133, accent: '#00d9ff', glow: 'rgba(0, 217, 255, 0.35)' },
    purple: { color: 0xcc00ff, emissive: 0x220033, accent: '#cc00ff', glow: 'rgba(204, 0, 255, 0.35)' }
};

let earthMesh, earthMaterial, directionalLight;

// ==========================================
// 3D СФЕРА BACKGROUND
// ==========================================
function initGlobal3D() {
    const canvas = document.getElementById('cyber-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6.0;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.SphereGeometry(3.2, 50, 50);
    earthMaterial = new THREE.MeshPhongMaterial({
        color: SYSTEM_THEMES.green.color,
        emissive: SYSTEM_THEMES.green.emissive,
        wireframe: true
    });
    
    earthMesh = new THREE.Mesh(geometry, earthMaterial);
    scene.add(earthMesh);

    directionalLight = new THREE.DirectionalLight(SYSTEM_THEMES.green.color, 1.5);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x080a10);
    scene.add(ambientLight);

    function animate() {
        requestAnimationFrame(animate);
        if (earthMesh) earthMesh.rotation.y += 0.0012;
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
// СИНХРОННОЕ ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
// ==========================================
function switchSystemTheme(themeName) {
    if (!SYSTEM_THEMES[themeName]) return;
    currentTheme = themeName;
    const theme = SYSTEM_THEMES[themeName];

    // Изменение параметров 3D сцены
    if (earthMaterial && directionalLight) {
        earthMaterial.color.setHex(theme.color);
        earthMaterial.emissive.setHex(theme.emissive);
        directionalLight.color.setHex(theme.color);
    }

    // Внедрение CSS переменных на всю страницу
    document.documentElement.style.setProperty('--neon-color', theme.accent);
    document.documentElement.style.setProperty('--neon-glow', theme.glow);

    const cursor = document.getElementById('cursor-glow');
    if (cursor) cursor.style.background = `radial-gradient(circle, ${theme.glow.replace('0.35', '0.1')} 0%, rgba(0,0,0,0) 70%)`;

    // Синхронизация точек выбора темы во всех панелях
    document.querySelectorAll('.dot').forEach(dot => {
        dot.classList.remove('active');
        if (dot.classList.contains(themeName)) {
            dot.classList.add('active');
        }
    });
}

// ==========================================
// НАВИГАЦИЯ И ИНТЕРФЕЙС
// ==========================================
function showActivePanel(panelId) {
    document.querySelectorAll('.panel').forEach(p => {
        p.classList.remove('active');
        p.style.setProperty('display', 'none', 'important');
    });

    const target = document.getElementById(panelId);
    if (target) {
        target.classList.add('active');
        if (panelId === 'user-dashboard' && window.innerWidth > 968) {
            target.style.setProperty('display', 'grid', 'important');
        } else if (panelId === 'admin-dashboard') {
            target.style.setProperty('display', 'flex', 'important');
        } else {
            target.style.setProperty('display', 'block', 'important');
        }
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

// ==========================================
// АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ (БАЗА ДАННЫХ)
// ==========================================
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const repeat = document.getElementById('reg-repeat').value;

    if (pass !== repeat) return alert("ACCESS ERROR: Encryption keys do not match.");

    try {
        const { data: userExists } = await _supabase.from('users').select('username').eq('username', username).maybeSingle();
        if (userExists) return alert("DENIED: Username signature already assigned.");

        const generatedBankId = Math.floor(10000000 + Math.random() * 90000000).toString();

        await _supabase.from('users').insert([
            { username: username, password_hash: pass, bank_id: generatedBankId, balance: 0.00 }
        ]);

        alert(`NODE INITIALIZED. Generated Core Bank ID: ${generatedBankId}`);
        switchAuthTab('login');
    } catch (err) {
        alert("MAINFRAME ERROR: Registration rejected.");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;

    // Хардкод рут-доступа админа
    if (username === 'admin21' && pass === 'admin210412') {
        currentUser = { username: 'admin21', bank_id: '99999999', balance: 0, is_admin: true };
        initAdminDashboard();
        return;
    }

    try {
        const { data: user, error } = await _supabase.from('users').select('*').eq('username', username).eq('password_hash', pass).maybeSingle();
        if (error || !user) return alert("INVALID ACCESS KEY OR IDENTIFIER.");
        if (user.is_banned) return showActivePanel('ban-panel');

        currentUser = user;
        if (user.is_admin) {
            initAdminDashboard();
        } else {
            initUserDashboard();
        }
    } catch (err) {
        alert("LINK OFFLINE: Mainframe connection error.");
    }
}

// ==========================================
// ОПЕРАЦИИ ПОЛЬЗОВАТЕЛЯ И ТРАНЗАКЦИИ
// ==========================================
function initUserDashboard() {
    showActivePanel('user-dashboard');
    document.getElementById('user-display-name').innerText = currentUser.username.toUpperCase();
    document.getElementById('user-bank-id').innerText = currentUser.bank_id;
    document.getElementById('user-balance').innerText = `${parseFloat(currentUser.balance).toFixed(2)} LMT`;
    loadLedgerHistory();
}

async function loadLedgerHistory() {
    const historyBox = document.getElementById('ledger-history');
    if (!historyBox) return;

    try {
        const { data: txs } = await _supabase.from('transactions')
            .select('*')
            .or(`sender_id.eq.${currentUser.bank_id},receiver_id.eq.${currentUser.bank_id}`)
            .order('timestamp', { ascending: false });

        if (!txs || txs.length === 0) {
            historyBox.innerHTML = '<p class="no-tx">NO TRANSACTIONS DETECTED</p>';
            return;
        }

        historyBox.innerHTML = '';
        txs.forEach(tx => {
            const incoming = tx.receiver_id === currentUser.bank_id;
            const row = document.createElement('div');
            row.style = "display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); margin-bottom:8px; border-left:3px solid " + (incoming ? "var(--neon-color)" : "var(--neon-red)");
            row.innerHTML = `
                <div>
                    <p style="font-size:0.9rem; font-weight:bold;">${incoming ? '← BLOCK_INFLOW' : '→ BLOCK_OUTFLOW'}</p>
                    <small style="color:#5c6f84;">${incoming ? 'From: ' + tx.sender_id : 'To: ' + tx.receiver_id}</small>
                </div>
                <span style="font-family:'Orbitron'; font-weight:700; color:${incoming ? 'var(--neon-color)' : 'var(--neon-red)'}">
                    ${incoming ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} LMT
                </span>
            `;
            historyBox.appendChild(row);
        });
    } catch (e) {
        historyBox.innerHTML = '<p class="no-tx">ERROR LOADING LEDGER</p>';
    }
}

async function handleTransfer(e) {
    e.preventDefault();
    const destBankId = document.getElementById('transfer-id').value.trim();
    const amount = parseFloat(document.getElementById('transfer-amount').value);

    if (destBankId === currentUser.bank_id) return alert("LOOP ERROR: Cannot transfer to yourself.");
    if (amount > currentUser.balance) return alert("QUANTUM FAILURE: Insufficient liquidity.");

    try {
        const { data: receiver } = await _supabase.from('users').select('*').eq('bank_id', destBankId).maybeSingle();
        if (!receiver) return alert("TARGET NODE NOT FOUND IN GRID.");

        const senderFinalBal = parseFloat(currentUser.balance) - amount;
        const receiverFinalBal = parseFloat(receiver.balance) + amount;

        await _supabase.from('users').update({ balance: senderFinalBal }).eq('id', currentUser.id);
        await _supabase.from('users').update({ balance: receiverFinalBal }).eq('id', receiver.id);
        await _supabase.from('transactions').insert([{ sender_id: currentUser.bank_id, receiver_id: destBankId, amount: amount }]);

        currentUser.balance = senderFinalBal;
        alert("TRANSACTION BLOCK ATTESTED.");
        initUserDashboard();
    } catch (err) {
        alert("TRANSACTION CRASHED.");
    }
}

// ==========================================
// СУПЕР-АДМИНКА И ПОЛНОЕ УДАЛЕНИЕ (PURGE)
// ==========================================
async function initAdminDashboard() {
    showActivePanel('admin-dashboard');
    const tableBody = document.getElementById('admin-user-table');
    if (!tableBody) return;

    try {
        const { data: nodes } = await _supabase.from('users').select('*');
        tableBody.innerHTML = '';

        nodes.forEach(node => {
            if (node.is_admin) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${node.username}</td>
                <td style="font-family:'Orbitron';">${node.bank_id}</td>
                <td style="color:var(--neon-color); font-weight:bold;">${parseFloat(node.balance).toFixed(2)} LMT</td>
                <td style="color:${node.is_banned ? 'var(--neon-red)' : 'var(--neon-color)'}; font-weight:bold;">${node.is_banned ? 'BANNED' : 'OPERATIONAL'}</td>
                <td>
                    <button class="purge-btn" onclick="purgeUserNode('${node.bank_id}', '${node.username}')">DELETE</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (e) {
        console.error("Matrix load failed.");
    }
}

async function executeAdminAction(action) {
    const target = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value) || 0;

    if (!target) return alert("TARGET NODE ID UNASSIGNED.");

    try {
        const { data: user } = await _supabase.from('users').select('*').eq('bank_id', target).maybeSingle();
        if (!user) return alert("NODE DOES NOT EXIST.");

        if (action === 'give') {
            await _supabase.from('users').update({ balance: parseFloat(user.balance) + amount }).eq('bank_id', target);
        } else if (action === 'remove') {
            await _supabase.from('users').update({ balance: Math.max(0, parseFloat(user.balance) - amount) }).eq('bank_id', target);
        } else if (action === 'ban') {
            await _supabase.from('users').update({ is_banned: true }).eq('bank_id', target);
        } else if (action === 'unban') {
            await _supabase.from('users').update({ is_banned: false }).eq('bank_id', target);
        }

        alert(`EXECUTION PROTOCOL [${action.toUpperCase()}] COMPLETE.`);
        initAdminDashboard();
    } catch (e) {
        alert("OVERRIDE COMMAND FAILED.");
    }
}

async function purgeUserNode(bankId, username) {
    const verify = confirm(`WARNING // OVERLORD PURGE REQUESTED:\nAre you sure you want to completely erase "${username}" (${bankId}) from database mainframes? This cannot be undone.`);
    if (!verify) return;

    try {
        await _supabase.from('users').delete().eq('bank_id', bankId);
        alert("NODE SUCCESSFULLY PURGED.");
        initAdminDashboard();
    } catch (err) {
        alert("PURGE OPERATION ERRORED.");
    }
}

function logout() {
    currentUser = null;
    showActivePanel('auth-panel');
}

window.addEventListener('mousemove', (e) => {
    const glow = document.getElementById('cursor-glow');
    if (glow && window.innerWidth > 968) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    }
});

window.onload = () => {
    initGlobal3D();
    showActivePanel('auth-panel');
    switchSystemTheme('green');
};
