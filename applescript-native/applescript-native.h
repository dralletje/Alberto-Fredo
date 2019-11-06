#ifndef NAMED_IMAGE_H
#define NAMED_IMAGE_H

#include <napi.h>

namespace ApplescriptNative {

  Napi::String execute_applescript(Napi::Env env, Napi::String source);

}

#endif  // NAMED_IMAGE_H
