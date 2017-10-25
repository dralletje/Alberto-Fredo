#ifndef NAMED_IMAGE_H
#define NAMED_IMAGE_H

#include "nan.h"

namespace IconImage {

Nan::MaybeLocal<v8::Object> get_icon_for_path(const char * str);
  
}

#endif  // NAMED_IMAGE_H
