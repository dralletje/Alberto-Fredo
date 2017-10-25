#include "nan.h"
#include "electron-icon-image.h"

// #include "../node_modules/electron/atom/common/api/atom_api_native_image.h"

using namespace Nan;
using namespace v8;

namespace {

NAN_METHOD(get_icon_for_path) {
  String::Utf8Value str(info[0]->ToString()); //first string arg
  Nan::MaybeLocal<v8::Object> iconBuff = IconImage::get_icon_for_path(*str);
  info.GetReturnValue().Set(iconBuff.ToLocalChecked());
}

void Init(Handle<Object> exports) {
  Nan::SetMethod(exports, "get_icon_for_path", get_icon_for_path);
}

} // namespace


NODE_MODULE(IconImage, Init)
