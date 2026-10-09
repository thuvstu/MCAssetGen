/// <reference types="next/image-types/global" />

/**
 * Keep static image import types available for standalone `tsc` runs.
 * Next generates next-env.d.ts at dev/build time, but that file is ignored
 * by this repository and is not present in a clean checkout.
 */
