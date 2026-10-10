/**
 * Sumber konten halaman detail 1 (hardcode).
 * Boleh diganti lewat `setProduct()` — halaman 2 mengisi nilai ini dari
 * response API. Semua importer memakai live binding, jadi render berikutnya
 * otomatis membaca nilai terbaru.
 */
export let product = {
  id: 'mw75-tumi',
  name: 'MW75 TUMI',
  category: 'Noise-Cancelling Wireless Headphones',
  price: 750,
  availability: 'in_stock',

  announcement: 'Free US Ground shipping on orders of $99 or more.',

  nav: [
    { label: 'Headphones', href: '#' },
    { label: 'Earphones', href: '#' },
    { label: 'Accessories', href: '#' },
    { label: 'Collaborations', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Orders', href: './orders.html' },
  ],

  breadcrumb: [
    { label: 'All Products', href: '#' },
    { label: 'MW75 TUMI', href: null },
  ],

  variants: [
    {
      id: 'black',
      label: 'Black',
      swatch: '#1b1b1b',
      isDefault: true,
      quantity: 12,
      images: [
        {
          src: '/img/black-hero.png',
          alt: 'Floating black TUMI MW75 Active Noise-Cancelling headphones — three-quarter view',
        },
        {
          src: '/img/black-front.png',
          alt: 'Black TUMI MW75 headphones — front view',
        },
        {
          src: '/img/black-engraving.png',
          alt: 'Close-up of TUMI 19 Degree engraving detail on black MW75 headphones',
        },
        {
          src: '/img/black-straight.png',
          alt: 'Black TUMI MW75 headphones — straight side profile view',
        },
      ],
    },
    {
      id: 'silver',
      label: 'Silver',
      swatch: '#cfcfcf',
      isDefault: false,
      quantity: 0,
      images: [
        {
          src: '/img/silver-hero.png',
          alt: 'Floating silver TUMI MW75 Active Noise-Cancelling headphones — three-quarter view',
        },
        {
          src: '/img/silver-front.png',
          alt: 'Silver TUMI MW75 headphones — front view',
        },
        {
          src: '/img/silver-engraving.png',
          alt: 'Close-up of TUMI 19 Degree engraving detail on silver MW75 headphones',
        },
        {
          src: '/img/silver-straight.png',
          alt: 'Silver TUMI MW75 headphones — straight side profile view',
        },
      ],
    },
  ],

  usps: [
    { icon: '/img/icon-anc.svg', label: 'ANC' },
    {
      icon: '/img/icon-headphones.svg',
      label: 'Anodized aluminum, tempered glass and lambskin leather',
    },
    { icon: '/img/icon-driver.svg', label: '40mm beryllium drivers' },
    { icon: '/img/icon-battery.svg', label: '32 hours of listening' },
    { icon: '/img/icon-bluetooth.svg', label: 'Bluetooth® 5.1' },
    { icon: '/img/icon-mic.svg', label: '4 beamforming microphones' },
  ],

  policies: {
    shipping: {
      title: 'Free Shipping',
      body: 'Free ground shipping on orders of $99 or more in the U.S.',
    },
    returns: {
      title: 'Free Returns',
      body: 'We offer a 14-day return policy, allowing you to shop with confidence.',
    },
    warranty: {
      title: 'Product Protection',
      body: 'Rest easy with our manufacturer warranty, ensuring that your product is protected against any manufacturing defects or issues.',
      linkLabel: 'manufacturer warranty',
      linkHref: '#',
    },
  },

  story: {
    eyebrow: 'Master & Dynamic for',
    title: 'TUMI',
    image: '/img/tumi-feature.png',
    imageAlt: 'TUMI × Master & Dynamic collaboration — MW75 headphones and earphones',
    body: 'A collection of active noise-cancelling sound tools created in partnership with the international travel and lifestyle brand built to enhance any journey. Featuring TUMI’s iconic 19 Degree design details, the headphones and earphones are seamless blend of engineering precision and artistic expression.',
  },

  description: {
    eyebrow: 'MW75',
    title: 'Active Noise-Cancelling Wireless Headphones',
    image: '/img/mw75-feature.png',
    imageAlt: 'Black TUMI MW75 headphones resting on a travel surface',
    body: 'The MW75 Active Noise-Cancelling Wireless Headphones deliver detailed, serious acoustics and custom-tailored sound with 40mm Beryllium drivers and Adaptive Active Noise Cancellation for the perfect combination of sound and silence. Experience effortless all-day listening with lightweight anodized aluminum and soft lambskin leather in a distinct, refined silhouette.',
    links: [
      { label: 'Learn more', prefix: 'about MW75', href: '#' },
      { label: 'here', prefix: 'Discover the full TUMI collaboration', href: '#' },
    ],
  },

  specs: [
    {
      group: 'Materials and Design',
      items: [
        { label: 'Materials', value: 'Lambskin leather headband and ear pads/anodized aluminum controls' },
        { label: 'Dimensions', value: '160.75mm x 197.83mm x 83.57mm' },
        { label: 'Weight', value: '338g' },
        { label: 'Ear Coupling', value: 'Over-Ear' },
        { label: 'Ear Pads', value: 'Replaceable magnetic lambskin-wrapped memory foam' },
      ],
    },
    {
      group: 'Sound and Features',
      items: [
        { label: 'Drivers', value: '40mm beryllium' },
        { label: 'Impedance', value: '32 Ohms' },
        { label: 'Talk Microphones', value: '4 Microphone talk solution with wind protection' },
        { label: 'ANC Microphones', value: '4 Microphone ANC solution' },
        { label: 'Voice Assistant', value: 'Compatible with native voice assistants' },
      ],
    },
    {
      group: 'Connectivity and Charging',
      items: [
        {
          label: 'Battery Life',
          value: 'Up to 32 hours of battery life or up to 28 hours with ANC enabled',
        },
        {
          label: 'Bluetooth Profile',
          value: 'Bluetooth® 5.1 range of 100ft/30m with AAC, aptX™ Adaptive up to 24 bit/48kHz, and SBC. Hi-res requires a compatible source device and streaming service',
        },
        {
          label: 'Wired Digital',
          value: 'Supports hi-res audio up to 24-bit / 96kHz using provided USB-C to USB-C cable with supported devices',
        },
        { label: 'Analog', value: 'USB-C to 3.5mm cable for optional analog audio connection' },
        { label: 'Cables', value: 'USB-C to 3.5mm audio cable, USB-C to USB-C charging cable' },
        { label: 'Antenna', value: 'Internal Antenna' },
      ],
    },
  ],

  inTheBox: [
    { name: 'Wireless Headphones', image: '/img/box-headphones.png' },
    { name: 'USB-C to USB-C Charging Cable', image: '/img/box-usbc-usbc.png' },
    { name: 'USB-C to 3.5mm Audio Cable', image: '/img/box-usbc-35.png' },
    { name: 'USB-C to USB-A Adapter', image: '/img/box-usbc-usba.png' },
    { name: '3.5mm to 1/4" Adapter', image: '/img/box-35-quarter.png' },
    { name: 'Flight Adapter', image: '/img/box-flight.png' },
    { name: 'Hard Shell Travel Case', image: '/img/box-case.png' },
  ],

  support: {
    title: 'Need support? We’re here to assist you every step of the way.',
    body: 'Access product support and frequently asked questions in our Support Center',
    ctaLabel: 'Support Center',
    ctaHref: 'https://support.masterdynamic.com',
    image: '/img/support-bg.jpg',
  },

  newsletter: 'Sign up for early access, news and exclusive offers',

  footerGroups: [
    {
      title: 'Help & Info',
      links: [
        { label: 'Product Comparisons', href: '#' },
        { label: 'Product Support', href: 'https://support.masterdynamic.com' },
        { label: 'Shopping Info', href: '#' },
        { label: 'Product Detail (API)', href: './product-api.html' },
        { label: 'My Orders', href: './orders.html' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'News', href: '#' },
        { label: 'Contact Us', href: '#' },
      ],
    },
    {
      title: 'Gifting',
      links: [
        { label: 'Corporate Gifting', href: '#' },
        { label: 'Digital Gift Card', href: '#' },
      ],
    },
  ],

  legal: [
    { label: 'Do Not Sell / Share', href: '#' },
    { label: 'Notice At Collection', href: '#' },
    { label: 'Web Accessibility', href: '#' },
    { label: 'Personal Data Requests', href: '#' },
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Cookie Settings', href: '#' },
  ],

  address:
    'Designed and developed in New York City. 1178 Broadway, 3rd Floor, Suite 1205 New York, NY, 10001',
  copyright: '© 2026. All Rights Reserved.',
};

const AVAILABILITY_STATES = {
  sold_out: {
    label: 'Sold out / Pre-Order',
    ctaLabel: 'ADD TO CART',
    enabled: false,
    helper: 'This product is currently unavailable.',
  },
  pre_order: {
    label: 'Pre-Order',
    ctaLabel: 'PRE-ORDER',
    enabled: true,
    helper: 'Reserve now — your item ships when stock arrives.',
  },
  in_stock: {
    label: 'In stock',
    ctaLabel: 'ADD TO CART',
    enabled: true,
    helper: 'In stock and ready to ship.',
  },
};

export function getAvailabilityState(p = product) {
  return AVAILABILITY_STATES[p.availability] ?? AVAILABILITY_STATES.in_stock;
}

/** Varian dianggap tersedia bila `quantity` tidak diisi (mock) atau > 0. */
export function isVariantAvailable(variant) {
  return typeof variant?.quantity !== 'number' || variant.quantity > 0;
}

/** Ganti produk aktif (dipakai halaman 2 setelah menerima response API). */
export function setProduct(next) {
  product = next;
}
