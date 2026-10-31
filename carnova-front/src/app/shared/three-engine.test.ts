import { describe, expect, it } from 'vitest';
import { isSoftwareRenderer } from './three-engine';

const RENDERER = 0x1f01;
const UNMASKED = 0x9246;
function context(name: string, debugInfo = true) {
  return {
    RENDERER,
    getExtension: (n: string) =>
      debugInfo && n === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: UNMASKED } : null,
    getParameter: (p: number) => (p === (debugInfo ? UNMASKED : RENDERER) ? name : 'WebKit WebGL'),
  } as unknown as WebGL2RenderingContext;
}

describe('isSoftwareRenderer', () => {
  it('detects CPU WebGL implementations', () => {
    expect(
      isSoftwareRenderer(
        context('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)'),
      ),
    ).toBe(true);
    expect(isSoftwareRenderer(context('llvmpipe (LLVM 17.0.6, 256 bits)'))).toBe(true);
    expect(isSoftwareRenderer(context('Microsoft Basic Render Driver'))).toBe(false);
  });
  it('keeps full quality on hardware GPUs and when the renderer name is masked', () => {
    expect(isSoftwareRenderer(context('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060)'))).toBe(false);
    expect(isSoftwareRenderer(context('Apple GPU', false))).toBe(false);
  });
});
