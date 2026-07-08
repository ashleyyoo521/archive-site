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

export type ArchiveItem = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  mediaUrl: string;
  mediaType: "image" | "video" | "link";
  source: string;
  note: string;
  dateAdded: string;
};

function parsePage(page: any): ArchiveItem {
  const props = page.properties;
  return {
    id: page.id,
    name: props.이름?.title?.[0]?.plain_text ?? "",
    category: props.Category?.select?.name ?? "",
    tags: (props.Tags?.multi_select ?? []).map((t: any) => t.name),
    mediaUrl: props["Media URL"]?.url ?? "",
    mediaType: props["Media Type"]?.select?.name ?? "image",
    source: props.Source?.url ?? "",
    note: props.Note?.rich_text?.[0]?.plain_text ?? "",
    dateAdded: page.created_time ?? "",
  };
}

export async function getArchiveItems(options?: {
  category?: string;
  tag?: string;
}): Promise<ArchiveItem[]> {
  const dataSourceId = await getDataSourceId();
  const filters: any[] = [];

  if (options?.category) {
    filters.push({ property: "Category", select: { equals: options.category } });
  }
  if (options?.tag) {
    filters.push({ property: "Tags", multi_select: { contains: options.tag } });
  }

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: filters.length ? (filters.length === 1 ? filters[0] : { and: filters }) : undefined,
  });

  return response.results.map(parsePage);
}

export async function getArchiveItemById(id: string): Promise<ArchiveItem> {
  const page = await notion.pages.retrieve({ page_id: id });
  return parsePage(page);
}
