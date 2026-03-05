import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { IncomingHttpHeaders } from "node:http";
import { expect, test } from "@playwright/test";

const LEGACY_TO_CANONICAL: Array<[string, string]> = [
  ["/agendar", "/portal/agendar"],
  ["/apoio", "/portal/apoio"],
  ["/chat", "/portal/chat"],
  ["/sessoes", "/portal/sessoes"],
];

function rawGet(url: string): Promise<{ status: number; headers: IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const requester = parsed.protocol === "https:" ? httpsRequest : httpRequest;

    const req = requester(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
      },
      (res) => {
        res.resume();
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
          })
        );
      }
    );

    req.on("error", reject);
    req.end();
  });
}

test.describe("Legacy patient routes", () => {
  for (const [legacy, canonical] of LEGACY_TO_CANONICAL) {
    test(`${legacy} returns 308 to ${canonical}`, async ({ baseURL }) => {
      const target = new URL(legacy, baseURL).toString();
      const response = await rawGet(target);

      expect(response.status).toBe(308);
      const location = response.headers.location;
      expect(location).toContain(canonical);
    });
  }
});
