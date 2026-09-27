import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers
// Użycie: gen <outdir> <crop.png...>  → maska (skala szarości) o rozmiarze wejścia, union wszystkich instancji
let outDir = URL(fileURLWithPath: CommandLine.arguments[1])
let ctx = CIContext()
for path in CommandLine.arguments.dropFirst(2) {
    let url = URL(fileURLWithPath: path)
    let handler = VNImageRequestHandler(url: url)
    let req = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([req])
    let out = outDir.appendingPathComponent(url.deletingPathExtension().lastPathComponent + ".png")
    var ci: CIImage
    if let obs = req.results?.first, !obs.allInstances.isEmpty {
        let buf = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
        ci = CIImage(cvPixelBuffer: buf)
    } else {
        let src = CIImage(contentsOf: url)!
        ci = CIImage(color: .black).cropped(to: src.extent)
    }
    let cg = ctx.createCGImage(ci, from: ci.extent, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())!
    let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, cg, nil); CGImageDestinationFinalize(dest)
}
