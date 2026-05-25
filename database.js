/**
 * TRUSTIX KERNEL DATABASE INTERFACE (LocalStorage Virtual Simulation)
 */

const DB = {
    // Получить все сущности
    getRawData: function() {
        let data = localStorage.getItem('trustix_matrix_db');
        if (!data) {
            // Начальная инициализация Системы
            const initialDB = {
                users: {
                    "admin21": {
                        username: "admin21",
                        password: "admin210412",
                        bankId: "MASTER_CORE",
                        balance: Infinity,
                        isBanned: false,
                        isAdmin: true
                    }
                },
                transactions: []
            };
            localStorage.setItem('trustix_matrix_db', JSON.stringify(initialDB));
            return initialDB;
        }
        return JSON.parse(data);
    },

    // Сохранить состояние в ядро памяти
    saveRawData: function(data) {
        localStorage.setItem('trustix_matrix_db', JSON.stringify(data));
    },

    // Поиск пользователя по логину
    findUser: function(username) {
        const db = this.getRawData();
        return db.users[username] || null;
    },

    // Поиск пользователя по Bank ID
    findUserById: function(bankId) {
        const db = this.getRawData();
        return Object.values(db.users).find(u => u.bankId === bankId) || null;
    },

    // Запись нового контрагента в сеть
    createUser: function(username, password) {
        const db = this.getRawData();
        if (db.users[username]) return false;

        // Генерация уникального 8-значного кода
        let uniqueId;
        while (true) {
            uniqueId = Math.floor(10000000 + Math.random() * 90000000).toString();
            if (!Object.values(db.users).some(u => u.bankId === uniqueId)) break;
        }

        db.users[username] = {
            username: username,
            password: password,
            bankId: uniqueId,
            balance: 0.00,
            isBanned: false,
            isAdmin: false
        };

        this.saveRawData(db);
        return db.users[username];
    },

    // Обновить баланс сущности
    updateBalance: function(bankId, newBalance) {
        const db = this.getRawData();
        const user = Object.values(db.users).find(u => u.bankId === bankId);
        if (user) {
            if (user.isAdmin) return; // У админа бесконечность
            db.users[user.username].balance = parseFloat(newBalance);
            this.saveRawData(db);
        }
    },

    // Переключатель статуса блокировки
    setBanStatus: function(bankId, status) {
        const db = this.getRawData();
        const user = Object.values(db.users).find(u => u.bankId === bankId);
        if (user && !user.isAdmin) {
            db.users[user.username].isBanned = status;
            this.saveRawData(db);
            return true;
        }
        return false;
    },

    // Стирание учетной записи из ядра
    deleteUser: function(bankId) {
        const db = this.getRawData();
        const user = Object.values(db.users).find(u => u.bankId === bankId);
        if (user && !user.isAdmin) {
            delete db.users[user.username];
            this.saveRawData(db);
            return true;
        }
        return false;
    },

    // Добавление транзакции в общую цепочку блоков (Ledger)
    addTransaction: function(senderId, senderName, receiverId, receiverName, amount) {
        const db = this.getRawData();
        const newTx = {
            id: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            timestamp: new Date().toLocaleString(),
            senderId,
            senderName,
            receiverId,
            receiverName,
            amount: parseFloat(amount)
        };
        db.transactions.unshift(newTx); // Новые транзакции сверху
        this.saveRawData(db);
    },

    // Получить историю транзакций конкретной личности
    getTransactionsForUser: function(bankId) {
        const db = this.getRawData();
        return db.transactions.filter(tx => tx.senderId === bankId || tx.receiverId === bankId);
    }
};