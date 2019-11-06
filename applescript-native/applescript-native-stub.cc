#include "electron-icon-image.h"
#include "nan.h"

namespace ApplescriptNative {

// just return an empty buffer on unsupported platforms
Nan::MaybeLocal<v8::Object> get_icon_for_path(const char * str) {
  // return Nan::NewBuffer(255);
  return Nan::NewBuffer(0);
}

} //end namespace
