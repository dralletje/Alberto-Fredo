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
    V8Value get_propertie(v8::Local<v8::Array> object, const char *key) {
      return object->Get(v8::String::NewFromUtf8(v8::Isolate::GetCurrent(), key));
    }

    bool IsHigherThanYosemite() {
        NSOperatingSystemVersion operatingSystemVersion =
            [[NSProcessInfo processInfo] operatingSystemVersion];
        return operatingSystemVersion.majorVersion == 10
            &&
        operatingSystemVersion.minorVersion > 10;
    }

    VibrancyHelper::VibrancyHelper() : viewIndex_(0) {
    }

    int32_t VibrancyHelper::AddView(unsigned char* buffer, v8::Local<v8::Array> options) {
        NSView* window_view = *reinterpret_cast<NSView**>(buffer);
        if (!window_view)
            return -1;
        NSRect window_frame = [[window_view window] frame];

        ViewOptions viewOptions = GetOptions(options);
        NSString * path_string = [NSString stringWithUTF8String:viewOptions.Path];

        NSLog(@"Windowheight (%f) - offset top (%d)", window_frame.size.height, viewOptions.Y);
        NSLog(@"Path: %@", path_string);

        NSImage * image = [[NSWorkspace sharedWorkspace] iconForFile:path_string];
        [image setSize:CGSizeMake(viewOptions.Width * 2, viewOptions.Height * 2)];
        NSRect frame = NSMakeRect(
          viewOptions.X,
          window_frame.size.height - viewOptions.Y,
          viewOptions.Width,
          viewOptions.Height
        );

        NSView * image_backed_view = [[NSView alloc] initWithFrame:frame];

        image_backed_view.layer = [[CALayer alloc] init];
        image_backed_view.layer.contentsGravity = kCAGravityResizeAspectFill;
        image_backed_view.layer.contents = image;
        image_backed_view.wantsLayer = YES;

        // [windowview.window.contentView
        //     addSubview:image_backed_view
        //     positioned:NSWindowAbove
        //     relativeTo: [[windowview.window.contentView subviews] objectAtIndex:0]
        // ];

        NSLog(@"Subviews: %@", [window_view.window.contentView subviews]);

        [window_view.window.contentView
            addSubview:image_backed_view
        ];

        int viewId = viewIndex_;
        views_.insert(std::make_pair(viewId, image_backed_view));
        viewIndex_++;
        return viewId;
    }

    bool VibrancyHelper::UpdateView(unsigned char* buffer, v8::Local<v8::Array> options) {
        ViewOptions viewOptions = GetOptions(options);

        if (viewOptions.ViewId == -1)
            return false;

        NSImageView* imageView = views_[viewOptions.ViewId];
        if (!imageView)
            return false;

        NSRect frame = NSMakeRect(
          viewOptions.X,
          viewOptions.Y,
          viewOptions.Width,
          viewOptions.Height
        );
        [imageView setFrame:frame];

        return true;
    }

    bool VibrancyHelper::RemoveView(unsigned char* buffer, v8::Local<v8::Array> options) {
        V8Value vView = get_propertie(options, "ViewId");

        if (vView->IsNull() || !vView->IsInt32())
            return false;

        int viewId = vView->Int32Value();

        // if (viewId == -1 || viewId > static_cast<int>(views_. ()))
        //     return false;

        std::map<int, NSImageView*>::iterator It = views_.find(viewId);

        if (It == views_.end())
            return false;

        NSImageView* vibrantView = It->second;

        if (!vibrantView)
            return false;

        views_.erase(viewId);

        NSView* viewToRemove = vibrantView;
        [viewToRemove removeFromSuperview];

        return true;
    }

    VibrancyHelper::ViewOptions VibrancyHelper::GetOptions(v8::Local<v8::Array> options) {
        VibrancyHelper::ViewOptions viewOptions;
        viewOptions.Width = 0;
        viewOptions.Height = 0;
        viewOptions.X = 0;
        viewOptions.Y = 0;
        viewOptions.ViewId = -1;

        V8Value vPosition = get_propertie(options, "Position");
        V8Value vSize = get_propertie(options, "Size");
        V8Value vViewId = get_propertie(options, "ViewId");

        if (!vViewId->IsNull() && vViewId->IsInt32())
            viewOptions.ViewId = vViewId->Int32Value();

        if (!vSize->IsUndefined() && !vSize->IsNull()) {
            V8Array vaSize =
                v8::Local<v8::Array>::Cast(vSize);

            V8Value vWidth = get_propertie(vaSize, "width");
            V8Value vHeight = get_propertie(vaSize, "height");

            if (!vWidth->IsNull() && vWidth->IsInt32())
                viewOptions.Width = vWidth->Int32Value();

            if (!vHeight->IsNull() && vHeight->IsInt32())
                viewOptions.Height = vHeight->Int32Value();
        }

        if (!vPosition->IsUndefined() && !vPosition->IsNull()) {
            V8Array vaPosition = v8::Local<v8::Array>::Cast(vPosition);

            V8Value vX = get_propertie(vaPosition, "x");
            V8Value vY = get_propertie(vaPosition, "y");

            if (!vX->IsNull() && vX->IsInt32())
                viewOptions.X = vX->Int32Value();

            if (!vY->IsNull() && vY->IsInt32())
                viewOptions.Y = vY->Int32Value();
        }

        V8Value thing = get_propertie(options, "Path");
        v8::String::Utf8Value str(thing->ToString());
        NSLog(@"Object: %s", *str);
        viewOptions.Path = *str;

        return viewOptions;
    }

    bool VibrancyHelper::DisableVibrancy(unsigned char* windowHandleBuffer) {
        if (views_.size() > 0) {
            for (size_t i = 0; i < views_.size(); ++i) {
                NSView* viewToRemove = views_[i];
                [viewToRemove removeFromSuperview];
            }

            views_.clear();
        }
        return true;
    }
}  // namespace Vibrancy
