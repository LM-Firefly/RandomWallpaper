// WallHere wallpaper adapter.
// Strategy: parse search/listing pages for wallpaper detail links
// (/wallpaper/{id}), then visit a shuffled subset of detail pages and
// extract the full-resolution image URL hosted on get.wallhere.com.
// The search/listing HTML only contains thumbnail URLs (c.wallhere.com/...),
// which is why a two-layer crawl is required to obtain real wallpapers.

import { BaseAdapter } from './baseAdapter.js';
import { Logger } from './../logger.js';
import { makeHistoryEntry } from './../history.js';
import { shuffleArray } from './../utils.js';
import type { HistoryEntryData } from './../types.js';

const DEFAULT_KEYWORD = 'wallpaper';
const DEFAULT_SEARCH_TEMPLATE = 'https://wallhere.com/zh/search?q={q}';
const DEFAULT_MAX_DETAIL_PAGES = 12;

interface WallHereConfig {
    keyword?: string;
    'search-url-template'?: string;
    'search-url'?: string;
    'max-detail-pages'?: number;
    'image-regex'?: string;
    'author-name'?: string;
    [key: string]: unknown;
}

export class WallHereAdapter extends BaseAdapter<WallHereConfig> {
    protected override _defaultName(): string {
        return 'WallHere';
    }

    async requestRandomImage(count: number): Promise<HistoryEntryData[]> {
        const result: HistoryEntryData[] = [];
        const cfg = this._config;

        const keyword = String(cfg.keyword ?? DEFAULT_KEYWORD).trim() || DEFAULT_KEYWORD;
        const searchUrl = this._buildSearchUrl(keyword);

        let listingHtml: string;
        try {
            listingHtml = await this._bowl.sendAndReceiveText(this._bowl.newGetMessage(searchUrl));
        } catch (err) {
            Logger.error(`WallHere listing fetch failed: ${String(err)}`, this);
            throw result;
        }

        const detailUrls = this._extractDetailPageUrls(listingHtml, searchUrl);
        if (detailUrls.length === 0) {
            Logger.error('No wallpaper detail links discovered on WallHere listing', this);
            throw result;
        }

        const shuffledDetails = shuffleArray(detailUrls);
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
                this._extractFullResImageUrls(newImages, detailHtml, cfg['image-regex']);
                for (const url of newImages) {
                    if (!candidates.has(url)) {
                        candidates.add(url);
                        detailByImage.set(url, detailUrl);
                    }
                }
                if (candidates.size >= count) break;
            } catch (err) {
                Logger.warn(`Skip WallHere detail ${detailUrl}: ${String(err)}`, this);
            }
        }

        const all = shuffleArray(Array.from(candidates));
        const author = String(cfg['author-name'] ?? 'WallHere').trim() || 'WallHere';

        for (const imageUrl of all) {
            if (result.length >= count) break;
            if (this._isImageBlocked(this._baseName(imageUrl))) continue;

            const entry = await makeHistoryEntry(author, this._sourceName, imageUrl);
            const sourceDetailUrl = detailByImage.get(imageUrl) ?? searchUrl;
            entry.source.sourceUrl = sourceDetailUrl;
            entry.source.imageLinkUrl = sourceDetailUrl;
            if (!this._includesWallpaper(result, entry.source.imageDownloadUrl)) {
                result.push(entry);
            }
        }

        if (result.length < count) {
            if (result.length === 0)
                Logger.error('No valid image URL discovered from WallHere source', this);
            else Logger.warn('Returning fewer images than requested.', this);
            throw result;
        }

        return result;
    }

    private _buildSearchUrl(keyword: string): string {
        const override = String(this._config['search-url'] ?? '').trim();
        if (override) return override;

        const tpl =
            String(this._config['search-url-template'] ?? DEFAULT_SEARCH_TEMPLATE).trim() ||
            DEFAULT_SEARCH_TEMPLATE;

        if (tpl.includes('{q}')) {
            return tpl.replaceAll('{q}', encodeURIComponent(keyword));
        }

        try {
            const u = new URL(tpl);
            if (!u.searchParams.has('q')) u.searchParams.set('q', keyword);
            return u.toString();
        } catch {
            return DEFAULT_SEARCH_TEMPLATE.replace('{q}', encodeURIComponent(keyword));
        }
    }

    private _extractDetailPageUrls(html: string, baseUrl: string): string[] {
        const out = new Set<string>();
        const patterns = [
            /https?:\/\/wallhere\.com\/(?:[a-z]{2}\/)?wallpaper\/\d+/gi,
            /\/(?:[a-z]{2}\/)?wallpaper\/\d+/gi,
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

    private _extractFullResImageUrls(
        bucket: Set<string>,
        text: string,
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

        // Real full-resolution wallpapers are served from get.wallhere.com only.
        // Thumbnails (c.wallhere.com/photos/.../...!as) are intentionally ignored.
        patterns.push(
            /https?:\/\/get\.wallhere\.com\/photo\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi,
        );

        for (const re of patterns) {
            let m: RegExpExecArray | null;
            while ((m = re.exec(text)) !== null) {
                const normalized = m[0].trim().replace(/['"]/g, '');
                if (normalized) bucket.add(normalized);
            }
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
