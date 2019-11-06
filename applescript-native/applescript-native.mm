// I have No IDEA why this should be @import instead of #import,
// but with #import I got a  "Couldn't find OSALanguage class" error.
@import OSAKit;

#include "applescript-native.h"
#include <napi.h>
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
// #import <OSAKit/OSAKit.h>
// #import <OSAKit/OSALanguage.h>

namespace ApplescriptNative {

  Napi::String execute_applescript(Napi::Env env, Napi::String raw_source) {
    @autoreleasepool {
      NSString * source = [NSString stringWithUTF8String: raw_source.Utf8Value().c_str()];

      OSAScript * script = [[OSAScript alloc] initWithSource: source
                                                  language: [OSALanguage languageForName: @"JavaScript"]];
      NSDictionary* errorDict;
      NSString * result = [[script executeAndReturnError: &errorDict] stringValue];

      if (result == nil) {
        NSLog(@"ERROR: %@", errorDict);
        return Napi::String::New(env, "{\"error\":true}");
      }

      return Napi::String::New(env, std::string([result UTF8String]));
    }
  }

} //end namespace
