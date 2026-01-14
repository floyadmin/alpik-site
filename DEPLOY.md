# Деплой / обновление сайта

Сайт собирается командой `npm run build` в папку `dist/`.

## Cloudflare Pages (рекомендуется)

### Вариант A — через Git (автообновление)
1. В Cloudflare Pages откройте проект → **Settings → Builds & deployments**.
2. Укажите:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. В **Settings → Environment variables** (если нужно) добавьте:
   - `SITE_GTM_ID` (пример: `GTM-XXXXXXX`)
   - `SITE_GADS_ID` (пример: `AW-123456789`)
4. Закоммитьте и отправьте изменения в ветку, к которой привязан Pages — деплой выполнится автоматически.

### Вариант B — вручную из консоли (быстро “прямо сейчас”)
1. Убедитесь, что сборка свежая:
   - `npm run build`
2. Деплой:
   - `npx wrangler pages deploy dist --project-name <ИМЯ_ПРОЕКТА>`

Если `wrangler` попросит авторизацию — выполните логин в открывшемся браузере и повторите команду.

## Netlify (если вы на Netlify)

- **Build command**: `npm run build`
- **Publish directory**: `dist`

Локально можно залить так:
- `npx netlify deploy --dir=dist --prod`

## Важно про кэш

Для файла `tracking.js` выставлен заголовок `Cache-Control: public, max-age=0, must-revalidate`, чтобы изменения применялись сразу (иначе браузеры могут держать старую версию сутки).
