import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("Public catalog routes", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it("GET /api/public/plans returns published plans payload", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: [
          {
            id: "a8b11f2d-f60a-44f8-b881-fc5d179f198f",
            planKey: "solo",
            locale: "pt-BR",
            version: 1,
            payload: { name: "Solo" },
            etag: "etag",
            publishedAt: "2026-03-05T10:00:00.000Z",
          },
        ],
        error: null,
      }),
    });

    const { GET } = await import("@/app/api/public/plans/route");
    const res = await GET(new Request("http://localhost/api/public/plans?locale=pt-BR"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].planKey).toBe("solo");
  });

  it("GET /api/public/content returns published page payload", async () => {
    createClientMock.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({
        data: {
          pageKey: "pricing",
          locale: "pt-BR",
          items: [
            {
              id: "c7d3b778-a053-436a-b4c1-911bf29d691a",
              sectionKey: "main",
              version: 1,
              etag: "etag",
              payload: { title: "Planos" },
              publishedAt: "2026-03-05T10:00:00.000Z",
            },
          ],
        },
        error: null,
      }),
    });

    const { GET } = await import("@/app/api/public/content/route");
    const res = await GET(new Request("http://localhost/api/public/content?page=pricing&locale=pt-BR"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.pageKey).toBe("pricing");
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].sectionKey).toBe("main");
  });
});
