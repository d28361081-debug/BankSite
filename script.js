document.addEventListener('DOMContentLoaded', async () => {
    // ЭЛЕМЕНТЫ ИНТЕРФЕЙСА
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app-screen');
    const adminScreen = document.getElementById('admin-screen');

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const sendBtn = document.getElementById('send-btn');

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const targetUserInput = document.getElementById('target-user');
    const transferAmountInput = document.getElementById('transfer-amount');

    const userLoginName = document.getElementById('user-login-name');
    const userTechId = document.getElementById('user-tech-id');
    const userBalance = document.getElementById('user-balance');
    const historyList = document.getElementById('history-list');
    const adminUsersList = document.getElementById('admin-users-list');

    let currentUser = null;

    // ПРИНУДИТЕЛЬНО ПОКАЗЫВАЕМ ЭКРАН ВХОДА ПРИ СТАРТЕ
    if (authScreen) {
        authScreen.classList.remove('hidden');
    }

    // ФУНКЦИЯ ОБНОВЛЕНИЯ ЭКРАНА ПОЛЬЗОВАТЕЛЯ
    async function updateDashboard() {
        if (!currentUser) return;
        try {
            const data = await window.CyberDB.getUserData(currentUser.username);
            if (!data) return;
            
            if(userBalance) userBalance.textContent = parseFloat(data.balance).toFixed(2);
            if(userTechId) userTechId.textContent = data.tech_id;
            if(userLoginName) userLoginName.textContent = data.username;

            // Загружаем историю
            const txs = await window.CyberDB.getTransactionHistory(data.username);
            if (historyList) {
                historyList.innerHTML = '';
                txs.forEach(tx => {
                    const li = document.createElement('li');
                    li.className = 'history-item';
                    const isSender = tx.sender === data.username;
                    li.innerHTML = `
                        <span>${isSender ? '➡️ ВЫВОД' : '⬅️ ЗАЧИСЛЕНИЕ'} // ${isSender ? tx.receiver : tx.sender}</span>
                        <span style="color: ${isSender ? '#ff5555' : '#00ff66'}">${isSender ? '-' : '+'}${tx.amount} ¤</span>
                    `;
                    historyList.appendChild(li);
                });
            }
        } catch (err) {
            console.error("Ошибка обновления данных: ", err);
        }
    }

    // ФУНКЦИЯ ОБНОВЛЕНИЯ ПАНЕЛИ АДМИНА
    async function updateAdminPanel() {
        if (!adminUsersList) return;
        try {
            const users = await window.CyberDB.getAllUsers();
            adminUsersList.innerHTML = '';
            users.forEach(u => {
                const div = document.createElement('div');
                div.className = 'admin-user-card';
                div.innerHTML = `
                    <p><strong>Пользователь:</strong> ${u.username} (${u.tech_id})</p>
                    <p>Баланс: <input type="number" value="${u.balance}" id="bal-${u.id}"> ¤ 
                       <button class="admin-action-btn" onclick="saveBalance('${u.username}', 'bal-${u.id}')">Изменить</button>
                    </p>
                    <p>Статус: ${u.is_banned ? `<span style="color:red">БАН (Код: ${u.ban_code})</span>` : '<span style="color:green">АКТИВЕН</span>'}</p>
                    <button class="admin-action-btn" style="background:#ff5555" onclick="toggleBan('${u.username}', ${u.is_banned})">
                        ${u.is_banned ? 'Разбанить' : 'Забанить'}
                    </button>
                    <button class="admin-action-btn" style="background:#444" onclick="deleteUser('${u.username}')">Удалить</button>
                    <hr style="border-color:#333; margin-top:10px;">
                `;
                adminUsersList.appendChild(div);
            });
        } catch (err) {
            console.error("Ошибка админ-панели: ", err);
        }
    }

    // ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ КНОПОК АДМИНА
    window.saveBalance = async (username, inputId) => {
        const val = document.getElementById(inputId).value;
        await window.CyberDB.updateBalance(username, val);
        alert("Баланс изменен!");
        updateAdminPanel();
    };

    window.toggleBan = async (username, isBanned) => {
        if (isBanned) {
            await window.CyberDB.unbanUser(username);
        } else {
            const code = prompt("Введите код блокировки:", "SYSTEM_ERR_403");
            if (code) await window.CyberDB.banUser(username, code);
        }
        updateAdminPanel();
    };

    window.deleteUser = async (username) => {
        if (confirm(`Удалить аккаунт ${username} навсегда?`)) {
            await window.CyberDB.deleteUser(username);
            updateAdminPanel();
        }
    };

    // ОБРАБОТЧИКИ КНОПОК
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const user = usernameInput.value.trim();
            const pass = passwordInput.value.trim();
            if(!user || !pass) return alert("Заполните поля!");

            try {
                const res = await window.CyberDB.loginUser(user, pass);
                currentUser = res;
                authScreen.classList.add('hidden');
                if (res.isAdmin) {
                    adminScreen.classList.remove('hidden');
                    updateAdminPanel();
                } else {
                    appScreen.classList.remove('hidden');
                    updateDashboard();
                }
            } catch(err) {
                alert(err.message);
            }
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const user = usernameInput.value.trim();
            const pass = passwordInput.value.trim();
            if(!user || !pass) return alert("Заполните поля!");

            try {
                await window.CyberDB.registerUser(user, pass);
                alert("Регистрация успешна! Теперь воспользуйтесь кнопкой ВХОД.");
            } catch(err) {
                alert(err.message);
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', async () => {
            const target = targetUserInput.value.trim();
            const amount = parseFloat(transferAmountInput.value);
            if(!target || isNaN(amount) || amount <= 0) return alert("Неверные данные перевода");

            try {
                await window.CyberDB.transferFunds(currentUser.username, target, amount);
                alert("Перевод успешно выполнен!");
                targetUserInput.value = '';
                transferAmountInput.value = '';
                updateDashboard();
            } catch(err) {
                alert(err.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            appScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            currentUser = null;
            adminScreen.classList.add('hidden');
            authScreen.classList.remove('hidden');
        });
    }
});
