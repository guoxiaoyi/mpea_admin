const CONTINENT_DEFINITIONS = [
  {
    code: 'asia',
    nameZh: '亚洲',
    nameEn: 'Asia',
    region: 'Asia'
  },
  {
    code: 'europe',
    nameZh: '欧洲',
    nameEn: 'Europe',
    region: 'Europe'
  },
  {
    code: 'africa',
    nameZh: '非洲',
    nameEn: 'Africa',
    region: 'Africa'
  },
  {
    code: 'north_america',
    nameZh: '北美洲',
    nameEn: 'North America',
    region: 'Americas',
    subregions: ['Northern America', 'North America', 'Central America', 'Caribbean']
  },
  {
    code: 'south_america',
    nameZh: '南美洲',
    nameEn: 'South America',
    region: 'Americas',
    subregions: ['South America']
  },
  {
    code: 'oceania',
    nameZh: '大洋洲',
    nameEn: 'Oceania',
    region: 'Oceania'
  },
  {
    code: 'antarctica',
    nameZh: '南极洲',
    nameEn: 'Antarctica',
    region: 'Antarctic'
  }
];

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const countriesCache = new Map(); // key: continentCode -> { expires, data }
const countryInfoCache = new Map(); // key: ISO2 -> { expires, data }
const citiesCache = new Map(); // key: ISO2 -> { expires, data }
const cityInfoCache = new Map(); // key: ISO2|city -> { expires, data }
const countryNameCache = new Map(); // key: name -> { expires, data }

function now() {
  return Date.now();
}

function getCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expires && entry.expires > now()) {
    return entry.data;
  }
  map.delete(key);
  return null;
}

function setCache(map, key, data, ttl = CACHE_TTL) {
  map.set(key, {
    data,
    expires: ttl ? now() + ttl : undefined
  });
}

function buildUserAgent() {
  return 'MPEA-Map/1.0 (+https://mpea.local/map)';
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': buildUserAgent(),
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`请求失败: ${response.status} ${response.statusText} ${body}`);
  }
  return response.json();
}

function resolveContinentCode(region, subregion) {
  if (!region) return null;
  const targetRegion = region.trim();
  const targetSub = subregion ? subregion.trim() : '';
  for (const def of CONTINENT_DEFINITIONS) {
    if (def.region !== targetRegion) continue;
    if (!def.subregions || def.subregions.length === 0) {
      return def.code;
    }
    if (targetSub && def.subregions.includes(targetSub)) {
      return def.code;
    }
  }

  // fallback: match broader region if subregion not listed
  const fallback = CONTINENT_DEFINITIONS.find((def) => def.region === targetRegion);
  return fallback ? fallback.code : null;
}

export function listContinents() {
  return CONTINENT_DEFINITIONS.map((item) => ({
    code: item.code,
    nameZh: item.nameZh,
    nameEn: item.nameEn
  }));
}

export function getContinentMeta(code) {
  if (!code) return null;
  const normalized = String(code).toLowerCase();
  const meta = CONTINENT_DEFINITIONS.find((item) => item.code === normalized);
  if (!meta) return null;
  return {
    code: meta.code,
    nameZh: meta.nameZh,
    nameEn: meta.nameEn
  };
}

async function fetchCountryInfoByIso2(iso2) {
  const upper = (iso2 || '').toUpperCase();
  if (!upper) return null;
  const cached = getCache(countryInfoCache, upper);
  if (cached) return cached;

  const data = await fetchJSON(
    `https://restcountries.com/v3.1/alpha/${upper}?fields=name,cca2,region,subregion,translations`
  );
  const entry = Array.isArray(data) ? data[0] : data;
  if (!entry) return null;

  const continentCode = resolveContinentCode(entry.region, entry.subregion);
  const info = {
    iso2: entry.cca2,
    nameEn: entry.name?.common || upper,
    nameZh: entry.translations?.zho?.common || entry.name?.common || upper,
    region: entry.region,
    subregion: entry.subregion,
    continentCode
  };
  setCache(countryInfoCache, upper, info);
  return info;
}

export async function getCountriesByContinent(continentCode) {
  const def = CONTINENT_DEFINITIONS.find((item) => item.code === continentCode);
  if (!def) {
    throw new Error('未知的洲代码');
  }
  const cached = getCache(countriesCache, continentCode);
  if (cached) return cached;

  const url = `https://restcountries.com/v3.1/region/${def.region}?fields=name,cca2,region,subregion,translations`;
  const payload = await fetchJSON(url);
  if (!Array.isArray(payload)) {
    throw new Error('国家数据解析失败');
  }

  const countries = payload
    .filter((country) => {
      if (!country || !country.cca2) return false;
      const resolved = resolveContinentCode(country.region, country.subregion);
      if (!resolved) return false;
      if (def.subregions && def.subregions.length > 0) {
        return resolved === def.code;
      }
      return country.region === def.region;
    })
    .map((country) => {
      const code = country.cca2.toUpperCase();
      const info = {
        iso2: code,
        nameEn: country.name?.common || code,
        nameZh: country.translations?.zho?.common || country.name?.common || code,
        region: country.region,
        subregion: country.subregion,
        continentCode: def.code
      };
      setCache(countryInfoCache, code, info);
      return info;
    })
    .sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-CN'));

  setCache(countriesCache, continentCode, countries);
  return countries;
}

export async function getCitiesByCountryCode(countryCode) {
  if (!countryCode) throw new Error('国家代码缺失');
  const upper = countryCode.toUpperCase();
  const cached = getCache(citiesCache, upper);
  if (cached) return cached;

  const countryInfo = await fetchCountryInfoByIso2(upper);
  if (!countryInfo) throw new Error('未找到国家信息');

  const response = await fetchJSON('https://countriesnow.space/api/v0.1/countries/cities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      country: countryInfo.nameEn
    })
  });

  if (response.error) {
    throw new Error(response.msg || '获取城市数据失败');
  }

  const cities = Array.isArray(response.data) ? response.data : [];
  const normalized = [...new Set(cities.filter((item) => typeof item === 'string' && item.trim()))]
    .map((item) => item.trim())
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));

  setCache(citiesCache, upper, normalized);
  return normalized;
}

export async function getCityInfo(countryCode, cityName) {
  if (!countryCode || !cityName) throw new Error('城市信息参数不完整');
  const upper = countryCode.toUpperCase();
  const key = `${upper}|${cityName.toLowerCase()}`;

  const cached = getCache(cityInfoCache, key);
  if (cached) return cached;

  const countryInfo = await fetchCountryInfoByIso2(upper);
  if (!countryInfo) throw new Error('未找到国家信息');

  const searchParams = new URLSearchParams({
    name: cityName,
    count: '5',
    language: 'zh',
    format: 'json',
    country: countryInfo.nameEn
  });

  const data = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?${searchParams.toString()}`);
  const results = Array.isArray(data?.results) ? data.results : [];

  const matched = results.find((item) => item.country_code?.toUpperCase() === upper) || results[0];
  if (!matched) {
    return null;
  }

  const info = {
    continentCode: countryInfo.continentCode,
    continentNameZh:
      CONTINENT_DEFINITIONS.find((item) => item.code === countryInfo.continentCode)?.nameZh || '',
    continentNameEn:
      CONTINENT_DEFINITIONS.find((item) => item.code === countryInfo.continentCode)?.nameEn || '',
    countryCode: upper,
    countryNameZh: countryInfo.nameZh,
    countryNameEn: countryInfo.nameEn,
    cityName: matched.name || cityName,
    admin1: matched.admin1 || '',
    admin2: matched.admin2 || '',
    latitude: matched.latitude,
    longitude: matched.longitude,
    timezone: matched.timezone || '',
    raw: matched,
    source: 'open-meteo-geocoding'
  };

  setCache(cityInfoCache, key, info, 1000 * 60 * 60); // cache 1 hour
  return info;
}

export async function resolveCountryByName(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  const cached = getCache(countryNameCache, key);
  if (cached) return cached;

  try {
    const data = await fetchJSON(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(trimmed)}?fields=cca2,name,translations`
    );
    const entry = Array.isArray(data) ? data[0] : data;
    if (!entry) return null;
    const info = {
      iso2: entry.cca2 ? entry.cca2.toUpperCase() : '',
      nameEn: entry.name?.common || trimmed,
      nameZh: entry.translations?.zho?.common || entry.name?.common || trimmed
    };
    setCache(countryNameCache, key, info);
    return info;
  } catch (error) {
    console.warn('resolveCountryByName failed:', error.message);
    return null;
  }
}

export default {
  listContinents,
  getCountriesByContinent,
  getCitiesByCountryCode,
  getCityInfo,
  getContinentMeta,
  resolveCountryByName
};


