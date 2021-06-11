import { PanelPlugin } from '@grafana/data';
import { ProductionOptions } from './types';
import { ProductionPanel } from './ProductionPanel';

export const plugin = new PanelPlugin<ProductionOptions>(ProductionPanel).setPanelOptions((builder) => {
  return builder
    .addBooleanSwitch({
      path: 'autoRefresh',
      name: 'autoRefresh',
      description: 'Activer / désactiver le rafraîchissement automatique.',
      category: ['Rafraîchissement automatique des données'],
      defaultValue: false,
    })
    .addNumberInput({
      path: 'refreshSeconds',
      name: 'Seconds',
      description: 'Nombre de secondes entre deux rafraîchissements.',
      category: ['Rafraîchissement automatique des données'],
      defaultValue: 60,
    });
});
