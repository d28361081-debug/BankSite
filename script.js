/**
 * TRUSTIX BANK // CORE ENGINE & UNBREAKABLE UI DRIVER
 */

let currentUser = null;

// Главный инициализатор ядра
document.addEventListener('DOMContentLoaded', () => {
    
    // ГАРАНТИРОВАННЫЙ ВЫХОД ИЗ ПРЕЛОАДЕРА
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600);
        }
    }, 1500);

    // Безопасная инициализация модулей интерфейса
    try {
        setupAuthTabs();
        setupForms();
    } catch (err) {
        console.error("Critical UI modules failed:", err);
    }

    // Изолированный запуск тяжелой 3D графики
    try {
        initThreeBackground();
    } catch (err) {
        console.warn("Matrix Hologram engine failed to load. Falling back to 2D dark mode.", err);
    }
});

/* ==========================================
   THREE.JS: ОТКАЗОУСТОЙЧИВАЯ 3D СЦЕНА
   ========================================== */
function initThreeBackground() {
    const canvas = document.getElementById('cyber-canvas');
    if (!canvas || typeof THREE === 'undefined') {
        console.log("Three.js absent or blocked. CSS background activated.");
        return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030a06, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 160;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.SphereGeometry(65, 45, 45);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff66,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);

    const coreGeo = new THREE.SphereGeometry(63, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x003311,
        transparent: true,
        opacity: 0.25,
        wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 350;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 400;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.8,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.6
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    function animate() {
        requestAnimationFrame(animate);
        earthMesh.rotation.y += 0.0008;
        earthMesh.rotation.x += 0.0002;
        coreMesh.rotation.y -= 0.0004;
        particlesMesh.rotation.y += 0.0003;
        particlesMesh.rotation.x -= 0.0001;
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

/* ==========================================
   ИНТЕРФЕЙС УПРАВЛЕНИЯ И АВТОРИЗАЦИЯ
   ========================================== */
function setupAuthTabs() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (!tabLogin || !tabRegister || !loginForm || !registerForm) return;

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

function setupForms() {
    const regForm = document.getElementById('register-form');
    const logForm = document.getElementById('login-form');
    const txForm = document.getElementById('transfer-form');

    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('reg-username').value.trim();
            const pass = document.getElementById('reg-password').value;
            const repeatPass = document.getElementById('reg-repeat-password').value;

            if (user.length < 3) return showToast("Имя пользователя слишком короткое", true);
            if (pass.length < 4) return showToast("Пароль слишком простой", true);
            if (pass !== repeatPass) return showToast("Пароли не совпадают", true);

            const newUser = DB.createUser(user, pass);
            if (!newUser) return showToast("Имя занято в нейросети", true);

            showToast(`Аккаунт создан! Ваш ID: ${newUser.bankId}`);
            regForm.reset();
            const tabLogin = document.getElementById('tab-login');
            if (tabLogin) tabLogin.click();
        });
    }

    if (logForm) {
        logForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-username').value.trim();
            const pass = document.getElementById('login-password').value;

            const foundUser = DB.findUser(user);
            if (!foundUser || foundUser.password !== pass) {
                return showToast("Крипто-ключ неверный или сущности нет", true);
            }

            if (foundUser.isBanned) {
                const banOverlay = document.getElementById('ban-overlay');
                if (banOverlay) banOverlay.style.display = 'flex';
                return;
            }

            currentUser = foundUser;
            showToast(`Сессия открыта. Приветствуем, ${currentUser.username}`);
            switchScreen(currentUser.isAdmin ? 'admin-dashboard' : 'user-dashboard');
            updateDashboardData();
        });
    }

    if (txForm) {
        txForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const targetId = document.getElementById('transfer-target-id').value.trim();
            const amount = parseFloat(document.getElementById('transfer-amount').value);

            if (amount <= 0 || isNaN(amount)) return showToast("Некорректная сумма перевода", true);
            if (currentUser.bankId === targetId) return showToast("Нельзя переводить себе", true);
            if (currentUser.balance < amount) return showToast("Недостаточно кредитов на балансе", true);

            const recipient = DB.findUserById(targetId);
            if (!recipient) return showToast("Адресат не найден в Matrix DB", true);
            if (recipient.isBanned) return showToast("Счет получателя заблокирован", true);

            DB.updateBalance(currentUser.bankId, currentUser.balance - amount);
            DB.updateBalance(recipient.bankId, recipient.balance + amount);
            DB.addTransaction(currentUser.bankId, currentUser.username, recipient.bankId, recipient.username, amount);

            currentUser = DB.findUser(currentUser.username);
            showToast("Квантовый перевод завершен успешно!");
            txForm.reset();
            updateDashboardData();
        });
    }
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
    }, 150);
}

function updateDashboardData() {
    if (!currentUser) return;

    if (currentUser.isAdmin) {
        const tableBody = document.getElementById('admin-users-table');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        const db = DB.getRawData();
        Object.values(db.users).forEach(u => {
            const tr = document.createElement('tr');
            const statusText = u.isBanned ? '<span style="color:#ff0055">BANNED</span>' : (u.isAdmin ? '<span style="color:#ffb700">ROOT</span>' : '<span style="color:#00ff66">ACTIVE</span>');
            const balanceVal = u.isAdmin ? '∞' : u.balance.toFixed(2);
            
            tr.innerHTML = `
                <td style="font-family:var(--font-cyber); font-size:0.85rem;">${u.bankId}</td>
                <td>${u.username}</td>
                <td style="color:var(--neon-green)">${balanceVal} ₮</td>
                <td>${statusText}</td>
            `;
            tableBody.appendChild(tr);
        });
    } else {
        const uName = document.getElementById('user-display-name');
        const uId = document.getElementById('user-display-id');
        const uBalance = document.getElementById('user-display-balance');

        if (uName) uName.innerText = currentUser.username.toUpperCase();
        if (uId) uId.innerText = `ID: ${currentUser.bankId}`;
        if (uBalance) uBalance.innerHTML = `${currentUser.balance.toFixed(2)} <span>₮</span>`;

        const logContainer = document.getElementById('transaction-log');
        if (!logContainer) return;
        logContainer.innerHTML = '';
        const txs = DB.getTransactionsForUser(currentUser.bankId);

        if (txs.length === 0) {
            logContainer.innerHTML = '<p style="color:rgba(0,255,102,0.3); font-size:0.85rem;">NO TRANSACTIONS RECORDED</p>';
        } else {
            txs.forEach(tx => {
                const isIncoming = tx.receiverId === currentUser.bankId;
                const div = document.createElement('div');
                div.className = `tx-item ${isIncoming ? 'tx-in' : 'tx-out'}`;
                
                div.innerHTML = `
                    <div class="tx-details">
                        <div class="tx-meta">${tx.timestamp} // ${tx.id}</div>
                        <div class="tx-party">${isIncoming ? `FROM: ${tx.senderName} (${tx.senderId})` : `TO: ${tx.receiverName} (${tx.receiverId})`}</div>
                    </div>
                    <div class="tx-amount">${isIncoming ? '+' : '-'}${tx.amount.toFixed(2)} ₮</div>
                `;
                logContainer.appendChild(div);
            });
        }
    }
}

function triggerAdminAction(actionType) {
    const targetId = document.getElementById('admin-target-id').value.trim();
    const amount = parseFloat(document.getElementById('admin-amount').value);

    if (!targetId) return showToast("Введите ID цели", true);
    
    const targetUser = DB.findUserById(targetId);
    if (!targetUser) return showToast("Субъект с таким ID отсутствует", true);
    if (targetUser.isAdmin) return showToast("Невозможно применить макрос к ROOT", true);

    switch(actionType) {
        case 'give':
            if (isNaN(amount) || amount <= 0) return showToast("Некорректная сумма", true);
            DB.updateBalance(targetId, targetUser.balance + amount);
            DB.addTransaction("MASTER_CORE", "OVERLORD", targetId, targetUser.username, amount);
            showToast(`Выдано ${amount} ₮ пользователю ${targetUser.username}`);
            break;
            
        case 'remove':
            if (isNaN(amount) || amount <= 0) return showToast("Некорректная сумма", true);
            let newBal = Math.max(0, targetUser.balance - amount);
            DB.updateBalance(targetId, newBal);
            DB.addTransaction(targetId, targetUser.username, "MASTER_CORE", "OVERLORD", amount);
            showToast(`Изъято ${amount} ₮ у пользователя ${targetUser.username}`);
            break;

        case 'ban':
            DB.setBanStatus(targetId, true);
            showToast(`Доступ терминала ${targetUser.username} заблокирован`, true);
            break;

        case 'unban':
            DB.setBanStatus(targetId, false);
            showToast(`Доступ терминала ${targetUser.username} восстановлен`);
            break;

        case 'delete':
            if(confirm(`Стереть из архива личность ${targetUser.username}?`)) {
                DB.deleteUser(targetId);
                showToast(`Сущность ${targetUser.username} полностью аннигилирована`, true);
            }
            break;
    }

    const adminForm = document.getElementById('admin-action-form');
    if (adminForm) adminForm.reset();
    updateDashboardData();
}

function showToast(message, isError = false) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerText = `// ${message.toUpperCase()}`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function logout() {
    currentUser = null;
    showToast("Сессия успешно закрыта");
    switchScreen('auth-screen');
    const logForm = document.getElementById('login-form');
    if (logForm) logForm.reset();
}

function closeBanOverlay() {
    const banOverlay = document.getElementById('ban-overlay');
    if (banOverlay) banOverlay.style.display = 'none';
    logout();
}
