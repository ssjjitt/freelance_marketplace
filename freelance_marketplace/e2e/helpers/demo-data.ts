import { DEFAULT_PASSWORD } from "./credentials.js";



export { DEFAULT_PASSWORD as DEMO_PASSWORD };



/** Уникальный суффикс только когда тесту нужен свой свежий заказ в «Мои заказы». */

export function uniqueLabel(base: string): string {

  const d = new Date();

  const stamp = d.toLocaleString("ru-RU", {

    day: "2-digit",

    month: "2-digit",

    hour: "2-digit",

    minute: "2-digit",

  });

  return `${base} (${stamp})`;

}



export function deadlineInDays(days: number): string {

  const d = new Date();

  d.setDate(d.getDate() + days);

  return d.toISOString().slice(0, 10);

}



export type OrderDemoVariant =

  | "landing"

  | "crm"

  | "smm"

  | "design"

  | "mobile"

  | "copywriting"

  | "accounting";



const ORDER_SCENARIOS: Record<

  OrderDemoVariant,

  {

    title: string;

    description: string;

    budget: string;

    category: string;

    categoryId: number;

  }

> = {

  landing: {

    title: "Лендинг для кофейни «Бодрость»",

    description:

      "Одностраничный сайт: меню, акции, форма бронирования. Тёплая палитра, адаптив под смартфоны.",

    budget: "1200",

    category: "Веб-разработка",

    categoryId: 6,

  },

  crm: {

    title: "Интеграция сайта с CRM Bitrix24",

    description:

      "Связать формы заявок с CRM, настроить воронку и уведомления менеджерам в Telegram.",

    budget: "2800",

    category: "Веб-разработка",

    categoryId: 6,

  },

  smm: {

    title: "Ведение Instagram салона красоты",

    description:

      "12 постов и сторис в месяц, ответы в Direct, рубрики «до/после» и акции.",

    budget: "950",

    category: "SMM",

    categoryId: 9,

  },

  design: {

    title: "Редизайн мобильных экранов приложения",

    description:

      "Figma: 8 ключевых экранов, UI-kit, состояния кнопок и форм для разработки.",

    budget: "2600",

    category: "Дизайн интерфейсов",

    categoryId: 8,

  },

  mobile: {

    title: "Доработка Android-приложения доставки",

    description:

      "Исправить краши на Android 12+, обновить карту заказов и push-уведомления.",

    budget: "3400",

    category: "Мобильные приложения",

    categoryId: 7,

  },

  copywriting: {

    title: "Серия статей для корпоративного блога",

    description:

      "5 лонгридов про автоматизацию бизнеса, SEO-заголовки, адаптация под Tone of Voice.",

    budget: "700",

    category: "Тексты и переводы",

    categoryId: 3,

  },

  accounting: {

    title: "Ведение учёта для ИП на УСН",

    description:

      "Первичные документы, отчётность, сверка с банком и маркетплейсами раз в месяц.",

    budget: "350",

    category: "Бухгалтерия",

    categoryId: 10,

  },

};



/** Реалистичный заказ; по умолчанию без даты в названии (не засоряет каталог). */

export function customerOrderPayload(

  variant: OrderDemoVariant = "landing",

  options?: { unique?: boolean }

) {

  const scenario = ORDER_SCENARIOS[variant];

  return {

    ...scenario,

    title: options?.unique ? uniqueLabel(scenario.title) : scenario.title,

    deadline: deadlineInDays(21),

  };

}



export type ServiceDemoVariant = "landing" | "api" | "design";



const SERVICE_SCENARIOS: Record<

  ServiceDemoVariant,

  { title: string; description: string; price: string; category: string }

> = {

  landing: {

    title: "Вёрстка лендинга под ключ",

    description:

      "Адаптив по макету Figma, базовая SEO-разметка, оптимизация скорости загрузки.",

    price: "950",

    category: "Веб-разработка",

  },

  api: {

    title: "REST API на Node.js",

    description: "Проектирование эндпоинтов, JWT, документация Swagger, деплой на VPS.",

    price: "1800",

    category: "Веб-разработка",

  },

  design: {

    title: "Дизайн интерфейса в Figma",

    description: "Прототип, UI-kit, передача макетов разработчикам с спецификацией.",

    price: "1200",

    category: "Дизайн интерфейсов",

  },

};



export function executerServicePayload(

  variant: ServiceDemoVariant = "landing",

  options?: { unique?: boolean }

) {

  const scenario = SERVICE_SCENARIOS[variant];

  return {

    ...scenario,

    title: options?.unique ? uniqueLabel(scenario.title) : scenario.title,

  };

}



/** Резюме исполнителя */

export function executerResumePayload(options?: { unique?: boolean }) {

  const base = {

    title: "Веб-разработчик — React и TypeScript",

    description:

      "Верстаю и разрабатываю интерфейсы под ключ: от прототипа в Figma до деплоя. " +

      "Работаю с заказчиками из HoReCa и e-commerce.",

    experience:

      "4 года коммерческой разработки. Последние проекты: лендинги, личные кабинеты, каталоги.",

    education: "БГУИР, программная инженерия.",

  };

  return {

    ...base,

    title: options?.unique ? uniqueLabel(base.title) : base.title,

  };

}



export function executerApplicationPayload() {

  return {

    message:

      "Здравствуйте! Делал похожие проекты, могу показать портфолио и уложиться в срок.",

    proposedPrice: "1150",

  };

}



export function adminBroadcastPayload() {

  const stamp = new Date().toLocaleDateString("ru-RU");

  return {

    title: uniqueLabel("Обновление правил платформы"),

    message:

      `С ${stamp} действуют уточнённые правила модерации заказов и услуг. ` +

      "Пожалуйста, ознакомьтесь с разделом помощи в профиле.",

  };

}



export function adminCategoryPayload() {

  return {

    name: uniqueLabel("Обучение онлайн"),

    description: "Демо-категория для видео админ-панели.",

  };

}



export function realtimeChatMessages() {

  const tag = Date.now().toString(36).slice(-4);

  return {

    customer: `Здравствуйте! Когда можем начать работу? #${tag}`,

    executer: `Добрый день! Готов приступить завтра. #${tag}`,

  };

}



export function chatMessageActionsPayload() {

  const tag = Date.now().toString(36).slice(-4);

  return {

    toEdit: `Исходный текст сообщения #${tag}`,

    edited: `Отредактированный текст #${tag}`,

    toDelete: `Сообщение на удаление #${tag}`,

  };

}



/** Данные для показа формы регистрации (без завершения без кода из почты) */

export function registrationPreviewPayload() {

  return {

    username: "marina_kovaleva",

    email: "marina.kovaleva.demo@mail.ru",

    password: DEFAULT_PASSWORD,

  };

}



export function supportTicketPayload() {

  return {

    subject: uniqueLabel("Не приходит письмо с кодом"),

    description:

      "Повторная регистрация: код подтверждения не приходит на почту в течение 15 минут.",

  };

}



/** Подкатегория под существующую ветку (без мусорных корневых «E2E Категория»). */

export function adminSubcategoryPayload() {

  return {

    parentName: "Разработка и IT",

    name: "Интеграции с CRM",

    description: "Подключение форм, оплат и CRM к сайтам и интернет-магазинам.",

  };

}



export function reviewPayload() {

  return {

    comment: "Отличная работа: в срок, по ТЗ, рекомендую как исполнителя.",

  };

}



export function disputePayload() {

  return {

    reason: "Несогласие с отклонением отклика",

    description: "Прошу пересмотреть решение заказчика — условия выполнимы.",

  };

}



export function managerDisputeResolutionPayload() {

  return {

    comment:

      "Отклик соответствовал ТЗ, отказ заказчика необоснован. Решение в пользу исполнителя.",

  };

}



export function reportPayload() {

  return {

    reason: "Подозрительное описание заказа, возможный спам.",

  };

}



/** Заголовки одноразовых служебных заказов (без «Бодрость» и без даты). */

export const DEMO_AUX_ORDER_TITLES = {

  complaint: "Проверка жалобы на заказ",

  review: "Заказ для отзыва после завершения",

  delete: "Временный заказ на удаление",

} as const;


