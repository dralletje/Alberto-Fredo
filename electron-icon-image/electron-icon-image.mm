#include "electron-icon-image.h"
#include "nan.h"
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>

using namespace Nan;

namespace IconImage {

Nan::MaybeLocal<v8::Object> get_icon_for_path(const char * str) {
  @autoreleasepool {
    printf("HEY");
    // create IconImage
    NSImage * image = [[NSWorkspace sharedWorkspace] iconForFile:[NSString stringWithUTF8String:str]];
    [image setSize:NSMakeSize(64,64)];

    // validate it, return empty buffer if invalid
    if(!image.valid) {
      return Nan::NewBuffer(0);
    }

    // copy buffer to NSData
    CGImageRef cgRef = [image CGImageForProposedRect:nil context:nil hints:nil];
    NSBitmapImageRep *newRep = [[NSBitmapImageRep alloc] initWithCGImage:cgRef];
    [newRep setSize:[image size]]; // keep the same resolution
    NSData * pngData = [newRep representationUsingType:NSPNGFileType properties:[[NSDictionary alloc] init]];

    unsigned int length = [pngData length];

    // return PNG buffer
    return Nan::CopyBuffer((char *) [pngData bytes], length);
  }
}

} //end namespace
