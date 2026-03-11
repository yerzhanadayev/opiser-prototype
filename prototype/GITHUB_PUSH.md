# Публикация на GitHub

В репозитории только папка **prototype** (исходники прототипа). Первый коммит уже создан.

## Что сделать

1. Открой терминал и перейди в папку **prototype**:
   ```bash
   cd /Users/yerzhanadayev/vibe_coding/protocol-new-module-shymkent/prototype
   ```

2. Привяжи свой репозиторий с GitHub (подставь свой URL):
   ```bash
   git remote add origin https://github.com/ВАШ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git
   ```
   Или по SSH:
   ```bash
   git remote add origin git@github.com:ВАШ_ЛОГИН/ИМЯ_РЕПОЗИТОРИЯ.git
   ```

3. Отправь код на GitHub:
   ```bash
   git push -u origin main
   ```

Если на GitHub у репозитория ветка по умолчанию `master`:
   ```bash
   git branch -M master
   git push -u origin master
   ```

После клонирования репозитория с GitHub в нём будет только содержимое prototype (package.json, src/, index.html и т.д.). Запуск: `npm install` → `npm run dev`.
