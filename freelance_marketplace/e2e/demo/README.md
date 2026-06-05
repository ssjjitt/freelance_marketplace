# Демо-сценарии для видео (диплом)

Пошаговые тесты с **реалистичными данными** и **входом через UI** (без `storageState`).

## Запуск

```bash
# backend :8080, frontend :5174
cd e2e
npm run test:demo          # все 11 сценариев + очистка мусора от прошлых прогонов
npm run test:demo:cleanup  # только удалить старые E2E-заказы и «E2E Категория»
npm run test:demo:full     # один сквозной сценарий ~3–8 мин (11-full-platform-cycle)
npm run test:demo:manager-support   # менеджер: тикет + спор (~1–2 мин)
npm run test:demo:admin-full        # админ: все функции
npm run test:demo:realtime-chat     # чат в двух окнах (Socket.IO)

# Запись video.webm в test-results (обязательно скрипты test:video:*, не test:demo:*)
npm run test:video:full             # сквозной сценарий, 1920×1080
npm run test:video:manager-support
npm run test:video:admin-full
npm run test:video:realtime-chat   # 2 ролика: test-results/.../customer/video.webm и .../executer/video.webm
npm run test:video:chat-actions       # чат: правка и удаление своих сообщений
npm run test:video:ticket-dispute     # тикет + спор, полный цикл (~2–3 мин)
npm run test:video                  # все демо-сценарии
```

Перед записью видео один раз очистите накопившиеся дубликаты (`npm run test:demo` делает это автоматически в `global.setup.ts`). Каталог в демо **06** использует заказы из `data.sql`, без новых «Бодрость» на каждый прогон.

Паузы для записи (медленнее, удобнее на видео):

```powershell
$env:DEMO_VIDEO="1"
$env:DEMO_PAUSE_MS="1800"
npm run test:video
```

Запись видео в `e2e/test-results/.../video.webm` (по умолчанию **1920×1080**):

```powershell
cd e2e
npm run test:video:admin-full
# или вручную:
$env:DEMO_VIDEO="1"
$env:DEMO_PAUSE_MS="1500"
npm run test:video:full
```

Скрипты `test:demo:*` и `*:headed` **не пишут видео** при успешном прогоне (только `retain-on-failure`). Для диплома используйте **`test:video:*`** — в них уже включён `DEMO_VIDEO=1`.

Если нужно легче по диску: `$env:DEMO_VIDEO_WIDTH="1280"; $env:DEMO_VIDEO_HEIGHT="720"`.

В сквозном сценарии `11-full-platform-cycle` тема переключается по роли (кнопка в шапке): **заказчик — светлая**, **исполнитель — тёмная**. Настройка в `ROLE_THEME` внутри spec-файла.

Для монтажа в MP4 (лучше совместимость с PowerPoint/плеерами):

```powershell
ffmpeg -i video.webm -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p demo.mp4
```

## Порядок сценариев

| Файл | Содержание |
|------|------------|
| `00-guest-registration-login` | Гость, каталог, защита страниц, регистрация (шаги 1–2), вход `customer` |
| `01-customer-order` | Вход, «Разместить заказ», публикация, «Мои заказы», завершение |
| `02-executer-resume-application` | Вход, резюме, каталог, отклик, история |
| `03-customer-executer-interaction` | Одобрение отклика, уведомление, чат |
| `04-manager-moderation` | Панель менеджера, бейдж заказа, блокировка |
| `05-admin-dashboard` | Статистика, массовая рассылка |
| `06-catalog-discovery` | Поиск, категории, фильтры, сортировка, просмотр заказа и услуги |
| `07-customer-extended` | Редактирование/удаление заказа, отклики, отзыв, жалоба, избранное, профиль |
| `08-executer-extended` | Услуги CRUD, резюме, отклик/отмена, спор |
| `09-manager-extended` | Тикеты, споры, модерация резюме и услуг |
| `10-admin-platform` | Главная админа, категория и подкатегория |
| `11-full-platform-cycle` | Сквозной сценарий всех ролей (~3 мин) |
| `12-manager-disputes-tickets` | Менеджер: разрешение тикета и спора (отдельное видео) |
| `13-admin-full-platform` | Админ: полный обзор всех функций (~2–4 мин) |
| `14-realtime-chat` | Чат заказчик ↔ исполнитель в реальном времени (2 окна) |
| `15-chat-message-actions` | Чат: редактирование и удаление своих сообщений |
| `16-ticket-dispute-support-flow` | Тикет (заказчик) → менеджер → спор (исполнитель) → решение |

Подробная матрица: [COVERAGE.md](./COVERAGE.md).

## Регистрация до конца

По умолчанию показываются шаги 1–2 (логин, почта, роль). Чтобы завершить регистрацию в тесте, нужен код из письма:

```powershell
$env:E2E_VERIFY_CODE="1234"
```

## Быстрый прогон (без UI-входа)

Старые тесты с `storageState`:

```bash
npm run test:diploma:fast
```

Учётки: `data.sql`, пароль `Qwert123_`.
