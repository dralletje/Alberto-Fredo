//----------------------------------------------------------------------------
// electron-vibrancy
// Copyright 2016 arkenthera
//
// MIT License
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice
// shall be included in all copies or substantial
// portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//----------------------------------------------------------------------------

#import <CoreServices/CoreServices.h>

#include "./VibrancyHelper.h"


namespace Vibrancy {
    NSMutableDictionary * views_ = [[NSMutableDictionary alloc] init];

    // V8Value get_propertie(v8::Local<v8::Array> object, const char *key) {
    //   return object->Get(v8::String::NewFromUtf8(v8::Isolate::GetCurrent(), key));
    // }

    bool VibrancyHHelper::UpdateView(int32_t key, unsigned char* buffer, Napi::Object options) {
        ViewOptions viewOptions = GetOptions(options);
        NSString * path_string = viewOptions.Path;
        NSView* window_view = *reinterpret_cast<NSView**>(buffer);

        NSImageView* imageView = [views_ objectForKey:[NSNumber numberWithInt:key]];
        // NSImageView* imageView = nil;

        // NSRect window_frame = [[window_view window] frame];
        NSRect frame = NSMakeRect(
          viewOptions.X,
          viewOptions.Y,
          viewOptions.Width,
          viewOptions.Height
        );

        NSLog(@"Frame [%@]: %@", path_string, NSStringFromRect(frame));


        //convertRectFromBacking

        // Convert to device space -- this is required for proper HiDPI support
        frame = [[imageView superview] convertRectFromBacking:frame];
        // At this point we can trunc/round/ceil
        frame.origin.x = floor(frame.origin.x);
        frame.origin.y = floor(frame.origin.y);
        // Convert back to the view's coordinate system
        frame = [imageView.superview convertRectFromBacking:frame];
        [imageView setFrame:frame];
        NSLog(@":: %@", NSStringFromRect(frame));

        if (!window_view)
            return false;

        // NSLog(@"path_string: %@", path_string);
        NSImage * image = [[NSWorkspace sharedWorkspace] iconForFile:path_string];
        [image setSize:CGSizeMake(viewOptions.Height, viewOptions.Width)];

        CGFloat desiredScaleFactor = [window_view.window backingScaleFactor];
        CGFloat actualScaleFactor = [image recommendedLayerContentsScale:desiredScaleFactor];
        id layerContents = [image layerContentsForContentsScale:actualScaleFactor];

        if (!imageView) {
          // render()
          NSView * image_backed_view = [[NSView alloc] initWithFrame:frame];
          image_backed_view.layer = [[CALayer alloc] init];
          // image_backed_view.layer.contentsGravity = kCAGravityResizeAspectFill;
          // image_backed_view.layer.contents = image;
          image_backed_view.wantsLayer = YES;

          // image_backed_view.layer.sublayerTransform = CATransform3DMakeScale(1.0f, -1.0f, 1.0f);


          [image_backed_view.layer setContents:layerContents];
          [image_backed_view.layer setContentsScale:actualScaleFactor];

          // mount()
          [window_view.window.contentView
              addSubview: image_backed_view
          ];

          // NSLayoutConstraint *constraint = [NSLayoutConstraint
          //   constraintWithItem: image_backed_view
          //   attribute: NSLayoutAttributeTop
          //   relatedBy: NSLayoutRelationEqual
          //   toItem: window_view.window.contentView
          //   attribute: NSLayoutAttributeTop
          //   multiplier:1.0f
          //   constant:viewOptions.Y
          // ];
          //
          // [window_view.window.contentView addConstraint:constraint];

          image_backed_view.autoresizingMask = NSViewMaxXMargin | NSViewMinYMargin;


          // NSLog(@"key: %@", [NSNumber numberWithInt:key]);
          // NSLog(@"image_backed_view: %@", image_backed_view);
          [views_ setObject:image_backed_view forKey:[NSNumber numberWithInt:key]];
          return true;
        } else {
          NSLog(@"update key: %d", key);
          [imageView setFrame:frame];
          return true;
        }
    }

    bool VibrancyHHelper::RemoveView(int32_t key) {
      NSImageView* imageView = [views_ objectForKey:[NSNumber numberWithInt:key]];

        if (!imageView)
            return false;

        NSView* viewToRemove = imageView;
        [viewToRemove removeFromSuperview];
        [views_ removeObjectForKey:[NSNumber numberWithInt:key]];

        return true;
    }

    ViewOptions VibrancyHHelper::GetOptions(Napi::Object options) {
        ViewOptions viewOptions;
        viewOptions.Width = options.Get("width").As<Napi::Number>().Int32Value();
        NSLog(@"viewOptions.Width: %i", viewOptions.Width);
        viewOptions.Height = options.Get("height").As<Napi::Number>().Int32Value();
        NSLog(@"viewOptions.Height: %i", viewOptions.Height);
        // Mac coordinates have (0, 0) in the left *bottom*, not the top.
        viewOptions.X = options.Get("left").As<Napi::Number>().Int32Value();
        NSLog(@"viewOptions.X: %i", viewOptions.X);
        viewOptions.Y = options.Get("bottom").As<Napi::Number>().Int32Value();
        NSLog(@"viewOptions.Y: %i", viewOptions.Y);

        // V8Value vPosition = get_propertie(options, "Position");
        // V8Value vSize = get_propertie(options, "Size");
        //
        // if (!vSize->IsUndefined() && !vSize->IsNull()) {
        //     V8Array vaSize =
        //         v8::Local<v8::Array>::Cast(vSize);
        //
        //     V8Value vWidth = get_propertie(vaSize, "width");
        //     V8Value vHeight = get_propertie(vaSize, "height");
        //
        //     if (!vWidth->IsNull() && vWidth->IsInt32())
        //         viewOptions.Width = vWidth->Int32Value();
        //
        //     if (!vHeight->IsNull() && vHeight->IsInt32())
        //         viewOptions.Height = vHeight->Int32Value();
        // }
        //
        // if (!vPosition->IsUndefined() && !vPosition->IsNull()) {
        //     V8Array vaPosition = v8::Local<v8::Array>::Cast(vPosition);
        //
        //     V8Value vX = get_propertie(vaPosition, "x");
        //     V8Value vY = get_propertie(vaPosition, "y");
        //
        //     if (!vX->IsNull() && vX->IsInt32())
        //         viewOptions.X = vX->Int32Value();
        //
        //     if (!vY->IsNull() && vY->IsInt32())
        //         viewOptions.Y = vY->Int32Value();
        // }

        // V8Value thing = get_propertie(options, "Path");
        const char* str = options.Get("Path").ToString().Utf8Value().c_str(); // String::AsciiValue
        viewOptions.Path = [NSString stringWithUTF8String:str];

        return viewOptions;
    }
}  // namespace Vibrancy
