// Tiny in-process i18n. UI strings use the English form as their key
// (avoids a separate key catalog). Languages: en / zh-CN / de.

export type Locale = 'en' | 'zh-CN' | 'de';
export type LocalePref = 'auto' | Locale;

type Dict = Partial<Record<string, string>>;

const ZH_CN: Dict = {
    // Tabs
    'General': '常规',
    'Wallpaper Sources': '壁纸来源',
    'History': '历史',
    // Hero / actions
    'Request New Wallpaper': '获取新壁纸',
    'Pause Auto-Fetch': '暂停自动获取',
    'Resume Auto-Fetch': '恢复自动获取',
    'Settings': '设置',
    'Quit': '退出',
    'Random Wallpaper': '随机壁纸',
    'Open Save Folder': '打开保存文件夹',
    'Clear History': '清空历史',
    'Browse': '浏览',
    'Add Source': '添加来源',
    'Edit': '编辑',
    'Delete': '删除',
    'Save': '保存',
    'Set': '设为壁纸',
    'Open Link': '打开链接',
    // Section headers
    'Wallpaper': '壁纸',
    'Auto-Fetching': '自动获取',
    'Startup': '启动',
    'Notifications & Logs': '通知与日志',
    // Field labels
    'Scaling mode': '缩放模式',
    'Different wallpaper per monitor': '每个显示器使用不同壁纸',
    'Also set as lock screen wallpaper': '同时设为锁屏壁纸',
    'Post-apply command (PowerShell)': '应用后命令（PowerShell）',
    'History length': '历史长度',
    'Save-for-later folder': '收藏文件夹',
    'Auto-fetch enabled': '启用自动获取',
    'Hours': '小时',
    'Minutes': '分钟',
    'Fetch on startup': '启动时获取',
    'Start with Windows': '随 Windows 启动',
    'Start minimized to tray': '启动时最小化到托盘',
    'Show notifications': '显示通知',
    'Log level': '日志级别',
    'Language': '语言',
    'Appearance': '外观',
    'Font family': '字体',
    'Font size': '字号',
    'Custom font family': '自定义字体',
    'System default': '系统默认',
    'Page URL': '页面地址',
    'Scan linked scripts': '扫描关联脚本',
    'Max linked scripts to scan': '最多扫描脚本数',
    'Max detail pages to scan': '最多扫描详情页数',
    'Category ID': '分类 ID',
    'Custom image regex (optional)': '自定义图片正则（可选）',
    'Author name': '作者名称',
    'Palace Museum source note':
        '故宫源说明：默认抓取“皇家建筑”页面并提取图片链接；若页面结构变更，可调整页面地址或自定义正则。',
    'WallHere source note':
        'WallHere 源说明：从搜索页提取壁纸详情页链接，随机访问若干详情页并获取 get.wallhere.com 上的原图地址（避免拿到缩略图）。可调整「最多扫描详情页数」控制请求量。',
    'Wallhalla source note':
        'Wallhalla 源说明：从搜索/列表页提取壁纸详情页链接，随机访问若干详情页并提取真实的 storage 图片地址（自动识别 png/jpg/webp）。可调整「最多扫描详情页数」控制请求量。',
    'Pexels source note':
        'Pexels 源说明：官网受 Cloudflane 保护，需要使用官方 API。请在 https://www.pexels.com/api/ 免费申请 API Key 并填入下方。启用「使用精选集」后将忽略查询词，改为读取 Pexels 编辑精选。',
    'API Key': 'API Key',
    'Use curated feed (ignore query)': '使用精选集（忽略查询词）',
    'Query': '查询词',
    'Orientation': '方向',
    'Any': '任意',
    'Landscape': '横向',
    'Portrait': '竖向',
    'Square': '正方形',
    'Minimum size': '最小尺寸',
    'Large (24MP+)': '大（24MP+）',
    'Medium (12MP+)': '中（12MP+）',
    'Small (4MP+)': '小（4MP+）',
    'Color (hex or name, optional)': '颜色（十六进制或名称，可选）',
    'Results per page': '每页结果数',
    'Max page (random within)': '最大页码（随机选取）',
    'Keyword': '关键词',
    'Search URL template': '搜索地址模板',
    'Search URL (override, optional)': '搜索地址（覆盖，可选）',
    'Scan album pages': '扫描专辑页面',
    'Max albums to scan': '最多扫描专辑数',
    'Scan wallpaper pages': '扫描壁纸详情页',
    'Max wallpaper pages': '最多扫描详情页数',
    'Display name': '显示名称',
    'Blocked filenames': '屏蔽的文件名',
    'One blocked filename per line': '每行一个屏蔽文件名',
    // Scaling modes
    'Fill': '填充',
    'Fit': '适应',
    'Stretch': '拉伸',
    'Tile': '平铺',
    'Center': '居中',
    'Span across monitors': '跨屏显示',
    // Log levels
    'Silent': '静默',
    'Error': '错误',
    'Warn': '警告',
    'Info': '信息',
    'Debug': '调试',
    // Empty / placeholder messages
    'No wallpapers in the history yet. Click "Request New Wallpaper" on the General tab.':
        '历史里还没有壁纸。请在"常规"标签页点击"获取新壁纸"。',
    'No sources configured yet. Add one above to start.':
        '尚未配置壁纸来源。请在上方添加一个开始使用。',
    // Language options
    'Auto (system)': '自动（系统）',
    'English': 'English',
    '简体中文': '简体中文',
    'Deutsch': 'Deutsch',
    // Status / dialogs
    'Idle': '空闲',
    'Fetching…': '获取中…',
    'Failed': '失败',
    'History cleared.': '历史已清空。',
    'Delete all cached wallpapers?': '删除所有缓存的壁纸？',
};

const DE: Dict = {
    // Tabs
    'General': 'Allgemein',
    'Wallpaper Sources': 'Hintergrundquellen',
    'History': 'Verlauf',
    // Hero / actions
    'Request New Wallpaper': 'Neuen Hintergrund laden',
    'Pause Auto-Fetch': 'Auto-Laden pausieren',
    'Resume Auto-Fetch': 'Auto-Laden fortsetzen',
    'Settings': 'Einstellungen',
    'Quit': 'Beenden',
    'Random Wallpaper': 'Random Wallpaper',
    'Open Save Folder': 'Speicherordner öffnen',
    'Clear History': 'Verlauf löschen',
    'Browse': 'Durchsuchen',
    'Add Source': 'Quelle hinzufügen',
    'Edit': 'Bearbeiten',
    'Delete': 'Löschen',
    'Save': 'Speichern',
    'Set': 'Anwenden',
    'Open Link': 'Link öffnen',
    // Section headers
    'Wallpaper': 'Hintergrund',
    'Auto-Fetching': 'Automatisches Laden',
    'Startup': 'Systemstart',
    'Notifications & Logs': 'Benachrichtigungen & Logs',
    // Field labels
    'Scaling mode': 'Skalierungsmodus',
    'Different wallpaper per monitor': 'Pro Bildschirm anderer Hintergrund',
    'Also set as lock screen wallpaper': 'Auch als Sperrbildschirm festlegen',
    'Post-apply command (PowerShell)': 'Nachverarbeitungsbefehl (PowerShell)',
    'History length': 'Verlaufslänge',
    'Save-for-later folder': 'Favoritenordner',
    'Auto-fetch enabled': 'Automatisches Laden aktiv',
    'Hours': 'Stunden',
    'Minutes': 'Minuten',
    'Fetch on startup': 'Beim Start laden',
    'Start with Windows': 'Mit Windows starten',
    'Start minimized to tray': 'Minimiert in den Infobereich starten',
    'Show notifications': 'Benachrichtigungen anzeigen',
    'Log level': 'Log-Level',
    'Language': 'Sprache',
    'Appearance': 'Darstellung',
    'Font family': 'Schriftart',
    'Font size': 'Schriftgröße',
    'Custom font family': 'Eigene Schriftart',
    'System default': 'System-Standard',
    'Page URL': 'Page URL',
    'Scan linked scripts': 'Linked scripts scannen',
    'Max linked scripts to scan': 'Max. Anzahl gescannter Skripte',
    'Max detail pages to scan': 'Max. Anzahl Detailseiten',
    'Category ID': 'Kategorie-ID',
    'Custom image regex (optional)': 'Eigener Bild-RegEx (optional)',
    'Author name': 'Autorname',
    'Palace Museum source note':
        'Palace-Museum-Hinweis: Standardmäßig wird die Seite „Royal Architecture“ geparst und Bild-Links extrahiert. Bei Layout-Änderungen bitte URL oder RegEx anpassen.',
    'WallHere source note':
        'WallHere-Hinweis: Aus der Suchseite werden Detailseiten-Links extrahiert; eine zufällige Auswahl wird besucht, um die echten Vollbild-URLs auf get.wallhere.com zu erhalten (statt Thumbnails). Die Anzahl der Detailseiten kann angepasst werden.',
    'Wallhalla source note':
        'Wallhalla-Hinweis: Aus der Such-/Übersichtsseite werden Detailseiten-Links extrahiert; eine zufällige Auswahl wird besucht, um die echten Storage-URLs (png/jpg/webp) zu finden. Die Anzahl der Detailseiten kann angepasst werden, um Netzwerklast zu steuern.',
    'Pexels source note':
        'Pexels-Hinweis: Die Website ist Cloudflare-geschützt, daher wird die offizielle API verwendet. Bitte holen Sie einen kostenlosen API-Key unter https://www.pexels.com/api/. Aktivieren Sie „Kuratierten Feed verwenden“, um die Suchanfrage zu ignorieren und stattdessen die Pexels-Redaktionsauswahl zu laden.',
    'API Key': 'API-Key',
    'Use curated feed (ignore query)': 'Kuratierten Feed verwenden (Query ignorieren)',
    'Query': 'Suchbegriff',
    'Orientation': 'Ausrichtung',
    'Any': 'Beliebig',
    'Landscape': 'Querformat',
    'Portrait': 'Hochformat',
    'Square': 'Quadratisch',
    'Minimum size': 'Mindestgröße',
    'Large (24MP+)': 'Groß (24MP+)',
    'Medium (12MP+)': 'Mittel (12MP+)',
    'Small (4MP+)': 'Klein (4MP+)',
    'Color (hex or name, optional)': 'Farbe (Hex oder Name, optional)',
    'Results per page': 'Ergebnisse pro Seite',
    'Max page (random within)': 'Maximale Seite (zufällig)',
    'Keyword': 'Stichwort',
    'Search URL template': 'Such-URL-Vorlage',
    'Search URL (override, optional)': 'Such-URL (Override, optional)',
    'Scan album pages': 'Albumseiten scannen',
    'Max albums to scan': 'Max. Anzahl Alben',
    'Scan wallpaper pages': 'Wallpaper-Detailseiten scannen',
    'Max wallpaper pages': 'Max. Anzahl Detailseiten',
    'Display name': 'Anzeigename',
    'Blocked filenames': 'Gesperrte Dateinamen',
    'One blocked filename per line': 'Ein gesperrter Dateiname pro Zeile',
    // Scaling modes
    'Fill': 'Füllen',
    'Fit': 'Anpassen',
    'Stretch': 'Strecken',
    'Tile': 'Kacheln',
    'Center': 'Zentrieren',
    'Span across monitors': 'Über Bildschirme spannen',
    // Log levels
    'Silent': 'Stumm',
    'Error': 'Fehler',
    'Warn': 'Warnung',
    'Info': 'Info',
    'Debug': 'Debug',
    // Empty / placeholder messages
    'No wallpapers in the history yet. Click "Request New Wallpaper" on the General tab.':
        'Noch keine Hintergründe im Verlauf. Klicken Sie im Tab „Allgemein“ auf „Neuen Hintergrund laden“.',
    'No sources configured yet. Add one above to start.':
        'Noch keine Quellen konfiguriert. Fügen Sie oben eine hinzu, um zu starten.',
    // Language options
    'Auto (system)': 'Automatisch (System)',
    'English': 'English',
    '简体中文': '简体中文',
    'Deutsch': 'Deutsch',
    // Status / dialogs
    'Idle': 'Untätig',
    'Fetching…': 'Lädt…',
    'Failed': 'Fehlgeschlagen',
    'History cleared.': 'Verlauf gelöscht.',
    'Delete all cached wallpapers?': 'Alle zwischengespeicherten Hintergründe löschen?',
};

const DICTS: Record<Locale, Dict> = {
    en: {},
    'zh-CN': ZH_CN,
    de: DE,
};

let current: Locale = 'en';
const listeners = new Set<() => void>();

export function resolveLocale(pref: LocalePref | undefined): Locale {
    if (pref && pref !== 'auto') return pref;
    const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
    const lower = nav.toLowerCase();
    if (lower.startsWith('zh')) return 'zh-CN';
    if (lower.startsWith('de')) return 'de';
    return 'en';
}

export function setLocale(l: Locale): void {
    if (current === l) return;
    current = l;
    if (typeof document !== 'undefined') {
        document.documentElement.lang = l;
    }
    for (const fn of listeners) fn();
}

export function getLocale(): Locale {
    return current;
}

export function onLocaleChange(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function t(key: string): string {
    return DICTS[current][key] ?? key;
}
