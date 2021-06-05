import React, { useEffect, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { BackendSrv, getBackendSrv } from '@grafana/runtime';
import { ProductionOptions } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory /*, useTheme */ } from '@grafana/ui';

import { CheckSetup } from './CheckSetup';

interface Props extends PanelProps<ProductionOptions> {}

export const ProductionPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const [openingTimeSetup, setOpeningTimeSetup] = useState({});
  // const theme = useTheme();
  const styles = getStyles();
  const gspLoopback: BackendSrv = getBackendSrv();

  useEffect(() => {
    const url = [window.location.protocol, '//', window.location.hostname, ':', '3000'].join('');
    gspLoopback.get(`${url}/app-setup/opening-time-setup`).then((data) => {
      setOpeningTimeSetup(data);
      console.log(openingTimeSetup);
    });
  }, []);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <CheckSetup setup={openingTimeSetup}></CheckSetup>
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
});
