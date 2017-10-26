import Vapor
import Foundation

//@objc public protocol ScreenShotObserverDelegate: class {
//@objc optional func screenShotObserver(_ observer: ScreenShotObserver, addedItem item: NSMetadataItem)
//@objc optional func screenShotObserver(_ observer: ScreenShotObserver, updatedItem item: NSMetadataItem)
//@objc optional func screenShotObserver(_ observer: ScreenShotObserver, removedItem item: NSMetadataItem)
//}

@objc
class DiceGameTracker : NSObject, NSMetadataQueryDelegate {
    @objc
    func queryUpdated(_ object: Notification) {
        print("hey!")
        print(object)
    }
}

extension Droplet {
    func setupRoutes() throws {
        get("hello") { req in
            var json = JSON()
            try json.set("hello", "world")
            return json
        }

        socket("socket") { req, ws in
            let q = req.data["query"]?.string ?? ""
            print("Query:", q)

            // guard let age = request.data["query"].string else {
            //     throw Abort.badRequest
            // }
            // const ns_center = $.NSNotificationCenter('defaultCenter');
            // ns_center(
            //   'addObserver', delegate,
            //   'selector', 'queryUpdated:'
            //   'name', $('NSMetadataQueryDidStartGatheringNotification'),
            //   'object', query,
            // )
            // ns_center(
            //   'addObserver', delegate,
            //   'selector', 'queryUpdated:'
            //   'name', $('NSMetadataQueryDidUpdateNotification'),
            //   'object', query,
            // )
            // ns_center(
            //   'addObserver', delegate,
            //   'selector', 'queryUpdated:'
            //   'name', $('NSMetadataQueryDidFinishGatheringNotification'),
            //   'object', query,
            // )
            class DiceGameTracker : NSObject, NSMetadataQueryDelegate {
                @objc
                func queryUpdated(_ object: Notification) {
                    print("hey!")
                    print(object)
                }
            }

            let delegate = DiceGameTracker();
            let query = NSMetadataQuery()
            query.delegate = delegate;
            query.predicate = NSPredicate(format: "kMDItemIsScreenCapture = 1");

            NotificationCenter.default.addObserver(delegate,
                 selector: #selector(DiceGameTracker.queryUpdated(_:)),
                 name: NSNotification.Name.NSMetadataQueryDidStartGathering,
                 object: query)
             NotificationCenter.default.addObserver(delegate,
                  selector: #selector(DiceGameTracker.queryUpdated(_:)),
                  name: NSNotification.Name.NSMetadataQueryDidUpdate,
                  object: query)
              NotificationCenter.default.addObserver(delegate,
                   selector: #selector(DiceGameTracker.queryUpdated(_:)),
                   name: NSNotification.Name.NSMetadataQueryDidStartGathering,
                   object: query)

            query.start();

            ws.onText = { ws, text in
                print("Socket received data: \(text)")
                try ws.send("asd")
            }

            ws.onClose = { ws, _, _, _ in
                print("Socket closed")
                query.stop()
            }
        }

        get("plaintext") { req in

            return "Hello, world!"
        }

        // response to requests to /info domain
        // with a description of the request
        get("info") { req in
            return req.description
        }

        get("description") { req in return req.description }

        try resource("posts", PostController.self)
    }
}
