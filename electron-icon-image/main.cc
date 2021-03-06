#include <napi.h>
#include "electron-icon-image.h"

// #include "../node_modules/electron/atom/common/api/atom_api_native_image.h"

// using namespace Nan;
// using namespace v8;

Napi::Buffer<uint8_t> get_icon_for_path(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  return IconImage::get_icon_for_path(env, std::string(info[0].ToString()).c_str());

  // String::Utf8Value str(info[0]->ToString()); //first string arg
  // Nan::MaybeLocal<v8::Object> iconBuff = IconImage::get_icon_for_path(info[0]->toString());
  // info.GetReturnValue().Set(iconBuff.ToLocalChecked());

}

Napi::Object init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "get_icon_for_path"), Napi::Function::New(env, get_icon_for_path));
    return exports;
};

NODE_API_MODULE(IconImage, init);
