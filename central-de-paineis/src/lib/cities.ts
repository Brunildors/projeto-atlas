import { countryName, t } from "../i18n";
import type { Address, City, Region } from "../types";
import { countryOf, HOME_COUNTRY } from "./countries";
import { compareText } from "./format";

const REGIONS: Partial<Record<string, Region>> = {
  "BR:SP": {
    label: "SP",
    rules: {
      fixed: [
        {
          month: 7,
          day: 9,
          name: "Revolução Constitucionalista de 1932",
          kind: "feriado",
          note: "Data magna do estado de São Paulo",
          since: 1997,
        },
      ],
    },
  },
  "BR:RJ": {
    label: "RJ",
    rules: { fixed: [{ month: 4, day: 23, name: "Dia de São Jorge", kind: "feriado", since: 2008 }] },
  },
  "BR:PR": {
    label: "PR",
    rules: { fixed: [{ month: 12, day: 19, name: "Emancipação Política do Paraná", kind: "feriado" }] },
  },
  "BR:RS": {
    label: "RS",
    rules: {
      fixed: [
        {
          month: 9,
          day: 20,
          name: "Revolução Farroupilha",
          kind: "feriado",
          note: "Data magna do Rio Grande do Sul",
        },
      ],
    },
  },
  "BR:BA": {
    label: "BA",
    rules: { fixed: [{ month: 7, day: 2, name: "Independência da Bahia", kind: "feriado" }] },
  },
  "BR:PE": {
    label: "PE",
    rules: {
      fixed: [
        {
          month: 3,
          day: 6,
          name: "Revolução Pernambucana de 1817",
          kind: "feriado",
          note: "Data magna de Pernambuco",
          since: 2018,
        },
      ],
    },
  },
  "BR:AL": {
    label: "AL",
    rules: {
      fixed: [
        { month: 6, day: 24, name: "São João", kind: "feriado" },
        { month: 6, day: 29, name: "São Pedro", kind: "feriado" },
        { month: 9, day: 16, name: "Emancipação Política de Alagoas", kind: "feriado" },
      ],
    },
  },
  "BR:RN": {
    label: "RN",
    rules: {
      fixed: [{ month: 10, day: 3, name: "Mártires de Cunhaú e Uruaçu", kind: "feriado", since: 2007 }],
    },
  },
  "BR:CE": {
    label: "CE",
    rules: {
      fixed: [
        { month: 3, day: 19, name: "Dia de São José", kind: "feriado", note: "Padroeiro do Ceará" },
        {
          month: 3,
          day: 25,
          name: "Data Magna do Ceará",
          kind: "feriado",
          note: "Abolição da escravatura no Ceará, em 1884",
        },
      ],
    },
  },
  "BR:MA": {
    label: "MA",
    rules: { fixed: [{ month: 7, day: 28, name: "Adesão do Maranhão à Independência", kind: "feriado" }] },
  },
  "BR:PA": {
    label: "PA",
    rules: { fixed: [{ month: 8, day: 15, name: "Adesão do Pará à Independência", kind: "feriado" }] },
  },
  "BR:AM": {
    label: "AM",
    rules: {
      fixed: [
        {
          month: 9,
          day: 5,
          name: "Elevação do Amazonas à categoria de província",
          kind: "feriado",
        },
      ],
    },
  },

  "DE:HH": {
    label: "Hamburgo",
    rules: { fixed: [{ month: 10, day: 31, name: "Dia da Reforma", kind: "feriado", since: 2018 }] },
  },
  "BE:VLG": {
    label: "Flandres",
    rules: {
      fixed: [
        {
          month: 7,
          day: 11,
          name: "Dia da Comunidade Flamenga",
          kind: "facultativo",
          note: "Folga do serviço público flamengo; para as empresas, é dia normal",
        },
      ],
    },
  },
  "ES:VC": {
    label: "Comunidade Valenciana",
    rules: {
      fixed: [
        {
          month: 3,
          day: 19,
          name: "São José",
          kind: "feriado",
          note: "A Comunidade troca esta data em alguns anos: confira o calendário laboral",
        },
        { month: 10, day: 9, name: "Dia da Comunidade Valenciana", kind: "feriado" },
      ],
      easter: [{ offset: 1, name: "Segunda-feira de Páscoa", kind: "feriado" }],
    },
  },
};

export const CITIES: City[] = [
  {
    id: "santos",
    name: "Santos",
    country: "BR",
    state: "SP",
    rules: {
      fixed: [
        {
          month: 1,
          day: 26,
          name: "Aniversário de Santos",
          kind: "feriado",
          note: "Fundação da cidade, em 1546",
        },
        {
          month: 9,
          day: 8,
          name: "Nossa Senhora do Monte Serrat",
          kind: "feriado",
          note: "Padroeira de Santos",
        },
      ],
      easter: [{ offset: -3, name: "Quinta-feira Santa", kind: "facultativo" }],
    },
  },
  {
    id: "rio-de-janeiro",
    name: "Rio de Janeiro",
    country: "BR",
    state: "RJ",
    rules: {
      fixed: [
        {
          month: 1,
          day: 20,
          name: "Dia de São Sebastião",
          kind: "feriado",
          note: "Padroeiro do Rio de Janeiro",
        },
      ],
    },
  },
  {
    id: "paranagua",
    name: "Paranaguá",
    country: "BR",
    state: "PR",
    rules: {
      fixed: [
        {
          month: 7,
          day: 29,
          name: "Aniversário de Paranaguá",
          kind: "feriado",
          note: "Fundação da cidade, em 1648",
        },
      ],
    },
  },
  {
    id: "itajai",
    name: "Itajaí",
    country: "BR",
    state: "SC",
    rules: {
      fixed: [
        {
          month: 6,
          day: 15,
          name: "Aniversário de Itajaí",
          kind: "feriado",
          note: "Emancipação política, em 1860",
        },
      ],
    },
  },
  {
    id: "rio-grande",
    name: "Rio Grande",
    country: "BR",
    state: "RS",
    rules: {
      fixed: [
        {
          month: 2,
          day: 19,
          name: "Aniversário de Rio Grande",
          kind: "feriado",
          note: "Fundação da cidade, em 1737",
        },
      ],
    },
  },
  {
    id: "porto-alegre",
    name: "Porto Alegre",
    country: "BR",
    state: "RS",
    rules: {
      fixed: [
        {
          month: 2,
          day: 2,
          name: "Nossa Senhora dos Navegantes",
          kind: "feriado",
          note: "Padroeira de Porto Alegre",
        },
      ],
    },
  },
  {
    id: "vitoria",
    name: "Vitória",
    country: "BR",
    state: "ES",
    rules: {
      fixed: [
        {
          month: 9,
          day: 8,
          name: "Nossa Senhora da Vitória",
          kind: "feriado",
          note: "Padroeira e aniversário de Vitória",
        },
      ],
      easter: [
        {
          offset: 8,
          name: "Nossa Senhora da Penha",
          kind: "feriado",
          note: "A segunda-feira oito dias depois da Páscoa",
        },
      ],
    },
  },
  {
    id: "salvador",
    name: "Salvador",
    country: "BR",
    state: "BA",
    rules: {
      fixed: [
        { month: 6, day: 24, name: "São João", kind: "feriado" },
        {
          month: 12,
          day: 8,
          name: "Nossa Senhora da Conceição da Praia",
          kind: "feriado",
          note: "Padroeira da Bahia",
        },
      ],
    },
  },
  {
    id: "recife",
    name: "Recife",
    country: "BR",
    state: "PE",
    rules: {
      fixed: [
        {
          month: 7,
          day: 16,
          name: "Nossa Senhora do Carmo",
          kind: "feriado",
          note: "Padroeira do Recife",
        },
        { month: 12, day: 8, name: "Nossa Senhora da Conceição", kind: "feriado" },
      ],
    },
  },
  {
    id: "maceio",
    name: "Maceió",
    country: "BR",
    state: "AL",
    rules: {
      fixed: [
        {
          month: 8,
          day: 27,
          name: "Nossa Senhora dos Prazeres",
          kind: "feriado",
          note: "Padroeira de Maceió",
        },
      ],
    },
  },
  {
    id: "natal",
    name: "Natal",
    country: "BR",
    state: "RN",
    rules: {
      fixed: [
        { month: 1, day: 6, name: "Santos Reis", kind: "feriado", note: "Padroeiros de Natal" },
        {
          month: 11,
          day: 21,
          name: "Nossa Senhora da Apresentação",
          kind: "feriado",
          note: "Padroeira de Natal",
        },
      ],
    },
  },
  {
    id: "fortaleza",
    name: "Fortaleza",
    country: "BR",
    state: "CE",
    rules: {
      fixed: [
        {
          month: 8,
          day: 15,
          name: "Nossa Senhora da Assunção",
          kind: "feriado",
          note: "Padroeira de Fortaleza",
        },
      ],
    },
  },
  {
    id: "sao-luis",
    name: "São Luís",
    country: "BR",
    state: "MA",
    rules: {
      fixed: [
        { month: 6, day: 29, name: "São Pedro", kind: "feriado" },
        {
          month: 9,
          day: 8,
          name: "Aniversário de São Luís",
          kind: "feriado",
          note: "Fundação da cidade, em 1612",
        },
        { month: 12, day: 8, name: "Nossa Senhora da Conceição", kind: "feriado" },
      ],
    },
  },
  {
    id: "belem",
    name: "Belém",
    country: "BR",
    state: "PA",
    rules: {
      fixed: [{ month: 1, day: 12, name: "Aniversário de Belém", kind: "feriado" }],
    },
  },
  {
    id: "manaus",
    name: "Manaus",
    country: "BR",
    state: "AM",
    rules: {
      fixed: [
        { month: 10, day: 24, name: "Aniversário de Manaus", kind: "feriado" },
        {
          month: 12,
          day: 8,
          name: "Nossa Senhora da Conceição",
          kind: "feriado",
          note: "Padroeira de Manaus",
        },
      ],
    },
  },

  { id: "roterda", name: "Roterdã", country: "NL", state: "", rules: {} },
  { id: "antuerpia", name: "Antuérpia", country: "BE", state: "VLG", rules: {} },
  { id: "hamburgo", name: "Hamburgo", country: "DE", state: "HH", rules: {} },
  { id: "le-havre", name: "Le Havre", country: "FR", state: "", rules: {} },
  {
    id: "valencia",
    name: "Valência",
    country: "ES",
    state: "VC",
    rules: {
      fixed: [
        { month: 1, day: 22, name: "São Vicente Mártir", kind: "feriado", note: "Padroeiro de Valência" },
      ],
      easter: [
        {
          offset: 8,
          name: "São Vicente Ferrer",
          kind: "feriado",
          note: "A segunda-feira depois da Segunda-feira de Páscoa",
        },
      ],
    },
  },
  {
    id: "lisboa",
    name: "Lisboa",
    country: "PT",
    state: "",
    rules: {
      fixed: [{ month: 6, day: 13, name: "Santo António", kind: "feriado", note: "Padroeiro de Lisboa" }],
    },
  },
  {
    id: "genova",
    name: "Gênova",
    country: "IT",
    state: "",
    rules: {
      fixed: [{ month: 6, day: 24, name: "São João Batista", kind: "feriado", note: "Padroeiro de Gênova" }],
    },
  },
  { id: "felixstowe", name: "Felixstowe", country: "GB", state: "", rules: {} },
  { id: "nova-york", name: "Nova York", country: "US", state: "", rules: {} },
  { id: "houston", name: "Houston", country: "US", state: "", rules: {} },
  { id: "los-angeles", name: "Los Angeles", country: "US", state: "", rules: {} },
  { id: "manzanillo", name: "Manzanillo", country: "MX", state: "", rules: {} },
  { id: "cartagena", name: "Cartagena", country: "CO", state: "", rules: {} },
  { id: "buenos-aires", name: "Buenos Aires", country: "AR", state: "", rules: {} },
  { id: "montevideu", name: "Montevidéu", country: "UY", state: "", rules: {} },
];

export const DEFAULT_CITY_ID = "santos";

export function findCity(id: string): City {
  return (
    CITIES.find((city) => city.id === id) ??
    CITIES.find((city) => city.id === DEFAULT_CITY_ID) ??
    CITIES[0]
  );
}

export function regionOf(city: City): Region | undefined {
  return city.state ? REGIONS[`${city.country}:${city.state}`] : undefined;
}

export const placeLabel = (city: City): string => {
  const country = countryOf(city.country);
  return `${city.name} (${city.country === HOME_COUNTRY ? city.state : countryName(country.code, country.name)})`;
};

export function citiesByGroup(): { label: string; cities: City[] }[] {
  const byName = (a: City, b: City) => compareText(a.name, b.name);

  return [
    { label: t("cal.ports.home"), cities: CITIES.filter((city) => city.country === HOME_COUNTRY).sort(byName) },
    { label: t("cal.ports.abroad"), cities: CITIES.filter((city) => city.country !== HOME_COUNTRY).sort(byName) },
  ];
}

const comparable = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function cityForAddress(address: Address): City | undefined {
  const name = comparable(address.city);
  return CITIES.find(
    (city) => city.country === HOME_COUNTRY && city.state === address.state && comparable(city.name) === name,
  );
}

const STORAGE_KEY = "central-de-paineis:cidade";

export function readStoredCityId(): string | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved !== null && CITIES.some((city) => city.id === saved) ? saved : null;
  } catch {
    return null;
  }
}

export function storeCityId(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {}
}

export function preferredCityId(address: Address | undefined): string {
  return readStoredCityId() ?? (address && cityForAddress(address)?.id) ?? DEFAULT_CITY_ID;
}
