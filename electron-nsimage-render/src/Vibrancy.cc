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
#include "./Vibrancy.h"
#include "./Common.h"

NAN_MODULE_INIT(InitAll) {
    Vibrancy::Vibrancy::Init(target);
}

NODE_MODULE(Vibrancy, InitAll)

//----------------------------------------------------------------------------
namespace Vibrancy {
    static VibrancyHHelper vibHelper_;

    // Vibrancy::Vibrancy() {
    // }
    //
    // Vibrancy::~Vibrancy() {
    // }
    void Vibrancy::Init(Nan::ADDON_REGISTER_FUNCTION_ARGS_TYPE target) {
        v8::Local<v8::FunctionTemplate> tpl2 =
            Nan::New<v8::FunctionTemplate>(UpdateView);
        tpl2->InstanceTemplate()->SetInternalFieldCount(1);

        v8::Local<v8::FunctionTemplate> tpl3 =
            Nan::New<v8::FunctionTemplate>(RemoveView);
        tpl3->InstanceTemplate()->SetInternalFieldCount(1);

        Nan::Set(target,
            Nan::New("UpdateView").ToLocalChecked(),
            Nan::GetFunction(tpl2).ToLocalChecked());

        Nan::Set(target,
            Nan::New("RemoveView").ToLocalChecked(),
            Nan::GetFunction(tpl3).ToLocalChecked());
    }

    NAN_METHOD(Vibrancy::UpdateView) {
        int32_t key = Nan::To<int32_t>(info[0]).FromMaybe(0);
        v8::Local<v8::Object> handleBuffer =
            info[1].As<v8::Object>();
        v8::Local<v8::Array> options =
            info[2].As<v8::Array>();

        char* bufferData = node::Buffer::Data(handleBuffer);

        bool result = false;

        result = vibHelper_.UpdateView(key, (unsigned char*)bufferData, options);

        info.GetReturnValue().Set(result);
    }

    NAN_METHOD(Vibrancy::RemoveView) {
        int32_t key = Nan::To<int32_t>(info[0]).FromMaybe(0);
        v8::Local<v8::Object> handleBuffer =
            info[1].As<v8::Object>();

        char* bufferData = node::Buffer::Data(handleBuffer);

        bool result = false;

        result = vibHelper_.RemoveView(key, (unsigned char*)bufferData);

        info.GetReturnValue().Set(result);
    }
}   //  namespace Vibrancy
