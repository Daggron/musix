#import "MusixScannerModule.h"

#import <AVFoundation/AVFoundation.h>
#import <UIKit/UIKit.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#import <React/RCTUtils.h>
#import <CommonCrypto/CommonDigest.h>

static NSString *const kBookmarksKey = @"MusixWatchedFolders";

@interface MusixScannerModule () <UIDocumentPickerDelegate>
@end

@implementation MusixScannerModule {
  RCTPromiseResolveBlock _importResolve;
  RCTPromiseRejectBlock _importReject;
  RCTPromiseResolveBlock _folderResolve;
  RCTPromiseRejectBlock _folderReject;
  BOOL _pickingFolder;
}

RCT_EXPORT_MODULE(MusixScannerModule)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

#pragma mark - Documents Directory

- (NSString *)documentsPath {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(
      NSDocumentDirectory, NSUserDomainMask, YES);
  return paths.firstObject;
}

- (NSString *)musicDirectory {
  NSString *dir =
      [[self documentsPath] stringByAppendingPathComponent:@"Music"];
  [[NSFileManager defaultManager] createDirectoryAtPath:dir
                            withIntermediateDirectories:YES
                                            attributes:nil
                                                 error:nil];
  return dir;
}

#pragma mark - Import Files

- (void)importFiles:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_importResolve = resolve;
    self->_importReject = reject;
    self->_pickingFolder = NO;

    NSArray<UTType *> *types = @[ UTTypeAudio ];

    UIDocumentPickerViewController *picker =
        [[UIDocumentPickerViewController alloc] initForOpeningContentTypes:types
                                                           asCopy:YES];
    picker.delegate = self;
    picker.allowsMultipleSelection = YES;

    UIViewController *root = RCTPresentedViewController();
    if (root) {
      [root presentViewController:picker animated:YES completion:nil];
    } else {
      self->_importResolve(@[]);
      self->_importResolve = nil;
      self->_importReject = nil;
    }
  });
}

- (void)documentPicker:(UIDocumentPickerViewController *)controller
    didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls {
  if (self->_pickingFolder) {
    [self handleFolderPickerResult:urls];
    return;
  }
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    NSMutableArray<NSString *> *importedPaths = [NSMutableArray new];
    NSString *musicDir = [self musicDirectory];

    for (NSURL *url in urls) {
      NSString *filename = [url lastPathComponent];
      NSString *ext = [[filename pathExtension] lowercaseString];
      if (![ext isEqualToString:@"flac"]) continue;

      NSString *dest =
          [musicDir stringByAppendingPathComponent:filename];

      if ([[NSFileManager defaultManager] fileExistsAtPath:dest]) {
        [importedPaths addObject:dest];
        continue;
      }

      NSError *error = nil;
      [[NSFileManager defaultManager] copyItemAtURL:url
                                              toURL:[NSURL fileURLWithPath:dest]
                                              error:&error];
      if (!error) {
        [importedPaths addObject:dest];
      }
    }

    if (self->_importResolve) {
      self->_importResolve(importedPaths);
    }
    self->_importResolve = nil;
    self->_importReject = nil;
  });
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
  if (_pickingFolder) {
    if (_folderResolve) _folderResolve(@"");
    _folderResolve = nil;
    _folderReject = nil;
  } else {
    if (_importResolve) _importResolve(@[]);
    _importResolve = nil;
    _importReject = nil;
  }
}

#pragma mark - Metadata Extraction

- (void)getMetadata:(NSString *)filePath
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    NSURL *fileURL = [NSURL fileURLWithPath:filePath];
    AVURLAsset *asset = [AVURLAsset URLAssetWithURL:fileURL options:nil];

    NSString *title = nil;
    NSString *artist = nil;
    NSString *album = nil;
    NSNumber *year = nil;
    NSString *genre = nil;

    for (NSString *format in asset.availableMetadataFormats) {
      NSArray<AVMetadataItem *> *items =
          [asset metadataForFormat:format];
      for (AVMetadataItem *item in items) {
        NSString *key = item.commonKey;
        if (!key) continue;

        if ([key isEqualToString:AVMetadataCommonKeyTitle]) {
          title = [item stringValue];
        } else if ([key isEqualToString:AVMetadataCommonKeyArtist] ||
                   [key isEqualToString:AVMetadataCommonKeyCreator]) {
          artist = [item stringValue];
        } else if ([key isEqualToString:AVMetadataCommonKeyAlbumName]) {
          album = [item stringValue];
        } else if ([key isEqualToString:AVMetadataCommonKeyCreationDate]) {
          NSString *dateStr = [item stringValue];
          if (dateStr.length >= 4) {
            year = @([[dateStr substringToIndex:4] integerValue]);
          }
        } else if ([key isEqualToString:AVMetadataCommonKeyType]) {
          genre = [item stringValue];
        }
      }
    }

    if (!title) {
      title = [[filePath lastPathComponent] stringByDeletingPathExtension];
    }
    if (!artist) artist = @"Unknown Artist";
    if (!album) album = @"Unknown Album";
    if (!genre) genre = @"Other";

    double durationSec = CMTimeGetSeconds(asset.duration);

    NSDictionary *fileAttrs =
        [[NSFileManager defaultManager] attributesOfItemAtPath:filePath
                                                         error:nil];
    long long fileSize = [fileAttrs[NSFileSize] longLongValue];
    int bitrate = durationSec > 0
                      ? (int)((fileSize * 8.0) / durationSec / 1000.0)
                      : 0;

    NSMutableDictionary *meta = [NSMutableDictionary dictionary];
    meta[@"title"] = title;
    meta[@"artist"] = artist;
    meta[@"album"] = album;
    meta[@"year"] = year ?: @0;
    meta[@"genre"] = genre;
    meta[@"duration"] = @(durationSec);
    meta[@"bitrate"] = @(bitrate);
    meta[@"filePath"] = filePath;
    meta[@"fileSize"] = @(fileSize);
    meta[@"codec"] = @"flac";

    NSUInteger hue = [self hueForAlbum:album];
    meta[@"hue"] = @(hue);

    NSString *artworkPath = [self extractArtwork:asset filePath:filePath];
    if (artworkPath) {
      meta[@"artworkPath"] = artworkPath;
    } else {
      meta[@"artworkPath"] = [NSNull null];
    }

    NSError *jsonErr = nil;
    NSData *jsonData =
        [NSJSONSerialization dataWithJSONObject:meta options:0 error:&jsonErr];
    NSString *jsonStr =
        jsonData ? [[NSString alloc] initWithData:jsonData
                                         encoding:NSUTF8StringEncoding]
                 : @"{}";

    resolve(jsonStr);
  });
}

- (NSString *)extractArtwork:(AVURLAsset *)asset filePath:(NSString *)filePath {
  NSString *artworkDir = [[self documentsPath] stringByAppendingPathComponent:@"Artwork"];
  [[NSFileManager defaultManager] createDirectoryAtPath:artworkDir
                            withIntermediateDirectories:YES
                                            attributes:nil
                                                 error:nil];

  NSString *baseName = [[filePath lastPathComponent] stringByDeletingPathExtension];
  NSString *destPath = [artworkDir stringByAppendingPathComponent:
                         [baseName stringByAppendingString:@".jpg"]];

  if ([[NSFileManager defaultManager] fileExistsAtPath:destPath]) {
    return destPath;
  }

  for (NSString *format in asset.availableMetadataFormats) {
    NSArray<AVMetadataItem *> *items = [asset metadataForFormat:format];
    for (AVMetadataItem *item in items) {
      if ([item.commonKey isEqualToString:AVMetadataCommonKeyArtwork]) {
        NSData *rawData = nil;
        if ([item.value isKindOfClass:[NSData class]]) {
          rawData = (NSData *)item.value;
        } else if ([item.dataValue length] > 0) {
          rawData = item.dataValue;
        }
        if (rawData) {
          UIImage *img = [UIImage imageWithData:rawData];
          if (img) {
            NSData *jpeg = UIImageJPEGRepresentation(img, 0.85);
            if (jpeg && [jpeg writeToFile:destPath atomically:YES]) {
              return destPath;
            }
          }
        }
      }
    }
  }
  return nil;
}

- (NSUInteger)hueForAlbum:(NSString *)album {
  const char *str = [album UTF8String];
  unsigned char hash[CC_MD5_DIGEST_LENGTH];
  CC_MD5(str, (CC_LONG)strlen(str), hash);
  return (hash[0] | (hash[1] << 8)) % 360;
}

#pragma mark - Folder Scanning

- (void)scanFolder:(NSString *)bookmarkId
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject {
  NSData *bookmarkData = [self bookmarkDataForId:bookmarkId];
  if (!bookmarkData) {
    resolve(@[]);
    return;
  }

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    BOOL stale = NO;
    NSError *error = nil;
    NSURL *folderURL =
        [NSURL URLByResolvingBookmarkData:bookmarkData
                                  options:NSURLBookmarkResolutionWithoutUI
                            relativeToURL:nil
                      bookmarkDataIsStale:&stale
                                    error:&error];
    if (!folderURL || error) {
      resolve(@[]);
      return;
    }

    [folderURL startAccessingSecurityScopedResource];

    NSFileManager *fm = [NSFileManager defaultManager];
    NSDirectoryEnumerator *enumerator = [fm
        enumeratorAtURL:folderURL
        includingPropertiesForKeys:@[ NSURLNameKey, NSURLIsRegularFileKey ]
                          options:NSDirectoryEnumerationSkipsHiddenFiles
                     errorHandler:nil];

    NSMutableArray<NSString *> *flacPaths = [NSMutableArray new];
    NSString *musicDir = [self musicDirectory];

    for (NSURL *fileURL in enumerator) {
      NSString *ext = [[fileURL pathExtension] lowercaseString];
      if (![ext isEqualToString:@"flac"]) continue;

      NSString *filename = [fileURL lastPathComponent];
      NSString *dest =
          [musicDir stringByAppendingPathComponent:filename];

      if ([fm fileExistsAtPath:dest]) {
        [flacPaths addObject:dest];
        continue;
      }

      NSError *copyErr = nil;
      [fm copyItemAtURL:fileURL
                  toURL:[NSURL fileURLWithPath:dest]
                  error:&copyErr];
      if (!copyErr) {
        [flacPaths addObject:dest];
      }
    }

    [folderURL stopAccessingSecurityScopedResource];
    resolve(flacPaths);
  });
}

#pragma mark - Watched Folders

- (void)addWatchedFolder:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_folderResolve = resolve;
    self->_folderReject = reject;
    self->_pickingFolder = YES;

    UIDocumentPickerViewController *picker =
        [[UIDocumentPickerViewController alloc]
            initForOpeningContentTypes:@[ UTTypeFolder ]];
    picker.delegate = self;
    picker.allowsMultipleSelection = NO;

    UIViewController *root = RCTPresentedViewController();
    if (root) {
      [root presentViewController:picker animated:YES completion:nil];
    } else {
      self->_folderResolve(@"");
      self->_folderResolve = nil;
      self->_folderReject = nil;
    }
  });
}

- (void)removeWatchedFolder:(NSString *)bookmarkId {
  NSMutableDictionary *bookmarks =
      [[[NSUserDefaults standardUserDefaults] dictionaryForKey:kBookmarksKey]
          mutableCopy]
          ?: [NSMutableDictionary new];
  [bookmarks removeObjectForKey:bookmarkId];
  [[NSUserDefaults standardUserDefaults] setObject:bookmarks
                                            forKey:kBookmarksKey];
}

- (NSString *)getWatchedFolders {
  NSDictionary *bookmarks =
      [[NSUserDefaults standardUserDefaults] dictionaryForKey:kBookmarksKey]
          ?: @{};
  NSMutableArray *result = [NSMutableArray new];

  for (NSString *bookmarkId in bookmarks) {
    NSDictionary *entry = bookmarks[bookmarkId];
    NSString *path = entry[@"path"] ?: @"";
    [result addObject:@{@"id" : bookmarkId, @"path" : path}];
  }

  NSData *jsonData =
      [NSJSONSerialization dataWithJSONObject:result options:0 error:nil];
  return jsonData
             ? [[NSString alloc] initWithData:jsonData
                                     encoding:NSUTF8StringEncoding]
             : @"[]";
}

- (NSData *)bookmarkDataForId:(NSString *)bookmarkId {
  NSDictionary *bookmarks =
      [[NSUserDefaults standardUserDefaults] dictionaryForKey:kBookmarksKey];
  NSString *base64 = bookmarks[bookmarkId][@"bookmark"];
  if (!base64) return nil;
  return [[NSData alloc] initWithBase64EncodedString:base64 options:0];
}

#pragma mark - Folder Picker Delegate

- (void)handleFolderPickerResult:(NSArray<NSURL *> *)urls {
  if (_folderResolve) {
    if (urls.count == 0) {
      _folderResolve(@"");
    } else {
      NSURL *folderURL = urls.firstObject;
      [folderURL startAccessingSecurityScopedResource];

      NSError *error = nil;
      NSData *bookmarkData =
          [folderURL bookmarkDataWithOptions:0
              includingResourceValuesForKeys:nil
                             relativeToURL:nil
                                     error:&error];
      [folderURL stopAccessingSecurityScopedResource];

      if (bookmarkData && !error) {
        NSString *bookmarkId = [[NSUUID UUID] UUIDString];
        NSString *base64 = [bookmarkData base64EncodedStringWithOptions:0];
        NSString *path = [folderURL path];

        NSMutableDictionary *bookmarks =
            [[[NSUserDefaults standardUserDefaults]
                dictionaryForKey:kBookmarksKey] mutableCopy]
                ?: [NSMutableDictionary new];
        bookmarks[bookmarkId] = @{@"bookmark" : base64, @"path" : path};
        [[NSUserDefaults standardUserDefaults] setObject:bookmarks
                                                  forKey:kBookmarksKey];

        _folderResolve(bookmarkId);
      } else {
        _folderResolve(@"");
      }
    }
    _folderResolve = nil;
    _folderReject = nil;
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeScannerModuleSpecJSI>(params);
}

@end
