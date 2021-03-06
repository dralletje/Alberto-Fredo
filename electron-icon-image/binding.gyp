{
  'targets': [
    {
      'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
      'target_name': 'IconImage',
      'include_dirs': [ "<!@(node -p \"require('node-addon-api').include\")" ],
      'sources': [
        'main.cc'
      ],
      'conditions': [
        ['OS=="mac"', {
          'xcode_settings': {
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++11", "-stdlib=libc++", "-mmacosx-version-min=10.7"],
            "OTHER_LDFLAGS": ["-framework CoreFoundation -framework AppKit"]
          },
          'sources': [
            'electron-icon-image.mm',
          ],
          'link_settings': {
            'libraries': [
              '$(SDKROOT)/System/Library/Frameworks/AppKit.framework',
            ],
          }
        }],
        ['OS != "mac"', {
          'sources': [
            'electron-icon-stub.cc'
          ]
        }]
      ],
    }
  ]
}
