// Palace Museum wallpaper adapter.
//
// Strategy (updated for the 2024 SPA-style listing page):
//
// 1. Derive the AJAX search endpoint from the listing URL. For
//    `/lights/{name}.html` it becomes `/searchs/{name}b.html`, which is the
//    XHR endpoint the page calls in `refrush()` via `$.get(...)`.
// 2. Fetch page 1 to discover the total page count from the rendered
//    `<a data-key="N">` pagination links.
// 3. GET a random page; the response is an HTML fragment containing
//    `/light/{id}.html` detail links (24 per page by default).
// 4. Pick a random subset of detail pages and extract the direct
//    `img.dpm.org.cn/Uploads/...` image URLs from each.

import { BaseAdapter } from './baseAdapter.js';
import { Logger } from './../logger.js';
import { makeHistoryEntry } from './../history.js';
import { shuffleArray } from './../utils.js';
import type { HistoryEntryData } from './../types.js';

const DEFAULT_PAGE_URL = 'https://www.dpm.org.cn/lights/royal.html';
const DEFAULT_MAX_DETAIL_PAGES = 12;
const DEFAULT_CATEGORY_ID = 624;
const PAGE_SIZE = 24;

interface PalaceMuseumConfig {
    'page-url'?: string;
    'category-id'?: number | string;
    'max-detail-pages'?: number;
    'image-regex'?: string;
    'author-name'?: string;
    [key: string]: unknown;
}

export class PalaceMuseumAdapter extends BaseAdapter<PalaceMuseumConfig> {
    protected override _defaultName(): string {
        return '故宫博物院';
    }

    async requestRandomImage(count: number): Promise<HistoryEntryData[]> {
        const result: HistoryEntryData[] = [];
        const cfg = this._config;
        const pageUrl = String(cfg['page-url'] ?? DEFAULT_PAGE_URL).trim() || DEFAULT_PAGE_URL;
        const categoryId = this._toPositiveInt(cfg['category-id'], DEFAULT_CATEGORY_ID);
        const searchEndpoint = this._deriveSearchEndpoint(pageUrl);

        // Step 1: probe page 1 to learn total pages.
        let totalPages = 1;
        try {
            const firstPage = await this._fetchListPage(searchEndpoint, pageUrl, categoryId, 1);
            totalPages = this._extractTotalPages(firstPage) || 1;
        } catch (err) {
            Logger.error(`Palace Museum probe fetch failed: ${String(err)}`, this);
            throw result;
        }

        // Step 2: collect detail URLs from a random page (and the probe page
        // as a fallback if the random one is empty).
        const detailUrls = new Set<string>();
        const randomPage = totalPages > 1
            ? 1 + Math.floor(Math.random() * totalPages)
            : 1;

        const pagesToTry = randomPage === 1 ? [1] : [randomPage, 1];
        for (const p of pagesToTry) {
            try {
                const html = await this._fetchListPage(searchEndpoint, pageUrl, categoryId, p);
                for (const url of this._extractDetailPageUrls(html, pageUrl)) {
                    detailUrls.add(url);
                }
                if (detailUrls.size > 0) break;
            } catch (err) {
                Logger.warn(`Palace Museum list page ${p} failed: ${String(err)}`, this);
            }
        }

        if (detailUrls.size === 0) {
            Logger.error('No detail page links discovered from Palace Museum search endpoint', this);
            throw result;
        }

        // Step 3: visit a random subset of detail pages to extract image URLs.
        const shuffledDetails = shuffleArray(Array.from(detailUrls));
        const maxDetailPages = this._toPositiveInt(cfg['max-detail-pages'], DEFAULT_MAX_DETAIL_PAGES);
        const detailBudget = Math.min(
            Math.max(count * 2, maxDetailPages),
            shuffledDetails.length,
        );

        const candidates = new Set<string>();
        const detailByImage = new Map<string, string>();

        for (let i = 0; i < detailBudget; i++) {
            const detailUrl = shuffledDetails[i];
            try {
                const detailHtml = await this._bowl.sendAndReceiveText(
                    this._bowl.newGetMessage(detailUrl),
                );
                const newImages = new Set<string>();
                this._collectImageUrls(newImages, detailHtml, detailUrl, cfg['image-regex']);
                for (const url of newImages) {
                    if (!candidates.has(url)) {
                        candidates.add(url);
                        detailByImage.set(url, detailUrl);
                    }
                }
                if (candidates.size >= count) break;
            } catch (err) {
                Logger.warn(`Skip Palace Museum detail ${detailUrl}: ${String(err)}`, this);
            }
        }

        const all = shuffleArray(Array.from(candidates));
        const author = String(cfg['author-name'] ?? '故宫博物院').trim() || '故宫博物院';

        for (const imageUrl of all) {
            if (result.length >= count) break;
            if (this._isImageBlocked(this._baseName(imageUrl))) continue;

            const entry = await makeHistoryEntry(author, this._sourceName, imageUrl);
            const sourceDetailUrl = detailByImage.get(imageUrl) ?? pageUrl;
            entry.source.sourceUrl = sourceDetailUrl;
            entry.source.imageLinkUrl = sourceDetailUrl;
            if (!this._includesWallpaper(result, entry.source.imageDownloadUrl)) {
                result.push(entry);
            }
        }

        if (result.length < count) {
            if (result.length === 0)
                Logger.error('No valid image URL discovered from Palace Museum source', this);
            else Logger.warn('Returning fewer images than requested.', this);
            throw result;
        }

        return result;
    }

    /**
     * Build the AJAX search endpoint URL from a listing page URL.
     *
     *   https://www.dpm.org.cn/lights/royal.html
     *     -> https://www.dpm.org.cn/searchs/royalb.html
     */
    private _deriveSearchEndpoint(pageUrl: string): string {
        try {
            const u = new URL(pageUrl);
            const m = u.pathname.match(/^\/lights\/([^/]+?)\.html?$/i);
            if (m) {
                u.pathname = `/searchs/${m[1]}b.html`;
                u.search = '';
                u.hash = '';
                return u.href;
            }
        } catch {
            // fall through
        }
        return 'https://www.dpm.org.cn/searchs/royalb.html';
    }

    private async _fetchListPage(
        endpoint: string,
        referer: string,
        categoryId: number,
        page: number,
    ): Promise<string> {
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${sep}category_id=${categoryId}&p=${page}&pagesize=${PAGE_SIZE}&_=${Date.now()}`;
        const req = this._bowl.newGetMessage(url, {
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': referer,
            'Accept': 'text/html, */*; q=0.01',
        });
        return this._bowl.sendAndReceiveText(req);
    }

    /**
     * Read pagination links of the form `<a ... data-key="N" ...>` and return
     * the maximum N. Defaults to 1 when no pagination is found.
     */
    private _extractTotalPages(html: string): number {
        let max = 0;
        const re = /data-key="(\d+)"/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(html)) !== null) {
            const n = parseInt(m[1], 10);
            if (Number.isFinite(n) && n > max) max = n;
        }
        return max > 0 ? max : 1;
    }

    private _extractDetailPageUrls(html: string, baseUrl: string): string[] {
        const out = new Set<string>();
        const patterns = [
            /https?:\/\/[\w.-]*dpm\.org\.cn\/light\/\d+\.html/gi,
            /\/light\/\d+\.html/gi,
        ];

        for (const re of patterns) {
            let m: RegExpExecArray | null;
            while ((m = re.exec(html)) !== null) {
                const abs = this._resolvePageUrl(m[0], baseUrl);
                if (abs) out.add(abs);
            }
        }

        return Array.from(out);
    }

    private _collectImageUrls(
        bucket: Set<string>,
        text: string,
        baseUrl: string,
        customPattern: unknown,
    ): void {
        const patterns: RegExp[] = [];

        const rawPattern = String(customPattern ?? '').trim();
        if (rawPattern) {
            try {
                patterns.push(new RegExp(rawPattern, 'gi'));
            } catch (err) {
                Logger.warn(`Invalid custom image regex: ${String(err)}`, this);
            }
        }

        // img.dpm.org.cn hosts the actual wallpaper files under /Uploads/...
        patterns.push(
            /https?:\/\/img\.dpm\.org\.cn\/Uploads\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi,
            // Generic fallback: any absolute image URL on dpm.org.cn.
            /https?:\/\/[\w.-]*dpm\.org\.cn\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi,
        );

        for (const re of patterns) {
            let m: RegExpExecArray | null;
            while ((m = re.exec(text)) !== null) {
                const abs = this._resolveImageUrl(m[0], baseUrl);
                if (abs) bucket.add(abs);
            }
        }
    }

    private _resolveImageUrl(raw: string, baseUrl: string): string | null {
        if (!raw) return null;

        const normalized = raw
            .trim()
            .replace(/^['"]|['"]$/g, '')
            .replace(/\\\//g, '/');

        if (!normalized) return null;
        if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(normalized)) return null;

        if (normalized.startsWith('//')) return `https:${normalized}`;
        if (/^https?:\/\//i.test(normalized)) return normalized;

        try {
            return new URL(normalized, baseUrl).href;
        } catch {
            return null;
        }
    }

    private _resolvePageUrl(raw: string, baseUrl: string): string | null {
        if (!raw) return null;
        const normalized = raw.trim().replace(/^['"]|['"]$/g, '').replace(/\\\//g, '/');
        if (!normalized) return null;

        if (normalized.startsWith('//')) return `https:${normalized}`;
        if (/^https?:\/\//i.test(normalized)) return normalized;

        try {
            return new URL(normalized, baseUrl).href;
        } catch {
            return null;
        }
    }

    private _toPositiveInt(v: unknown, fallback: number): number {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return fallback;
        return Math.floor(n);
    }
}
