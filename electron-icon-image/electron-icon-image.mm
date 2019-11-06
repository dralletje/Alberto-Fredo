#include "electron-icon-image.h"
#include <napi.h>
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>

namespace IconImage {

  Napi::Buffer<uint8_t> get_icon_for_path(Napi::Env env, const char * str) {
      @autoreleasepool {
      printf("HEY");
      // create IconImage
      NSImage * image = [[NSWorkspace sharedWorkspace] iconForFile:[NSString stringWithUTF8String:str]];
      [image setSize:NSMakeSize(64,64)];

      // validate it, return empty buffer if invalid
      if(!image.valid) {
        return Napi::Buffer<uint8_t>::New(env, 0);
      }

      // copy buffer to NSData
      CGImageRef cgRef = [image CGImageForProposedRect:nil context:nil hints:nil];
      NSBitmapImageRep *newRep = [[NSBitmapImageRep alloc] initWithCGImage:cgRef];
      [newRep setSize:[image size]]; // keep the same resolution
      NSData * pngData = [newRep representationUsingType:NSPNGFileType properties:[[NSDictionary alloc] init]];

      unsigned int length = [pngData length];

      // return PNG buffer
      return Napi::Buffer<uint8_t>::Copy(env, (uint8_t *) [pngData bytes], length);
    }
  }

} //end namespace
