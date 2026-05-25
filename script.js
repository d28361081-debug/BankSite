/**
 * ZHOTOMER RP // DATABASE SYSTEM - CORE APPLICATION INTERACTIVITY
 */

// Фейковые (или стартовые) правила для отображения точь-в-точь как на твоем скриншоте!
const ROLES_AND_LAWS = [
    {
        title: "Пункт 1. Уважение и антибуллинг",
        icon: "🚫",
        articles: [
            { code: "Статья 1.0", name: "Неуважение к игрокам или офицерам", desc: "Проявление неуважительного отношения в адрес участников игрового процесса или сотрудников правоохранительных органов.", fine: "Штраф: 6 000" },
            { code: "Статья 1.1", name: "Запрещено оскорблять игроков во время RP-процесса", desc: "Использование оскорбительных выражений и унижение достоинства игроков в рамках активных ролевых ситуаций.", fine: "Штраф: 6 000" }
        ]
    },
    {
        title: "Пункт 2. Правила дорожного движения",
        icon: "🚘",
        articles: [
            { code: "Статья 1.7", name: "Неправильная парковка (без аварийной сигнализации)", desc: "Остановка или бросание транспортного средства без включенной аварийной сигнализации на тротуарах, газонах, в туннелях, садах, парках, на кольцевых развязках, посреди дороги, на рельсах.", fine: "Штраф: 4 000" },
            { code: "Статья 1.8", name: "Езда без включённых фар с 17:00 до 08:00", desc: "Движение на транспортном средстве в темное время суток без использования ближнего или дальнего освещения.", fine: "Штраф: 4 000" }
        ]
    },
    {
        title: "Пункт 3. Оружие и лицензии",
        icon: "⚔️",
        articles: [
            { code: "Статья 3.1", name: "Открытое ношение оружия", desc: "Демонстрация огнестрельного или холодного оружия в людных и общественных местах.", fine: "Штраф: 6 000" },
            { code: "Статья 3.2", name: "Стрельба без RP-причины", desc: "Применение огнестрельного оружия без веских внутриигровых (ролевых) оснований.", fine: "Тюремное заключение и изъятие лицензий", isJail: true }
        ]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    let currentUser = null;

    // Инициализация интерфейса
    renderLawsCards(ROLES_AND_LAWS);
    initThreeBackground();

    // Скрытие загрузчика
    setTimeout(() => {
        const loader = document.getElementById('preloader');
        loader.style.opacity = '0';
        setTimeout(() => loader.classList.add('hidden'), 600);
    }, 1500);

    /* ================= ДИНАМИЧЕСКИЙ ПОИСК И КАРТОЧКИ (КАК НА СКРИНШОТЕ) ================= */
    function renderLawsCards(data) {
        const container = document.getElementById('laws-playground');
        container.innerHTML = '';

        data.forEach(section => {
            const card = document.createElement('div');
            card.className = 'law-card';
            
            let articlesHTML = '';
            section.articles.forEach(art => {
                articlesHTML += `
                    <div class="article-item">
                        <div class="article-title">${art.code}: ${art.name}</div>
                        <div class="article-desc">${art.desc}</div>
                        <div class="fine-badge ${art.isJail ? 'jail' : ''}">
                            ${art.isJail ? '⛓️' : '💳'} ${art.fine}
                        </div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="law-card-header">
                    <span class="law-icon">${section.icon}</span>
                    <h3>${section.title}</h3>
                </div>
                ${articlesHTML}
            `;
            container.appendChild(card);
        });
    }

    // Живой поиск по строке ввода
    document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = ROLES_AND_LAWS.map(section => {
            const matchedArticles = section.articles.filter(art => 
                art.name.toLowerCase().includes(query) || 
                art.code.toLowerCase().includes(query) || 
                art.desc.toLowerCase().includes(query) ||
                art.fine.toLowerCase().includes(query)
            );
            
            if (section.title.toLowerCase().includes(query) || matchedArticles.length > 0) {
                return {
                    ...section,
                    articles: matchedArticles.length > 0 ? matchedArticles : section.articles
                };
            }
            return null;
        }).filter(item => item !== null);

        renderLawsCards(filtered);
    });

    /* ================= ЛОГИКА ОКНА УПРАВЛЕНИЯ И АВТОРИЗАЦИИ ================= */
    const overlay = document.getElementById('modal-overlay');
    const authBlock = document.getElementById('auth-card-block');
    const dashBlock = document.getElementById('dashboard-card-block');
    const adminBlock = document.getElementById('admin-card-block');

    document.getElementById('trigger-auth-btn').addEventListener('click', () => {
        overlay.classList.remove('hidden');
        if (currentUser) {
            if (currentUser.isAdmin) { openAdminPanel(); } else { openUserDash(); }
        } else {
            authBlock.classList.remove('hidden');
        }
    });

    // Переключение Вход / Регистрация
    const tLogin = document.getElementById('tab-login');
    const tReg = document.getElementById('tab-register');
    const fLogin = document.getElementById('login-form');
    const fReg = document.getElementById('register-form');

    tLogin.addEventListener('click', () => { tLogin.classList.add('active'); tReg.classList.remove('active'); fLogin.classList.remove('hidden'); fReg.classList.add('hidden'); });
    tReg.addEventListener('click', () => { tReg.classList.add('active'); tLogin.classList.remove('active'); fReg.classList.remove('hidden'); fLogin.classList.add('hidden'); });

    // Закрытие окон
    const closeModalElements = ['close-modal', 'close-dash', 'close-admin', 'modal-overlay'];
    closeModalElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                if (e.target.id === id || el.classList.contains('close-modal-btn')) {
                    overlay.classList.add('hidden');
                }
            });
        }
    });

    /* ================= ВЗАИМОДЕЙСТВИЕ С БАЗОЙ ДАННЫХ SUPABASE ================= */
    // Регистрация
    fReg.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('reg-username').value.trim();
        const p1 = document.getElementById('reg-password').value;
        const p2 = document.getElementById('reg-password-repeat').value;

        if (p1 !== p2) return showToast("Пароли не совпадают!", "error");

        showToast("Синхронизация с облаком...", "info");
        const res = await Database.registerUser(user, p1);
        if (res.success) {
            showToast(`Успешно! Ваш ID: ${res.user.id}`, "success");
            fReg.reset();
            tLogin.click();
        } else { showToast(res.message, "error"); }
    });

    // Логин
    fLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('login-username').value.trim();
        const p = document.getElementById('login-password').value;

        showToast("Авторизация терминала...", "info");
        const res = await Database.loginUser(user, p);
        if (res.success) {
            currentUser = res.user;
            authBlock.classList.add('hidden');
            updateHeaderNavZone();
            if (currentUser.isAdmin) { openAdminPanel(); } else { openUserDash(); }
        } else {
            if (res.isBanned) document.getElementById('ban-screen').classList.remove('hidden');
            else showToast(res.message, "error");
        }
    });

    // Перевод денег
    document.getElementById('transfer-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = document.getElementById('transfer-target').value.trim();
        const sum = document.getElementById('transfer-sum').value;

        showToast("Процессинг транзакции...", "info");
        const res = await Database.executeTransaction(currentUser.id, target, sum);
        if (res.success) {
            showToast("Перевод успешно завершен!", "success");
            document.getElementById('transfer-form').reset();
            await syncCurrentUserData();
        } else { showToast(res.message, "error"); }
    });

    async function syncCurrentUserData() {
        if (!currentUser) return;
        const fresh = await Database.getUserById(currentUser.id);
        if (!fresh || fresh.isBanned) { window.location.reload(); return; }
        
        document.getElementById('dash-balance-amount').innerText = parseFloat(fresh.balance).toLocaleString();
        await renderTxHistoryHTML();
    }

    async function renderTxHistoryHTML() {
        const allTx = await Database.getTransactions();
        const rows = document.getElementById('tx-history-rows');
        rows.innerHTML = '';

        const mine = allTx.filter(t => t.senderId === currentUser.id || t.receiverId === currentUser.id);
        if (mine.length === 0) {
            rows.innerHTML = `<tr><td style="color:var(--text-muted); text-align:center;">История пуста</td></tr>`;
            return;
        }

        mine.forEach(t => {
            const isIn = t.receiverId === currentUser.id;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:${isIn ? 'var(--neon-green)' : 'var(--neon-red)'}">${isIn ? '⚡ IN' : '🔻 OUT'}</td>
                <td>${isIn ? t.senderName : t.receiverName}</td>
                <td style="text-align:right; font-weight:700;">${isIn ? '+' : '-'}${parseFloat(t.amount).toLocaleString()}</td>
            `;
            rows.appendChild(tr);
        });
    }

    function openUserDash() {
        dashBlock.classList.remove('hidden');
        adminBlock.classList.add('hidden');
        document.getElementById('dash-username').innerText = currentUser.username.toUpperCase();
        document.getElementById('dash-bank-id').innerText = currentUser.id;
        syncCurrentUserData();
    }

    function updateHeaderNavZone() {
        const zone = document.getElementById('auth-zone');
        if (currentUser) {
            zone.innerHTML = `<button class="nav-login-btn" style="border-color:var(--neon-cyan); color:var(--neon-cyan)" id="nav-profile-btn">${currentUser.username.toUpperCase()}</button>`;
            document.getElementById('nav-profile-btn').addEventListener('click', () => {
                overlay.classList.remove('hidden');
                if (currentUser.isAdmin) openAdminPanel(); else openUserDash();
            });
        }
    }

    /* ================= МОДУЛЬ АДМИНИСТРАТОРА ================= */
    async function openAdminPanel() {
        adminBlock.classList.remove('hidden');
        dashBlock.classList.add('hidden');
        await syncAdminDataRows();
    }

    async function syncAdminDataRows() {
        const users = await Database.getUsers();
        const tbody = document.getElementById('admin-users-rows');
        tbody.innerHTML = '';

        users.forEach(u => {
            if (u.isAdmin) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color:var(--neon-gold)">${u.id}</td>
                <td><b>${u.username}</b></td>
                <td>${parseFloat(u.balance).toLocaleString()} N$</td>
                <td style="color:${u.isBanned ? 'var(--neon-red)' : 'var(--neon-green)'}">${u.isBanned ? 'BANNED' : 'ACTIVE'}</td>
                <td>
                    <button class="admin-btn-inline" onclick="triggerAdminControl('give', '${u.id}')">+$</button>
                    <button class="admin-btn-inline" style="color:var(--neon-red)" onclick="triggerAdminControl('ban', '${u.id}', ${u.isBanned})">
                        ${u.isBanned ? 'UNBAN' : 'BAN'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.triggerAdminControl = async function(action, id, state) {
        if (action === 'give') {
            const cash = prompt("Укажите сумму начисления:");
            if (!cash || isNaN(cash)) return;
            const user = await Database.getUserById(id);
            await Database.adminUpdateUser(id, { balance: parseFloat(user.balance) + parseFloat(cash) });
            showToast("Баланс изменен", "success");
        } else if (action === 'ban') {
            await Database.adminUpdateUser(id, { isBanned: !state });
            showToast("Статус аккаунта изменен", "info");
        }
        await syncAdminDataRows();
    };

    // Выходы
    const logoutAction = () => { currentUser = null; window.location.reload(); };
    document.getElementById('logout-btn').addEventListener('click', logoutAction);
    document.getElementById('admin-logout-btn').addEventListener('click', logoutAction);
    document.getElementById('ban-close-app').addEventListener('click', logoutAction);

    /* ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ================= */
    function showToast(text, type = "info") {
        const box = document.getElementById('notify-box');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.innerText = text;
        box.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
    }

    // Реалтайм-обновление (Цикл опроса БД раз в 5 секунд)
    setInterval(async () => {
        if (!currentUser) return;
        if (currentUser.isAdmin) { await syncAdminDataRows(); } else { await syncCurrentUserData(); }
    }, 5000);

    /* ================= 3D ЭФФЕКТЫ THREE.JS ================= */
    function initThreeBackground() {
        const host = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x040907, 0.012);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 170;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        host.appendChild(renderer.domElement);

        const lightGreen = new THREE.DirectionalLight(0x00ff96, 0.6);
        lightGreen.position.set(60, 40, 40);
        scene.add(lightGreen);

        const lightCyan = new THREE.DirectionalLight(0x00f0ff, 0.4);
        lightCyan.position.set(-60, -40, -40);
        scene.add(lightCyan);

        // Кибер-сфера (AAA Wireframe стиль)
        const geo = new THREE.SphereGeometry(65, 40, 40);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff96, wireframe: true, transparent: true, opacity: 0.15 });
        const sphere = new THREE.Mesh(geo, mat);
        scene.add(sphere);

        // Облако движущихся частиц (Субтитры космоса)
        const partGeo = new THREE.BufferGeometry();
        const count = 400;
        const positions = new Float32Array(count * 3);
        for(let i=0; i<count*3; i++) positions[i] = (Math.random() - 0.5) * 400;
        partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const partMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 1.5, transparent: true, opacity: 0.5 });
        const particles = new THREE.Points(partGeo, partMat);
        scene.add(particles);

        function renderLoop() {
            requestAnimationFrame(renderLoop);
            sphere.rotation.y += 0.001;
            sphere.rotation.x += 0.0002;
            particles.rotation.y -= 0.0003;
            renderer.render(scene, camera);
        }
        renderLoop();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});
