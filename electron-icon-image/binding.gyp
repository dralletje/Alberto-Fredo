{
  'targets': [
    {
      'target_name': 'IconImage',
      'include_dirs': [ '<!(node -e "require(\'nan\')")' ],
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
