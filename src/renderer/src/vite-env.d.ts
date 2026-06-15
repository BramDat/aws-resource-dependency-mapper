/// <reference types="vite/client" />

import type { AwsDependencyMapperApi } from '../../../preload/index';

declare global {
  interface Window {
    awsDependencyMapper: AwsDependencyMapperApi;
  }
}
