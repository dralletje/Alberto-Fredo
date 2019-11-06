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
// #include "./Vibrancy.h"
#include "./Common.h"
#include "./VibrancyHelper.h"

//----------------------------------------------------------------------------
static Vibrancy::VibrancyHHelper vibHelper_;

Napi::Boolean UpdateView(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  int32_t key = info[0].ToNumber().Int32Value();
  char* bufferData = info[1].As<Napi::Buffer<char>>().Data();
  Napi::Object options = info[2].As<Napi::Object>();

  bool result = vibHelper_.UpdateView(key, (unsigned char*)bufferData, options);

  return Napi::Boolean::New(env, result);
}

Napi::Boolean RemoveView(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  int32_t key = info[0].ToNumber().Int32Value();
  // v8::Local<v8::Object> handleBuffer =
  //     info[1].As<v8::Object>();
  //
  // char* bufferData = node::Buffer::Data(handleBuffer);

  bool result = false;

  result = vibHelper_.RemoveView(key);

  // info.GetReturnValue().Set(result);

  return Napi::Boolean::New(env, result);
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "UpdateView"), Napi::Function::New(env, UpdateView));
    exports.Set(Napi::String::New(env, "RemoveView"), Napi::Function::New(env, RemoveView));
    return exports;
};

NODE_API_MODULE(Vibrancy, init);
