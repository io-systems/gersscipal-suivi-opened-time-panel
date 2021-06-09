import { PanelPlugin } from '@grafana/data';
import { ProductionOptions } from './types';
import { ProductionPanel } from './ProductionPanel';

export const plugin = new PanelPlugin<ProductionOptions>(ProductionPanel); // .setPanelOptions((builder) => {});
