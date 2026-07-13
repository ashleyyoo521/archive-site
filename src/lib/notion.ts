import { Client } from "@notionhq/client";

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

let cachedDataSourceId: string | null = null;

async function getDataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;
  const db: any = await notion.databases.retrieve({ database_id: DATABASE_ID });
  cachedDataSourceId = db.data_sources[0].id;
  return cachedDataSourceId;
}

export type FacetKey =
  | "marketPosition"
  | "productCategory"
  | "target"
  | "involvement"
  | "marketingStrategy"
  | "brandType"
  | "companyVision";

export const FACET_LABELS: Record<FacetKey, string> = {
  marketPosition: "시장지위",
  productCategory: "제품군",
  target: "타깃",
  involvement: "관여도",
  marketingStrategy: "마케팅 전략",
  brandType: "브랜드 유형",
  companyVision: "회사 비전",
};

export const FACET_PROPERTY_NAMES: Record<FacetKey, string> = {
  marketPosition: "시장지위",
  productCategory: "제품군",
  target: "타깃",
  involvement: "관여도",
  marketingStrategy: "마케팅 전략",
  brandType: "브랜드 유형",
  companyVision: "회사 비전",
};

export const ALL_TAG_PROPERTY_NAMES: string[] = [
  "Tags",
  ...Object.values(FACET_PROPERTY_NAMES),
];

export type ArchiveItem = {
  id: string;
  companyName: string;
  productName: string;
  subtitle: string;
  releaseDate: string;
  category: string;
  tags: string[];
  marketPosition: string[];
  productCategory: string[];
  target: string[];
  involvement: string[];
  marketingStrategy: string[];
  brandType: string[];
  companyVision: string[];
  marketingGoal: string;
  problem: string;
  solution: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "link";
  source: string;
  note: string;
  dateAdded: string;
};

function multiSelectNames(prop: any): string[] {
  return (prop?.multi_select ?? []).map((t: any) => t.name);
}

function parsePage(page: any): ArchiveItem {
  const props = page.properties;
  return {
    id: page.id,
    companyName: props.회사명?.rich_text?.[0]?.plain_text ?? "",
    productName: props.제품명?.title?.[0]?.plain_text ?? "",
    subtitle: props.소제목?.rich_text?.[0]?.plain_text ?? "",
    releaseDate: props.공개일자?.date?.start ?? "",
    category: props.Category?.select?.name ?? "",
    tags: multiSelectNames(props.Tags),
    marketPosition: multiSelectNames(props[FACET_PROPERTY_NAMES.marketPosition]),
    productCategory: multiSelectNames(props[FACET_PROPERTY_NAMES.productCategory]),
    target: multiSelectNames(props[FACET_PROPERTY_NAMES.target]),
    involvement: multiSelectNames(props[FACET_PROPERTY_NAMES.involvement]),
    marketingStrategy: multiSelectNames(props[FACET_PROPERTY_NAMES.marketingStrategy]),
    brandType: multiSelectNames(props[FACET_PROPERTY_NAMES.brandType]),
    companyVision: multiSelectNames(props[FACET_PROPERTY_NAMES.companyVision]),
    marketingGoal: props["마케팅 목표"]?.rich_text?.[0]?.plain_text ?? "",
    problem: props.문제점?.rich_text?.[0]?.plain_text ?? "",
    solution: props.솔루션?.rich_text?.[0]?.plain_text ?? "",
    mediaUrl: props["Media URL"]?.url ?? "",
    mediaType: props["Media Type"]?.select?.name ?? "image",
    source: props.Source?.url ?? "",
    note: props.Note?.rich_text?.[0]?.plain_text ?? "",
    dateAdded: page.created_time ?? "",
  };
}

export async function getArchiveItems(options?: { category?: string }): Promise<ArchiveItem[]> {
  const dataSourceId = await getDataSourceId();
  const filters: any[] = [];
  if (options?.category) {
    filters.push({ property: "Category", select: { equals: options.category } });
  }
  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: filters.length ? filters[0] : undefined,
  });
  return response.results.map(parsePage);
}

export async function getArchiveItemById(id: string): Promise<ArchiveItem> {
  const page = await notion.pages.retrieve({ page_id: id });
  return parsePage(page);
}

export async function getFacetOptions(): Promise<Record<FacetKey, string[]>> {
  const dataSourceId = await getDataSourceId();
  const source: any = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  const props = source.properties;

  const result = {} as Record<FacetKey, string[]>;
  (Object.keys(FACET_PROPERTY_NAMES) as FacetKey[]).forEach((key) => {
    const propName = FACET_PROPERTY_NAMES[key];
    const options = props[propName]?.multi_select?.options ?? [];
    result[key] = options.map((o: any) => o.name);
  });
  return result;
}

export async function updateTextField(pageId: string, propertyName: string, value: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: { [propertyName]: { rich_text: [{ text: { content: value } }] } },
  });
}

export async function updateTitleField(pageId: string, propertyName: string, value: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: { [propertyName]: { title: [{ text: { content: value } }] } },
  });
}

export async function updateDateField(pageId: string, propertyName: string, value: string) {
  await notion.pages.update({
    page_id: pageId,
    properties: { [propertyName]: { date: value ? { start: value } : null } },
  });
}

export async function addToTags(pageId: string, tag: string) {
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const current = multiSelectNames(page.properties.Tags);
  const updated = Array.from(new Set([...current, tag]));
  await notion.pages.update({
    page_id: pageId,
    properties: { Tags: { multi_select: updated.map((name) => ({ name })) } },
  });
}

export async function removeTagFromAnyProperty(pageId: string, tag: string) {
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const updates: Record<string, any> = {};

  for (const propName of ALL_TAG_PROPERTY_NAMES) {
    const current = multiSelectNames(page.properties[propName]);
    if (current.includes(tag)) {
      const updated = current.filter((t: string) => t !== tag);
      updates[propName] = { multi_select: updated.map((name: string) => ({ name })) };
    }
  }

  if (Object.keys(updates).length > 0) {
    await notion.pages.update({ page_id: pageId, properties: updates });
  }
}

export type NewArchiveItemInput = {
  category: string;
  companyName: string;
  productName: string;
  subtitle: string;
  releaseDate: string;
  mediaUrl: string;
  mediaType: string;
  source: string;
  note: string;
  marketingGoal: string;
  problem: string;
  solution: string;
  facets: Partial<Record<FacetKey, string[]>>;
};

export async function createArchiveItem(input: NewArchiveItemInput): Promise<string> {
  const dataSourceId = await getDataSourceId();

  const properties: Record<string, any> = {
    제품명: { title: [{ text: { content: input.productName || "제목 없음" } }] },
    회사명: { rich_text: [{ text: { content: input.companyName || "" } }] },
    소제목: { rich_text: [{ text: { content: input.subtitle || "" } }] },
    Category: { select: { name: input.category } },
    Note: { rich_text: [{ text: { content: input.note || "" } }] },
    ["마케팅 목표"]: { rich_text: [{ text: { content: input.marketingGoal || "" } }] },
    문제점: { rich_text: [{ text: { content: input.problem || "" } }] },
    솔루션: { rich_text: [{ text: { content: input.solution || "" } }] },
  };

  if (input.releaseDate) properties.공개일자 = { date: { start: input.releaseDate } };
  if (input.mediaUrl) properties["Media URL"] = { url: input.mediaUrl };
  if (input.mediaType) properties["Media Type"] = { select: { name: input.mediaType } };
  if (input.source) properties.Source = { url: input.source };

  (Object.keys(FACET_PROPERTY_NAMES) as FacetKey[]).forEach((key) => {
    const values = input.facets[key];
    if (values && values.length > 0) {
      properties[FACET_PROPERTY_NAMES[key]] = { multi_select: values.map((name) => ({ name })) };
    }
  });

  const page: any = await notion.pages.create({
    parent: { data_source_id: dataSourceId } as any,
    properties,
  });

  return page.id;
}

export async function deleteArchiveItem(pageId: string) {
  await notion.pages.update({ page_id: pageId, archived: true });
}

export async function restoreArchiveItem(pageId: string) {
  await notion.pages.update({ page_id: pageId, archived: false });
}
