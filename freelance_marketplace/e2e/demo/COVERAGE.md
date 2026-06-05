# Покрытие демо E2E по функционалу

| Функция | Сценарий |
|--------|----------|
| Поиск, категории, фильтры, сортировка | `06-catalog-discovery` |
| Просмотр заказа / услуги | `06-catalog-discovery` |
| Создание / завершение заказа | `01-customer-order` |
| Редактирование / удаление заказа | `07-customer-extended` |
| Создание / редактирование / удаление / завершение услуги | `08-executer-extended` |
| Просмотр и одобрение / отклонение откликов | `03`, `07-customer-extended` |
| Отклик на заказ (UI) | `02-executer-resume-application` |
| Отмена отклика | `08-executer-extended` |
| Отзыв | `07-customer-extended` |
| Жалоба на заказ | `07-customer-extended` |
| Избранное | `07-customer-extended` |
| Спор (открытие и разрешение) | `09-manager-extended`, `12-manager-disputes-tickets` |
| Профиль: просмотр, редактирование, аватар | `07-customer-extended` |
| Чаты, уведомления | `03`, `14-realtime-chat` |
| Редактирование / удаление сообщений в чате | `15-chat-message-actions` |
| Резюме: создать | `02-executer-resume-application` |
| Резюме: редактировать | `02` (форма создания; отдельный edit — в профиле исполнителя) |
| Тикеты: создание, просмотр, статус, решение | `09`, `12`, `16-ticket-dispute-support-flow` |
| Споры: открытие, список, разрешение | `09`, `12`, `16-ticket-dispute-support-flow` |
| Блокировка / разблокировка | `04-manager-moderation` |
| Модерация заказов, бейдж доверия | `04-manager-moderation` |
| Модерация резюме / услуг | `09-manager-extended` |
| Главная админа, категории, рассылка | `05`, `10`, `13-admin-full-platform` |
| Гость, регистрация, вход | `00-guest-registration-login` |
