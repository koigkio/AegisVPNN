const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 650,
    resizable: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
  win.setMenu(null);
  // win.webContents.openDevTools(); // Раскомментируйте для отладки
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 480,
    height: 680,
    minWidth: 400,
    minHeight: 500,
    resizable: true,
    frame: true,
    transparent: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: false, // Сначала скрываем окно
    backgroundColor: '#0A192F'
  });

  // Загружаем HTML файл
  mainWindow.loadFile('index.html')
    .then(() => {
      console.log('index.html loaded successfully');
    })
    .catch((err) => {
      console.error('Failed to load index.html:', err);
    });

  // Показываем окно когда контент загружен
  mainWindow.once('ready-to-show', () => {
    console.log('Window is ready to show');
    mainWindow.show();
    mainWindow.focus();
    
    // Открываем DevTools для отладки (можно закомментировать)
    // mainWindow.webContents.openDevTools();
  });

  // Убираем меню
  mainWindow.setMenu(null);
  
  // Обработка закрытия окна
  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
  
  console.log('Window created successfully');
}

// Обработчики событий Electron
app.whenReady().then(() => {
  console.log('Electron app is ready');
  createWindow();
  
  // Для MacOS: создаем окно если все закрыты
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Закрываем приложение когда все окна закрыты (кроме Mac)
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработка ошибок
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Render process gone:', details);
});

app.on('child-process-gone', (event, details) => {
  console.error('Child process gone:', details);
});

console.log('AegisVPN starting...');