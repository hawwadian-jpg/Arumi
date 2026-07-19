/**
 * Единый конфиг локализаций сайта.
 *
 * Все видимые тексты находятся здесь и имеют одинаковую структуру для RU/EN.
 * Изображения и slug работ общие: URL не меняются при переключении языка.
 */

export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];

export type Work = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  description: string[];
  image: string;
};

type LegalSection = { title: string; text: string };

export type SiteContent = {
  meta: {
    title: string;
    shortTitle: string;
    description: string;
    locale: string;
  };
  navigation: Array<{ label: string; anchor: string }>;
  interface: {
    menuOpen: string;
    menuClose: string;
    skipToContent: string;
    backToTop: string;
    legalNavigation: string;
    mainNavigation: string;
    languageLabel: string;
    scrollHint: string;
    nextChapter: string;
    workProgressSeparator: string;
    workComingSoon: string;
  };
  hero: {
    eyebrow: string;
    firstName: string;
    lastName: string;
    subtitle: string;
    cta: string;
    image: string;
    imageAlt: string;
  };
  pillars: Array<{
    number: string;
    title: string;
    text: string;
    href: string;
    linkLabel: string;
  }>;
  worksHeading: { eyebrow: string; title: string; text: string };
  works: Work[];
  about: { eyebrow: string; title: string; paragraphs: string[]; linkLabel: string };
  quote: { text: string; author: string };
  contact: {
    eyebrow: string;
    title: string;
    text: string;
    email: string;
    telegramLabel: string;
    telegramUrl: string;
    telegramPrefix: string;
  };
  newsletter: {
    eyebrow: string;
    title: string;
    disclaimer: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitLabel: string;
    honeypotLabel: string;
  };
  footer: { rights: string; privacy: string; terms: string };
  legal: {
    eyebrow: string;
    updated: string;
    privacy: { title: string; description: string; sections: LegalSection[] };
    terms: { title: string; description: string; sections: LegalSection[] };
  };
  messages: {
    thanks: { eyebrow: string; title: string; text: string; action: string };
    notFound: { eyebrow: string; title: string; text: string; action: string };
  };
};

const shared = {
  email: "hawwaraw@gmail.com",
  telegramLabel: "@Human_Tales",
  telegramUrl: "https://t.me/Human_Tales",
  heroImage: "/images/dina.jpg",
} as const;

function createMeta(title: string, shortTitle: string, description: string, locale: string): SiteContent["meta"] {
  return { title, shortTitle, description, locale };
}

function createNavigation(home: string, works: string, about: string, contact: string): SiteContent["navigation"] {
  return [
    { label: home, anchor: "home" },
    { label: works, anchor: "works" },
    { label: about, anchor: "about" },
    { label: contact, anchor: "contact" },
  ];
}

function createContact(eyebrow: string, title: string, text: string): SiteContent["contact"] {
  return {
    eyebrow,
    title,
    text,
    email: shared.email,
    telegramLabel: shared.telegramLabel,
    telegramUrl: shared.telegramUrl,
    telegramPrefix: "Telegram",
  };
}

function createLegalDocument(title: string, description: string, sections: Array<[string, string]>): SiteContent["legal"]["privacy"] {
  return { title, description, sections: sections.map(([sectionTitle, text]) => ({ title: sectionTitle, text })) };
}

function createLegal(
  eyebrow: string,
  updated: string,
  privacy: [string, string, Array<[string, string]>],
  terms: [string, string, Array<[string, string]>],
): SiteContent["legal"] {
  return {
    eyebrow,
    updated,
    privacy: createLegalDocument(...privacy),
    terms: createLegalDocument(...terms),
  };
}

const ruIdentity = {
  meta: createMeta(
    "Дина Макарова — автор, журналист, режиссёр",
    "Дина Макарова",
    "Автор, журналист и режиссёр: истории о людях, культурах и связях между ними.",
    "ru_RU",
  ),
  navigation: createNavigation("Главная", "Работы", "Обо мне", "Контакты"),
};

const enIdentity = {
  meta: createMeta(
    "Dina Makarova — Author, Journalist, Filmmaker",
    "Dina Makarova",
    "Author, journalist and filmmaker creating stories, exploring cultures and connecting people.",
    "en_US",
  ),
  navigation: createNavigation("Home", "Works", "About", "Contact"),
};

const ruPrivacySections: Array<[string, string]> = [
  ["Какие данные мы получаем", "При подписке сайт получает указанный вами e-mail. Сервер также обрабатывает минимальные технические данные, необходимые для защиты формы."],
  ["Как используются данные", "E-mail используется только для отправки запрошенных обновлений. Он не продаётся и не передаётся для рекламных целей."],
  ["Хранение и удаление", "Подписки хранятся на сервере сайта. Для удаления данных напишите на контактный e-mail сайта."],
  ["Внешние ссылки", "Сайт может содержать ссылки на сторонние сервисы. После перехода применяются их собственные политики конфиденциальности."],
];

const ruTermsSections: Array<[string, string]> = [
  ["Материалы сайта", "Тексты, фотографии и другие оригинальные материалы защищены авторским правом, если не указано иное."],
  ["Разрешённое использование", "Можно просматривать страницы и делиться ссылками. Для перепубликации или коммерческого использования требуется письменное разрешение."],
  ["Точность и доступность", "Сайт носит информационный характер. Материалы могут исправляться, обновляться или удаляться без предварительного уведомления."],
  ["Контакты", "По вопросам разрешений и использования материалов напишите на контактный e-mail сайта."],
];

const enPrivacySections: Array<[string, string]> = [
  ["Information we receive", "If you subscribe, the website receives the email address you provide. The server also processes the minimum technical data required to protect the form."],
  ["How information is used", "Your email is used only to send requested updates. It is not sold or shared for advertising purposes."],
  ["Storage and removal", "Subscriptions are stored on the website server. To request removal, use the website contact email."],
  ["External links", "This website may link to third-party services. Their own privacy policies apply after you follow those links."],
];

const enTermsSections: Array<[string, string]> = [
  ["Website content", "Texts, photographs and other original materials on this website are protected by copyright unless stated otherwise."],
  ["Permitted use", "You may view and share links to public pages. Republishing or commercial use of the materials requires prior written permission."],
  ["Accuracy and availability", "The website is provided for informational purposes. Content may be corrected, updated or removed without notice."],
  ["Contact", "For permissions or questions, use the website contact email."],
];

const ru: SiteContent = {
  ...ruIdentity,
  interface: {
    menuOpen: "Открыть меню",
    menuClose: "Закрыть меню",
    skipToContent: "Перейти к содержимому",
    backToTop: "Наверх",
    legalNavigation: "Юридическая информация",
    mainNavigation: "Основная навигация",
    languageLabel: "Переключить язык на английский",
    scrollHint: "Листайте ниже",
    nextChapter: "Следующий раздел",
    workProgressSeparator: "из",
    workComingSoon: "Избранные проекты и публикации появятся в этом разделе.",
  },
  hero: {
    eyebrow: "Автор · Журналист · Международные проекты",
    firstName: "Дина",
    lastName: "Макарова",
    subtitle: "Создаю идеи. Исследую культуры. Соединяю людей.",
    cta: "Смотреть работы",
    image: shared.heroImage,
    imageAlt: "Портрет Дины Макаровой",
  },
  pillars: [
    {
      number: "01",
      title: "Создавать",
      text: "Книги · Кино · Телевидение\nЖурналистика · Музыка · Каллиграфия",
      href: "/work/books",
      linkLabel: "Подробнее",
    },
    {
      number: "02",
      title: "Исследовать",
      text: "Страны · Культуры · Эссе\nФотография · Священные места · Видеодневники",
      href: "/work/travel",
      linkLabel: "Подробнее",
    },
    {
      number: "03",
      title: "Объединять",
      text: "Образовательные проекты\nМеждународное партнёрство · Социальные инициативы",
      href: "/#contact",
      linkLabel: "Связаться",
    },
  ],
  worksHeading: {
    eyebrow: "Избранные работы",
    title: "Истории в разных формах.",
    text: "Книги, кино, репортажи, путешествия и музыка — разные языки одного разговора о людях.",
  },
  works: [
    {
      slug: "books",
      title: "Книги",
      eyebrow: "Литература",
      summary: "Большие истории о людях, памяти и местах, которые формируют нас.",
      description: [
        "Книга оставляет пространство для деталей, которые исчезают в спешке: голоса, жеста, истории, сохранённой ландшафтом.",
        "Здесь будут собраны издания, фрагменты, переводы и материалы будущих встреч с читателями.",
      ],
      image: "/images/books.png",
    },
    {
      slug: "films",
      title: "Кино",
      eyebrow: "Режиссура",
      summary: "Документальное наблюдение, визуальные эссе и человеческие истории на экране.",
      description: [
        "Кино позволяет сначала услышать и увидеть, а уже потом объяснять. Камера остаётся рядом с людьми и местами, где рождается смысл.",
        "Раздел подготовлен для трейлеров, фестивальных показов, съёмочных групп и информации о просмотрах.",
      ],
      image: "/images/films.png",
    },
    {
      slug: "journalism",
      title: "Журналистика",
      eyebrow: "Истории",
      summary: "Репортажи и эссе, основанные на внимании, контексте и настоящих встречах.",
      description: [
        "Журналистика начинается с точного вопроса и терпения, необходимого для честного ответа.",
        "Новые статьи можно добавлять сюда отдельными публикациями, не меняя структуру всего сайта.",
      ],
      image: "/images/journalism.png",
    },
    {
      slug: "travel",
      title: "Путевые заметки",
      eyebrow: "Места",
      summary: "Культуры, священные места, фотография и заметки из путешествий.",
      description: [
        "Путешествие — не список направлений, а способ смотреть внимательнее и заново открывать привычное.",
        "Раздел может стать журналом эссе, фотографий и видеодневников, собранных по странам и темам.",
      ],
      image: "/images/travel.png",
    },
    {
      slug: "music",
      title: "Музыка",
      eyebrow: "Композиции",
      summary: "Звук и ритм, которые продолжают историю там, где заканчиваются слова.",
      description: [
        "Музыка создаёт собственный эмоциональный язык и открывает новое измерение визуальных и литературных работ.",
        "Здесь будут опубликованы записи, коллаборации и заметки о композициях.",
      ],
      image: "/images/music.png",
    },
  ],
  about: {
    eyebrow: "Обо мне",
    title: "Истории пересекают любые границы.",
    paragraphs: [
      "Дина Макарова — автор, журналист и режиссёр. В основе её работ — любопытство, человеческая близость и уважение к разным культурам.",
      "В книгах, кино, эссе и международных проектах она ищет истории, которые помогают людям яснее увидеть друг друга.",
    ],
    linkLabel: "Начать разговор",
  },
  quote: {
    text: "Я верю в силу историй, которые вдохновляют, объединяют и меняют мир.",
    author: "Дина Макарова",
  },
  contact: createContact(
    "Контакты",
    "Давайте создадим что-то значимое.",
    "По вопросам публикаций, сотрудничества, показов и международных проектов напишите напрямую или свяжитесь в Telegram.",
  ),
  newsletter: {
    eyebrow: "Оставайтесь на связи",
    title: "Письма об историях, местах и новых работах.",
    disclaimer: "Только редкие содержательные письма. Без шума и спама.",
    emailLabel: "Ваш e-mail",
    emailPlaceholder: "name@example.com",
    submitLabel: "Подписаться",
    honeypotLabel: "Оставьте это поле пустым",
  },
  footer: {
    rights: "Все права защищены",
    privacy: "Конфиденциальность",
    terms: "Условия",
  },
  legal: createLegal(
    "Документы",
    "Обновлено: июль 2026",
    ["Политика конфиденциальности", "Политика конфиденциальности сайта Дины Макаровой.", ruPrivacySections],
    ["Условия использования", "Условия использования сайта Дины Макаровой.", ruTermsSections],
  ),
  messages: {
    thanks: { eyebrow: "Спасибо", title: "Вы в списке.", text: "Заявка получена. Следующее письмо придёт на вашу почту.", action: "На главную" },
    notFound: { eyebrow: "404", title: "Эта история ещё не написана.", text: "Возможно, страница перемещена или адрес указан неверно.", action: "На главную" },
  },
};

const en: SiteContent = {
  ...enIdentity,
  interface: {
    menuOpen: "Open menu",
    menuClose: "Close menu",
    skipToContent: "Skip to content",
    backToTop: "Back to top",
    legalNavigation: "Legal information",
    mainNavigation: "Main navigation",
    languageLabel: "Switch language to Russian",
    scrollHint: "Scroll to discover",
    nextChapter: "Next chapter",
    workProgressSeparator: "of",
    workComingSoon: "Selected projects and publication details will appear here.",
  },
  hero: {
    eyebrow: "Author · Journalist · International Projects",
    firstName: "Dina",
    lastName: "Makarova",
    subtitle: "Creating ideas. Exploring cultures. Connecting people.",
    cta: "Explore my work",
    image: shared.heroImage,
    imageAlt: "Portrait of Dina Makarova",
  },
  pillars: [
    { number: "01", title: "Create", text: "Books · Films · Television\nJournalism · Music · Calligraphy", href: "/en/work/books", linkLabel: "Discover" },
    { number: "02", title: "Explore", text: "Countries · Cultures · Essays\nPhotography · Sacred Places · Video Diaries", href: "/en/work/travel", linkLabel: "Discover" },
    { number: "03", title: "Connect", text: "Educational Projects\nInternational Partnerships · Social Impact", href: "/en/#contact", linkLabel: "Get in touch" },
  ],
  worksHeading: {
    eyebrow: "Selected work",
    title: "Stories in many forms.",
    text: "Books, films, reporting, journeys and music — different languages for the same search for connection.",
  },
  works: [
    { slug: "books", title: "Books", eyebrow: "Writing", summary: "Long-form stories about people, memory and the places that shape us.", description: ["Books offer room for the details that disappear in a hurried world: a voice, a gesture, the history carried by a landscape.", "This section is prepared for publications, excerpts, translations and future reading events."], image: "/images/books.png" },
    { slug: "films", title: "Films", eyebrow: "Directing", summary: "Documentary observation, visual essays and human stories on screen.", description: ["Film makes it possible to listen before explaining. The camera stays close to people, places and the small details where meaning lives.", "This section is ready for trailers, festival selections, credits and screening information."], image: "/images/films.png" },
    { slug: "journalism", title: "Journalism", eyebrow: "Stories", summary: "Reporting and essays built on attention, context and real encounters.", description: ["Journalism begins with a careful question and the patience to hear an honest answer.", "Future articles can be added here as individual publications without changing the layout of the site."], image: "/images/journalism.png" },
    { slug: "travel", title: "Travel Notes", eyebrow: "Places", summary: "Cultures, sacred places, photography and notes from the road.", description: ["Travel is not a list of destinations, but a way to look more closely and reconsider what feels familiar.", "This section can grow into a journal of essays, photographs and video diaries organised by country or theme."], image: "/images/travel.png" },
    { slug: "music", title: "Music", eyebrow: "Compositions", summary: "Sound, rhythm and compositions that continue a story beyond words.", description: ["Music creates an emotional language of its own and gives visual and literary work another dimension.", "Recordings, collaborations and composition notes can be published here when they are ready."], image: "/images/music.png" },
  ],
  about: {
    eyebrow: "About",
    title: "Stories can cross every border.",
    paragraphs: ["Dina Makarova is an author, journalist and film director whose work is rooted in curiosity, human connection and respect for different cultures.", "Across books, films, essays and international projects, she searches for stories that help people see one another more clearly."],
    linkLabel: "Start a conversation",
  },
  quote: { text: "I believe in the power of stories that inspire, connect and create change.", author: "Dina Makarova" },
  contact: createContact(
    "Contact",
    "Let’s create something meaningful.",
    "For editorial work, collaborations, screenings and international projects, write directly or connect on Telegram.",
  ),
  newsletter: {
    eyebrow: "Stay connected",
    title: "Letters about stories, places and new work.",
    disclaimer: "Occasional updates only. No noise, no spam.",
    emailLabel: "Your email address",
    emailPlaceholder: "name@example.com",
    submitLabel: "Subscribe",
    honeypotLabel: "Leave this field empty",
  },
  footer: { rights: "All rights reserved", privacy: "Privacy", terms: "Terms" },
  legal: createLegal(
    "Legal",
    "Last updated: July 2026",
    ["Privacy Policy", "Privacy policy for the Dina Makarova website.", enPrivacySections],
    ["Terms of Use", "Terms of use for the Dina Makarova website.", enTermsSections],
  ),
  messages: {
    thanks: { eyebrow: "Thank you", title: "You’re on the list.", text: "Your request has been received. The next letter will arrive in your inbox.", action: "Return home" },
    notFound: { eyebrow: "404", title: "This story hasn’t been written yet.", text: "The page may have moved, or the address may be incorrect.", action: "Return home" },
  },
};

export const content: Record<Locale, SiteContent> = { ru, en };
export const defaultLocale: Locale = "ru";

export function getContent(locale: Locale): SiteContent {
  return content[locale];
}

export function localePath(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return locale === "ru" ? normalized : `/en${normalized === "/" ? "" : normalized}`;
}

export function alternatePath(locale: Locale, pathname: string): string {
  if (locale === "ru") return localePath("en", pathname);
  const withoutPrefix = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return localePath("ru", withoutPrefix);
}
