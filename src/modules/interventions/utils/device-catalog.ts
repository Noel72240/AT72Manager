/** Valeur sentinelle pour les champs « Autre » */
export const CUSTOM_OPTION_VALUE = '__custom__'

export const DEVICE_CATEGORIES = [
  'Téléphone',
  'Tablette',
  'PC portable',
  'PC fixe',
  'TV',
  'Console de jeux',
  'Montre connectée',
  'Imprimante',
  'Autre',
] as const

export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number]

/** Marques téléphones / tablettes — marché européen */
export const PHONE_BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'POCO',
  'Huawei',
  'Honor',
  'Oppo',
  'OnePlus',
  'Realme',
  'Google',
  'Nokia (HMD)',
  'Motorola',
  'Sony',
  'Asus',
  'Nothing',
  'Fairphone',
  'Crosscall',
  'Wiko',
  'Alcatel',
  'TCL',
  'Doro',
  'Gigaset',
  'Meizu',
  'ZTE',
  'Vivo',
  'Tecno',
  'Infinix',
  'Blackview',
  'Doogee',
  'Ulefone',
  'Cubot',
  'Energizer',
  'Cat (Caterpillar)',
  'Hammer',
  'Shift',
  'Lenovo',
  'Microsoft',
  'LG',
  'HTC',
  'BQ',
  'Archos',
  'Orange',
  'Bouygues Telecom',
  'SFR',
  'Freebox (Free)',
] as const

export const PC_BRANDS = [
  'Apple',
  'Asus',
  'Acer',
  'Dell',
  'HP',
  'Lenovo',
  'MSI',
  'Microsoft',
  'Razer',
  'Samsung',
  'Huawei',
  'LG',
  'Toshiba',
  'Fujitsu',
  'Gigabyte',
] as const

export const TV_BRANDS = [
  'Samsung',
  'LG',
  'Sony',
  'Philips',
  'Panasonic',
  'TCL',
  'Hisense',
  'Grundig',
  'Thomson',
  'Sharp',
  'Loewe',
  'Toshiba',
  'Haier',
  'Xiaomi',
  'Huawei',
] as const

export const CONSOLE_BRANDS = [
  'Sony (PlayStation)',
  'Microsoft (Xbox)',
  'Nintendo',
  'Valve (Steam Deck)',
  'Asus (ROG Ally)',
  'Lenovo (Legion Go)',
] as const

export const PHONE_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  Apple: [
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Plus',
    'iPhone 16',
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Plus',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14 Plus',
    'iPhone 14',
    'iPhone 13',
    'iPhone 12',
    'iPhone 11',
    'iPhone SE (2022)',
    'iPhone SE (2020)',
  ],
  Samsung: [
    'Galaxy S25 Ultra',
    'Galaxy S25+',
    'Galaxy S25',
    'Galaxy S24 Ultra',
    'Galaxy S24+',
    'Galaxy S24',
    'Galaxy S23 Ultra',
    'Galaxy S23+',
    'Galaxy S23',
    'Galaxy S22',
    'Galaxy A55',
    'Galaxy A54',
    'Galaxy A35',
    'Galaxy A34',
    'Galaxy A25',
    'Galaxy A15',
    'Galaxy A05',
    'Galaxy Z Fold6',
    'Galaxy Z Flip6',
    'Galaxy Z Fold5',
    'Galaxy Z Flip5',
  ],
  Xiaomi: [
    '14 Ultra',
    '14 Pro',
    '14',
    '13T Pro',
    '13T',
    '13 Pro',
    '13',
    '12T Pro',
    '12T',
    'Redmi Note 13 Pro+',
    'Redmi Note 13 Pro',
    'Redmi Note 13',
    'Redmi Note 12 Pro',
    'Redmi 13C',
    'Poco X6 Pro',
    'Poco F6 Pro',
    'Poco M6 Pro',
  ],
  Redmi: ['Note 13 Pro+', 'Note 13 Pro', 'Note 13', 'Note 12 Pro', '13C', 'A3', '12'],
  POCO: ['X6 Pro', 'X6', 'F6 Pro', 'F6', 'M6 Pro', 'M6', 'C65'],
  Huawei: [
    'P60 Pro',
    'P60',
    'Mate 60 Pro',
    'Mate 50 Pro',
    'Nova 12 Pro',
    'Nova 12',
    'Nova 11',
    'P50 Pro',
    'MatePad Pro',
  ],
  Honor: [
    'Magic6 Pro',
    'Magic6',
    'Magic5 Pro',
    '200 Pro',
    '200',
    '90',
    'X8b',
    'X7b',
    'X6b',
  ],
  Oppo: [
    'Find X7 Ultra',
    'Find X6 Pro',
    'Reno12 Pro',
    'Reno12',
    'Reno11 Pro',
    'Reno11',
    'A79',
    'A58',
    'A38',
  ],
  OnePlus: [
    '12',
    '12R',
    '11',
    'Nord 4',
    'Nord CE 4',
    'Nord CE 3 Lite',
    'Open',
  ],
  Realme: [
    'GT 6',
    'GT 5 Pro',
    '12 Pro+',
    '12 Pro',
    '12',
    '11 Pro+',
    'C67',
    'C55',
  ],
  Google: [
    'Pixel 9 Pro XL',
    'Pixel 9 Pro',
    'Pixel 9',
    'Pixel 8 Pro',
    'Pixel 8',
    'Pixel 8a',
    'Pixel 7 Pro',
    'Pixel 7',
    'Pixel 7a',
    'Pixel Fold',
  ],
  'Nokia (HMD)': [
    'G42 5G',
    'G22',
    'G21',
    'X30 5G',
    'XR21',
    'C32',
    'C22',
    '105 4G',
  ],
  Motorola: [
    'Edge 50 Ultra',
    'Edge 50 Pro',
    'Edge 50',
    'Edge 40 Pro',
    'Edge 40',
    'Moto G84',
    'Moto G54',
    'Moto G34',
    'Moto G14',
    'Razr 40 Ultra',
    'Razr 40',
  ],
  Sony: [
    'Xperia 1 VI',
    'Xperia 1 V',
    'Xperia 5 V',
    'Xperia 10 VI',
    'Xperia 10 V',
  ],
  Asus: [
    'ROG Phone 8 Pro',
    'ROG Phone 8',
    'Zenfone 11 Ultra',
    'Zenfone 10',
  ],
  Nothing: ['Phone (2a)', 'Phone (2)', 'Phone (1)'],
  Fairphone: ['Fairphone 5', 'Fairphone 4', 'Fairphone 3+'],
  Crosscall: ['Stellar-X5', 'Core-Z5', 'Action-X5', 'Core-M5'],
  Wiko: ['T50', 'T30', 'Power U30', '10', 'Power U20'],
  Alcatel: ['3L (2022)', '1S (2021)', '1B (2022)', '1V (2021)'],
  TCL: ['50 5G', '40 SE', '30 SE', '20 SE'],
  Doro: ['8080', '8050', '7860', '6880'],
  Gigaset: ['GX6', 'GX4', 'GS5'],
  Meizu: ['21', '20 Pro', '20', '18'],
  ZTE: ['Blade V50', 'Blade A73', 'Axon 60 Ultra', 'Nubia Z60 Ultra'],
  Vivo: ['X100 Pro', 'X100', 'V30 Pro', 'V29', 'Y36'],
  Tecno: ['Camon 30 Premier', 'Camon 30 Pro', 'Spark 20 Pro', 'Pova 6 Pro'],
  Infinix: ['GT 20 Pro', 'Note 40 Pro', 'Hot 40 Pro', 'Smart 8'],
  Blackview: ['BV9300 Pro', 'BV9200', 'A96', 'Shark 8'],
  Doogee: ['S100 Pro', 'V Max', 'S89 Pro'],
  Ulefone: ['Armor 24', 'Power Armor 18T', 'Note 16 Pro'],
  Cubot: ['KingKong 9', 'P80', 'Note 50'],
  Energizer: ['Hard Case G5', 'Ultimate U710S'],
  'Cat (Caterpillar)': ['S62 Pro', 'S53', 'S42 H+'],
  Hammer: ['Blade 5G', 'Explorer Pro', 'Iron 4'],
  Shift: ['SHIFT6mq', 'SHIFTphone 8'],
  Lenovo: ['Legion Phone Duel 2', 'K13 Note', 'Moto (via Lenovo)'],
  Microsoft: ['Surface Duo 2', 'Surface Duo'],
  LG: ['Wing', 'Velvet', 'G8X ThinQ', 'K52'],
  HTC: ['U23 Pro', 'Desire 22 Pro', 'Wildfire E3'],
  BQ: ['Aquaris X2 Pro', 'Aquaris X', 'Aquaris V'],
  Archos: ['Diamond Omega', '50 Diamond', '55 Graphite'],
  Orange: ['Neva play', 'Neva jet', 'Rise 55'],
  'Bouygues Telecom': ['B-Happy', 'B-Smart'],
  SFR: ['Startrail 9', 'Staraddict 6'],
  'Freebox (Free)': ['Freebox Pop', 'Freebox Delta'],
}

export const PC_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  Apple: ['MacBook Air M3', 'MacBook Air M2', 'MacBook Pro 14"', 'MacBook Pro 16"', 'iMac 24"'],
  Asus: ['ZenBook 14', 'VivoBook 15', 'ROG Strix G16', 'TUF Gaming A15'],
  Acer: ['Aspire 5', 'Swift 3', 'Nitro 5', 'Predator Helios'],
  Dell: ['XPS 13', 'XPS 15', 'Inspiron 15', 'Latitude 5540', 'Alienware m16'],
  HP: ['Pavilion 15', 'Envy x360', 'Spectre x360', 'Omen 16', 'EliteBook 840'],
  Lenovo: ['ThinkPad X1 Carbon', 'ThinkPad T14', 'IdeaPad 5', 'Legion 5 Pro', 'Yoga 7'],
  MSI: ['Modern 15', 'Creator Z16', 'Katana 15', 'Raider GE78'],
  Microsoft: ['Surface Laptop 5', 'Surface Pro 9', 'Surface Laptop Go 3'],
  Razer: ['Blade 16', 'Blade 15', 'Blade 14'],
  Samsung: ['Galaxy Book4 Pro', 'Galaxy Book3 Ultra'],
  Huawei: ['MateBook D16', 'MateBook X Pro'],
  LG: ['Gram 17', 'Gram 16', 'Gram 14'],
  Toshiba: ['Satellite Pro', 'Portégé X40'],
  Fujitsu: ['Lifebook U9311', 'Lifebook E5512'],
  Gigabyte: ['Aero 16', 'G5', 'Aorus 17X'],
}

export const TV_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  Samsung: ['QE65S95D', 'QE55S90D', 'QE65Q80D', 'UE55DU7170', 'The Frame 2024'],
  LG: ['OLED65G4', 'OLED55C4', '65QNED86', '43UR78006'],
  Sony: ['XR-65A95L', 'XR-55A80L', 'KD-65X85L', 'KD-43X75K'],
  Philips: ['65OLED808', '55PUS8808', '43PUS7608', 'Ambilight 55"'],
  Panasonic: ['TX-65MZ2000', 'TX-55MZ1500', 'TX-50MX800'],
  TCL: ['65C845', '55C745', '43P635'],
  Hisense: ['65U8KQ', '55A7KQ', '43A6K'],
  Grundig: ['55 GUT 9465', '43 GUT 7435'],
  Thomson: ['55UG6400', '43UG6400'],
  Sharp: ['55EQ6EA', '50EQ7EA'],
  Loewe: ['bild i.55', 'bild c.43'],
  Toshiba: ['55UA5D63', '43UA4D63'],
  Haier: ['H55K702UG', 'H43K702UG'],
  Xiaomi: ['TV A Pro 65', 'TV A 55', 'TV P1 43'],
  Huawei: ['Vision 65', 'Vision 55'],
}

export const CONSOLE_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  'Sony (PlayStation)': ['PlayStation 5 Pro', 'PlayStation 5', 'PlayStation 5 Digital', 'PlayStation 4 Pro', 'PlayStation 4'],
  'Microsoft (Xbox)': ['Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S'],
  Nintendo: ['Switch OLED', 'Switch', 'Switch Lite', 'Wii U'],
  'Valve (Steam Deck)': ['Steam Deck OLED', 'Steam Deck 512 Go', 'Steam Deck 256 Go'],
  'Asus (ROG Ally)': ['ROG Ally X', 'ROG Ally Z1 Extreme'],
  'Lenovo (Legion Go)': ['Legion Go', 'Legion Go S'],
}

export function getBrandOptions(category: string): readonly string[] {
  switch (category) {
    case 'Téléphone':
    case 'Tablette':
    case 'Montre connectée':
      return PHONE_BRANDS
    case 'PC portable':
    case 'PC fixe':
      return PC_BRANDS
    case 'TV':
      return TV_BRANDS
    case 'Console de jeux':
      return CONSOLE_BRANDS
    default:
      return PHONE_BRANDS
  }
}

export function getModelOptions(category: string, brand: string): string[] {
  if (!brand) return []

  let catalog: Record<string, readonly string[]> = PHONE_MODELS_BY_BRAND

  switch (category) {
    case 'PC portable':
    case 'PC fixe':
      catalog = PC_MODELS_BY_BRAND
      break
    case 'TV':
      catalog = TV_MODELS_BY_BRAND
      break
    case 'Console de jeux':
      catalog = CONSOLE_MODELS_BY_BRAND
      break
    default:
      catalog = PHONE_MODELS_BY_BRAND
  }

  const models = catalog[brand] ?? []
  return [...models]
}

export function toSelectOptions(
  items: readonly string[],
  placeholder: string,
  includeCustom = false,
): { value: string; label: string }[] {
  const base = [
    { value: '', label: placeholder },
    ...items.map((item) => ({ value: item, label: item })),
  ]
  if (includeCustom) {
    base.push({ value: CUSTOM_OPTION_VALUE, label: 'Autre (saisie libre)…' })
  }
  return base
}

export function resolveStoredModel(model: string, customModel: string): string {
  if (model === CUSTOM_OPTION_VALUE) {
    return customModel.trim()
  }
  return model.trim()
}

export function modelToFormFields(storedModel?: string): { model: string; customModel: string } {
  if (!storedModel) {
    return { model: '', customModel: '' }
  }
  return { model: storedModel, customModel: '' }
}

/** Détecte si le modèle enregistré correspond à une option du catalogue */
export function matchModelInCatalog(
  category: string,
  brand: string,
  storedModel: string,
): { model: string; customModel: string } {
  if (!storedModel) {
    return { model: '', customModel: '' }
  }

  const options = getModelOptions(category, brand)
  if (options.includes(storedModel)) {
    return { model: storedModel, customModel: '' }
  }

  return { model: CUSTOM_OPTION_VALUE, customModel: storedModel }
}
