const DEFAULT_BASE_URL = "https://serpdino.com";

export class SerpDinoClient {
    private baseUrl: string;
    private apiKey: string;

    constructor(apiKey: string, baseUrl?: string) {
        this.apiKey = apiKey;
        this.baseUrl = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    }

    async request<T = unknown>(
        method: string,
        path: string,
        options: { body?: unknown; params?: Record<string, string> } = {}
    ): Promise<T> {
        const url = new URL(path, this.baseUrl);
        if (options.params) {
            for (const [k, v] of Object.entries(options.params)) {
                if (v !== undefined && v !== "") url.searchParams.set(k, v);
            }
        }

        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };

        const res = await fetch(url.toString(), {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`SerpDino API ${res.status}: ${text}`);
        }

        return res.json() as Promise<T>;
    }

    get<T = unknown>(path: string, params?: Record<string, string>) {
        return this.request<T>("GET", path, { params });
    }

    post<T = unknown>(path: string, body?: unknown) {
        return this.request<T>("POST", path, { body });
    }

    del<T = unknown>(path: string, body?: unknown) {
        return this.request<T>("DELETE", path, { body });
    }
}
