const SUPABASE_URL = "https://aunfrnyhbfcxgdfhvcox.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_8Xf1-4RnW0-f09idcW76vQ_JU5_Iqqe";

const ADMIN_USERNAME = "admin21";
const ADMIN_PASSWORD_CRYPT = "admin210412";

async function supabaseFetch(endpoint, options = {}) {
    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
    
    // ДОБАВЛЯЕМ ОБЯЗАТЕЛЬНЫЕ НАСТРОЙКИ БЕЗОПАСНОСТИ ДЛЯ БРАУЗЕРОВ
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        ...options,
        mode: 'cors', // Разрешает запросы между разными сайтами (Render -> Supabase)
        headers: { ...headers, ...options.headers }
    });
    
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Ошибка базы данных");
    }
    return response.json();
}

window.CyberDB = {
    async loginUser(username, password) {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD_CRYPT) {
            return { username: ADMIN_USERNAME, role: 'admin', isAdmin: true };
        }
        const users = await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}&select=*`);
        if (users.length === 0) throw new Error("Пользователь не найден");
        const user = users[0];
        if (user.is_banned) throw new Error(`TERMINAL_BANNED // CODE: ${user.ban_code}`);
        if (user.password !== password) throw new Error("Неверный пароль");
        return { ...user, role: 'user', isAdmin: false };
    },

    async registerUser(username, password) {
        if (username.toLowerCase() === ADMIN_USERNAME) throw new Error("Имя зарезервировано");
        if (username.length < 3) throw new Error("Имя слишком короткое");
        const existing = await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}&select=id`);
        if (existing.length > 0) throw new Error("Этот логин уже занят");

        const techId = "TRX-" + Math.floor(100000 + Math.random() * 900000);
        const newUser = {
            username: username,
            password: password,
            tech_id: techId,
            balance: 1000,
            is_banned: false,
            ban_code: ""
        };
        const created = await supabaseFetch("users", {
            method: "POST",
            body: JSON.stringify(newUser)
        });
        return created[0];
    },

    async getUserData(username) {
        const users = await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}&select=*`);
        if (users.length === 0) return null;
        return users[0];
    },

    async transferFunds(senderUsername, receiverUsername, amount) {
        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) throw new Error("Неверная сумма");
        if (senderUsername === receiverUsername) throw new Error("Нельзя перевести себе");

        const senderData = await this.getUserData(senderUsername);
        if (!senderData || senderData.balance < amount) throw new Error("Недостаточно средств");

        const receiverData = await this.getUserData(receiverUsername);
        if (!receiverData) throw new Error("Получатель не найден");

        await supabaseFetch(`users?username=eq.${encodeURIComponent(senderUsername)}`, {
            method: "PATCH",
            body: JSON.stringify({ balance: senderData.balance - amount })
        });
        await supabaseFetch(`users?username=eq.${encodeURIComponent(receiverUsername)}`, {
            method: "PATCH",
            body: JSON.stringify({ balance: receiverData.balance + amount })
        });

        await supabaseFetch("transactions", {
            method: "POST",
            body: JSON.stringify({
                sender: senderUsername,
                receiver: receiverUsername,
                amount: amount,
                timestamp: new Date().toLocaleTimeString()
            })
        });
        return true;
    },

    async getTransactionHistory(username) {
        return await supabaseFetch(`transactions?or=(sender.eq.${encodeURIComponent(username)},receiver.eq.${encodeURIComponent(username)})&order=id.desc&limit=20`);
    },

    async getAllUsers() {
        return await supabaseFetch("users?order=username.asc");
    },

    async updateBalance(username, newBalance) {
        await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}`, {
            method: "PATCH",
            body: JSON.stringify({ balance: parseFloat(newBalance) })
        });
        return true;
    },

    async banUser(username, banCode) {
        await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}`, {
            method: "PATCH",
            body: JSON.stringify({ is_banned: true, ban_code: banCode })
        });
        return true;
    },

    async unbanUser(username) {
        await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}`, {
            method: "PATCH",
            body: JSON.stringify({ is_banned: false, ban_code: "" })
        });
        return true;
    },

    async deleteUser(username) {
        await supabaseFetch(`users?username=eq.${encodeURIComponent(username)}`, {
            method: "DELETE"
        });
        return true;
    }
};
