/**
 * Стабильные сущности из data.sql — для каталога без лишних INSERT при каждом прогоне.
 */
export const SEED_CATALOG = {
  order: {
    id: 2,
    title: "Доработка личного кабинета",
    searchToken: "кабинет",
    category: "Веб-разработка",
  },
  service: {
    id: 1,
    title: "Вёрстка из Figma за 48 часов",
    searchToken: "Figma",
    category: "Веб-разработка",
  },
  categories: {
    parentIt: "Разработка и IT",
    web: "Веб-разработка",
    smm: "SMM",
    design: "Дизайн интерфейсов",
  },
} as const;
