// Основной скрипт рендер-процесса
class AegisVPN {
    constructor() {
        this.isConnected = false;
        this.connectionTime = 0;
        this.dataUploaded = 0;
        this.dataDownloaded = 0;
        this.timer = null;
        this.connectTimer = null;
        
        this.init();
    }

    async init() {
        // Загрузка конфигурации
        await this.loadConfig();
        
        // Инициализация событий
        this.initEvents();
        
        // Обновление времени
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        
        // Проверка статуса VPN
        this.checkVPNStatus();
        
        // Обновление версии
        this.updateVersion();
    }

    async loadConfig() {
        try {
            const config = await window.api.loadConfig();
            
            document.getElementById('server').value = config.server || '';
            document.getElementById('port').value = config.port || '51820';
            document.getElementById('publicKey').value = config.publicKey || '';
            document.getElementById('privateKey').value = config.privateKey || '';
            document.getElementById('presharedKey').value = config.presharedKey || '';
            document.getElementById('autoConnect').checked = config.autoConnect || false;
            
            console.log('Конфигурация загружена:', config);
        } catch (error) {
            console.error('Ошибка загрузки конфигурации:', error);
        }
    }

    async saveConfig() {
        try {
            const config = {
                server: document.getElementById('server').value.trim(),
                port: document.getElementById('port').value.trim(),
                publicKey: document.getElementById('publicKey').value.trim(),
                privateKey: document.getElementById('privateKey').value.trim(),
                presharedKey: document.getElementById('presharedKey').value.trim(),
                autoConnect: document.getElementById('autoConnect').checked
            };

            // Валидация
            if (!config.server) {
                this.showMessage('Ошибка', 'Пожалуйста, укажите сервер');
                return;
            }

            await window.api.saveConfig(config);
            
            // Визуальная обратная связь
            const saveBtn = document.getElementById('btnSave');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Сохранено';
            saveBtn.classList.add('btn-success');
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('btn-success');
            }, 2000);
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showMessage('Ошибка', 'Не удалось сохранить конфигурацию');
        }
    }

    async connect() {
        if (this.isConnected) return;
        
        // Собираем конфигурацию
        const config = {
            server: document.getElementById('server').value.trim(),
            port: document.getElementById('port').value.trim(),
            publicKey: document.getElementById('publicKey').value.trim(),
            privateKey: document.getElementById('privateKey').value.trim(),
            presharedKey: document.getElementById('presharedKey').value.trim()
        };

        // Валидация
        if (!config.server || !config.publicKey || !config.privateKey) {
            this.showMessage('Ошибка', 'Заполните все обязательные поля');
            return;
        }

        try {
            // Сохраняем конфигурацию перед подключением
            await this.saveConfig();
            
            // Меняем состояние интерфейса
            this.setConnectingState(true);
            
            // Вызываем API подключения
            const result = await window.api.connectVPN(config);
            
            if (result.success) {
                this.isConnected = true;
                this.setConnectedState(true);
                this.startConnectionTimer();
                this.startTrafficSimulation();
                
                this.showMessage('Успех', 'VPN успешно подключен');
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('Ошибка подключения:', error);
            this.showMessage('Ошибка подключения', error.message || 'Неизвестная ошибка');
            this.setConnectingState(false);
        }
    }

    async disconnect() {
        if (!this.isConnected) return;
        
        try {
            // Меняем состояние интерфейса
            this.setConnectingState(false);
            
            // Вызываем API отключения
            const result = await window.api.disconnectVPN();
            
            if (result.success) {
                this.isConnected = false;
                this.setConnectedState(false);
                this.stopConnectionTimer();
                this.stopTrafficSimulation();
                
                this.showMessage('Информация', 'VPN отключен');
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            console.error('Ошибка отключения:', error);
            this.showMessage('Ошибка', 'Не удалось отключиться от VPN');
        }
    }

    setConnectingState(connecting) {
        const btnConnect = document.getElementById('btnConnect');
        const btnDisconnect = document.getElementById('btnDisconnect');
        
        if (connecting) {
            btnConnect.disabled = true;
            btnConnect.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Подключение...';
        } else {
            btnConnect.disabled = false;
            btnConnect.innerHTML = '<i class="fas fa-link"></i> Подключить';
        }
    }

    setConnectedState(connected) {
        const statusText = document.getElementById('statusText');
        const connectionLine = document.getElementById('connectionLine');
        const btnConnect = document.getElementById('btnConnect');
        const btnDisconnect = document.getElementById('btnDisconnect');
        
        if (connected) {
            statusText.textContent = 'Подключено';
            statusText.className = 'status-value connected';
            connectionLine.parentElement.classList.add('connected');
            btnConnect.disabled = true;
            btnDisconnect.disabled = false;
        } else {
            statusText.textContent = 'Отключено';
            statusText.className = 'status-value disconnected';
            connectionLine.parentElement.classList.remove('connected');
            btnConnect.disabled = false;
            btnDisconnect.disabled = true;
        }
    }

    startConnectionTimer() {
        this.connectionTime = 0;
        clearInterval(this.connectTimer);
        
        this.connectTimer = setInterval(() => {
            this.connectionTime++;
            this.updateConnectionTime();
        }, 1000);
    }

    stopConnectionTimer() {
        clearInterval(this.connectTimer);
        this.connectionTime = 0;
        this.updateConnectionTime();
    }

    updateConnectionTime() {
        const hours = Math.floor(this.connectionTime / 3600);
        const minutes = Math.floor((this.connectionTime % 3600) / 60);
        const seconds = this.connectionTime % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('connectionTime').textContent = timeString;
    }

    startTrafficSimulation() {
        this.dataUploaded = 0;
        this.dataDownloaded = 0;
        
        clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            // Генерация случайного трафика
            const uploadSpeed = Math.floor(Math.random() * 500) + 100;
            const downloadSpeed = Math.floor(Math.random() * 1000) + 500;
            
            this.dataUploaded += uploadSpeed / 8; // Байты
            this.dataDownloaded += downloadSpeed / 8;
            
            // Обновление UI
            document.getElementById('uploadSpeed').textContent = `${uploadSpeed} Kbps`;
            document.getElementById('downloadSpeed').textContent = `${downloadSpeed} Kbps`;
            
            const totalMB = ((this.dataUploaded + this.dataDownloaded) / 1024 / 1024).toFixed(2);
            document.getElementById('dataUsed').textContent = `${totalMB} MB`;
            
        }, 1000);
    }

    stopTrafficSimulation() {
        clearInterval(this.timer);
        
        document.getElementById('uploadSpeed').textContent = '0 Kbps';
        document.getElementById('downloadSpeed').textContent = '0 Kbps';
        document.getElementById('dataUsed').textContent = '0 MB';
    }

    async checkVPNStatus() {
        try {
            const status = await window.api.getVPNStatus();
            
            if (status.connected && !this.isConnected) {
                // VPN был подключен до запуска приложения
                this.isConnected = true;
                this.setConnectedState(true);
                this.startConnectionTimer();
                this.startTrafficSimulation();
            }
        } catch (error) {
            console.error('Ошибка проверки статуса:', error);
        }
    }

    initEvents() {
        // Кнопка сохранения
        document.getElementById('btnSave').addEventListener('click', () => this.saveConfig());
        
        // Кнопка подключения
        document.getElementById('btnConnect').addEventListener('click', () => this.connect());
        
        // Кнопка отключения
        document.getElementById('btnDisconnect').addEventListener('click', () => this.disconnect());
        
        // Автоподключение при изменении чекбокса
        document.getElementById('autoConnect').addEventListener('change', (e) => {
            this.saveConfig();
        });
        
        // Быстрое сохранение при изменении полей
        ['server', 'port', 'publicKey', 'privateKey', 'presharedKey'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('blur', () => {
                // Сохраняем только если есть изменения
                if (element.value.trim() !== '') {
                    setTimeout(() => this.saveConfig(), 1000);
                }
            });
        });
        
        // Обработчики клавиш
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveConfig();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.connect();
            }
            if (e.key === 'F6') {
                e.preventDefault();
                this.disconnect();
            }
        });
        
        // Подписка на события от main процесса
        window.api.onAutoConnect(() => {
            if (document.getElementById('autoConnect').checked) {
                setTimeout(() => this.connect(), 2000);
            }
        });
        
        window.api.onVPNConnect(() => this.connect());
        window.api.onVPNDisconnect(() => this.disconnect());
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    updateVersion() {
        // В реальном приложении берем из package.json
        document.getElementById('version').textContent = 'v1.0.0';
    }

    showMessage(title, message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-header">
                <i class="fas fa-info-circle"></i>
                <span>${title}</span>
                <button class="notification-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="notification-body">${message}</div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(30, 41, 59, 0.95);
            border: 1px solid var(--accent-blue);
            border-radius: 8px;
            padding: 15px;
            width: 300px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        // Кнопка закрытия
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Автоматическое закрытие через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const eyeBtn = field.parentElement.querySelector('.btn-eye i');
        
        if (field.type === 'password') {
            field.type = 'text';
            eyeBtn.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            eyeBtn.className = 'fas fa-eye';
        }
    }
}

// Утилиты
function togglePassword(fieldId) {
    const app = window.aegisVPN;
    app.togglePassword(fieldId);
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.aegisVPN = new AegisVPN();
});