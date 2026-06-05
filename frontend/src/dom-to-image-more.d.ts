declare module "dom-to-image-more" {
  interface DomToImageOptions {
    quality?: number;
    pixelRatio?: number;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    filter?: (node: Node) => boolean;
    bgcolor?: string;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  export function toPng(node: Node, options?: DomToImageOptions): Promise<string>;
  export function toJpeg(node: Node, options?: DomToImageOptions): Promise<string>;
  export function toBlob(node: Node, options?: DomToImageOptions): Promise<Blob>;
  export function toPixelData(node: Node, options?: DomToImageOptions): Promise<Uint8ClampedArray>;
  export function toSvg(node: Node, options?: DomToImageOptions): Promise<string>;
}
