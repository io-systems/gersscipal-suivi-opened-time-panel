import React, { useEffect, useState, useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { BackendSrv, getBackendSrv } from '@grafana/runtime';
import { ProductionOptions, Setup } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory /*, useTheme */ } from '@grafana/ui';

interface Props extends PanelProps<ProductionOptions> {}

export const ProductionPanel: React.FC<Props> = ({
  options,
  data,
  timeRange,
  width,
  height,
  onChangeTimeRange,
}: Props) => {
  const openingTimeSetup = useRef<Setup>();
  // const theme = useTheme();
  const styles = getStyles();
  const gspLoopback: BackendSrv = getBackendSrv();
  let validSetup = useRef(false);
  let [week, setWeek] = useState<any[]>([]);

  const refreshWeek = (day: Date) => {
    if (!openingTimeSetup.current) {
      return;
    }
    const lastDay = day.getDay();
    const openingTimeSetupLastIndex = openingTimeSetup.current.value.week.findIndex((d) => d.weekDay === lastDay);
    console.log(openingTimeSetupLastIndex);
    if (openingTimeSetupLastIndex < 0) {
      return;
    }
    let tmp: any[] = [];
    for (let i = 6; i >= 0; i--) {
      let d = new Date(day);
      d.setDate(day.getDate() - i);
      const openingTimeSetupIndex = openingTimeSetup.current.value.week.findIndex((od) => od.weekDay === d.getDay());
      tmp.push({
        day: d,
        setup: { ...openingTimeSetup.current.value.week[openingTimeSetupIndex] },
      });
    }
    setWeek(tmp);
  };

  useEffect(() => {
    const url = [window.location.protocol, '//', window.location.hostname, ':', '3000'].join('');
    gspLoopback.get(`${url}/app-setup/opening-time-setup`).then((data: Setup) => {
      openingTimeSetup.current = data;
      const setupError =
        !data || !data.value || !data.value.week || !Array.isArray(data.value.week) || data.value.week.length <= 0;
      validSetup.current = !setupError;
      if (!validSetup.current) {
        return;
      }
      refreshWeek(new Date());
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
      {validSetup.current ? <p>ok</p> : <p>nok</p>}
      {JSON.stringify(week, null, 2)}
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
