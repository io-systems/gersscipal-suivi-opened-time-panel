import React from 'react';
// import { PanelProps } from '@grafana/data';
// import { ProductionOptions } from 'types';

interface Props {
  setup: any;
}
export const CheckSetup: React.FC<Props> = ({ setup }: Props) => {
  return (
    <div>
      {!setup ||
      !setup.value ||
      !setup.value.week ||
      !Array.isArray(setup.value.week) ||
      setup.value.week.lenght <= 0 ? (
        <h1>Problème de configuration</h1>
      ) : (
        <h1>la config est arrivée !</h1>
      )}
    </div>
  );
};
