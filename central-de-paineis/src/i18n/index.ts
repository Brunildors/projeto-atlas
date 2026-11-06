import { useSyncExternalStore } from "react";
import { getLang, LANGUAGES, subscribeLang, type Lang, type Messages } from "./core";
import { assistant } from "./messages/assistant";
import { auth } from "./messages/auth";
import { calendar } from "./messages/calendar";
import { capacity } from "./messages/capacity";
import { common } from "./messages/common";
import { forecast } from "./messages/forecast";
import { profile } from "./messages/profile";
import { projects } from "./messages/projects";

export { getLang, LANGUAGES, setLang, type Lang } from "./core";

const AREAS = [common, auth, capacity, forecast, calendar, projects, assistant, profile] as const;

type KeysOf<T> = T extends Messages<infer K> ? K : never;

export type MessageKey = KeysOf<(typeof AREAS)[number]>;

export type PluralKey = MessageKey extends infer K ? (K extends `${infer Base}.other` ? Base : never) : never;

const DICTIONARY = Object.fromEntries(
  LANGUAGES.map(({ id }) => [id, Object.assign({}, ...AREAS.map((area) => area[id]))]),
) as Record<Lang, Record<MessageKey, string>>;

export type Params = Record<string, string | number>;

function fill(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === "number" ? value.toLocaleString(getLang()) : value;
  });
}

export function t(key: MessageKey, params?: Params): string {
  return fill(DICTIONARY[getLang()][key] ?? DICTIONARY["pt-BR"][key] ?? key, params);
}

export function tn(key: PluralKey, count: number, params?: Params): string {
  const rule = new Intl.PluralRules(getLang()).select(count);
  const dict = DICTIONARY[getLang()] as Record<string, string>;
  const text = dict[`${key}.${rule}`] ?? dict[`${key}.other`] ?? key;
  return fill(text, { n: count, ...params });
}

export function formatList(items: string[]): string {
  return new Intl.ListFormat(getLang(), { style: "long", type: "conjunction" }).format(items);
}

export function countryName(code: string, fallback: string): string {
  try {
    return new Intl.DisplayNames([getLang()], { type: "region" }).of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}
