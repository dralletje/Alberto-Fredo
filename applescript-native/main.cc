#include <napi.h>
#include "applescript-native.h"

// #include "../node_modules/electron/atom/common/api/atom_api_native_image.h"

// using namespace Nan;
// using namespace v8;

Napi::String execute_applescript(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  return ApplescriptNative::execute_applescript(env, info[0].ToString());

  // String::Utf8Value str(info[0]->ToString()); //first string arg
  // Nan::MaybeLocal<v8::Object> iconBuff = IconImage::get_icon_for_path(info[0]->toString());
  // info.GetReturnValue().Set(iconBuff.ToLocalChecked());

}

Napi::Object init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "execute_applescript"), Napi::Function::New(env, execute_applescript));
    return exports;
};

NODE_API_MODULE(IconImage, init);
