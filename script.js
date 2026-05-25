document.addEventListener('DOMContentLoaded', () => {
    // ИНИЦИАЛИЗАЦИЯ ТРЕХМЕРНОГО НЕОНОВОГО ФОНА (THREE.JS)
    initThreeBackground();

    // ИМИТАЦИЯ ЗАГРУЗКИ КИБЕР-ТЕРМИНАЛА
    setTimeout(() => {
        const preload = document.getElementById('preload-screen');
        if(preload) {
            preload.style.opacity = '0';
            setTimeout(() => preload.classList.add('hidden'), 500);
        }
    }, 1500);

    // ССЫЛКИ НА ЭКРАНЫ И ИНПУТЫ
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const adminScreen = document.getElementById('admin-screen');

    // Кнопки авторизации/регистрации
    const loginBtn = document.getElementById('action-login-btn');
    const registerBtn = document.getElementById('action-register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const sendBtn = document.getElementById('send-btn');

    // Поля ввода
    const loginUserInp = document.getElementById('login-username');
    const loginPassInp = document.getElementById('login-password');
    const regUserInp = document.getElementById('reg-username');
    const regPassInp = document.getElementById('reg-password');
    const regRepeatPassInp = document.getElementById('reg-repeat-password');
    const targetBankIdInp = document.getElementById('target-bank-id');
    const transferAmountInp = document.getElementById('transfer-amount');

    // Текстовые ноды дешборда
    const userLoginName = document.getElementById('user-login-name');
    const userTechId = document.getElementById('user-tech-id');
    const userBalance = document.getElementById('user-balance');
    const historyList = document.getElementById('history-list');
    const adminUsersList = document.getElementById('admin-users-list');

    let currentUser = null;

    // ПРИНУДИТЕЛЬНЫЙ ВЫВОД ФОРМЫ НА ЭКРАН ПРИ СТАРТЕ
    if (authScreen) authScreen.classList.remove('hidden');

    // ОБНОВЛЕНИЕ ДАННЫХ КЛИЕНТА
    async function refreshDashboard() {
        if (!currentUser) return;
        try {
            const data = await window.CyberDB.getUserData(currentUser.username);
            if (!data) return;

            // Проверка на лету — не забанен ли юзер кем-то через сеть
            if(data.is_banned) {
                alert(`ДОСТУП ЗАБЛОКИРОВАН.\nКод ошибки: ${data.ban_code || 'SECURITY_VIOLATION'}`);
                performLogout();
                return;
            }
            
            if(userBalance) userBalance.textContent = parseFloat(data.balance).toFixed(2);
            if(userTechId) userTechId.textContent = data.tech_id;
            if(userLoginName) userLoginName.textContent = data.username;

            // Логи транзакций
            const txs = await window.CyberDB.getTransactionHistory(data.username);
            if (historyList) {
                historyList.innerHTML = '';
                if(txs.length === 0) {
                    historyList.innerHTML = '<li><span style="color:#444">ЛОГИ ОПЕРАЦИЙ ПУСТЫ</span></li>';
                }
                txs.forEach(tx => {
                    const li = document.createElement('li');
                    const isSender = tx.sender === data.username;
                    li.innerHTML = `
                        <span>${isSender ? '➡️ ВЫВОД СРЕДСТВ' : '⬅️ ЗАЧИСЛЕНИЕ СЕТИ'} // Контрагент: ${isSender ? tx.receiver : tx.sender}</span>
                        <span style="color: ${isSender ? '#ff3333' : '#00ff66'}">${isSender ? '-' : '+'}${tx.amount} ¤</span>
                    `;
                    historyList.appendChild(li);
                });
            }
        } catch (err) {
            console.error("Ошибка обновления терминала:", err);
        }
    }

    // ОБНОВЛЕНИЕ ПАНЕЛИ АДМИНИСТРАТОРА (ВСЯ СЕТЬ)
    async function refreshAdminPanel() {
        if (!adminUsersList) return;
        try {
            const users = await window.CyberDB.getAllUsers();
            adminUsersList.innerHTML = '';
            users.forEach(u => {
                const div = document.createElement('div');
                div.className = 'admin-u-card';
                div.innerHTML = `
                    <p><strong>Пользователь сети:</strong> ${u.username} (ID: <span style="color:#00ffff">${u.tech_id}</span>)</p>
                    <p>Баланс на счете: <span style="color:#00ff66">${parseFloat(u.balance).toFixed(2)} ¤</span></p>
                    <p>Статус терминала: ${u.is_banned ? `<span style="color:#ff3333; font-weight:bold;">БАН [Код: ${u.ban_code}]</span>` : '<span style="color:#00ff66">АКТИВЕН</span>'}</p>
                    <div class="admin-controls">
                        <input type="number" placeholder="Сумма" id="amt-${u.id}" min="1">
                        <button class="admin-btn" onclick="modifyBalance('${u.username}', 'amt-${u.id}', true)">НАЧИСЛИТЬ</button>
                        <button class="admin-btn" onclick="modifyBalance('${u.username}', 'amt-${u.id}', false)">СПИСАТЬ</button>
                        <button class="admin-btn" style="border-color:#ff3333; color:#ff3333;" onclick="admToggleBan('${u.username}', ${u.is_banned})">
                            ${u.is_banned ? 'РАЗБАНИТЬ' : 'ЗАБАНИТЬ'}
                        </button>
                        <button class="admin-btn" style="border-color:#666; color:#666;" onclick="admDeleteUser('${u.username}')">УДАЛИТЬ</button>
                    </div>
                `;
                adminUsersList.appendChild(div);
            });
        } catch (err) {
            console.error("Ошибка рендеринга админ-модуля:", err);
        }
    }

    // ГЛОБАЛЬНЫЕ КЛИКИ АДМИНА ДЛЯ ТАБЛИЦЫ
    window.modifyBalance = async (username, inputId, isGive) => {
        const input = document.getElementById(inputId);
        const amount = parseFloat(input.value);
        if(isNaN(amount) || amount <= 0) return alert("Введите корректное число");
        
        await window.CyberDB.updateBalance(username, amount, isGive);
        input.value = '';
        refreshAdminPanel();
    };

    window.admToggleBan = async (username, currentBanStatus) => {
        if (currentBanStatus) {
            await window.CyberDB.unbanUser(username);
        } else {
            const code = prompt("Укажите код системной блокировки:", "TERMINAL_VIOLATION_403") || "ERR_403";
            await window.CyberDB.banUser(username, code);
        }
        refreshAdminPanel();
    };

    window.admDeleteUser = async (username) => {
        if (confirm(`Вы действительно хотите безвозвратно стереть ${username} из глобальной сети?`)) {
            await window.CyberDB.deleteUser(username);
            refreshAdminPanel();
        }
    };

    // ОБРАБОТЧИКИ НАЖАТИЙ КНОПОК ПОЛЬЗОВАТЕЛЯ
    loginBtn.addEventListener('click', async () => {
        const user = loginUserInp.value.trim();
        const pass = loginPassInp.value.trim();
        if(!user || !pass) return alert("ОШИБКА: Заполните все поля авторизации!");

        try {
            const res = await window.CyberDB.loginUser(user, pass);
            currentUser = res;
            authScreen.classList.add('hidden');
            
            if (res.isAdmin) {
                adminScreen.classList.remove('hidden');
                refreshAdminPanel();
            } else {
                appScreen.classList.remove('hidden');
                refreshDashboard();
            }
        } catch(err) {
            alert(err.message);
        }
    });

    registerBtn.addEventListener('click', async () => {
        const user = regUserInp.value.trim();
        const pass = regPassInp.value.trim();
        const repPass = regRepeatPassInp.value.trim();

        if(!user || !pass || !repPass) return alert("ОШИБКА: Все регистрационные поля должны быть заполнены!");
        if(pass !== repPass) return alert("ОШИБКА: Введенные крипто-ключи не совпадают!");

        try {
            await window.CyberDB.registerUser(user, pass);
            alert("РЕГИСТРАЦИЯ ЗАВЕРШЕНА СУКСЕССЛИ.\nИдентификатор создан в облаке. Используйте форму входа.");
            regUserInp.value = '';
            regPassInp.value = '';
            regRepeatPassInp.value = '';
        } catch(err) {
            alert(err.message);
        }
    });

    sendBtn.addEventListener('click', async () => {
        const targetId = targetBankIdInp.value.trim();
        const amount = parseFloat(transferAmountInp.value);
        
        if(!targetId || isNaN(amount) || amount <= 0) {
            return alert("ОШИБКА: Некорректные параметры проведения транзакции!");
        }

        try {
            await window.CyberDB.transferFunds(currentUser.username, targetId, amount);
            alert("МЕЖБАНКОВСКИЙ ПЕРЕВОД ВЫПОЛНЕН УСПЕШНО!");
            targetBankIdInp.value = '';
            transferAmountInp.value = '';
            refreshDashboard();
        } catch(err) {
            alert(err.message);
        }
    });

    function performLogout() {
        currentUser = null;
        appScreen.classList.add('hidden');
        adminScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
        loginUserInp.value = '';
        loginPassInp.value = '';
    }

    logoutBtn.addEventListener('click', performLogout);
    adminLogoutBtn.addEventListener('click', performLogout);

    // ФУНКЦИЯ СКРИПТА ДЛЯ СБОРКИ 3D ЗЕМЛИ (THREE.JS)
    function initThreeBackground() {
        const container = document.getElementById('three-bg-container');
        if(!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Создаем каркасную неоновую планету Земля
        const geometry = new THREE.SphereGeometry(1.8, 24, 24);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff66,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        const earth = new THREE.Mesh(geometry, material);
        scene.add(earth);

        // Атмосферные частицы вокруг
        const starsGeom = new THREE.BufferGeometry();
        const starsCount = 250;
        const starPositions = new Float32Array(starsCount * 3);

        for(let i=0; i < starsCount * 3; i++) {
            starPositions[i] = (Math.random() - 0.5) * 10;
        }

        starsGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starsMat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.03, transparent: true, opacity: 0.6 });
        const starField = new THREE.Points(starsGeom, starsMat);
        scene.add(starField);

        // Анимация вращения через GPU
        function animate() {
            requestAnimationFrame(animate);
            earth.rotation.y += 0.0012;
            earth.rotation.x += 0.0003;
            starField.rotation.y -= 0.0005;
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});
