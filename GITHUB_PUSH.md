# Публикация на GitHub и GitHub Pages

В репозитории уже есть **workflow** `.github/workflows/deploy-pages.yml`: при пуше в `main` собирается **prototype** (Vite) и публикуется в **GitHub Pages**.

## Важно: имя репозитория

В `prototype/vite.config.ts` задано `base: "/opiser-prototype/"`.  
Сайт будет открываться по адресу:

`https://ВАШ_ЛОГИН.github.io/opiser-prototype/`

Поэтому репозиторий на GitHub лучше назвать **`opiser-prototype`**.  
Если имя другое — измените `base` в `prototype/vite.config.ts` на `"/ИМЯ-РЕПО/"` и закоммитьте.

## Первый push

1. Создайте на GitHub новый репозиторий (например `opiser-prototype`), **без** README (или потом сделайте `git pull --rebase` при конфликте).

2. В корне проекта:

```bash
cd /Users/yerzhanadayev/vibe_coding/protocol-new-module-shymkent
git remote add origin https://github.com/ВАШ_ЛОГИН/opiser-prototype.git
git push -u origin main
```

По SSH:

```bash
git remote add origin git@github.com:ВАШ_ЛОГИН/opiser-prototype.git
git push -u origin main
```

## Включить GitHub Pages

1. Репозиторий на GitHub → **Settings** → **Pages**.
2. **Build and deployment** → **Source**: выберите **GitHub Actions** (не Branch).
3. После первого успешного запуска workflow сайт появится по ссылке вида  
   `https://ВАШ_ЛОГИН.github.io/opiser-prototype/`

Проверить запуск: вкладка **Actions** — workflow «Deploy to GitHub Pages».

## Только папка prototype

Если нужен репозиторий **только** с прототипом (без ТЗ и документов), можно пушить из подпапки `prototype` в отдельный репо — тогда `base` можно сменить на `"/"` если репозиторий называется `USERNAME.github.io` или задать `base: "/repo-name/"` как сейчас.
