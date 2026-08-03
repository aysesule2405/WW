import AppKit
import Foundation

struct Layer: Decodable {
    let path: String
    let x: Double
    let y: Double
    let sourceX: Double?
    let sourceY: Double?
    let sourceWidth: Double?
    let sourceHeight: Double?
}

struct Manifest: Decodable {
    let width: Int
    let height: Int
    let layers: [Layer]
}

guard CommandLine.arguments.count == 3 else {
    fputs("Usage: swift render-delivery-map-preview.swift manifest.json output.png\n", stderr)
    exit(2)
}

let manifestURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let manifest = try JSONDecoder().decode(Manifest.self, from: Data(contentsOf: manifestURL))

guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: manifest.width,
    pixelsHigh: manifest.height,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    fputs("Could not create bitmap context\n", stderr)
    exit(1)
}

NSGraphicsContext.saveGraphicsState()
guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    fputs("Could not create graphics context\n", stderr)
    exit(1)
}
NSGraphicsContext.current = context
context.imageInterpolation = .none
NSColor.black.setFill()
NSRect(x: 0, y: 0, width: manifest.width, height: manifest.height).fill()

for layer in manifest.layers {
    guard let image = NSImage(contentsOfFile: layer.path) else {
        fputs("Missing image: \(layer.path)\n", stderr)
        exit(1)
    }
    let size = image.size
    let sourceWidth = layer.sourceWidth ?? size.width
    let sourceHeight = layer.sourceHeight ?? size.height
    let source = NSRect(
        x: layer.sourceX ?? 0,
        y: size.height - (layer.sourceY ?? 0) - sourceHeight,
        width: sourceWidth,
        height: sourceHeight
    )
    let destination = NSRect(
        x: layer.x,
        y: Double(manifest.height) - layer.y - sourceHeight,
        width: sourceWidth,
        height: sourceHeight
    )
    image.draw(
        in: destination,
        from: source,
        operation: .sourceOver,
        fraction: 1,
        respectFlipped: true,
        hints: [.interpolation: NSImageInterpolation.none]
    )
}

context.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fputs("Could not encode PNG\n", stderr)
    exit(1)
}
try png.write(to: outputURL)
