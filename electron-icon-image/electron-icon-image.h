#ifndef NAMED_IMAGE_H
#define NAMED_IMAGE_H

#include <napi.h>

namespace IconImage {

  Napi::Buffer<uint8_t> get_icon_for_path(Napi::Env env, const char * str);

}

#endif  // NAMED_IMAGE_H
