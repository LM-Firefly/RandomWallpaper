// Adapter factory — instantiate the right adapter for a given source meta.

import { BaseAdapter } from './baseAdapter.js';
import { GenericJsonAdapter } from './genericJson.js';
import { LocalFolderAdapter } from './localFolder.js';
import { PalaceMuseumAdapter } from './palaceMuseum.js';
import { PexelsAdapter } from './pexels.js';
import { WallHallaAdapter } from './wallhalla.js';
import { WallHereAdapter } from './wallhere.js';
import { RedditAdapter } from './reddit.js';
import { UnsplashAdapter } from './unsplash.js';
import { UrlSourceAdapter } from './urlSource.js';
import { WallhavenAdapter } from './wallhaven.js';
import { SourceType, type SourceMeta } from './../types.js';

export function createAdapter(meta: SourceMeta): BaseAdapter {
    switch (meta.type) {
        case SourceType.WALLHAVEN:
            return new WallhavenAdapter(meta);
        case SourceType.REDDIT:
            return new RedditAdapter(meta);
        case SourceType.UNSPLASH:
            return new UnsplashAdapter(meta);
        case SourceType.GENERIC_JSON:
            return new GenericJsonAdapter(meta);
        case SourceType.STATIC_URL:
            return new UrlSourceAdapter(meta);
        case SourceType.LOCAL_FOLDER:
            return new LocalFolderAdapter(meta);
        case SourceType.PALACE_MUSEUM:
            return new PalaceMuseumAdapter(meta);
        case SourceType.WALLHERE:
            return new WallHereAdapter(meta);
        case SourceType.WALLHALLA:
            return new WallHallaAdapter(meta);
        case SourceType.PEXELS:
            return new PexelsAdapter(meta);
        default:
            // Sensible fallback: unknown type → empty Wallhaven query.
            return new WallhavenAdapter({ ...meta, type: SourceType.WALLHAVEN });
    }
}
