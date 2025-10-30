<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Прямая Загрузка Видео для CPM Bot</title>
    
    <script type="module">
        // Импорт основных функций
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
        // Импорт Storage SDK
        import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

        // === Firebase Config (CPM Project) ===
        const firebaseConfig = {
            apiKey: "AIzaSyCwl4hXA-UVi6gHSDwIxONFeOBoIMD7H5w",
            authDomain: "cpm-project1.firebaseapp.com",
            projectId: "cpm-project1",
            // 🛑 ФАКТИЧЕСКОЕ ИМЯ БАКЕТА: cpm-project1.firebasestorage.app
            storageBucket: "cpm-project1.firebasestorage.app", 
            messagingSenderId: "1071894518061",
            appId: "1:1071894518061:web:9eb187d2f6101efe911ba4",
            measurementId: "G-SJWFD8DLGQ"
        };
        
        // === Init Firebase (Анонимно) ===
        const app = initializeApp(firebaseConfig);
        const storage = getStorage(app); 
        
        // -------------------------------------------------------------
        // --- Логика загрузки файла ---
        // -------------------------------------------------------------
        
        document.addEventListener('DOMContentLoaded', () => {
            const fileInput = document.getElementById('fileInput');
            const uploadButton = document.getElementById('uploadButton');
            const statusDiv = document.getElementById('status');
            const urlOutput = document.getElementById('urlOutput');

            uploadButton.addEventListener('click', uploadFile);

            async function uploadFile() {
                const file = fileInput.files[0];

                if (!file) {
                    statusDiv.innerHTML = '<span style="color: red;">⚠️ Пожалуйста, выберите файл для загрузки.</span>';
                    return;
                }

                statusDiv.innerHTML = '⏳ Начало загрузки...';
                uploadButton.disabled = true;
                urlOutput.style.display = 'none';

                // 1. Создаем уникальный путь для файла (папка: 'cpm_uploads')
                const uniqueId = Date.now();
                const fileExtension = file.name.split('.').pop();
                const storageRef = ref(storage, `cpm_uploads/${uniqueId}.${fileExtension}`);

                // 2. Запускаем загрузку 
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on('state_changed', 
                    (snapshot) => {
                        // Обновление прогресса
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        statusDiv.innerHTML = `⏳ Загрузка: ${progress.toFixed(0)}%`;
                    }, 
                    (error) => {
                        // Обработка ошибок
                        statusDiv.innerHTML = `<span style="color: red;">❌ Ошибка загрузки: ${error.message}</span>`;
                        uploadButton.disabled = false;
                        console.error("Upload error:", error);
                    }, 
                    async () => {
                        // 3. Загрузка завершена: получаем публичный URL
                        statusDiv.innerHTML = '<span style="color: green;">✅ Загрузка завершена!</span> Получение ссылки...';
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            
                            // 4. Выводим URL и инструкции
                            urlOutput.value = downloadURL;
                            urlOutput.style.display = 'block';
                            statusDiv.innerHTML = '<span style="color: green;">✅ Успешно!</span> **Скопируйте ссылку ниже и вставьте ее в Telegram-бот.**';
                            uploadButton.disabled = true;
                            
                        } catch (e) {
                            statusDiv.innerHTML = `<span style="color: red;">❌ Ошибка получения ссылки: ${e.message}</span>`;
                            uploadButton.disabled = false;
                        }
                    }
                );
            }
        });
    </script>
    
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            min-height: 100vh;
            margin: 0;
            background-color: #f4f4f9;
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .container {
            width: 90%;
            max-width: 600px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #4CAF50;
            font-size: 1.8em;
            margin-bottom: 20px;
        }
        input[type="file"] {
            display: block;
            margin: 20px auto;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            width: 100%;
            max-width: 350px;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            transition: background-color 0.3s;
        }
        button:hover:not(:disabled) {
            background-color: #45a049;
        }
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        #status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 6px;
            background-color: #e9e9f0;
            min-height: 40px;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
        }
        #urlOutput {
            width: 100%;
            padding: 10px;
            margin-top: 15px;
            border: 1px solid #4CAF50;
            border-radius: 6px;
            background-color: #e8f5e9;
            font-family: monospace;
            cursor: pointer;
            text-align: left;
            resize: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⬆️ Прямая Загрузка Видео</h1>
        <p>Используйте эту форму для загрузки видеофайлов любого размера ($ > 50 \text{ МБ}$) напрямую в Firebase Storage.</p>
        
        <input type="file" id="fileInput" accept="video/*">
        <button id="uploadButton">Загрузить Видео</button>
        
        <div id="status">Ожидание выбора файла...</div>
        
        <textarea id="urlOutput" rows="3" readonly style="display: none;" 
                  onclick="this.select(); document.execCommand('copy'); alert('Ссылка скопирована!');"></textarea>
    </div>
</body>
</html>
