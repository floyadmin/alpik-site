import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const enDir = path.join(root, 'en');

const BASE_URL = 'https://alpik.com.ua';
const GTM_ID = (process.env.SITE_GTM_ID || '').trim();

const serviceTranslations = {
  '01': {
    title: 'Facade repair, finishing, cladding, painting & hydrophobic protection',
    subtitle:
      'We renew facades, restore protection and improve the exterior look of buildings following proven technology and safety requirements.',
    paragraphs: [
      'We provide a full range of facade works of any complexity using modern methods and certified materials. We start with a technical inspection to assess the condition of load‑bearing and finishing layers, identify cracks, delamination, corrosion and biological contamination.',
      'Preparation includes mechanical or chemical cleaning from dust, dirt, efflorescence, old paint coatings and weakened plaster areas. Then we perform local or full facade repair: crack filling with repair compounds, geometry restoration, reinforcement of problem areas, leveling and base preparation for the finish.',
      'For cladding and finishing we use porcelain stoneware, clinker tile, facade panels and decorative plasters; for painting — weather‑resistant, vapor‑permeable paints. The final step is hydrophobic treatment with water‑repellent compounds that protect from moisture, freeze–thaw damage and mold, significantly extending the facade service life.'
    ]
  },
  '02': {
    title: 'Chimney stack repair & modernization',
    subtitle: 'We diagnose, repair and modernize chimney stacks while meeting strict safety requirements.',
    paragraphs: [
      'Chimney stack repairs are performed with industrial specifics and increased safety requirements in mind. We start with a detailed inspection to determine wear, root causes of damage and the remaining service life of the structure.',
      'Works are carried out using rope access without stopping production processes. We restore brickwork or metal elements, replace emergency sections, reinforce structures and seal joints. We use refractory mixes, heat‑resistant paints, anti‑corrosion coatings and specialized protective materials.',
      'Modernization may include thermal insulation, installation of new caps, spark arresters, protective hoods and additional safety elements. The goal is higher efficiency, reliability and compliance with current operating standards.'
    ]
  },
  '03': {
    title: 'Installation of chimneys & air ducts',
    subtitle: 'We install flue systems and ventilation ducts: assembly, sealing and safe work at height.',
    paragraphs: [
      'We install chimneys, exhaust and ventilation ducts on industrial and commercial facilities. We select the solution for the site conditions and ensure correct routing and fastening to minimize vibrations and loads.',
      'Installation includes mounting sections, sealing joints, arranging supports and compensators, and protecting penetrations through roofs and walls. Where required we add thermal insulation and corrosion protection for long‑term operation.'
    ]
  },
  '04': {
    title: 'Demolition of chimneys & steel structures',
    subtitle: 'Safe dismantling at height with rigging, controlled lowering and debris management.',
    paragraphs: [
      'We dismantle chimneys and steel structures using a controlled, step‑by‑step method and rope access to avoid damaging adjacent equipment and buildings.',
      'We plan the work sequence, set up rigging, cut sections and lower them safely. We can arrange safe access, fencing and waste removal according to the site requirements.'
    ]
  },
  '05': {
    title: 'Grain elevator overhaul: silo cleaning & repair',
    subtitle: 'Complex works for elevators and silos: cleaning, repair and protection of structures.',
    paragraphs: [
      'We perform comprehensive repairs of grain elevator complexes, including cleaning and repair of silos. We inspect structures, identify damage to metal and concrete, and define the scope of restoration works.',
      'Works may include cleaning internal surfaces, removing product residues, repairing corrosion‑affected elements, sealing joints and restoring protective coatings.',
      'We focus on safety, industrial standards and long‑term durability so the facility can return to stable operation as quickly as possible.'
    ]
  },
  '06': {
    title: 'Roof installation & repair',
    subtitle: 'We repair roofs, eliminate leaks and restore junction nodes with the right technology.',
    paragraphs: [
      'Roofing works are performed with the architectural and technical specifics of the object in mind. We install new roofs and perform major or routine repairs of existing ones.',
      'The scope includes dismantling damaged areas, restoring supporting structures, installing waterproofing and thermal insulation, and rebuilding junction nodes. We work with PVC/TPO membranes, bituminous materials, metal tiles and corrugated/profled sheet to ensure long‑term tightness and durability.'
    ]
  },
  '07': {
    title: 'Gutters, flashings & snow-melting systems',
    subtitle: 'We install drainage systems, flashings and heating cables to protect roofs and facades.',
    paragraphs: [
      'We install gutters, downpipes, flashings and additional roof elements that control water runoff and protect facade junctions from moisture.',
      'If required, we mount anti‑icing and snow‑melting systems: heating cables, controllers and safe cable routing. The result is fewer icicles, safer walkways and longer roof service life.'
    ]
  },
  '08': {
    title: 'Steel structure painting & sandblasting',
    subtitle: 'Surface preparation and protective coating systems for long-term corrosion resistance.',
    paragraphs: [
      'We prepare metal surfaces by sandblasting to remove rust, old coatings and contaminants. Proper preparation improves adhesion and extends coating life.',
      'We then apply anti‑corrosion primers and finishing paint systems according to the required class of protection and operating environment.'
    ]
  },
  '09': {
    title: 'Ventilated facade systems installation',
    subtitle: 'Installation of substructures and cladding for durable and energy‑efficient facades.',
    paragraphs: [
      'We install ventilated facades: substructure, insulation, wind protection and cladding panels. Ventilated systems improve moisture management and energy efficiency.',
      'We ensure correct geometry, reliable fasteners and safe work at height, including junctions, corners and penetrations.'
    ]
  },
  '10': {
    title: 'Translucent structures installation',
    subtitle: 'Mounting glazing systems, curtain walls and other light‑transmitting structures.',
    paragraphs: [
      'We install translucent structures: glazing, facade glazing, skylights and other systems that require precise installation and sealing.',
      'Works include fixing frames, installing glass units, sealing joints and adjusting elements to achieve tightness and reliable operation.'
    ]
  },
  '11': {
    title: 'Sandwich panels & profiled sheet installation',
    subtitle: 'Fast installation of wall and roof enclosures with accurate geometry and sealing.',
    paragraphs: [
      'We install sandwich panels and profiled sheet metal for walls and roofs on industrial and commercial objects.',
      'We ensure correct alignment, fasteners and sealing of joints, including junctions, corners and penetrations for durability and airtightness.'
    ]
  },
  '12': {
    title: 'Thermal insulation for buildings & apartments',
    subtitle: 'We select materials and insulation technology with heat engineering and durability in mind.',
    paragraphs: [
      'We provide end‑to‑end insulation solutions for residential and industrial buildings. We use modern insulation materials such as mineral wool, EPS and polyurethane systems.',
      'Works follow vapor and waterproofing requirements to ensure a comfortable indoor climate and reduced energy consumption.'
    ]
  },
  '13': {
    title: 'Advertising structures & banner installation',
    subtitle: 'Mounting advertising frames and safely hanging banners at height.',
    paragraphs: [
      'We install advertising structures, frames, sign elements and hang banners using rope access where needed.',
      'We focus on reliable fasteners, correct tensioning and safe work organization to withstand wind loads and ensure long‑term operation.'
    ]
  },
  '14': {
    title: 'Snow, icicle & ice removal',
    subtitle: 'Seasonal roof and structure cleaning to keep people and property safe.',
    paragraphs: [
      'We remove snow, icicles and ice from roofs, canopies and structures. Works are performed safely with fencing and controlled removal.',
      'Regular cleaning reduces the risk of incidents and damage to gutters, facades and roof elements.'
    ]
  },
  '15': {
    title: 'Facade & window washing (incl. industrial sites)',
    subtitle: 'High‑level cleaning of facades, windows and industrial workshops with safe access.',
    paragraphs: [
      'We wash building facades, windows and industrial premises using rope access and professional cleaning products.',
      'We remove dust, soot and industrial contamination, restoring appearance and helping preserve finishing materials.'
    ]
  },
  '16': {
    title: 'Solar panels & inverter installation',
    subtitle: 'Installation of solar panels and inverters on roofs and structures with safe mounting and neat cabling.',
    paragraphs: [
      'We install solar panels and inverters for rooftop PV systems: mounting rails, panel layout, inverter placement and secure fastening.',
      'We route and secure cables, seal roof penetrations where needed, and follow manufacturer requirements and electrical safety rules for reliable long‑term operation.'
    ]
  },
  '17': {
    title: 'Sealing interpanel joints',
    subtitle: 'We restore tightness of facade joints to prevent drafts, moisture and heat losses.',
    paragraphs: [
      'We seal interpanel joints on residential and industrial buildings to protect from moisture penetration, drafts and heat loss.',
      'Works include cleaning the seam, replacing/adding insulation, applying sealant and protective layers for long‑term tightness.'
    ]
  },
  '18': {
    title: 'Decorations & lighting installation',
    subtitle: 'We install decorations and lighting at height: fastening, cabling if needed, testing and safe dismantling.',
    paragraphs: [
      'We install architectural, decorative and festive lighting systems of any complexity. We use energy‑efficient LED systems, protected cable routes and reliable mounts to ensure safe and stable operation.'
    ]
  }
};

const pageTranslations = {
  'index.html': [
    ['<!-- header-top с телефоном удалён -->', '<!-- header-top with phone removed -->'],
    ['<!-- Секция: Наші послуги (overview) -->', '<!-- Section: Our services (overview) -->'],
    ['Більше 1000 клієнтів вже довірилися нам', 'More than 1000 clients have already trusted us'],
    ['Клієнти оцінили професіоналізм «alpiK»,', 'Clients appreciate the professionalism of “alpiK”,'],
    ['адже наші відносини побудовані на', 'because our relationships are built on'],
    ['партнерстві та довірі', 'partnership and trust'],
    ['Наші послуги', 'Our services'],

    ['alt="Монтаж"', 'alt="Installation"'],
    ['>Монтаж</h3>', '>Installation</h3>'],
    ['водостічних систем, відливів, світлопрозорих конструкцій, тощо', 'gutter systems, flashings, glazing systems, and more'],

    ['alt="Ремонт"', 'alt="Repair"'],
    ['>Ремонт</h3>', '>Repair</h3>'],
    ['димових труб, елеваторів, силосів, тощо', 'chimneys, grain elevators, silos, and more'],

    ['alt="Встановлення сонячних панелей"', 'alt="Solar panel installation"'],
    ['Встановлення сонячних панелей', 'Solar panel installation'],
    ['Допоможемо підібрати все необхідне для ефективного використання сонячної енергії. Під ключ',
      'We\u2019ll help you choose everything needed for effective solar energy use. Turnkey'],

    ['alt="Клінінг"', 'alt="Cleaning"'],
    ['>Клінінг</h3>', '>Cleaning</h3>'],
    ['Миття вікон, фасадів та інших поверхонь.', 'Washing windows, facades and other surfaces.'],

    ['alt="Очищення дахів"', 'alt="Roof cleaning"'],
    ['>Очищення дахів</h3>', '>Roof cleaning</h3>'],
    ['Від снігу, борульок, листя та інших забруднень.', 'From snow, icicles, leaves and other debris.'],

    ['alt="Фарбування металоконструкцій"', 'alt="Steel structure painting"'],
    ['Фарбування металоконструкцій', 'Steel structure painting'],
    ['Покращення зовнішнього вигляду та захист від корозії.', 'Improves appearance and protects against corrosion.'],

    ['детальніше', 'learn more'],
    ['>Більше</a>', '>More</a>'],

    ['<!-- Сплит-блок "Про нас" (як на макеті) -->', '<!-- Split block: About us -->'],
    ['aria-label="Про нас"', 'aria-label="About us"'],
    ['aria-label="Покрівельні роботи"', 'aria-label="Rope access works"'],
    ['<div class="about-spotlight-label">Про нас</div>', '<div class="about-spotlight-label">About us</div>'],
    ['Ми є експертами<br>у виконанні висотних робіт', 'We are experts<br>in rope access works'],
    ['Маємо досвід виконання висотних робіт з 2010-го року. Виконавці робіт пройшли професійне навчання та професійно виконують поставлені задачі.',
      'We have been performing rope access works since 2010. Our specialists are professionally trained and deliver tasks safely and efficiently.'],
    ['aria-label="Ключові факти"', 'aria-label="Key facts"'],
    ['досвід роботи<br>понад 15 років', 'experience<br>15+ years'],
    ['працюємо з кращими<br>виробниками', 'work with top<br>manufacturers'],
    ['>БІЛЬШЕ</a>', '>MORE</a>'],

    ['aria-label="Переваги"', 'aria-label="Advantages"'],
    ['Індивідуальний<br>підхід', 'Personalized<br>approach'],
    ['Ми пропонуємо найкращі<br>та оптимальні рішення', 'We offer the best<br>and most practical solutions'],
    ['Готуємо<br>детальний проект', 'Prepare a<br>detailed plan'],
    ['Підбираємо технологію і<br>готуємо детальний розрахунок', 'Select the right technology and<br>provide a detailed estimate'],
    ['Гарантуємо<br>якість робіт', 'Guarantee<br>quality'],
    ['Здійснюється постійний<br>нагляд бригади', 'Continuous<br>team supervision'],

    ['<!-- Слайдер: Відгуки -->', '<!-- Slider: Testimonials -->'],
    ['aria-label="Відгуки"', 'aria-label="Testimonials"'],
    ['<h2 class="testimonials-title">Відгуки</h2>', '<h2 class="testimonials-title">Testimonials</h2>'],
    ['що наші клієнти думають про співпрацю з нами', 'what our clients say about working with us'],
    ['aria-label="Слайдер відгуків"', 'aria-label="Testimonials slider"'],
    ['aria-label="Попередній відгук"', 'aria-label="Previous testimonial"'],
    ['aria-label="Наступний відгук"', 'aria-label="Next testimonial"'],
    // Static HTML testimonials (non-JS)
    [
      'Роботи виконані якісно та акуратно, відповідно до технології й у погоджені терміни. Рекомендую',
      'The work was completed neatly, according to the proper technology and within the agreed deadlines. I recommend'
    ],
    ['співпрацю з «alpiK».', 'working with “alpiK”.'],
    [
      'Кваліфіковані спеціалісти, якісні матеріали та відповідальний підхід. «alpiK» виконує роботи на',
      'Qualified specialists, quality materials and a responsible approach. “alpiK” delivers work at'
    ],
    ['високому професійному рівні.', 'a high professional level.'],
    ['aria-label="Оцінка 5 з 5"', 'aria-label="Rating 5 out of 5"'],
    ['aria-label="Перемикачі слайдера"', 'aria-label="Slider controls"'],
    ['// Мобільне меню', '// Mobile menu'],
    ['// Слайдер: Відгуки', '// Testimonials slider'],
    ['Перейти до слайда', 'Go to slide'],
    ['Оцінка ${t.stars} з 5', 'Rating ${t.stars} out of 5'],
    [
      'Роботи виконані якісно та акуратно, відповідно до технології й у погоджені терміни. Рекомендую співпрацю з «alpiK».',
      'The work was completed neatly, according to the proper technology and within the agreed deadlines. I recommend working with “alpiK”.'
    ],
    [
      'Кваліфіковані спеціалісти, якісні матеріали та відповідальний підхід. «alpiK» виконує роботи на високому професійному рівні.',
      'Qualified specialists, quality materials and a responsible approach. “alpiK” delivers work at a high professional level.'
    ],
    [
      'Швидко відреагували на запит і допомогли підібрати оптимальне рішення. Робота виконана акуратно, команда ввічлива.',
      'They responded quickly and helped choose the best solution. The work was done neatly; the team was polite.'
    ],
    [
      'Якість на висоті: все зроблено чітко, без затримок і з дотриманням домовленостей. Дякую «alpiK» за професіоналізм!',
      'Top-notch quality: everything was done clearly, without delays and in line with agreements. Thank you “alpiK” for the professionalism!'
    ],

    ['aria-label="Категорії"', 'aria-label="Pages"'],
    ['aria-label="Логотип"', 'aria-label="Logo"'],
    ['Всі права захищені.', 'All rights reserved.']
  ],

  'about.html': [
    ['aria-label="Про нас"', 'aria-label="About us"'],
    ['<div class="hero-kicker">Про нас</div>', '<div class="hero-kicker">About us</div>'],
    ['Ми є професіоналами<br>у виконанні висотних робіт', 'We are professionals<br>in rope access works'],
    [
      'Комплекс висотних робіт методом промислового альпінізму: монтаж, ремонт, демонтаж, очищення, фарбування та технічне обслуговування будівель і споруд.',
      'A full range of rope access works: installation, repair, dismantling, cleaning, painting and maintenance of buildings and structures.'
    ],
    ['Про компанію alpiK', 'About alpiK'],
    ['alpiK — це команда професійних промислових альпіністів, яка спеціалізується на висотних роботах будь-якої складності.',
      'alpiK is a team of professional rope access specialists focused on high‑level works of any complexity.'],
    ['Ми виконуємо завдання там, де звичайні методи недоступні або економічно невигідні, забезпечуючи високу якість, безпеку та чітке дотримання термінів.',
      'We work where standard methods are inaccessible or inefficient, ensuring high quality, safety and clear deadlines.'],
    ['Наша компанія поєднує досвід, сучасні технології та відповідальний підхід до кожного проєкту.',
      'Our company combines experience, modern technology and a responsible approach to every project.'],
    ['Ми працюємо не за шаблонами — кожне рішення створюємо індивідуально під потреби клієнта та супроводжуємо його на всіх етапах: від ідеї до фінального результату.',
      'We don\u2019t work by templates \u2014 we tailor each solution to the client\u2019s needs and support the project from idea to final result.'],

    ['Чим ми займаємось?', 'What do we do?'],
    ['Ми виконуємо повний спектр висотних і промислових робіт, зокрема:', 'We provide a full range of rope access and industrial works, including:'],
    ['Монтаж водостічних систем та відливів', 'Installation of gutter systems and flashings'],
    ['Ремонт і модернізація димових труб', 'Chimney stack repair and modernization'],
    ['Монтаж димоходів і повітропроводів', 'Installation of chimneys and air ducts'],
    ['Демонтаж димових труб та металоконструкцій', 'Demolition of chimneys and steel structures'],
    ['Комплексний ремонт елеваторів, очищення та ремонт силосів', 'Grain elevator overhaul, silo cleaning and repair'],
    ['Антикорозійна обробка та фарбування металоконструкцій', 'Anti‑corrosion treatment and painting of steel structures'],
    ['Піскоструминне та гідроструйне очищення поверхонь', 'Sandblasting and high‑pressure surface cleaning'],
    ['Монтаж світлопрозорих конструкцій', 'Installation of translucent structures'],
    ['Монтаж рекламних конструкцій, навішування банерів', 'Installation of advertising structures, banner hanging'],
    ['Очищення покрівель від снігу, бурульок і полою', 'Roof cleaning from snow, icicles and ice'],
    ['Миття фасадів будівель, вікон та виробничих цехів', 'Washing facades, windows and industrial premises'],
    ['Монтаж декорацій та освітлення', 'Decorations and lighting installation'],
    ['Монтаж сонячних панелей', 'Solar panel installation'],
    ['Прокладання та монтаж силових кабелів на висоті', 'Routing and installation of power cables at height'],

    ['Наші переваги', 'Our advantages'],
    ['Професійні висотні роботи будь-якої складності з дотриманням усіх норм безпеки',
      'Professional rope access works of any complexity with full safety compliance'],
    ['Досвідчені промислові альпіністи з офіційними допусками та сертифікатами',
      'Experienced specialists with proper permits and certifications'],
    ['Працюємо без риштувань і підйомників — швидко, акуратно та без зайвих витрат',
      'Work without scaffolding or lifts \u2014 faster, cleaner and without extra costs'],
    ['Оперативний виїзд і чітке дотримання погоджених термінів', 'Fast response and strict adherence to agreed timelines'],
    ['Використовуємо лише надійне спорядження та перевірені матеріали', 'We use reliable equipment and proven materials'],
    ['Надаємо гарантію на всі виконані роботи', 'We provide a warranty for all completed works'],

    ['Наша фішка', 'What makes us different'],
    ['alpiK береться за складні та нестандартні об’єкти, від яких відмовляються інші. Ми доводимо кожен проєкт до безпечного, якісного та довготривалого результату.',
      'alpiK takes on complex and non‑standard objects that others refuse. We deliver each project to a safe, high‑quality and long‑lasting result.']
  ],

  'contacts.html': [
    ['aria-label="Контакти"', 'aria-label="Contacts"'],
    ['aria-label="Фото робіт"', 'aria-label="Work photos"'],
    ['Контактний телефон:', 'Phone:'],
    ['aria-label="Месенджери"', 'aria-label="Messengers"'],
    ['aria-label="Написати у Viber"', 'aria-label="Message on Viber"'],
    ['aria-label="Написати у Telegram"', 'aria-label="Message on Telegram"'],
    ['aria-label="Категорії"', 'aria-label="Pages"'],
    ['aria-label="Логотип"', 'aria-label="Logo"'],
    ['Всі права захищені.', 'All rights reserved.']
  ],

  'our-projects.html': [
    ['<title>\u041d\u0430\u0448\u0456 \u043f\u0440\u043e\u0435\u043a\u0442\u0438 \u2014 alpiK</title>', '<title>Projects \u2014 alpiK</title>'],
    ['>\u041d\u0430\u0448\u0456 \u043f\u0440\u043e\u0435\u043a\u0442\u0438</a>', '>Projects</a>'],
    ['<h1>\u041d\u0430\u0448\u0456 \u043f\u0440\u043e\u0435\u043a\u0442\u0438</h1>', '<h1>Projects</h1>'],
    ['Тут буде галерея реалізованих проектів з фото-заглушками.', 'A gallery of completed projects will be here (placeholder photos for now).'],
    ['alt="\u041f\u0440\u043e\u0435\u043a\u0442 1"', 'alt="Project 1"'],
    ['alt="\u041f\u0440\u043e\u0435\u043a\u0442 2"', 'alt="Project 2"'],
    ['alt="\u041f\u0440\u043e\u0435\u043a\u0442 3"', 'alt="Project 3"'],
    ['alt="\u041f\u0440\u043e\u0435\u043a\u0442 4"', 'alt="Project 4"'],
    ['aria-label="Категорії"', 'aria-label="Pages"'],
    ['aria-label="Логотип"', 'aria-label="Logo"'],
    ['Всі права захищені.', 'All rights reserved.']
  ]
};

function applyPageTranslations(html, fileName) {
  const pairs = pageTranslations[fileName];
  if (!pairs) return html;
  let out = html;
  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }
  return out;
}

function listHtmlFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
    .map((d) => d.name);
}

function ensureUaSwitcher(html) {
  if (html.includes('lang-switcher.js')) return html;
  const insert = '    <script src="lang-switcher.js" defer></script>\r\n</body>';
  return html.replace(/<\/body>/i, insert);
}

function ensureTracking(html) {
  if (html.includes('tracking.js')) return html;
  const insert = '    <script src="/tracking.js" defer></script>\r\n</body>';
  return html.replace(/<\/body>/i, insert);
}

function injectGtm(html) {
  if (!GTM_ID || !/^GTM-[A-Z0-9]+$/i.test(GTM_ID)) return html;

  const headBlock = [
    '<!-- gtm:start -->',
    `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>`,
    '<!-- gtm:end -->'
  ].join('\r\n');

  const bodyBlock = [
    '<!-- gtm-noscript:start -->',
    `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
    '<!-- gtm-noscript:end -->'
  ].join('\r\n');

  let out = html;
  out = out.replace(/\s*<!-- gtm:start -->[\s\S]*?<!-- gtm:end -->\s*/g, '\r\n');
  out = out.replace(/\s*<!-- gtm-noscript:start -->[\s\S]*?<!-- gtm-noscript:end -->\s*/g, '\r\n');
  out = out.replace(/<\/head>/i, `${headBlock}\r\n</head>`);
  out = out.replace(/<body([^>]*)>/i, `<body$1>\r\n${bodyBlock}`);
  return out;
}

function cleanupHtml(html, { isEn }) {
  let out = html;

  // Fix a common broken comment closer in footer markup: "</li><--" -> "</li>-->"
  out = out.replace(/<\/li><--/g, '</li>-->');

  // Fix another common broken closer: "-->>" -> "-->" (stray extra ">" after a comment)
  out = out.replace(/-->>/g, '-->');

  if (isEn) {
    // Remove ONLY those HTML comments whose *content* still contains Cyrillic.
    // This is done per-comment to avoid accidentally spanning across multiple comments.
    out = out.replace(/<!--[\s\S]*?-->/g, (comment) => {
      return /[\u0400-\u04FF]/.test(comment) ? '' : comment;
    });
  }

  return out;
}

function normalizeForPrettyUrls(html, { isEn }) {
  let out = html;

  // Root-relative static assets (works regardless of current URL depth)
  out = out.replace(/href="(?:\.\.\/)?style\.css"/g, 'href="/style.css"');
  out = out.replace(/src="(?:\.\.\/)?img\//g, 'src="/img/');
  out = out.replace(/src="(?:\.\.\/)?lang-switcher\.js"/g, 'src="/lang-switcher.js"');
  out = out.replace(/src="(?:\.\.\/)?tracking\.js"/g, 'src="/tracking.js"');

  // Root-relative internal navigation (avoid relative links breaking on /slug/ URLs)
  const prefix = isEn ? '/en' : '';
  out = out.replace(
    /href="(?!https?:|mailto:|tel:|viber:|#)([^"\/]+?)\.html"/g,
    (_m, slug) => {
      const lower = String(slug).toLowerCase();
      if (lower === 'index') return `href="${prefix || '/'}"`;
      return `href="${prefix}/${slug}/"`;
    }
  );

  // Ensure /en doesn't become //en
  out = out.replace(/href="\/en\//g, 'href="/en/');

  if (isEn) {
    // EN pages should keep navigation inside /en/ for all internal page links.
    // UA pages use root paths like /about/; without this, users fall back to UA when navigating.
    out = out.replace(/href="\/"/g, 'href="/en/"');
    out = out.replace(/href='\/'/g, "href='/en/'");

    out = out.replace(
      /href="\/(about|contacts|our-services|our-projects|service-\d{2})\/?"/g,
      (_m, slug) => `href="/en/${slug}/"`
    );
    out = out.replace(
      /href='\/(about|contacts|our-services|our-projects|service-\d{2})\/?'/g,
      (_m, slug) => `href='/en/${slug}/'`
    );
  }

  return out;
}

function injectI18nSeo(html, fileName, isEn) {
  const normalize = (name) => {
    if (!name) return '/';
    if (name.toLowerCase() === 'index.html') return '/';
    return `/${name.replace(/\.html$/i, '')}/`;
  };

  const uaUrl = `${BASE_URL}${normalize(fileName)}`;
  const enUrl = `${BASE_URL}/en${normalize(fileName)}`;
  const canonical = isEn ? enUrl : uaUrl;

  const block = [
    '<!-- i18n-seo:start -->',
    `<link rel="canonical" href="${canonical}">`,
    `<link rel="alternate" hreflang="uk" href="${uaUrl}">`,
    `<link rel="alternate" hreflang="en" href="${enUrl}">`,
    `<link rel="alternate" hreflang="x-default" href="${uaUrl}">`,
    '<!-- i18n-seo:end -->'
  ].join('\r\n');

  let out = html;
  out = out.replace(/\s*<!-- i18n-seo:start -->[\s\S]*?<!-- i18n-seo:end -->\s*/g, '\r\n');
  if (out.includes('rel="alternate" hreflang="en"') || out.includes('rel="canonical"')) {
    // No-op: we still prefer to insert our block even if others exist.
  }
  return out.replace(/<\/head>/i, `${block}\r\n</head>`);
}

function replaceInner(html, pattern, replacement) {
  const match = html.match(pattern);
  if (!match) return html;
  return html.replace(pattern, replacement);
}

function applyServiceTranslation(html, serviceNo) {
  const t = serviceTranslations[serviceNo];
  if (!t) return html;

  let out = html;

  // <title>
  out = out.replace(/<title>[\s\S]*?—\s*alpiK<\/title>/i, `<title>${t.title} — alpiK</title>`);

  // Hero title
  out = out.replace(
    /(<h1\s+class="hero-title">)[\s\S]*?(<\/h1>)/i,
    `$1${t.title}$2`
  );

  // Hero subtitle
  out = out.replace(
    /(<p\s+class="hero-subtitle">)[\s\S]*?(<\/p>)/i,
    `$1${t.subtitle}$2`
  );

  // Section title
  out = out.replace(
    /(<h2\s+class="section-title">)\s*\d{2}\.\s*[\s\S]*?(<\/h2>)/i,
    `$1${serviceNo}. ${t.title}$2`
  );

  // Service prose
  const proseHtml = t.paragraphs.map((p) => `<p>${p}</p>`).join('\r\n                    ');
  out = replaceInner(
    out,
    /(<div\s+class="service-prose">)[\s\S]*?(<\/div>)/i,
    `$1\r\n                    ${proseHtml}\r\n                $2`
  );

  return out;
}

function applyServicesCatalogTranslation(html) {
  let out = html;

  // Hero (our-services)
  out = out.replace(/aria-label="\u041d\u0430\u0448\u0456 \u043f\u043e\u0441\u043b\u0443\u0433\u0438"/gu, 'aria-label="Services"');
  out = out.replace(/(<div\s+class="hero-kicker">)\u041d\u0430\u0448\u0456 \u043f\u043e\u0441\u043b\u0443\u0433\u0438(<\/div>)/gu, '$1Services$2');
  out = out.replace(
    /(<h1\s+class="hero-title">)[\s\S]*?(<\/h1>)/i,
    '$1Rope Access & Construction$2'
  );
  out = out.replace(
    /(<p\s+class="hero-subtitle">)[\s\S]*?(<\/p>)/i,
    '$1We deliver a full range of works: from diagnostics and inspection to installation, repair, dismantling and maintenance of complex objects.$2'
  );

  // Section title + lead
  out = out.replace(/aria-label="\u041f\u0435\u0440\u0435\u043b\u0456\u043a \u043f\u043e\u0441\u043b\u0443\u0433"/gu, 'aria-label="Services list"');
  out = out.replace(/>\u041f\u0435\u0440\u0435\u043b\u0456\u043a \u043f\u043e\u0441\u043b\u0443\u0433<\/h2>/gu, '>Services list</h2>');
  out = out.replace(
    /(<p\s+class="services-catalog-lead">)[\s\S]*?(<\/p>)/i,
    '$1Choose a service — we\u2019ll recommend the best approach and provide a cost estimate.$2'
  );

  // Each card: aria-label + title based on service number
  out = out.replace(
    /(<a\s+class="services-catalog-card"[\s\S]*?href=")([^"]*?service-(\d{2})\/)("[\s\S]*?aria-label=")([^"]*)("[\s\S]*?>)/gi,
    (m, p1, _href, no, p4, _old, p6) => {
      const t = serviceTranslations[no];
      if (!t) return m;
      return `${p1}${_href}${p4}${t.title}${p6}`;
    }
  );

  out = out.replace(
    /(<a\s+class="services-catalog-card"[\s\S]*?href=")([^"]*?service-(\d{2})\/)("[\s\S]*?<h3\s+class="services-catalog-title">)[\s\S]*?(<\/h3>)/gi,
    (m, p1, _href, no, p4, p5) => {
      const t = serviceTranslations[no];
      if (!t) return m;
      return `${p1}${_href}${p4}${t.title}${p5}`;
    }
  );

  return out;
}

function buildEnFromUa(html, fileName) {
  let out = html;

  // lang
  out = out.replace(/(<html[^>]*\blang=")uk(")/i, '$1en$2');

  // Minimal UI translations (UA -> EN)
  const pairs = [
    // titles
    ['<title>alpiK \u2014 \u0413\u043e\u043b\u043e\u0432\u043d\u0430</title>', '<title>alpiK \u2014 Home</title>'],
    ['<title>\u041f\u0440\u043e \u043a\u043e\u043c\u043f\u0430\u043d\u0456\u044e \u2014 alpiK</title>', '<title>About \u2014 alpiK</title>'],
    ['<title>\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438 \u2014 alpiK</title>', '<title>Contacts \u2014 alpiK</title>'],
    ['<title>\u041d\u0430\u0448\u0456 \u043f\u043e\u0441\u043b\u0443\u0433\u0438 \u2014 alpiK</title>', '<title>Services \u2014 alpiK</title>'],

    // aria labels
    ['aria-label="\u041d\u0430 \u0433\u043e\u043b\u043e\u0432\u043d\u0443"', 'aria-label="Home"'],
    ['aria-label="\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 \u043c\u0435\u043d\u044e"', 'aria-label="Open menu"'],

    // nav links
    ['>\u0413\u043e\u043b\u043e\u0432\u043d\u0430</a>', '>Home</a>'],
    ['>\u041f\u0440\u043e \u043a\u043e\u043c\u043f\u0430\u043d\u0456\u044e</a>', '>About</a>'],
    ['>\u041d\u0430\u0448\u0456 \u043f\u043e\u0441\u043b\u0443\u0433\u0438</a>', '>Services</a>'],
    ['>\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438</a>', '>Contacts</a>'],

    // common CTAs
    ['\u041d\u0410\u041f\u0418\u0421\u0410\u0422\u0418 \u041d\u0410\u041c', 'CONTACT US'],
    ['\u041d\u0430\u043f\u0438\u0441\u0430\u0442\u0438 \u043d\u0430\u043c', 'Contact us'],
    ['\u0417\u0410\u041c\u041e\u0412\u0418\u0422\u0418 \u041a\u041e\u041d\u0421\u0423\u041b\u042c\u0422\u0410\u0426\u0406\u042e', 'REQUEST A CONSULTATION'],
    ['\u0417\u0430\u043c\u043e\u0432\u0438\u0442\u0438 \u043a\u043e\u043d\u0441\u0443\u043b\u044c\u0442\u0430\u0446\u0456\u044e', 'Request a consultation'],
    ['\u0417\u0410\u0422\u0415\u041b\u0415\u0424\u041e\u041d\u0423\u0412\u0410\u0422\u0418', 'CALL'],

    // contact CTA
    ['\u041d\u0430\u043f\u0438\u0448\u0456\u0442\u044c \u043d\u0430\u043c', 'Message us'],
    ['\u041c\u0438 \u0431\u0443\u0434\u0435\u043c\u043e \u0440\u0430\u0434\u0456 \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u0441\u0442\u0438 \u043d\u0430 \u0432\u0441\u0456 \u0432\u0430\u0448\u0456 \u0437\u0430\u043f\u0438\u0442\u0430\u043d\u043d\u044f.', 'We\u2019ll be happy to answer all your questions.'],
    ['\u041d\u0410\u041f\u0418\u0421\u0410\u0422\u0418', 'MESSAGE'],

    // footer
    ['>\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0457<', '>Pages<'],
    ['>\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438<', '>Contacts<'],
    ['aria-label="\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0457"', 'aria-label="Pages"'],
    ['aria-label="\u041b\u043e\u0433\u043e\u0442\u0438\u043f"', 'aria-label="Logo"'],
    ['\u0412\u0441\u0456 \u043f\u0440\u0430\u0432\u0430 \u0437\u0430\u0445\u0438\u0449\u0435\u043d\u0456.', 'All rights reserved.'],

    // misc / comments
    ['<!-- header-top \u0441 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u043e\u043c \u0443\u0434\u0430\u043b\u0451\u043d -->', '<!-- header-top with phone removed -->'],
    ['\u041d\u0430\u0448\u0456 \u043f\u0440\u043e\u0435\u043a\u0442\u0438', 'Projects'],
    ['// \u041c\u043e\u0431\u0456\u043b\u044c\u043d\u0435 \u043c\u0435\u043d\u044e', '// Mobile menu'],

    // service pages
    ['\u0414\u041e \u0412\u0421\u0406\u0425 \u041f\u041e\u0421\u041b\u0423\u0413', 'ALL SERVICES'],
    ['\u041e\u043f\u0438\u0441 \u043f\u043e\u0441\u043b\u0443\u0433\u0438', 'Service details'],
  ];

  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }

  // Service kicker: <div class="hero-kicker">Послуга 01</div>
  out = out.replace(
    /(<div\s+class="hero-kicker">)\s*\u041f\u043e\u0441\u043b\u0443\u0433\u0430/gu,
    '$1Service'
  );
  out = out.replace(/aria-label="\u041f\u043e\u0441\u043b\u0443\u0433\u0430"/gu, 'aria-label="Service"');

  // Page-level translations (index/about/contacts/projects)
  out = applyPageTranslations(out, fileName);

  // Full translations for services and services catalog
  const serviceMatch = fileName.match(/^service-(\d{2})\.html$/i);
  if (serviceMatch) {
    out = applyServiceTranslation(out, serviceMatch[1]);
  }

  if (fileName.toLowerCase() === 'our-services.html') {
    out = applyServicesCatalogTranslation(out);
  }

  // SEO: canonical + hreflang
  out = injectI18nSeo(out, fileName, true);

  // GTM + tracking
  out = ensureTracking(out);
  out = injectGtm(out);

  // Final cleanup for EN output
  out = cleanupHtml(out, { isEn: true });

  // Pretty-URL safe assets + navigation
  out = normalizeForPrettyUrls(out, { isEn: true });

  return out;
}

fs.mkdirSync(enDir, { recursive: true });

const files = listHtmlFiles(root);
for (const name of files) {
  const src = path.join(root, name);
  const ua = fs.readFileSync(src, 'utf8');
  let uaFixed = ensureUaSwitcher(ua);
  uaFixed = injectI18nSeo(uaFixed, name, false);
  uaFixed = cleanupHtml(uaFixed, { isEn: false });
  uaFixed = normalizeForPrettyUrls(uaFixed, { isEn: false });
  if (uaFixed !== ua) fs.writeFileSync(src, uaFixed, 'utf8');

  const en = buildEnFromUa(uaFixed, name);
  fs.writeFileSync(path.join(enDir, name), en, 'utf8');
}

console.log(`Done. Rebuilt ${files.length} EN pages in ${enDir}`);
