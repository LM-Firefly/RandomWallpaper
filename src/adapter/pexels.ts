// Pexels adapter — uses the official Pexels API (https://api.pexels.com/v1/).
// The public website is gated by Cloudflare bot protection, so HTML scraping
// is not viable; users must provide a free API key from
// https://www.pexels.com/api/ instead.

import { BaseAdapter } from './baseAdapter.js';
import { Logger } from './../logger.js';
import { makeHistoryEntry } from './../history.js';
import { shuffleArray } from './../utils.js';
import type { HistoryEntryData } from './../types.js';

const DEFAULT_QUERY = 'wallpaper';
const DEFAULT_PER_PAGE = 40;
const DEFAULT_MAX_PAGE = 20;

interface PexelsConfig {
    'api-key'?: string;
    query?: string;
    orientation?: 'landscape' | 'portrait' | 'square' | '';
    size?: 'large' | 'medium' | 'small' | '';
    color?: string;
    'use-curated'?: boolean;
    'per-page'?: number;
    'max-page'?: number;
    [key: string]: unknown;
}

interface PexelsPhoto {
    id: number;
    url: string;
    photographer: string;
    photographer_url: string;
    src: {
        original: string;
        large2x?: string;
        large?: string;
    };
}

interface PexelsPage {
    photos?: PexelsPhoto[];
    total_results?: number;
}

export class PexelsAdapter extends BaseAdapter<PexelsConfig> {
    protected override _defaultName(): string {
        return 'Pexels';
    }

    async requestRandomImage(count: number): Promise<HistoryEntryData[]> {
        const cfg = this._config;
        const apiKey = String(cfg['api-key'] ?? '').trim();
        if (!apiKey) {
            Logger.error(
                'Pexels API key is required. Get a free key at https://www.pexels.com/api/',
                this,
            );
            throw [] as HistoryEntryData[];
        }

        const perPage = this._toPositiveInt(cfg['per-page'], DEFAULT_PER_PAGE);
        const maxPage = this._toPositiveInt(cfg['max-page'], DEFAULT_MAX_PAGE);
        const page = 1 + Math.floor(Math.random() * Math.max(1, maxPage));

        const useCurated = Boolean(cfg['use-curated'] ?? false);
        const query = String(cfg.query ?? DEFAULT_QUERY).trim() || DEFAULT_QUERY;

        const url = useCurated
            ? `https://api.pexels.com/v1/curated?per_page=${perPage}&page=${page}`
            : this._buildSearchUrl(query, perPage, page, cfg);

        const req = this._bowl.newGetMessage(url, { Authorization: apiKey });

        let body: PexelsPage;
        try {
            body = await this._bowl.sendAndReceiveJson<PexelsPage>(req);
        } catch (err) {
            Logger.error(`Pexels API request failed: ${String(err)}`, this);
            throw [] as HistoryEntryData[];
        }

        const photos = Array.isArray(body?.photos) ? body.photos : [];
        if (photos.length === 0) {
            Logger.error('Pexels API returned no photos for this query/page', this);
            throw [] as HistoryEntryData[];
        }

        const shuffled = shuffleArray(photos);
        const result: HistoryEntryData[] = [];

        for (const photo of shuffled) {
            if (result.length >= count) break;
            const downloadUrl = photo.src?.original;
            if (!downloadUrl) continue;
            if (this._isImageBlocked(this._baseName(downloadUrl))) continue;
            if (this._includesWallpaper(result, downloadUrl)) continue;

            const entry = await makeHistoryEntry(
                photo.photographer ?? null,
                this._sourceName,
                downloadUrl,
            );
            entry.source.author = photo.photographer ?? null;
            entry.source.authorUrl = photo.photographer_url ?? null;
            entry.source.sourceUrl = 'https://www.pexels.com';
            entry.source.imageLinkUrl = photo.url ?? downloadUrl;
            result.push(entry);
        }

        if (result.length < count) {
            if (result.length === 0)
                Logger.error('No valid image URL discovered from Pexels source', this);
            else Logger.warn('Returning fewer images than requested.', this);
            throw result;
        }

        return result;
    }

    private _buildSearchUrl(
        query: string,
        perPage: number,
        page: number,
        cfg: PexelsConfig,
    ): string {
        const params = new URLSearchParams();
        params.set('query', query);
        params.set('per_page', String(perPage));
        params.set('page', String(page));

        const orientation = String(cfg.orientation ?? '').trim();
        if (orientation) params.set('orientation', orientation);

        const size = String(cfg.size ?? '').trim();
        if (size) params.set('size', size);

        const color = String(cfg.color ?? '').trim();
        if (color) params.set('color', color);

        return `https://api.pexels.com/v1/search?${params.toString()}`;
    }

    private _toPositiveInt(v: unknown, fallback: number): number {
        const n = Number(v);
        if (!Number.isFinite(n) || n <= 0) return fallback;
        return Math.floor(n);
    }
}
