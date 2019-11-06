{
  'targets': [
    {
      'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
      'target_name': 'ApplescriptNative',
      'include_dirs': [ "<!@(node -p \"require('node-addon-api').include\")" ],
      'sources': [
        'main.cc'
      ],
      'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++11", "-stdlib=libc++", "-mmacosx-version-min=10.7", "-fmodules", "-fcxx-modules"],
            "OTHER_LDFLAGS": ["-framework CoreFoundation -framework AppKit"]
          },
          'sources': [
            'applescript-native.mm',
          ],
          'link_settings': {
            'libraries': [
              '$(SDKROOT)/System/Library/Frameworks/AppKit.framework',
            ],
          }
        }],
        ['OS != "mac"', {
          'sources': [
            'applescript-native-stub.cc'
          ]
        }]
      ],
    }
  ]
}
