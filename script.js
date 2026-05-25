/**
 * TRUSTIX BANK // CORE ENGINE & THREE.JS CINEMATIC DRIVER
 */

let currentUser = null;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    initThreeBackground();
    setupAuthTabs();
    setupForms();
    
    // Симуляция завершения загрузки прелоадера
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.display = 'none', 600);
    }, 1800);
});

/* ==========================================
   THREE.JS: КИНЕМАТОГРАФИЧЕСКАЯ 3D ЗЕМЛЯ
   ========================================== */
function initThreeBackground() {
    const canvas = document.getElementById('cyber-canvas');
    const scene = new THREE.Scene();
    
    // Фоновый туман для глубины
    scene.fog = new THREE.FogExp2(0x030a06, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 160;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Геометрия Земли (Глобус из неоновой сетки)
    const geometry = new THREE.SphereGeometry(65, 45, 45);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff66,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);

    // Внутреннее светящееся ядро планеты
    const coreGeo = new THREE.SphereGeometry(63, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0x003311,
        transparent: true,
        opacity: 0.25,
        wireframe: false
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Массив парящих частиц в атмосфере (Moving Particles)
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

    // Цикл визуализации GPU Optimized
    function animate() {
        requestAnimationFrame(animate);
        
        // Медленное величественное вращение планеты
        earthMesh.rotation.y += 0.0008;
        earthMesh.rotation.x += 0.0002;
        
        coreMesh.rotation.y -= 0.0004;

        // Движение атмосферных частиц
        particlesMesh.rotation.y += 0.0003;
        particlesMesh.rotation.x -= 0.0001;

        renderer.render(scene, camera);
    }

    animate();

    // Отслеживание изменения размеров окна
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
    // Обработка регистрации
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('reg-username').value.trim();
        const pass = document.getElementById('reg-password').value;
        const repeatPass = document.getElementById('reg-repeat-password').value;

        if (user.length < 3) return showToast("Имя пользователя слишком короткое", true);
        if (pass.length < 4) return showToast("Пароль слишком простой", true);
        if (pass !== repeatPass) return showToast("Пароли не совпадают", true);

        const newUser = DB.createUser(user, pass);
        if (!newUser) {
            return showToast("Имя занято в нейросети", true);
        }

        showToast(`Аккаунт создан! Ваш ID: ${newUser.bankId}`);
        document.getElementById('register-form').reset();
        document.getElementById('tab-login').click();
    });

    // Обработка логина
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('login-username').value.trim();
        const pass = document.getElementById('login-password').value;

        const foundUser = DB.findUser(user);
        if (!foundUser || foundUser.password !== pass) {
            return showToast("Крипто-ключ неверный или сущности нет", true);
        }

        if (foundUser.isBanned) {
            document.getElementById('ban-overlay').style.display = 'flex';
            return;
        }

        // Вход выполнен успешно
        currentUser = foundUser;
        showToast(`Сессия открыта. Приветствуем, ${currentUser.username}`);
        switchScreen(currentUser.isAdmin ? 'admin-dashboard' : 'user-dashboard');
        updateDashboardData();
    });

    // Перевод денег пользователем
    document.getElementById('transfer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const targetId = document.getElementById('transfer-target-id').value.trim();
        const amount = parseFloat(document.getElementById('transfer-amount').value);

        if (amount <= 0 || isNaN(amount)) return showToast("Некорректная сумма перевода", true);
        if (currentUser.bankId === targetId) return showToast("Нельзя переводить себе", true);
        if (currentUser.balance < amount) return showToast("Недостаточно кредитов на балансе", true);

        const recipient = DB.findUserById(targetId);
        if (!recipient) return showToast("Адресат не найден в Matrix DB", true);
        if (recipient.isBanned) return showToast("Счет получателя заблокирован", true);

        // Проведение транзакции
        DB.updateBalance(currentUser.bankId, currentUser.balance - amount);
        DB.updateBalance(recipient.bankId, recipient.balance + amount);
        DB.addTransaction(currentUser.bankId, currentUser.username, recipient.bankId, recipient.username, amount);

        // Обновление локального стейта
        currentUser = DB.findUser(currentUser.username);
        showToast("Квантовый перевод завершен успешно!");
        document.getElementById('transfer-form').reset();
        updateDashboardData();
    });
}

/* ==========================================
   ОБНОВЛЕНИЕ ДАННЫХ И ЭКРАНОВ UI
   ========================================== */
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    setTimeout(() => {
        const target = document.getElementById(screenId);
        target.classList.add('active');
    }, 150);
}

function updateDashboardData() {
    if (!currentUser) return;

    if (currentUser.isAdmin) {
        // Логика админ-панели
        const tableBody = document.getElementById('admin-users-table');
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
        // Логика обычного пользователя
        document.getElementById('user-display-name').innerText = currentUser.username.toUpperCase();
        document.getElementById('user-display-id').innerText = `ID: ${currentUser.bankId}`;
        document.getElementById('user-display-balance').innerHTML = `${currentUser.balance.toFixed(2)} <span>₮</span>`;

        // Рендеринг истории транзакций
        const logContainer = document.getElementById('transaction-log');
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

/* ==========================================
   АДМИНИСТРАТИВНЫЕ МАКРОСЫ-ДЕЙСТВИЯ
   ========================================== */
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

    document.getElementById('admin-action-form').reset();
    updateDashboardData();
}

/* ==========================================
   ВСПОМОГАТЕЛЬНЫЕ СИСТЕМНЫЕ ФУНКЦИИ
   ========================================== */
function showToast(message, isError = false) {
    const container = document.getElementById('notification-container');
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
    document.getElementById('login-form').reset();
}

function closeBanOverlay() {
    document.getElementById('ban-overlay').style.display = 'none';
    logout();
}