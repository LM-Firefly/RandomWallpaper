# Memory Optimization for RandomWallpaper Windows

This document outlines the memory optimization changes made to the RandomWallpaper Windows project to address high memory usage issues.

## Issues Identified

1. **Resource leaks in file downloads**: Downloaded image buffers and streams were not properly cleaned up
2. **Temporary file accumulation**: Old temporary files were not being deleted
3. **Module import caching**: Repeated dynamic imports of modules causing memory buildup
4. **Missing cleanup in fallback mechanisms**: Temporary files created in fallback scenarios were not cleaned up

## Optimizations Implemented

### 1. Download Resource Management

**File: `src/main.ts`**
- Added explicit cleanup of response body streams in `downloadFileToTemp` function
- Added buffer cleanup for data URI handling
- Improved stream handling with proper resource disposal

### 2. Temporary File Cleanup

**File: `src/history.ts`**
- Added `cleanupTempFiles()` method to remove unused temporary files from history directory
- Implemented periodic cleanup to prevent accumulation of old temporary files

**File: `src/main.ts`**
- Added cleanup calls to various functions:
  - `trySourcesForScheduler()` - runs cleanup after each wallpaper change
  - `_schedulerStart()` - runs periodic cleanup in the scheduler
  - `performRandomize()` - runs cleanup after manual wallpaper change
  - Tray menu "Next Wallpaper" - runs cleanup after manual trigger
  - App startup - runs cleanup on application start

### 3. Module Import Optimization

**File: `src/manager/windowsWallpaperManager.ts`**
- Added caching for the wallpaper module to prevent repeated dynamic imports
- Added cleanup for temporary BMP files created during fallback process

### 4. Stream and Buffer Management

**File: `src/main.ts`**
- Added explicit buffer cleanup for data URI handling
- Added stream cleanup for HTTP response handling
- Added proper disposal of response body streams

## Benefits

- **Reduced memory footprint**: Proper resource cleanup prevents memory leaks
- **Disk space management**: Automatic cleanup of temporary files prevents disk space issues
- **Improved performance**: Module caching reduces repeated import overhead
- **Better stability**: Proper resource management reduces risk of resource exhaustion

## Testing

The optimizations have been tested by:
- Monitoring memory usage over extended periods
- Verifying that temporary files are properly cleaned up
- Ensuring all functionality remains intact after changes